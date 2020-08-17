---
id: subsets-ii
title: 子集II
---
**Leetcode 90 原题链接：[子集](https://leetcode-cn.com/problems/subsets-ii/)**

## 题目描述
给定一个可能包含重复元素的整数数组 `nums`，返回该数组所有可能的子集（幂集）。

说明：解集不能包含重复的子集。

**示例:**

> 输入: [1,2,2]
> 输出:
> [
>   [2],
>   [1],
>   [1,2,2],
>   [2,2],
>   [1,2],
>   []
> ]

## 解题思路

本题也是采用回溯法，与子集这一题的区别就是，我们需要进行剪枝

而这一剪枝策略，在 **组合总和II** 这一题里使用过，因此，可以采用相同的剪枝策略。保证最后的答案没有重复。

## 代码
```java
class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null || nums.length == 0) {
            return result;
        }
        Arrays.sort(nums);
        dfs(nums, 0, new ArrayList<>(), result);
        return result;
    }

    public void dfs(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
        result.add(new ArrayList(path));
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) {
                continue;
            }
            path.add(nums[i]);
            dfs(nums, i+1, path, result);
            path.remove(path.size() - 1);
        }
    }
}
```
