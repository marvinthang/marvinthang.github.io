---
title: "Probability"
date: 2026-06-12 10:00:00 +0800
categories: [tools]
tags: [probability, statistics, machine learning]
description: "Stat 110-style probability notes covering counting, conditioning, common distributions, Poisson processes, order statistics, inequalities, and limit theorems."
math: true
---

## Core Mindset

1. Don't lose common sense.
2. Check answers with simple cases, extreme cases, and especially the **simplest non-trivial case**.
3. Label people, objects, doors, cards, etc. If there are $n$ people, label them $1,2,\dots,n$.
4. Most probability bugs are modeling bugs, not algebra bugs.
5. Always ask: "How was this information generated?"

A **story proof** is a proof by interpretation: count the exact same thing in two different ways.

### Problem-Solving Strategy

When a problem looks messy, name the objects before doing algebra.

1. Define the events and random variables explicitly.
2. If the question asks for an expected count, try indicators.
3. If factorials or binomial coefficients get ugly, look for a story proof.
4. Check boundary cases like $n=0$, $n=1$, $p=0$, and $p=1$.


## Counting

### President Identity

$$
n\binom{n-1}{k-1}=k\binom{n}{k}
$$

Story: choose a committee of $k$ from $n$ people, with one person designated President.

Left side: choose the President first, then choose the other $k-1$ people.

Right side: choose the committee first, then choose one of the $k$ people as President.

### Vandermonde's Identity

$$
\binom{m+n}{k}=\sum_{i=0}^{k}\binom{m}{i}\binom{n}{k-i}
$$

Story: choose $k$ people from two groups of sizes $m$ and $n$. If $i$ people come from the first group, then $k-i$ people must come from the second group. Sum over all possible $i$.

### Hockey-Stick Identity

$$
\sum_{i=k}^{n}\binom{i}{k}=\binom{n+1}{k+1}
$$

Story: choose $k+1$ numbers from $\{0,1,\dots,n\}$. If the largest chosen number is $i$, choose the other $k$ numbers from $\{0,1,\dots,i-1\}$.

## Bayes' Rule

### Odds Form

$$
\frac{P(A\mid B)}{P(A^c\mid B)}
=
\frac{P(A)}{P(A^c)}
\cdot
\frac{P(B\mid A)}{P(B\mid A^c)}
$$

posterior odds = prior odds $\times$ likelihood ratio.

If odds are $x$, then:

$$
x=\frac{p}{1-p}
\quad\Longleftrightarrow\quad
p=\frac{x}{x+1}
$$

### Disease Testing Example

Suppose a rare disease affects $1\%$ of the population. A test has $95\%$ sensitivity and $95\%$ specificity. If someone tests positive, what is the probability they have the disease?

Let $D$ be disease and $T$ be positive test.

We have $P(D)=0.01$, $P(T\mid D)=0.95$, and $P(T\mid D^c)=0.05$.

$$
P(D\mid T)
=
\frac{P(T\mid D)P(D)}{P(T\mid D)P(D)+P(T\mid D^c)P(D^c)}
$$

$$
P(D\mid T)=\frac{0.95\cdot0.01}{0.95\cdot0.01+0.05\cdot0.99}\approx0.16
$$

Even with a 95% accurate test, the posterior is only about 16% because the prior probability is tiny.

Using odds form:

$$
\frac{P(D\mid T)}{P(D^c\mid T)} = \frac{P(T\mid D)P(D)}{P(T\mid D^c)P(D^c)} = \frac{0.95 \cdot 0.01}{0.05 \cdot 0.99} = \frac{0.0095}{0.0495} \approx 0.192
$$

Then convert back to probability:

$$
P(D\mid T) = \frac{0.192}{0.192 + 1} \approx 0.16
$$

## Conditional Probability Traps

### Prosecutor's Fallacy

In general:

$$
P(A\mid B)\ne P(B\mid A)
$$

Evidence probability is not the same as guilt probability.

In a Sally Clark-style mistake, compare:

$$
P(\text{death}\mid\text{natural causes})
\quad\text{vs.}\quad
P(\text{death}\mid\text{mother is guilty})
$$

This comparison shows how strongly the evidence is against the mother, but it does **not** answer the question of whether the mother is guilty.

Do not confuse either one with:

$$
P(\text{mother is guilty}\mid\text{death})
$$

## Conditional Independence

$A$ and $B$ are conditionally independent given $C$ if:

$$
P(A\cap B\mid C)=P(A\mid C)P(B\mid C)
$$

Equivalently, when the relevant probabilities are nonzero:

$$
P(A\mid B,C)=P(A\mid C)
$$

Conditional independence and ordinary independence are different. Neither implies the other.

### Conditional Independence Does Not Imply Independence

Example:

* $A$ = win game 1.
* $B$ = win game 2.
* $C$ = my true skill level.

Given $C$, the game outcomes can be treated as conditionally independent. Without knowing $C$, winning game 1 is evidence that I am strong, which raises the probability of winning game 2.

### Independence Does Not Imply Conditional Independence

Example:

* $A$ = fire.
* $B$ = popcorn.
* $C$ = alarm goes off.

Fire and popcorn may be independent causes of an alarm. But given that the alarm went off, learning there was no popcorn makes fire more likely.

## Monty Hall

The wrong argument is: "There are two doors left, so it must be 50/50." The issue is that Monty did not open a random door. He used information.

### Law of Total Probability View

Assume you first picked door 1. Let $S$ be the event that switching wins, and let $D_i$ be the event that the car is behind door $i$.

$$
P(S)=P(S\mid D_1)P(D_1)+P(S\mid D_2)P(D_2)+P(S\mid D_3)P(D_3)=\frac{2}{3}
$$

## Simpson's Paradox

Simpson's paradox: a comparison can point one way inside every subgroup, but reverse after aggregation.

| Doctor  | Surgery  | Success | Failure | Success Rate |
| ------- | -------- | ------: | ------: | -----------: |
| Hibbert | Heart    |      70 |      20 |      $70/90$ |
| Hibbert | Band-Aid |      10 |       0 |      $10/10$ |
| Nick    | Heart    |       2 |       8 |       $2/10$ |
| Nick    | Band-Aid |      81 |       9 |      $81/90$ |

Inside each surgery type:

$$
\frac{70}{90}>\frac{2}{10}
\quad\text{and}\quad
\frac{10}{10}>\frac{81}{90}
$$

So Dr. Hibbert is better in both subgroups. But overall:

$$
\frac{80}{100}<\frac{83}{100}
$$

Dr. Nick has the better aggregate rate because he performed many more easy surgeries.

Weighted-average shape:

$$
P(A\mid B)=P(A\mid C,B)P(C\mid B)+P(A\mid C^c,B)P(C^c\mid B)
$$

Even if one group is better in each conditional term, different weights can reverse the aggregate comparison.

Ask:

1. What are we conditioning on?
2. What variable might be a confounder?
3. Are subgroup sizes very different?
4. Does the result reverse inside subgroups?

## First-Step Analysis

First-step analysis solves recursive stochastic processes by conditioning on the first move.

### Gambler's Ruin

Gambler $A$ starts with $i$ dollars. Total money is $N$. Each round, $A$ wins $1$ dollar with probability $p$ and loses $1$ dollar with probability $q=1-p$.

Let:

$$
p_i=P(A\text{ wins the whole game}\mid A\text{ starts with }i)
$$

Boundary conditions:

$$
p_0=0,
\quad
p_N=1
$$

Condition on the first step:

$$
p_i=pp_{i+1}+qp_{i-1},
\quad
1\le i\le N-1
$$

For $p\ne q$:

$$
p_i=\frac{1-\left(\frac{q}{p}\right)^i}{1-\left(\frac{q}{p}\right)^N}
$$

For the fair case $p=q=\frac12$:

$$
p_i=\frac{i}{N}
$$

Moral: a tiny disadvantage becomes brutal over a long game.

## LOTUS and Variance

LOTUS says that for a function $g$:

$$
E[g(X)]=\sum_x g(x)P(X=x)
$$

in the discrete case. The point is that you do **not** need to find the distribution of $g(X)$ first.

Why it works: start from outcomes $s\in S$, then group all outcomes with the same value $X(s)=x$:

$$
E[g(X)]
=\sum_{s\in S}g(X(s))P(s)
=\sum_x g(x)\sum_{s:X(s)=x}P(s)
=\sum_x g(x)P(X=x)
$$

Variance is:

$$
\operatorname{Var}(X)=E[(X-E[X])^2]=E[X^2]-(E[X])^2
$$

Useful rules:

$$
\operatorname{Var}(X+c)=\operatorname{Var}(X)
$$

$$
\operatorname{Var}(cX)=c^2\operatorname{Var}(X)
$$

Variance is not linear in general. If $X,Y$ are independent, then:

$$
\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)
$$

Also, for independent $X_1,X_2$:

$$
\operatorname{Var}(X_1-X_2)=\operatorname{Var}(X_1)+\operatorname{Var}(X_2)
$$

Variances add for independent sums; they do not subtract.

### Tower Property

For a fixed value $y$, $E[X\mid Y=y]$ is a number. By contrast,
$E[X\mid Y]$ is a random variable: it is a function of the random value of
$Y$.

Two useful properties are:

$$
E[h(Y)X\mid Y]=h(Y)E[X\mid Y]
$$

because $h(Y)$ is known once we condition on $Y$, and:

$$
X\perp Y \quad\Longrightarrow\quad E[X\mid Y]=E[X]
$$

The tower property, also called **Adam's law** or the law of iterated
expectation, says:

$$
E[X]=E[E[X\mid Y]]
$$

More generally, if $\mathcal{G}$ is less detailed information than $\mathcal{H}$:

$$
E[E[X\mid \mathcal{H}]\mid \mathcal{G}]=E[X\mid \mathcal{G}]
$$

Interpretation: condition on useful information, compute the conditional expectation, then average over that information.

Discrete version:

$$
E[X]=\sum_y E[X\mid Y=y]P(Y=y)
$$

This is LOTP, but for expectation.

### Total Variance

The law of total variance, also called **Eve's law**, says:

$$
\operatorname{Var}(X)=E[\operatorname{Var}(X\mid Y)]+\operatorname{Var}(E[X\mid Y])
$$

Interpretation:

$$
\text{total variation} = \text{average within-group variation} + \text{between-group variation}
$$

### Total Covariance

The law of total covariance says:

$$
\operatorname{Cov}(X,Y)=E[\operatorname{Cov}(X,Y\mid Z)]+\operatorname{Cov}(E[X\mid Z],E[Y\mid Z])
$$

Special trick:

$$
\operatorname{Cov}(N,X)=\operatorname{Cov}(N,E[X\mid N])
$$

Reason: condition on $N$. Since $N$ is known after conditioning on $N$,

$$
\operatorname{Cov}(N,X\mid N)=0
$$

so the first term in total covariance disappears:

$$
\operatorname{Cov}(N,X)
=\operatorname{Cov}(E[N\mid N],E[X\mid N])
=\operatorname{Cov}(N,E[X\mid N])
$$

### Random Sums

Suppose a store receives a random number $N$ of customers per day, and
customer $i$ spends $X_i$. Assume that $N,X_1,X_2,\dots$ are mutually
independent and that the $X_i$ are identically distributed. The total daily
revenue is:

$$
T=\sum_{i=1}^{N}X_i
$$

Conditioning on $N$ gives:

$$
E[T\mid N]=NE[X]
$$

so Adam's law yields:

$$
E[T]=E[N]E[X]
$$

Similarly:

$$
\operatorname{Var}(T\mid N)=N\operatorname{Var}(X)
$$

and Eve's law gives:

$$
\begin{aligned}
\operatorname{Var}(T)
&=E[\operatorname{Var}(T\mid N)]
  +\operatorname{Var}(E[T\mid N])\\
&=\operatorname{Var}(X)E[N]+(E[X])^2\operatorname{Var}(N).
\end{aligned}
$$

### Two Envelopes Paradox

Two indistinguishable envelopes contain $\$x$ and $\$2x$. After choosing and
opening one, suppose it contains $\$100$. A tempting argument says the other
envelope contains either $\$50$ or $\$200$, each with probability $1/2$, so
switching has expected value:

$$
\frac12(50)+\frac12(200)=125
$$

The same argument would recommend switching no matter which envelope was
opened, even though the two unopened envelopes were symmetric.

The error is the unjustified conditional assignment:

$$
P(\text{other}=50\mid Y=100)
=P(\text{other}=200\mid Y=100)=\frac12
$$

These probabilities depend on the mechanism used to choose the smaller amount
$x$. Making them equal for every possible observation implicitly invokes a
uniform prior over all positive real numbers, which is not a probability
distribution. A valid prior for $x$ is required before the conditional
expectation of switching can be computed.

## Common Discrete Distributions

### Bernoulli

$$
X\sim\operatorname{Bern}(p)
$$

Named after Jacob Bernoulli. A Bernoulli random variable is one success/failure trial:

$$
P(X=1)=p,
\quad
P(X=0)=1-p
$$

$$
E[X]=p,
\quad
\operatorname{Var}(X)=p(1-p)
$$

### Binomial

$$
X\sim\operatorname{Bin}(n,p)
$$

$X$ is the number of successes in $n$ independent Bernoulli$(p)$ trials. It is called **binomial** because its PMF is built from the binomial coefficient $\binom{n}{k}$, the same coefficient in the binomial theorem.

$$
P(X=k)=\binom{n}{k}p^k(1-p)^{n-k},
\quad
k=0,1,\dots,n
$$

$$
E[X]=np, \quad \operatorname{Var}(X)=np(1-p)
$$

Even/odd trick:

$$
P(X\text{ is even})-P(X\text{ is odd})=(1-2p)^n
$$

$$
P(X\text{ is even})=\frac{1+(q-p)^n}{2},
\quad
P(X\text{ is odd})=\frac{1-(q-p)^n}{2}
$$

#### Sum of Binomials

If:

$$
X\sim\operatorname{Bin}(n,p),
\quad
Y\sim\operatorname{Bin}(m,p)
$$

and $X,Y$ are independent, then:

$$
X+Y\sim\operatorname{Bin}(n+m,p)
$$

### Multinomial

It is called **multinomial** because its PMF uses multinomial coefficients, the multi-category analogue of binomial coefficients. The multinomial is the multi-category version of the binomial. Instead of success/failure, each trial lands in exactly one of $k$ categories.

Notation:

$$
\mathbf{X}\sim\operatorname{Mult}_k(n,\mathbf{p})
$$

where $p_1+\cdots+p_k=1$ and $X_i$ counts how many trials land in category $i$.

Joint PMF:

$$
P(X_1=n_1,\dots,X_k=n_k)=\frac{n!}{n_1!\cdots n_k!}p_1^{n_1}\cdots p_k^{n_k}
$$

valid when $n_1+\cdots+n_k=n$.

Each marginal is binomial:

$$
X_i\sim\operatorname{Bin}(n,p_i)
$$

Lumping categories preserves multinomial form. For example, merging categories 1 and 2 gives probability $p_1+p_2$.

### Hypergeometric

It is called **hypergeometric** because its probabilities are built from products and ratios of binomial coefficients, which are coefficients in hypergeometric series. Hypergeometric appears when sampling without replacement.

Suppose there are $w$ white balls and $b$ black balls, and $n$ balls are drawn without replacement. If $X$ is the number of white balls drawn:

$$
X\sim\operatorname{HGeom}(w,b,n)
$$

$$
P(X=k)=\frac{\binom{w}{k}\binom{b}{n-k}}{\binom{w+b}{n}}
$$

$$
E[X]=n\frac{w}{w+b}
$$

Story: choose $k$ white balls, choose $n-k$ black balls, divide by all ways to choose $n$ balls.

Binomial is for independent trials or sampling with replacement. Hypergeometric is for dependent draws or sampling without replacement.

### Geometric

Stat 110 convention:

$$
X\sim\operatorname{Geom}(p)
$$

means $X$ is the number of failures before the first success. It is called **geometric** because its PMF $q^kp$ has terms in a geometric progression.

$$
P(X=k)=q^kp,
\quad
k=0,1,2,\dots
$$

$$
E[X]=\frac{q}{p}, \quad \operatorname{Var}(X)=\frac{q}{p^2}
$$

First-step expectation proof: let $a=E[X]$. On the first trial, success contributes $0$ failures; failure contributes $1$ failure and restarts.

$$
a=p\cdot0+q(1+a)
$$

So:

$$
a=\frac{q}{p}
$$

If $T$ is the number of trials until the first success, then $T=X+1$ and:

$$
E[T]=\frac{1}{p}
$$

Always check the convention.

### Negative Binomial

Stat 110 convention:

$$
X\sim\operatorname{NegBin}(r,p)
$$

means $X$ is the number of failures before the $r$-th success. It is called **negative binomial** because the PMF comes from the negative-binomial series expansion of $(1-q)^{-r}$.

$$
P(X=n)=\binom{n+r-1}{r-1}p^rq^n,
\quad
n=0,1,2,\dots
$$

Story: for $X=n$, the final trial must be the $r$-th success. Before the final trial, there are $n+r-1$ trials containing $r-1$ successes and $n$ failures.

Think of waiting for $r$ successes as $r$ independent geometric waiting blocks:

$$
E[X]=r\frac{q}{p}, \quad \operatorname{Var}(X)=r\frac{q}{p^2}
$$

If $T$ is the total number of trials until the $r$-th success:

$$
E[T]=\frac{r}{p}
$$

### Poisson

$$
X\sim\operatorname{Pois}(\lambda)
$$

Named after Simeon Denis Poisson. Poisson models counts over a large area or time interval when individual event probabilities are small.

$$
P(X=k)=\frac{e^{-\lambda}\lambda^k}{k!},
\quad
k=0,1,2,\dots
$$

$$
E[X]=\lambda,\quad \operatorname{Var}(X)=\lambda
$$

Mean equals variance for a Poisson random variable. One way to show the variance is to use LOTUS plus derivatives of the Taylor series for $e^\lambda$.

Poisson paradigm: if you count many rare events with probabilities $p_j$, where the $p_j$ are small and the events are weakly dependent, the total count is approximately Poisson with:

$$
\lambda=\sum_j p_j
$$

Binomial-to-Poisson limit:

$$
\operatorname{Bin}(n,p)\to\operatorname{Pois}(\lambda)
$$

as $n\to\infty$, $p\to0$, and $np=\lambda$ stays fixed.

#### Poisson Thinning

If:

$$
N\sim\operatorname{Pois}(\lambda)
$$

and each of the $N$ items is independently kept with probability $p$, then the number kept is:

$$
X\sim\operatorname{Pois}(\lambda p)
$$

If $Y$ is the number not kept, then:

$$
Y\sim\operatorname{Pois}(\lambda(1-p))
$$

and:

$$
X\perp Y
$$

This is different from the fixed-$n$ case. If $N=n$ is fixed, then:

$$
X\sim\operatorname{Bin}(n,p)
$$

not Poisson exactly. Write $\operatorname{Pois}(\lambda p)$ for thinning a Poisson count; write $\operatorname{Pois}(np)$ only when using a Poisson approximation to $\operatorname{Bin}(n,p)$.

### Triple Birthday Example

Suppose there are $n$ people, with birthdays uniformly random over 365 days.

For each triple of people $a,b,c$, define $I_{abc}=1$ if all three have the same birthday. For a fixed triple:

$$
P(I_{abc}=1)=\frac{1}{365^2}
$$

There are $\binom{n}{3}$ triples, so the expected number of triple birthday matches is:

$$
\lambda=\binom{n}{3}\frac{1}{365^2}
$$

The indicators are rare and only locally dependent. Disjoint triples are independent; triples sharing one person are also independent. Dependence only appears when two triples share two people, e.g. $I_{abc}$ and $I_{abd}$:

$$
P(I_{abc}=1,I_{abd}=1)=\frac{1}{365^3}
\ne
\frac{1}{365^4}=P(I_{abc}=1)P(I_{abd}=1)
$$

So the Poisson approximation is reasonable:

$$
X\approx\operatorname{Pois}\left(\binom{n}{3}\frac{1}{365^2}\right)
$$

Thus:

$$
P(\text{at least one triple birthday})\approx1-e^{-\lambda}
$$

For $n=100$:

$$
\lambda=\binom{100}{3}\frac{1}{365^2}\approx1.214
$$

so:

$$
P(\text{at least one triple birthday})\approx1-e^{-1.214}\approx0.703
$$

About 70%.

## Continuous Distributions

### Uniform

$$
U\sim\operatorname{Unif}(a,b)
$$

It is called **uniform** because every subinterval of the same length has the same probability. The PDF is flat:

$$
f(x)=\frac{1}{b-a},
\quad
 a\le x\le b
$$

The CDF is:

$$
F(x)=\frac{x-a}{b-a},
\quad
 a\le x\le b
$$

The expectation is:

$$
E[U]=\frac{a+b}{2}
$$

### Exponential

$$
X\sim\operatorname{Expo}(\lambda),\quad \lambda>0
$$

It is called **exponential** because the PDF and survival function are exponential functions. The exponential distribution models continuous waiting time until an event occurs at rate $\lambda$.

PDF:

$$
f(x)=\lambda e^{-\lambda x},\quad x>0
$$

CDF:

$$
F(x)=1-e^{-\lambda x},\quad x>0
$$

Connection to Poisson: if events arrive according to a Poisson process with rate $\lambda$, then the number of arrivals by time $t$ is:

$$
N(t)\sim\operatorname{Pois}(\lambda t)
$$

Let $T$ be the waiting time until the first arrival. Then:

$$
P(T>t)=P(N(t)=0)=e^{-\lambda t}
$$

So:

$$
F_T(t)=P(T\le t)=1-P(T>t)=1-e^{-\lambda t}
$$

Therefore:

$$
T\sim\operatorname{Expo}(\lambda)
$$

So Poisson counts events in a time interval, while Exponential measures the waiting time until the next event.

Mean and variance:

$$
E[X]=\frac{1}{\lambda},\quad \operatorname{Var}(X)=\frac{1}{\lambda^2}
$$

Memoryless property:

$$
P(X\ge s+t\mid X\ge s)=P(X\ge t)
$$

Proof:

$$
P(X\ge s+t\mid X\ge s)=\frac{P(X\ge s+t)}{P(X\ge s)}=\frac{e^{-\lambda(s+t)}}{e^{-\lambda s}}=e^{-\lambda t}
$$

The exponential is the continuous analogue of the geometric distribution, and it is the only continuous distribution with the memoryless property.

### Gamma

The Gamma distribution generalizes Exponential waiting times. With shape
$a>0$ and rate $\lambda>0$:

$$
X\sim\operatorname{Gamma}(a,\lambda)
$$

has PDF:

$$
f_X(x)=\frac{\lambda^a}{\Gamma(a)}x^{a-1}e^{-\lambda x},
\quad x>0
$$

and moments:

$$
E[X]=\frac{a}{\lambda},
\quad
\operatorname{Var}(X)=\frac{a}{\lambda^2}
$$

When $a$ is a positive integer, if
$Y_1,\dots,Y_a\overset{\text{iid}}{\sim}\operatorname{Expo}(\lambda)$, then:

$$
X=Y_1+\cdots+Y_a\sim\operatorname{Gamma}(a,\lambda)
$$

Thus $X$ is the waiting time until the $a$-th event in a Poisson process.

#### Poisson Process

A Poisson process with rate $\lambda$ connects three views of the same arrival
system:

1. The number of arrivals in an interval of length $t$ is
   $\operatorname{Pois}(\lambda t)$.
2. Consecutive interarrival times are independent
   $\operatorname{Expo}(\lambda)$ random variables.
3. The time $T_n$ of the $n$-th arrival is
   $\operatorname{Gamma}(n,\lambda)$.

#### Gamma--Poisson Conjugacy

Gamma is conjugate to the Poisson likelihood. Suppose the unknown arrival rate
has prior:

$$
\lambda\sim\operatorname{Gamma}(a,b)
$$

where $b$ is the rate parameter. If $X$ arrivals are observed during one unit
of time, so that $X\mid\lambda\sim\operatorname{Pois}(\lambda)$, then:

$$
\lambda\mid X\sim\operatorname{Gamma}(a+X,b+1)
$$

More generally, after observing $X$ arrivals over time $t$:

$$
\lambda\mid X\sim\operatorname{Gamma}(a+X,b+t)
$$

The likelihood adds the observed count to the shape and the exposure time to
the rate.

### Chi-Square

Let:

$$
Z_1,\dots,Z_n\overset{\text{iid}}{\sim}\mathcal{N}(0,1)
$$

Then the sum of their squares has a Chi-square distribution with $n$ degrees
of freedom:

$$
V=Z_1^2+\cdots+Z_n^2\sim\chi_n^2
$$

Its mean and variance are:

$$
E[V]=n,
\quad
\operatorname{Var}(V)=2n
$$

The Chi-square distribution is a special case of the Gamma distribution under
the shape-rate parameterization:

$$
\chi_n^2\sim\operatorname{Gamma}\left(\frac n2,\frac12\right)
$$

### Universality of the Uniform

If $X$ is a continuous random variable with strictly increasing CDF $F$, then:

$$
F(X)\sim\operatorname{Unif}(0,1)
$$

Conversely, if $U\sim\operatorname{Unif}(0,1)$, then:

$$
F^{-1}(U)\sim X
$$

This is how computers simulate many distributions: generate a Uniform$(0,1)$ random number, then plug it into the inverse CDF of the target distribution.

### Normal Distribution

It is called **normal** partly for historical reasons: it became the standard, or normal, error model in measurement problems. The standard normal is:

$$
Z\sim\mathcal{N}(0,1)
$$

with PDF:

$$
\varphi(z)=\frac{1}{\sqrt{2\pi}}e^{-z^2/2}
$$

The normal CDF is denoted $\Phi(z)$. It has no elementary closed form, so use a table or software.

By symmetry:

$$
E[Z]=0,\quad E[Z^3]=0
$$

and:

$$
E[Z^2]=\operatorname{Var}(Z)=1
$$

In fact, all odd moments of $Z$ are $0$ because the integrand is odd over a symmetric interval.

A general normal can be defined by a location-scale transform:

$$
X=\mu+\sigma Z,\quad \sigma>0
$$

Then:

$$
X\sim\mathcal{N}(\mu,\sigma^2)
$$

and:

$$
E[X]=\mu,\quad \operatorname{Var}(X)=\sigma^2
$$

Standardization reverses the transformation:

$$
Z=\frac{X-\mu}{\sigma}\sim\mathcal{N}(0,1)
$$

The general normal CDF is:

$$
F_X(x)=P(X\le x)=\Phi\left(\frac{x-\mu}{\sigma}\right)
$$

Differentiate to get the PDF:

$$
f_X(x)=\frac{1}{\sigma}\varphi\left(\frac{x-\mu}{\sigma}\right)
$$

Rule of thumb:

$$
P(|X-\mu|<\sigma)\approx0.68
$$

$$
P(|X-\mu|<2\sigma)\approx0.95
$$

$$
P(|X-\mu|<3\sigma)\approx0.997
$$

### Multivariate Normal

A random vector $\mathbf{X}=(X_1,\dots,X_k)$ is multivariate Normal if every
linear combination of its components is univariate Normal:

$$
t_1X_1+\cdots+t_kX_k
$$

for all fixed $t_1,\dots,t_k\in\mathbb{R}$. It is commonly written:

$$
\mathbf{X}\sim\mathcal{N}_k(\boldsymbol{\mu},\Sigma)
$$

where $\boldsymbol{\mu}=E[\mathbf{X}]$ and $\Sigma$ is the covariance matrix.

For general random variables, zero covariance does not imply independence. For
jointly multivariate Normal variables, however:

$$
\operatorname{Cov}(X_i,X_j)=0
\quad\Longrightarrow\quad
X_i\perp X_j
$$

More generally, jointly Normal subvectors are independent whenever all their
cross-covariances are zero.

### Student's t

Let $Z\sim\mathcal{N}(0,1)$ and $V\sim\chi_n^2$ be independent. Then:

$$
T=\frac{Z}{\sqrt{V/n}}\sim t_n
$$

The $t_n$ distribution is symmetric like the standard Normal but has heavier
tails, reflecting the additional uncertainty from estimating an unknown
population variance. As the degrees of freedom grow:

$$
t_n\xrightarrow{d}\mathcal{N}(0,1)
\quad\text{as }n\to\infty
$$

At one degree of freedom:

$$
t_1\sim\operatorname{Cauchy}
$$

so its mean and variance do not exist.

* For $n>1$, $E[T]=0$. For $n>2$, $\operatorname{Var}(T)=n/(n-2)$.

* k-th moment doesn't exist for $k\ge n$ if $n$ is the degrees of freedom.

### Cauchy

Named after Augustin-Louis Cauchy. The standard Cauchy distribution has PDF:

$$
f(x)=\frac{1}{\pi(1+x^2)}
$$

A classic construction is:

$$
\frac{Z}{W}\sim\operatorname{Cauchy}
$$

where $Z,W$ are independent standard normals.

The Cauchy has very heavy tails. Its mean does not exist, and neither does its variance. This is the trap: sample averages of iid Cauchy random variables do not settle down the way normal-looking intuition suggests.

#### Ratio of Two Standard Normals

Let $X,Y$ be independent standard normals, and define:

$$
T=\frac{X}{Y}
$$

Then $T$ has the standard Cauchy PDF.

Method 1: use a 2D change of variables. Let:

$$
T=\frac{X}{Y},\quad W=Y
$$

Then:

$$
X=TW,\quad Y=W
$$

The Jacobian is:

$$
J=
\begin{pmatrix}
\frac{\partial X}{\partial T} & \frac{\partial X}{\partial W}\\
\frac{\partial Y}{\partial T} & \frac{\partial Y}{\partial W}
\end{pmatrix}
=
\begin{pmatrix}
W & T\\
0 & 1
\end{pmatrix}
$$

so:

$$
|\det(J)|=|W|
$$

Since $X,Y$ are independent standard normals:

$$
f_{X,Y}(x,y)=\frac{1}{2\pi}e^{-(x^2+y^2)/2}
$$

Therefore:

$$
f_{T,W}(t,w)=f_{X,Y}(tw,w)|w|=\frac{1}{2\pi}|w|e^{-w^2(1+t^2)/2}
$$

Marginalize out $w$:

$$
f_T(t)=\int_{-\infty}^{\infty}\frac{1}{2\pi}|w|e^{-w^2(1+t^2)/2}\,dw
$$

By symmetry and the substitution $u=w^2(1+t^2)/2$:

$$
f_T(t)=\frac{1}{\pi}\int_0^\infty we^{-w^2(1+t^2)/2}\,dw=\frac{1}{\pi(1+t^2)}
$$

Method 2: condition on $Y=y$. Then:

$$
T\mid Y=y=\frac{X}{y}\sim\mathcal{N}\left(0,\frac{1}{y^2}\right)
$$

so:

$$
f_{T\mid Y}(t\mid y)=\frac{|y|}{\sqrt{2\pi}}e^{-t^2y^2/2}
$$

Using continuous LOTP:

$$
f_T(t)=\int_{-\infty}^{\infty}f_{T\mid Y}(t\mid y)f_Y(y)\,dy
=\frac{1}{2\pi}\int_{-\infty}^{\infty}|y|e^{-y^2(1+t^2)/2}\,dy
=\frac{1}{\pi(1+t^2)}
$$

### Beta

$$
X\sim\operatorname{Beta}(a,b)
$$

It is called **Beta** because its normalizing constant is the Beta function. Beta lives on $[0,1]$, so it is useful as a distribution for unknown probabilities.

PDF:

$$
f(x)=\frac{1}{B(a,b)}x^{a-1}(1-x)^{b-1},\quad 0<x<1
$$

where:

$$
B(a,b)=\frac{\Gamma(a)\Gamma(b)}{\Gamma(a+b)}
$$

Mean:

$$
E[X]=\frac{a}{a+b}
$$

Interpretation: $a$ and $b$ act like pseudo-counts of successes and failures. In particular:

$$
\operatorname{Beta}(1,1)=\operatorname{Unif}(0,1)
$$

Beta is conjugate to Binomial. If:

$$
p\sim\operatorname{Beta}(a,b)
$$

and after $n$ trials you observe $X$ successes, then:

$$
p\mid X\sim\operatorname{Beta}(a+X,b+n-X)
$$

### Order Statistics

Let $X_1,\dots,X_n$ be iid continuous random variables with PDF $f$ and CDF
$F$, and write their sorted values as:

$$
X_{(1)}\le X_{(2)}\le\cdots\le X_{(n)}
$$

For $X_{(k)}$ to lie in an infinitesimal interval at $x$, choose the observation
in that interval, choose the $k-1$ observations below $x$, and force the
remaining $n-k$ observations above $x$. Therefore:

$$
f_{X_{(k)}}(x)
=n\binom{n-1}{k-1}f(x)F(x)^{k-1}(1-F(x))^{n-k}
$$

Equivalently, the coefficient is
$n!/\bigl((k-1)!(n-k)!\bigr)$.

For the maximum, all observations must be at most $x$:

$$
F_{X_{(n)}}(x)=F(x)^n
$$

and hence:

$$
f_{X_{(n)}}(x)=nF(x)^{n-1}f(x)
$$

For the minimum, it is quickest to use the survival function:

$$
P(X_{(1)}>x)=(1-F(x))^n
$$

so:

$$
F_{X_{(1)}}(x)=1-(1-F(x))^n
$$

If $U_1,\dots,U_n$ are iid $\operatorname{Unif}(0,1)$, then the general formula
reduces to:

$$
U_{(j)}\sim\operatorname{Beta}(j,n-j+1)
$$

Consequently, if $B\sim\operatorname{Beta}(j,n-j+1)$ and
$X\sim\operatorname{Bin}(n,p)$, then:

$$
P(X\ge j)=P(B\le p)
$$

This identity is the same event viewed as either at least $j$ Uniform points
falling below $p$, or the $j$-th smallest point falling below $p$.

## Laplace Rule of Succession

Suppose an unknown success probability has prior:

$$
p\sim\operatorname{Unif}(0,1)
$$

After observing $n$ successes in $n$ trials, the likelihood is $p^n$. The posterior density is:

$$
f(p\mid X=n)=\frac{p^n}{\int_0^1 p^n\,dp}=(n+1)p^n
$$

The predictive probability of success on the next trial is the posterior mean:

$$
E[p\mid X=n]=\int_0^1 p(n+1)p^n\,dp=\frac{n+1}{n+2}
$$

After 1 observed success, the prediction is $2/3$. After 365 successes, it is $366/367$. You approach certainty but never reach exactly $1$.

## Moment Generating Functions

The moment generating function of $X$ is:

$$
M_X(t)=E[e^{tX}]
$$

The $n$-th derivative at $0$ gives the $n$-th moment:

$$
M_X^{(n)}(0)=E[X^n]
$$

Reason: expand $e^{tX}$ as a Taylor series:

$$
E[e^{tX}]=\sum_{n=0}^{\infty}\frac{E[X^n]t^n}{n!}
$$

If $X,Y$ are independent:

$$
M_{X+Y}(t)=M_X(t)M_Y(t)
$$

MGFs are useful because, when they exist near $0$, they uniquely determine the distribution.

| Distribution      | Parameters                    | MGF $M_X(t)$                                        | Valid for              |
| ----------------- | ----------------------------- | --------------------------------------------------- | ---------------------- |
| Bernoulli         | $X\sim\mathrm{Bern}(p)$       | $\boxed{1-p+pe^t}$                                  | all $t$                |
| Binomial          | $X\sim\mathrm{Bin}(n,p)$      | $\boxed{(1-p+pe^t)^n}$                              | all $t$                |
| Poisson           | $X\sim\mathrm{Pois}(\lambda)$ | $\boxed{\exp(\lambda(e^t-1))}$                      | all $t$                |
| Geometric         | $P(X=k)=(1-p)^{k-1}p,\ k\ge1$ | $\boxed{\frac{pe^t}{1-(1-p)e^t}}$                   | $t<-\ln(1-p)$          |
| Negative binomial | trials until $r$ successes    | $\boxed{\left(\frac{pe^t}{1-(1-p)e^t}\right)^r}$    | $t<-\ln(1-p)$          |
| Uniform           | $X\sim U(a,b)$                | $\boxed{\frac{e^{tb}-e^{ta}}{t(b-a)}}$              | all $t$, with $M(0)=1$ |
| Exponential       | rate $\lambda$                | $\boxed{\frac{\lambda}{\lambda-t}}$                 | $t<\lambda$            |
| Gamma             | shape $\alpha$, rate $\beta$  | $\boxed{\left(\frac{\beta}{\beta-t}\right)^\alpha}$ | $t<\beta$              |
| Chi-square        | $X\sim\chi_\nu^2$             | $\boxed{(1-2t)^{-\nu/2}}$                           | $t<1/2$                |
| Standard normal   | $Z\sim N(0,1)$                | $\boxed{e^{t^2/2}}$                                 | all $t$                |
| Normal            | $X\sim N(\mu,\sigma^2)$       | $\boxed{e^{\mu t+\sigma^2t^2/2}}$                   | all $t$                |

## Covariance and Correlation

Covariance measures linear co-movement:

$$
\operatorname{Cov}(X,Y)=E[(X-E[X])(Y-E[Y])]=E[XY]-E[X]E[Y]
$$

Key facts:

$$
\operatorname{Cov}(X,X)=\operatorname{Var}(X)
$$

$$
\operatorname{Cov}(aX+b,cY+d)=ac\operatorname{Cov}(X,Y)
$$

General variance-of-sum formula:

$$
\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)+2\operatorname{Cov}(X,Y)
$$

If $X,Y$ are independent, then $\operatorname{Cov}(X,Y)=0$.

Correlation standardizes covariance:

$$
\rho(X,Y)=\frac{\operatorname{Cov}(X,Y)}{\sqrt{\operatorname{Var}(X)\operatorname{Var}(Y)}}
$$

Always:

$$
-1\le \rho(X,Y)\le1
$$

Independence implies zero covariance, but zero covariance does **not** imply independence. Example: $X\sim\mathcal{N}(0,1)$ and $Y=X^2$ have nonlinear dependence even though the symmetric linear correlation is $0$.

## Transformations and Convolutions

### 1D Change of Variables

If $Y=g(X)$ and $g$ is strictly monotone, write $x=g^{-1}(y)$. Then:

$$
f_Y(y)=f_X(x)\left|\frac{dx}{dy}\right|
$$

The derivative term corrects for stretching or squishing of the axis.

### 2D Change of Variables

For a transformation from $(X,Y)$ to $(U,V)$, first solve $x=x(u,v)$ and $y=y(u,v)$. Then compute the Jacobian matrix:

$$
J=
\begin{pmatrix}
\frac{\partial x}{\partial u} & \frac{\partial x}{\partial v}\\
\frac{\partial y}{\partial u} & \frac{\partial y}{\partial v}
\end{pmatrix}
$$

The transformed joint PDF is:

$$
f_{U,V}(u,v)=f_{X,Y}(x(u,v),y(u,v))\left|\det(J)\right|
$$

### Convolution

If $X,Y$ are independent continuous random variables and $T=X+Y$, then:

$$
f_T(t)=\int_{-\infty}^{\infty}f_X(x)f_Y(t-x)\,dx
$$

Convolution integrates over all ways the two variables can add to $t$.

## Inequalities

Probability inequalities give distribution-free bounds from limited moment
information.

**Markov's inequality.** If $X\ge0$ and $a>0$, then:

$$
P(X\ge a)\le\frac{E[X]}{a}
$$

**Chebyshev's inequality.** If $X$ has mean $\mu$ and finite variance, then for
$c>0$:

$$
P(\lvert X-\mu\rvert\ge c)
\le\frac{\operatorname{Var}(X)}{c^2}
$$

This follows by applying Markov's inequality to the non-negative random
variable $(X-\mu)^2$.

**Cauchy--Schwarz inequality.** For square-integrable $X$ and $Y$:

$$
\lvert E[XY]\rvert\le\sqrt{E[X^2]E[Y^2]}
$$

This implies $-1\le\operatorname{Corr}(X,Y)\le1$ whenever both variances are
positive and finite.

**Jensen's inequality.** If $g$ is convex, then:

$$
E[g(X)]\ge g(E[X])
$$

For concave $g$, the inequality reverses. Taking $g(x)=x^2$ gives
$E[X^2]\ge(E[X])^2$, hence $\operatorname{Var}(X)\ge0$.

## Laws of Large Numbers and Central Limit Theorem

Let $X_1,X_2,\dots$ be iid random variables with mean $\mu$ and finite variance
$\sigma^2$, and define:

$$
\overline{X}_n=\frac1n\sum_{i=1}^{n}X_i
$$

### Law of Large Numbers

The weak law of large numbers states that the sample mean converges in
probability to the population mean. For every $\varepsilon>0$:

$$
\lim_{n\to\infty}
P(\lvert\overline{X}_n-\mu\rvert\ge\varepsilon)=0
$$

Under the finite-variance assumptions above, Chebyshev's inequality proves this
directly:

$$
P(\lvert\overline{X}_n-\mu\rvert\ge\varepsilon)
\le
\frac{\operatorname{Var}(\overline{X}_n)}{\varepsilon^2}
=
\frac{\sigma^2}{n\varepsilon^2}
\longrightarrow0
$$

The strong law gives the stronger almost-sure convergence:

$$
P\left(\lim_{n\to\infty}\overline{X}_n=\mu\right)=1
$$

### Central Limit Theorem

The law of large numbers identifies the limiting location of the sample mean.
The central limit theorem describes the shape and scale of its fluctuations:

$$
\frac{\overline{X}_n-\mu}{\sigma/\sqrt n}
\xrightarrow{d}\mathcal{N}(0,1)
$$

Equivalently, for large $n$:

$$
\overline{X}_n\approx
\mathcal{N}\left(\mu,\frac{\sigma^2}{n}\right)
$$

The standard error $\sigma/\sqrt n$ shrinks at rate $n^{-1/2}$. The finite,
positive variance assumption matters: heavy-tailed examples such as the
Cauchy distribution do not satisfy this version of the theorem.

## St. Petersburg Paradox

Flip a fair coin until the first heads. Let $T$ be the number of flips until the first heads. If the first heads occurs on flip $k$, payout is $2^k$.

$$
P(T=k)=\frac{1}{2^k}
$$

Let $Y=2^T$. Then:

$$
E[Y]=\sum_{k=1}^{\infty}2^k\frac{1}{2^k}
=\sum_{k=1}^{\infty}1
=\infty
$$

The expected payout is infinite, but nobody would pay infinite money to play. Expected value alone can be misleading when rare enormous outcomes dominate the average.

If the largest payout is capped at $2^{40}$, then:

$$
E[Y]=\sum_{k=1}^{40}2^k\frac{1}{2^k}=40
$$

With a finite cap, the expectation is finite.

## Markov Chains

A Markov chain is a stochastic process
$X_0,X_1,X_2,\dots$ that moves between states in discrete time.

### Markov Property

Given the present state, the next state is conditionally independent of the
entire past:

$$
P(X_{n+1}=j\mid X_n=i,X_{n-1}=i_{n-1},\dots,X_0=i_0)
=
P(X_{n+1}=j\mid X_n=i)
$$

This is memorylessness over time: the current state contains all the information
from the history that is relevant to the next transition.

### Transition Matrix

For a chain with $M$ states, the transition matrix $Q$ is the $M\times M$
matrix with entries:

$$
q_{ij}=P(X_{n+1}=j\mid X_n=i)
$$

Each row is a probability distribution:

$$
q_{ij}\ge0,
\quad
\sum_{j=1}^{M}q_{ij}=1
$$

The $n$-step transition probabilities are the entries of the matrix power:

$$
P(X_n=j\mid X_0=i)=(Q^n)_{ij}
$$

### Classification of States

A state is **recurrent** if, starting from that state, the probability of
eventually returning is $1$. It is **transient** if there is positive
probability of leaving and never returning.

For example, in Gambler's Ruin the intermediate wealth states are transient,
while bankruptcy and the target fortune are recurrent absorbing states.

A chain is **irreducible** if every state can eventually reach every other
state. Equivalently, for every pair $i,j$, there exists some $n\ge0$ such that:

$$
(Q^n)_{ij}>0
$$

### Stationary Distributions

A probability row vector
$\mathbf{s}=(s_1,\dots,s_M)$ is stationary if:

$$
\mathbf{s}Q=\mathbf{s}
$$

Thus $\mathbf{s}$ is a left eigenvector of $Q$ with eigenvalue $1$, normalized
so that:

$$
s_i\ge0,
\quad
\sum_{i=1}^{M}s_i=1
$$

If $X_0\sim\mathbf{s}$, then $X_n\sim\mathbf{s}$ at every later time. For a
finite irreducible chain, the stationary distribution is unique, and $s_i$ is
the long-run fraction of time spent in state $i$.

### Reversibility and Detailed Balance

A Markov chain is reversible with respect to $\mathbf{s}$ if, for every pair of
states $i,j$:

$$
s_iq_{ij}=s_jq_{ji}
$$

These are the **detailed balance equations**. They say that, in equilibrium,
the probability flow from $i$ to $j$ equals the flow from $j$ to $i$.

Any probability vector satisfying detailed balance is stationary. Indeed:

$$
(\mathbf{s}Q)_j
=
\sum_i s_iq_{ij}
=
\sum_i s_jq_{ji}
=
s_j\sum_i q_{ji}
=
s_j
$$

Detailed balance can therefore identify a stationary distribution without
directly solving the left-eigenvector equation.

### Random Walk on an Undirected Graph

Consider a finite connected undirected graph. Let $d_i$ be the degree of vertex
$i$. From the current vertex, choose one of its incident edges uniformly and
move across it. Then:

$$
q_{ij}
=
\begin{cases}
\frac{1}{d_i}, & \text{if }i\text{ and }j\text{ are adjacent},\\
0, & \text{otherwise}.
\end{cases}
$$

For adjacent vertices $i$ and $j$, detailed balance requires:

$$
s_i\frac1{d_i}=s_j\frac1{d_j}
$$

so $s_i$ must be proportional to $d_i$. Normalizing gives:

$$
s_i=\frac{d_i}{\sum_k d_k}
$$

Therefore, the long-run fraction of time spent at a vertex is proportional to
its degree: highly connected vertices are visited more often.
