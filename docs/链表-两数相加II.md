---
id: listNode2
title: 链表-两数相加II
---
**Leetcode 445 原题链接：[两数相加II](https://leetcode-cn.com/problems/add-two-numbers-ii/)**

## 题目描述
给你两个 **非空** 链表来代表两个非负整数。数字最高位位于链表开始位置。它们的每个节点只存储一位数字。将这两数相加会返回一个新的链表。

你可以假设除了数字 `0` 之外，这两个数字都不会以零开头。

**示例：**

> 输入：(7 -> 2 -> 4 -> 3) + (5 -> 6 -> 4)
> 
> 输出：7 -> 8 -> 0 -> 7
> 
> 原因：7243 + 564 = 7807

## 分析
本题的链表是高位在前，低位在后，与第一题刚好相反。注意需要考虑进位。

实际上，我们在计算两个数加法的时候，应当遵循低位在前高位在后的做法，但是是高位在前，低位在后，而且这是一个链表。

两个办法，一、反转两个链表，然后再直接调用【两数相加】的解题思路；二、利用栈的先入后出思想，先把两个链表压入栈，再弹出，依然是套用【两数相加】的算法。

可以看出，本题我们需要处理的就是反转这个操作，具体如何反转有不同的实现思路。

**最后在求结果时，需要进行反转处理！这个要特别注意！**

## 代码
`ListNode` 的定义 
```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) {
        this.val = val;
    }
}
```

## 解答代码
```java
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    if (l1 == null && l2 == null) {
        return null;
    }
    Stack<ListNode> stack1 = new Stack();
    Stack<ListNode> stack2 = new Stack();
    
    while (l1 != null) {
        stack1.push(l1);
        l1 = l1.next;
    }
    while (l2 != null) {
        stack2.push(l2);
        l2 = l2.next;
    }
    
    ListNode head = null;
    int carry = 0;
    while (!stack1.isEmpty() || !stack2.isEmpty() || carry > 0) {
        int a = stack1.isEmpty() ? 0 : stack1.pop().val;
        int b = stack2.isEmpty() ? 0 : stack2.pop().val;
        ListNode tmp = new ListNode((a + b + carry) % 10);
        tmp.next = head;
        head = tmp;
        carry = (a + b + carry) / 10;
    }
    return head;
}
```
## 注意
需要注意，这个链表是反着来的，每次 `head` 都保持在头部。

首先 `head = null;`

接着每次更新时 `tmp.next = head; head = tmp;`

最后直接返回 `head` 即可。

**小trick：**可以直接把最后 `carry` 溢出的判断放到 `while` 循环中去，这样不需要额外再单独处理了，秒啊！