---
title: "Fun Probability Problems"
date: 2026-09-21 00:00:00 +0800
categories: [probability]
tags: [probability, math]
description: "Fun problems in probability theory."
math: true
---

## Question 1 — Painted Cube

A \(3\times 3\times 3\) cube is painted red on its entire outer surface and then cut into \(27\) unit cubes.

One of the \(27\) small cubes is chosen uniformly at random and tossed onto a table.

You inspect the **five visible faces** and see that all five are white.

What is the probability that the face touching the table is red?

## Question 3 — Random Points in a Semicircle

Choose \(n\) points independently and uniformly at random on the circumference of a circle.

What is the probability that **there exists some semicircle containing all \(n\) points**?

Find a formula in terms of \(n\).

## Question 5 — Publication Selection and Bayesian Updating

Suppose

\[
X_1,\ldots,X_n \overset{iid}{\sim} N(\mu,1),
\]

where \(\mu\) is unknown.

A researcher runs an experiment and computes

\[
\bar X.
\]

However, the experiment is only **published** if

\[
\bar X>0.
\]

Assume the prior

\[
\mu\sim N(0,\tau^2).
\]

### (a)
You are given the published value

\[
\bar X=x>0.
\]

Find

\[
E[\mu\mid \bar X=x,\ \bar X>0].
\]

### (b)
Now suppose you **do not observe \(x\)**. You are only told that the experiment was published.

Find or characterize

\[
E[\mu\mid \bar X>0].
\]

### (c)
Explain whether observing the exact value \(x\) makes the additional information

\[
\bar X>0
\]

provide any extra information.

## Next problem

Each time random U(0, 1) and add up to them sum until sum >= 1, what is E(sum).

Wald's Equation

Part 2: condition on last one >= 0.2

## Hidden-Coin Prediction Game

Hidden-Coin Prediction Game

A number

$$ p\sim \mathrm{Uniform}(0,1) $$

is chosen once and hidden from you. A coin with

$$ P(H)=p $$

is then flipped repeatedly.

Before each flip, after seeing all previous outcomes, you must predict \(H\) or \(T\). You earn $1 for a correct prediction and $0 otherwise.

Part A. You have observed

$$ H,T,H,H,T. $$

What should you predict on the next flip, and what is your probability of being correct?

Part B. The game lasts exactly \(N\) flips.

Find the optimal expected total payout as a function of \(N\).

In particular, compute it for

$$ N=100. $$

Part C. Before the game starts, you are offered the opportunity to learn the exact value of \(p\) for a one-time fee of \(c\).

For \(N=100\), what is the largest \(c\) you should be willing to pay?

## Random Walks 

Start with wealth 0, games and when your wealth readches or crosses -5 or 10. Receive \$1 if hit/cross 10, and \$0 if hit/cross -5.

Two actions:
* Safe: +- 1 with prob 1/2
* Risky: +- 2 wih prob 1/2

Find optimal starategy and expected payout.

## HRT-Style Probability Problem — Conditioned Exponentials

Let

\[
X_1,X_2,\ldots,X_n \overset{iid}{\sim} \operatorname{Exp}(1).
\]

Condition on the event

\[
X_1+X_2+\cdots+X_n=1.
\]

Find

\[
P\left(
\max_{1\le i\le n} X_i>\frac12
\;\middle|\;
X_1+\cdots+X_n=1
\right).
\]

Equivalently, you may first find

\[
P\left(
X_i\le\frac12\ \text{for every }i
\;\middle|\;
X_1+\cdots+X_n=1
\right).
\]

Give your answer as a function of \(n\).

Simplex

## HRT-Style Statistics Problem — Combining Estimators

Suppose $T_1,T_2$ are unbiased estimators of $\theta$:

$E[T_1]=E[T_2]=\theta$,

with

$\operatorname{Var}(T_1)=v_1$,

$\operatorname{Var}(T_2)=v_2$,

$\operatorname{Cov}(T_1,T_2)=c$.

Consider

$T(a)=aT_1+(1-a)T_2$.

Find the $a$ minimizing $\operatorname{Var}(T(a))$, and find the minimum variance.

---

## Solution

$\operatorname{Var}(T(a))
=
a^2v_1+(1-a)^2v_2+2a(1-a)c$.

Expanding,

$\operatorname{Var}(T(a))
=
(v_1+v_2-2c)a^2+2(c-v_2)a+v_2$.

Differentiate and set to zero:

$2(v_1+v_2-2c)a+2(c-v_2)=0$.

Hence

$\boxed{
a^*=\frac{v_2-c}{v_1+v_2-2c}
}$.

The minimum variance is

$\boxed{
\operatorname{Var}(T(a^*))
=
\frac{v_1v_2-c^2}{v_1+v_2-2c}
}$.

Also,

$v_1+v_2-2c
=
\operatorname{Var}(T_1-T_2)\ge0$,

so $v_1+v_2<2c$ is impossible.

If

$v_1+v_2=2c$,

then $T_1=T_2$ almost surely, so every $a$ gives the same estimator.

https://qoj.ac/contest/4126/problem/20248

## Frog Grid

Given 2x8 grid with each frog in each cell, each frog jumps to a random adjacent cell. Calc prob that after 1 jump (all frog jump simultaneously) no two frogs are in the same cell.

## Rolling Dice

100 side die, roll until the current value <= previous value. What is the expected sum of rolls except last roll.

Intuition: use another game, you receive 100$ if that is the last roll (so next roll <= that roll). E(money) of each step is exactly x$, so same as the sum game. So total 100$ expected.
