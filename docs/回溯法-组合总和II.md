---
id: combination-sum-ii
title: 组合总和II
---
**Leetcode 40 原题链接：[组合总和](https://leetcode-cn.com/problems/combination-sum-ii/)**

## 题目描述
给定一个数组 `candidates` 和一个目标数 `target` ，找出 `candidates` 中所有可以使数字和为 `target` 的组合。

`candidates` 中的每个数字在每个组合中只能使用一次。

**说明：**

所有数字（包括目标数）都是正整数。

解集不能包含重复的组合。 

**示例 1:**

> 输入: candidates = [10,1,2,7,6,1,5], target = 8,
>
> 所求解集为:
> [
>   [1, 7],
>   [1, 2, 5],
>   [2, 6],
>   [1, 1, 6]
> ]

## 解题思路
本题是组合总和的升级版，组合总和II。
同样是采用回溯法，但是这里需要特别注意剪枝的问题。

### 剪枝
详细分析一下本题的剪枝
```java
if (i > start && candidates[i] == candidates[i - 1]) {
    continue;
}
```
上述两行代码是本题的精髓所在，就是靠上述两行代码实现剪枝。
先来分析 `candidates[i] == candidates[i - 1]` ，这行代码有效的保证了，类似于 `nums = [1,1,2,5]; target = 8;` 的前提条件下，不会出现两个 `[1,2,5]` 的解。因为第二次就可以有效的保证当遍历到第二个 `1` 时，会直接 `continue` 掉。

但是 `nums = [1,1,2,2]; target = 4;` 情况下，显然 `[1,1,2]` 必然需要成为解的一部分，但是如果只有上述 `candidates[i] == candidates[i - 1]` 条件约束，就会导致这种情况不出现了。因此那么就用 `i > start` 来避免这种情况，我们需要避免两个数重复的出现在同一层级上。在一个 for 循环中，所有被遍历到的数都是属于一个层级的。我们要让一个层级中，必须出现且只出现一个 1 ，那么就放过第一个出现重复的 1，但不放过后面出现的 1。第一个出现的 1 的特点就是 ` i == start` 第二个出现的 1 特点是 `i > start`

因此综上，将两个条件 **与** 起来，就可以得到我们的剪枝方案。

## 代码
```java
class Solution {
    public List<List<Integer>> combinationSum2(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        if (candidates == null || candidates.length == 0) {
            return result;
        }
        Arrays.sort(candidates);
        dfs(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }

    public void dfs(int[] candidates, int rest, int start, List<Integer> path, List<List<Integer>> result) {
        if (rest == 0) {
            result.add(new ArrayList(path));
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (rest - candidates[i] < 0) {
                break;
            }
            // 本题的重点，剪枝
            if (i > start && candidates[i] == candidates[i - 1]) {
                continue;
            }
            path.add(candidates[i]);
            dfs(candidates, rest - candidates[i], i + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}
```
