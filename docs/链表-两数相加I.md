---
id: listNode1
title: 链表-两数相加
---
**Leetcode 2 原题链接：[两数相加](https://leetcode-cn.com/problems/add-two-numbers/)**

## 题目描述
给出两个 **非空** 的链表用来表示两个非负的整数。其中，它们各自的位数是按照 **逆序** 的方式存储的，并且它们的每个节点只能存储 **一位** 数字。

如果，我们将这两个数相加起来，则会返回一个新的链表来表示它们的和。

您可以假设除了数字 `0` 之外，这两个数都不会以 `0` 开头。

**示例：**

> 输入：(2 -> 4 -> 3) + (5 -> 6 -> 4)
> 
> 输出：7 -> 0 -> 8
> 
> 原因：342 + 465 = 807

## 分析
本题的链表是低位在前，高位在后，直接从低位往高位加符合我们的加法思路。

注意需要考虑进位

## 代码部分
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

## 参考代码
```java
public ListNode addTwoNumbers(ListNode node1, ListNode node2) {
    if (node1 == null && node2 == null) {
        return null;
    }
    ListNode dummy = new ListNode(0);
    ListNode head = dummy;
    int carry = 0;
    while (node1 != null || node2 != null || carry > 0) {
        int a = node1 == null ? 0 : node1.val;
        int b = node2 == null ? 0 : node2.val;
        ListNode tmp = new ListNode((a + b + carry) % 10);
        head.next = tmp;
        head = head.next;
        carry = (a + b + carry) / 10;
        if (node1 != null) {
            node1 = node1.next;
        }
        if (node2 != null) {
            node2 = node2.next;
        }
    }
    return dummy.next;
}
```