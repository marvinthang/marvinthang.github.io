---
title: "Probability"
date: 2026-06-12 10:00:00 +0800
categories: [tools]
tags: [probability, statistics, machine learning]
description: ""
math: true
---


1. Don't lose common sense.
2. Do check answers, especially by doing sipmle and extreme cases.
3. Label people, objects, etc (If have n people, label them as 1, 2, ..., n).

To solve a problem, consider simple cases, extreme cases, and especially **simplest non-trivial case**.

Story Proof: Proof by interpretation.

Identity:

1. $n \binom{n-1}{k-1} = k \binom{n}{k}$

Pick $k$ people out of $n$, with 1 designated as President

2. $\binom{m+n}{k} = \sum_{i=0}^{k} \binom{m}{i} \binom{n}{k-i}$ (Vandermonde's identity)
  
Pick $k$ people out of $m+n$, with $i$ from the first $m$ and $k-i$ from the last $n$.

3. $\sum_{i=k}^{n} \binom{i}{k} = \binom{n+1}{k+1}$

Pick $k+1$ people out of $n+1$, with the largest one being $i$.

Non-naive definition of probability:

$P$ is a function which takes an event $A \subseteq S$ as input, return $P(A) \in [0, 1]$ as output, and satisfies these axioms:
1. $P(\emptyset) = 0$, $P(S) = 1$
2. $P(\cup_{i=1}^{\infty} A_i) = \sum_{i=1}^{\infty} P(A_i)$ for any sequence of disjoint events $A_1, A_2, ...$.
