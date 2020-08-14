---
id: threadLocal
title: ThreadLocal小结
---
## ThreadLocal 简介

ThreadLocal 的作用是提供线程内的局部变量，这种变量在线程的生命周期内起作用，减少同一个线程内多个函数或者组件之间一些公共变量的传递的复杂度。

ThreadLocal 对象会给每个线程分配一个属于它自己的数据容器（ThreadLocalMap），这个数据只有对应的线程才能获取到。互相是隔离的，线程安全的。

在线程中，可以通过 `get()/set()/initialValue()/remove` 等方法来访问变量。

### JDK 原始实现
ThreadLocal 最简单的实现方式就是 ThreadLocal 类内部有一个线程安全的 Map，然后用线程的 `ID` 作为 Map 的 `key`，实例对象作为 Map 的 `value`，这样就能达到各个线程的值隔离的效果。

**存在的问题：**
1. 该设计方案的 ThreadLocal 需要维护所有访问过的线程对象的副本数据，会造成 Map 很大。
2. 某个线程被销毁了，那么对象的 Map 中的 Entry 对象就无法被访问到了，这就需要对其进行清理，那么这个清理工作需要由谁来完成，以及如何完成呢？如果不做，那么会造成内存泄漏。

### JDK 目前实现

在 ThreadLocal 中定义了一个静态内部类：ThreadLocalMap，每个 Thread 对象都会存放一个 ThreadLocalMap 类型的 `threadLocals` 变量。

对 ThreadLocalMap 中存的 Entry 的 `key` 进行了优化，这个 `key` 是弱应用类型的。

**这么做的好处：**

1. 当前线程的局部变量，保存在这个线程内部。当线程生命结束时，其对应的局部变量也一同被销毁，提高了资源利用率。
2. 当 Entry 的 `key` 被回收时，对应的 `key` 就会变成 `null` ，最终也会被回收。 

## ThreadLocal 在项目中的使用

在项目中持有用户信息，用于代替 `session` 对象。定义一个类 `HostHolder`。

其中，定义一个 ThreadLocal 对象用于存储用户信息。
```java
/**
 * 持有用户信息，用于代替session对象
 */
@Component
public class HostHolder {

    private ThreadLocal<User> users = new ThreadLocal<>();

    public void setUser(User user) {
        users.set(user);
    }

    public User getUser() {
        return users.get();
    }

    public void clear() {
        users.remove();
    }

}
```

配合 Spring 的拦截器使用。在自定义的登录拦截器中的 `preHandle` 方法，成功验证完毕用户身份后，将其用户信息，保存至当前线程的 ThreadLocal 对象中。

在请求结束后即 `afterCompletion` 方法中，将用户信息清除掉。即调用 `remove` 方法。因为 SpringMVC 用的是线程池，每次使用完了之后，这些线程并没有被销毁。它下一次可能给其他请求再去使用。再次使用时，这个线程里的 ThreadLocal 就会是上一次请求的 ThreadLocal 的值，为了避免出现其他问题，所以应当清理掉。这应当是一个习惯。


```java
@Component
public class LoginTicketInterceptor implements HandlerInterceptor {

    @Autowired
    private UserService userService;
    @Autowired
    private HostHolder hostHolder;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        //从cookie中获取凭证
        String ticket = CookieUtil.getValue(request, "ticket");
        if(ticket!=null) {
            LoginTicket loginTicket = userService.findLoginTicket(ticket);
            //检查凭证是否有效
            if(loginTicket!=null && loginTicket.getStatus()==0 && loginTicket.getExpired().after(new Date())) {
                //根据凭证查询用户
                User user = userService.findUserById(loginTicket.getUserId());
                //在本次请求中持有用户
                hostHolder.setUser(user);
                // 构建用户认证的结果，并存入SecurityContext,以便于Security进行授权
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        user, user.getPassword(), userService.getAuthorities(user.getId()));
                SecurityContextHolder.setContext(new SecurityContextImpl(authentication));
            }
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        User user = hostHolder.getUser();
        if(user!=null && modelAndView!=null) {
            modelAndView.addObject("loginUser", user);
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        hostHolder.clear();
        // 把验证结果清理掉
        SecurityContextHolder.clearContext();
    }
}
```

## ThreadLocal 内存泄露问题

弱引用对象在 Java 虚拟机进行垃圾回收时，就会被释放。

ThreadLocalMap 使用 ThreadLocal 的弱引用作为 `key`，如果一个 ThreadLocal 没有外部关联的强引用，那么在虚拟机进行垃圾回收时，这个 ThreadLocal 会被回收，这样，ThreadLocalMap 中就会出现 `key` 为 `null` 的 Entry，这些 `key` 对应的 `value` 也就再无妨访问，但是 `value` 却存在一条从 Current Thread 过来的强引用链。因此只有当 Current Thread 销毁时，`value` 才能得到释放。

该强引用链如下：

`CurrentThread Ref -> Thread -> ThreadLocalMap -> Entry -> value`

因此，只要这个线程对象被gc回收，那些key为null对应的value也会被回收，这样也没什么问题，但在线程对象不被回收的情况下，比如使用线程池的时候，核心线程是一直在运行的，线程对象不会回收，若是在这样的线程中存在上述现象，就可能出现内存泄露的问题。

问题：为什么 Entry 中的 `key` 要被设置为弱引用，为什么不是强引用？

`key` 使用强应用：当 ThreadLocal 没有外部关联的强引用时，仍然有一个 Entry 中的 `key` 与它是强引用关联，那么此时就会出现一个新的引用链

`CurrentThread Ref -> Thread -> ThreadLocalMap -> Entry -> key -> ThreadLocal`

该链的出现就导致 ThreadLocal 对象无法被回收。直接导致了 `Entry` 的内存泄漏

`key` 使用弱引用：引用的 ThreadLocal 的对象被回收了，由于 ThreadLocalMap 持有 ThreadLocal 的弱引用，即使没有手动删除，ThreadLocal 也会被回收。`value` 在下一次 ThreadLocalMap 调 用 `set/get/remove` 的时候会被清除。

比较两种情况，我们可以发现：由于 ThreadLocalMap 的生命周期跟 Thread 一样长，如果都没有手动删除对应 `key`，都会导致内存泄漏，**但是使用弱引用可以多一层保障**：弱引用 ThreadLocal 不会内存泄漏，对应的 `value` 在下一次 ThreadLocalMap 调用 `set/get/remove` 的时候会被清除。

**因此，ThreadLocal 内存泄漏的根源是：由于 ThreadLocalMap 的生命周期跟 Thread 一样长，如果没有手动删除对应 `key` 就会导致内存泄漏，而不是因为弱引用。**

## ThreadLocal 最佳实践

综合上面的分析，我们可以理解 ThreadLocal 内存泄漏的前因后果，那么怎么避免内存泄漏呢？

每次使用完 ThreadLocal，都调用它的 `remove()` 方法，清除数据。

在使用线程池的情况下，没有及时清理 ThreadLocal，不仅是内存泄漏的问题，更严重的是可能导致业务逻辑出现问题。

所以，使用 ThreadLocal 就跟加锁完要解锁一样，用完就清理。

## 扩展：Java 中的引用类型

### 1. 强引用
强引用是指在程序代码中普遍存在的，类似 `Object obj = new Object()` 这类的引用。如果一个对象具有强引用，那就类似于不可回收的物品。
只要强引用还存在，垃圾回收器永远不会回收掉被引用的对象。
当内存空间不足，Java 虚拟机宁愿抛出 `Out Of MemoryError` 错误，使程序异常终止，也不会靠随意回收具有强引用 对象来解决内存不足的问题。
**举例：**
```java
Object object = new Object();
String str = "StrongReference";
```
如果想中断强引用和某个对象之间的关联，可以显示地将引用赋值为 `null`，这样一来的话，JVM 在合适的时间就会回收该对象。
比如 ArraryList 类的 `clear` 方法中就是通过将引用赋值为 `null` 来实现清理工作的
```java
public void clear() {
      modCount++;
      // Let gc do its work
      for (int i = 0; i < size; i++)
          elementData[i] = null;
      size = 0;
}
```

### 2. 软引用
软引用用来描述一些还有用但并非必需的对象。在 Java 中用 `java.lang.ref.SoftReference` 类来表示。对于软引用关联着的对象，只有在内存不足的时候 JVM 才会回收该对象。因此，这一点可以很好地用来解决 OOM 的问题，并且这个特性很适合用来实现缓存：比如网页缓存、图片缓存等。

**应用场景：**软引用通常用来实现内存敏感的缓存。如果内存空间还有剩余，就可以暂时保留缓存，当内存不足时，就可以将缓存清除，这样就保证了使用缓存的同时，不会耗尽内存。

软引用在实际中有重要的应用，例如浏览器的后退按钮，这个后退时显示的网页内容可以重新进行请求或者从缓存中取出：
（1）如果一个网页在浏览结束时就进行内容的回收，则按后退查看前面浏览过的页面时，需要重新构建
（2）如果将浏览过的网页存储到内存中会造成内存的大量浪费，甚至会造成内存溢出这时候就可以使用软引用

### 3. 弱引用
弱引用也是用来描述非必需对象的，当 JVM 进行垃圾回收时，无论内存是否充足，都会回收被弱引用关联的对象。在 java 中，用 `java.lang.ref.WeakReference` 类来表示。

弱引用与软引用的区别在于：只具有弱引用的对象拥有更短暂的生命周期。在垃圾回收器线程扫描它所管辖的内存区域的过程中，一旦发现了只具有弱引用的对象，不管当前内存空间足够与否，都会回收它的内存。不过，由于垃圾回收器是一个优先级很低的线程， 因此不一定会很快发现那些只具有弱引用的对象。所以被软引用关联的对象只有在内存不足时才会被回收，而被弱引用关联的对象在 JVM 进行垃圾回收时总会被回收。

**应用场景：** 弱应用同样可用于内存敏感的缓存。与软引用不同的是，在内存空间还足够时，软引用的对象不会被回收，但是，弱引用的对象有可能会被回收，其存活时间相比于弱引用更短一点。
实例：ThreadLocal 实现类中，对于 Entry 的 `key` 即 ThreadLocal 采用的就是弱引用的方式。

### 4. 虚引用
虚引用和前面的软引用、弱引用不同，它并不影响对象的生命周期。在 java 中用 `java.lang.ref.PhantomReference` 类表示。如果一个对象与虚引用关联，则跟没有引用与之关联一样，在任何时候都可能被垃圾回收器回收。虚引用主要用来跟踪对象被垃圾回收的活动。
虚引用必须和引用队列关联使用，当垃圾回收器准备回收一个对象时，如果发现它还有虚引用，就会把这个虚引用加入到与之关联的引用队列中。程序可以通过判断引用队列中是否已经加入了虚引用，来了解被引用的对象是否将要被垃圾回收。如果程序发现某个虚引用已经被加入到引用队列，那么就可以在所引用的对象的内存被回收之前采取必要的行动。
应用场景：可以用虚引用来跟踪对象被垃圾回收器回收的活动，当一个虚引用关联的对象被垃圾收集器回收之前会收到一条系统通知。

### 总结：

| 引用类型 | 被回收时间    | 用途      | 生存时间     |
|------|----------|---------|----------|
| 强引用  | 从来不会     | 对象的一般状态 | JVM停止运行时 |
| 软引用  | 内存不足时    | 对象缓存    | 内存不足时    |
| 弱引用  | JVM垃圾回收时 | 对象缓存    | gc运行后    |
| 虚引用  | 未知       | 未知      | 未知       |





