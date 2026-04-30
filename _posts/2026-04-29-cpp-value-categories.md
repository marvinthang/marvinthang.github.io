---
title: Value Categories in C++
date: 2026-04-29 10:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, value-categories, c++]
description: Back to Basics. Master C++ Value Categories With Standard Tools - Inbal Levi - CppCon 2022
math: true
---

Source: [Back to Basics: Master C++ Value Categories With Standard Tools - Inbal Levi - CppCon 2022](https://youtu.be/tH0Z2OvHAd8?si=7GgLzD47ArBn4PyR)

## Motivation: Miscommunicating with the Compiler

Value categories affect overload resolution, lifetime extension, and whether an expression can use the move path. Misunderstanding them can lead to accidental copies, especially for resource-owning types where copying is expensive.

Consider a resource-owning `Data` type:
```c++
struct Data {
    Data() = default;
    Data(const Data&) { /* expensive heap allocation */ } // copy constructor
    Data(Data&&) { /* cheap resource steal */ }           // move constructor

    Data& operator=(const Data&) { return *this; } // copy assignment
    Data& operator=(Data&&) { return *this; }      // move assignment
};

const Data getData(int val); // notice the const return type!

void Use() {
    Data d1;
    Data d2;

    d2 = std::move(d1); // move assignment invoked
    d2 = getData(42);   // copy assignment invoked!
}
```

When we call `getData(42)`, the expression is still an rvalue expression.  
However, the compiler must also obey type binding rules. The return type is `const Data`, so the expression has type `const Data`.

Let's look at overload resolution:
* **`Data& operator=(Data&&)` (Move Assignment):** Requires a mutable rvalue reference. Our returned object is `const`, and C++ does not allow dropping a `const` qualifier. **Binding fails.**
* **`Data& operator=(const Data&)` (Copy Assignment):** Requires a `const` lvalue reference. A `const T&` can bind to rvalues too, including a `const` rvalue. **Binding succeeds.**

> **Could it bind to `const Data&&`?**  
> Yes. If we explicitly wrote an overload taking `const Data&&`, it could bind.  
> But normal move operations use `Data&&`, not `const Data&&`, because stealing resources usually requires modifying the source object.
{: .prompt-info }

Because the move assignment operator cannot bind to a `const` rvalue, the compiler falls back to copy assignment.

> Avoid returning by `const` value.  
> It usually gives no benefit, and it can block move operations when the result is assigned or passed to something expecting `T&&`.
{: .prompt-danger }

## Value Categories

> **Value category is a property of an *expression*, NOT an object or a type.**
{: .prompt-tip }

Historically, `lvalue` and `rvalue` came from the left/right side of assignment.

```c++
auto a = int(42);
```

Old intuition:
* `a` is on the left side, so it was called an lvalue.
* `int(42)` is on the right side, so it was called an rvalue.

> In modern C++, this left/right intuition is mostly outdated.  
> Value categories are about identity and movability, not assignment position.
{: .prompt-info }

Modern value categories are mainly about two questions:

* **Identity**: does this expression refer to a specific object/function?
* **Movability**: can this expression be treated as expiring, so resources may be reused?

These properties matter because they affect:

* **Overload resolution**: which function/constructor is selected.
* **Performance**: whether code can use the move path instead of copying.

### The Golden Rule: Expressions vs. Types

This is the most common trap when learning move semantics: **type and value category are different things**.

Consider this code:
```c++
struct Data {
    Data(int x);
    int x_;
};

void foo(Data&& x) {
    x = 42; // Modifying the resource
}

void Use() {
    Data&& a = 42; 
    
    foo(a);          // FAIL! 'a' is an lvalue!
    foo(Data(73));   // OK: 'Data(73)' is a prvalue (which is an rvalue)
}
```

Why does `foo(a)` fail?

Because `a` has two separate facts:

* declared type: `Data&&`
* value category: lvalue

`foo(Data&&)` needs an rvalue expression.  
But `a` is a named variable, so the expression `a` is an lvalue.

> If you actually wanted to pass `a` to `foo`, you would have to cast the expression back into an rvalue (specifically, an xvalue) by calling `foo(std::move(a));`.
{: .prompt-tip }

> The name of a variable is almost always an lvalue expression.  
> This includes variables whose type is `T&&`.
{: .prompt-warning }

## The Modern Taxonomy

Each expression has two properties:
1. A **type** (e.g., `Data`, `Data&`, `Data&&`).
2. A **value category** (e.g., lvalue, xvalue, prvalue).

Modern C++ divides expressions using two main attributes:
1. **Identity (`glvalue`):** Does it have a specific memory address you can safely refer to?
2. **Movability (`rvalue`):** Is it safe to steal resources from it?

* Main Categories (classification only)
  * **glvalue**: expression whose evaluation determines the identity of an object or function  
  * **rvalue**: a prvalue or an xvalue  

* Subcategories
  * **lvalue**: glvalue that is not an xvalue  
  * **xvalue**: glvalue that denotes an object whose resources can be reused (usually because it is near the end of its lifetime)  
  * **prvalue**: expression whose evaluation initializes an object, or computes the value of the operand of an operator, as specified by the context in which it appears, or an expression that has type cv void

This gives us the three primary value categories:

| Category    | Has Identity? | Uses move path directly? | Examples                                          |
| :---------- | :-----------: | :----------------------: | :------------------------------------------------ |
| **lvalue**  |      Yes      |            No            | Variables, functions, string literals (`"hello"`) |
| **xvalue**  |      Yes      |           Yes            | `std::move(obj)`, `Data{}.member`                 |
| **prvalue** |    No-ish     |           Yes            | `42`, `nullptr`, lambda returns, `Data{}`         |

> `No-ish` because since C++17, prvalues can materialize temporary objects when needed.  
> But conceptually, a prvalue starts as a pure value, not as an object with stable identity.
{: .prompt-info }

### Common Examples

For lvalues:

```c++
int a = 42;          // 'a' is an lvalue
int b = a;           // 'a' is an lvalue expression
++a;                 // '++a' is an lvalue expression
string s = "hello";  // "hello" is an lvalue expression (string literals are lvalues)
a == b ? a : b;      // ternary operator returns an lvalue expression (when both sides are lvalues)
int &&ra = 42;       // 'ra' is an lvalue, even though its type is rvalue reference
```

> **Why is a string literal an lvalue?**  
> String literals have static storage duration and a fixed memory address. They are not temporary values; they exist for the entire duration of the program. Therefore, they are lvalues because they have identity and can be referred to by their address.
{: .prompt-info }

For prvalues:

```c++
int a = 42;             // '42' is a prvalue
int *pa = &a;           // '&a' is a prvalue (address of an lvalue is a prvalue)
pa = nullptr;           // 'nullptr' is a prvalue
bool equal = (a == 42); // 'a == 42' is a prvalue (result of comparison)
a++;                    // 'a++' is a prvalue (returns the value before incrementing)
auto lambda = []() { return 42; }; // '[]() { return 42; }' expression is a prvalue
a == a ? throw 2 : throw 3; // 'throw 2' and 'throw 3' are prvalues (throw expressions)

struct Data {
    int n;
    void foo() { this->n = 42; } // 'this' is a prvalue expression
};
``` 
> **Why is `this` a prvalue?**  
> `this` is a pointer value.  
> In a non-const member function, its type is `Data* const`, but the expression `this` itself is a prvalue.
>
> It points to an object with identity, but `this` as an expression is just a temporary pointer value.  
> That is why `&this` is not allowed.
{: .prompt-info }

For xvalues:

```c++
std::move(a);   // 'std::move(a)' is an xvalue

Data d;
d.n;            // lvalue: member access on an lvalue object
Data{}.n;       // xvalue: member access on a temporary object
```

> `std::move(a)` does not move anything by itself.
> It only casts `a` to an xvalue.
{: .prompt-warning }

> **Why is `Data{}.n` an xvalue?**  
> `Data{}` creates a temporary object. When we access `.n`, we are referring to a specific subobject inside that temporary.  
> So `Data{}.n` has **identity**, because it refers to a real subobject. But that subobject belongs to a temporary object, so it is treated as **expiring**.  
> Therefore, `Data{}.n` is an xvalue.
{: .prompt-info }

### Function Calls and Value Categories

Another example:

```c++
struct Data {
    int foo();
    int& bar();
    int&& baz();
};

Data d;
d.foo(); // prvalue: returns int by value
d.bar(); // lvalue: returns int&
d.baz(); // xvalue: returns int&&
```

Function return types determine the value category of the expression: 
* return by value `T` -> prvalue
* return by lvalue reference `T&` -> lvalue
* return by rvalue reference `T&&` -> xvalue

## Reference Binding

Expressions with different value categories bind to different kinds of references.

The important idea is:

> The expression's value category decides what reference type it can bind to.  
> After binding, the reference type decides what operations are allowed.
{: .prompt-info }

```c++
int a = 42;

int& la = a;
const int& cla = a;
int&& ra = a + 73;
const int&& cra = 42;
```

| Declaration             | Initial expression | Category | Can assign through it? | Why                                   |
| ----------------------- | ------------------ | -------- | ---------------------- | ------------------------------------- |
| `int& la = a;`          | `a`                | lvalue   | Yes                    | mutable reference to a                |
| `const int& cla = a;`   | `a`                | lvalue   | No                     | reference treats object as const      |
| `int&& ra = a + 73;`    | `a + 73`           | prvalue  | Yes                    | temporary is materialized and mutable |
| `const int&& cra = 42;` | `42`               | prvalue  | No                     | temporary is const                    |

> Reference variables have names, so expressions like `la`, `cla`, `ra`, and `cra` are all lvalue expressions.
{: .prompt-warning }

### Binding affects common C++ events

Binding rules are important in many places:

#### 1. Initialization or Assignment

Consider:

```c++
int a = 42;

int& la1 = a;              // OK
int& la2 = 73;             // Error

const int& cla1 = a;       // OK
const int& cla2 = 73;      // OK

int&& ra1 = a;             // Error
int&& ra2 = a + 42;        // OK

const int&& cra1 = a;      // Error
const int&& cra2 = a + 42; // OK
```

The binding table:

| Reference type | Binds lvalues? | Binds rvalues? | Example                                         |
| -------------- | -------------: | -------------: | ----------------------------------------------- |
| `T&`           |            Yes |             No | `int& la1 = a;`                                 |
| `const T&`     |            Yes |            Yes | `const int& cla1 = a;`, `const int& cla2 = 73;` |
| `T&&`          |             No |            Yes | `int&& ra2 = a + 42;`                           |
| `const T&&`    |             No |            Yes | `const int&& cra2 = a + 42;`                    |

> `const T&` can bind to almost everything, but it only gives read-only access.
{: .prompt-info }

##### Lifetime Extension

Binding a temporary to a reference can extend its lifetime:

```c++
const int& x = 73;  // lifetime extended, read-only
int&& y = 42;       // lifetime extended, mutable
const int&& z = 42; // lifetime extended, read-only
```

> Lifetime extension only means the temporary lives longer.
> It does not become an independent normal variable.
{: .prompt-warning }

#### 2. Function Calls

Binding also matters when passing arguments to functions.
Consider:

```c++
struct Data {
    Data(int n) : _n(n) {}
    int _n;
};

const Data getData(int x) {
    return Data(x);
}

void foo(Data& x) {}             // 1
void foo(const Data& x) {}       // 2
void foo(Data&& x) {}            // 3
void foo(const Data&& x) {}      // 4
```

Now:

```c++
Data d = 42;

Data& lval_ref_d = d;
const Data& c_lval_ref_d = d;
Data&& rval_ref_d = Data(73);
const Data&& c_rval_ref_d = Data(42);
```

Function calls:

```c++
foo(lval_ref_d);    // lvalue: calls 1, 2 (but 1 is better match)
foo(c_lval_ref_d);  // const lvalue: calls 2
foo(rval_ref_d);    // lvalue: calls 1, 2, because named rvalue reference is lvalue
foo(c_rval_ref_d);  // const lvalue: calls 2
foo(Data(73));      // xvalue/prvalue temporary: calls 3, 4, 2
foo(getData(42));   // const rvalue: calls 4, 2, because return type is const Data
```

Important cursed part:

```c++
Data&& rval_ref_d = Data(73);

foo(rval_ref_d); // calls foo(Data&), NOT foo(Data&&)
```

Why?  
Because `rval_ref_d` has a name.
So the expression `rval_ref_d` is an lvalue.
If we want to call the rvalue overload, we need:

```c++
foo(std::move(rval_ref_d)); // calls foo(Data&&)
```

| Argument expression | Value category | Type / constness | Best overload       |
| ------------------- | -------------- | ---------------- | ------------------- |
| `lval_ref_d`        | lvalue         | `Data`           | `foo(Data&)`        |
| `c_lval_ref_d`      | lvalue         | `const Data`     | `foo(const Data&)`  |
| `rval_ref_d`        | lvalue         | `Data`           | `foo(Data&)`        |
| `c_rval_ref_d`      | lvalue         | `const Data`     | `foo(const Data&)`  |
| `Data(73)`          | prvalue        | `Data`           | `foo(Data&&)`       |
| `getData(42)`       | prvalue        | `const Data`     | `foo(const Data&&)` |

> Function overload resolution uses the value category of the argument expression, not just the declared type of the variable.
{: .prompt-warning }

> `T&&` usually means the function is allowed to consume or steal from the argument.  
> After passing something as `std::move(x)`, don't rely on the old value of `x`.
{: .prompt-warning }

#### 3. Return Statement

Starting from C++17, value categories around return statements changed because of **guaranteed copy elision**.

##### Guaranteed Copy Elision

Consider:

```c++
Data d = Data(Data(42));
```

Before C++17, `Data(42)` could create one temporary object.
Then `Data(Data(42))` could create another temporary by moving from the first one.
Finally, `d` could be constructed by moving from that second temporary.

So conceptually:

```c++
Data temp1(42);                 // CTOR
Data temp2(std::move(temp1));   // Move CTOR, or copy CTOR if move is not available
Data d(std::move(temp2));       // Move CTOR, or copy CTOR if move is not available
```

Since C++17, this is guaranteed to construct `d` directly.
Conceptually:

```c++
Data d = Data(Data(42)); // only one constructor call
```

The extra temporary objects are not created.
So the compiler avoids copy and move construction completely.

> Since C++17, some prvalues do not create temporary objects immediately.
> They are used to initialize the final object directly.
{: .prompt-info }

##### Return Value Optimization

Consider:

```c++
Data getData(int x) {
    return Data(x);
}

Data d = getData(42);
```

In C++17, this also constructs `d` directly.
Conceptually:
```c++
Data d = getData(42); // one constructor call
```

The returned `Data(x)` is not first created somewhere else and then moved into `d`.
Instead, `d` is constructed directly from `Data(x)`.  
This is usually called **RVO**.
Since C++17, this case is guaranteed by the language, so it is more than just an optional optimization.

> In this case, there is no copy and no move.
> The object is built directly where it needs to live.
{: .prompt-tip }

##### Temporary Materialization

Since C++17, a prvalue is not always an object immediately.  
It is more like a recipe for creating an object.

When C++ needs an actual object, the prvalue is **materialized**.
This is called **temporary materialization conversion**.  

```c++
Data{};    // prvalue
Data{}.n; // materialize Data{}, then .n is an xvalue
```

> A **prvalue** of type `T` can be converted to an **xvalue** of type `T`.
> This creates a temporary object from the **prvalue** and produces an **xvalue** referring to that temporary.
{: .prompt-info }

> The original prvalue expression is still classified as a prvalue, even after materialization.  
> Materialization just creates a temporary object **behind the scenes** when C++ needs one.
{: .prompt-warning }

> In order to materialize, `T` must be a complete type.
{: .prompt-danger }

## Summary

* Value category is a property of an **expression**, not an object.
* Named variables are lvalues, even if their type is `T&&`.
* `std::move(x)` only casts `x` to an xvalue.
* Reference binding decides what operations are allowed.
* Since C++17, many prvalues construct the final object directly, with no copy or move.

> Most bugs here come from mixing up **declared type** and **expression category**.
{: .prompt-warning }

## Value Categories in Generic Code

Generic code has two important ideas:
* reference collapsing
* forwarding reference

### Reference Collapsing

In normal code, references to references are not allowed:

```c++
int& &  x;  // not valid directly
int& && x;  // not valid directly
```

But in generic code, reference-to-reference situations can appear after template substitution.  
For example:

```c++
template <typename T>
void foo(T&& x);
```

If we call:

```c++
int a = 42;
foo(a);
```

then `T` is deduced as `int&`.

So internally, the parameter type becomes `int& && x`.

C++ then applies **reference collapsing**.

The rule is simple:

| Form     | Collapses to |
| -------- | ------------ |
| `T& &`   | `T&`         |
| `T& &&`  | `T&`         |
| `T&& &`  | `T&`         |
| `T&& &&` | `T&&`        |

> If there is at least one `&`, the result is `&`.
> Only `&& &&` stays `&&`.
{: .prompt-tip }

So `int& && x` collapses to `int& x`.  
That is why `foo(a)` can bind even though the parameter looks like `T&&`.

Another example:

```c++
typedef int&  lref;
typedef int&& rref;

int a;
lref&  b = a;  // int& &   = int&
lref&& c = a;  // int& &&  = int&
rref&  d = a;  // int&& &  = int&
rref&& e = a;  // int&& && = int&&
```

### Forwarding Reference

A parameter like this:

```c++
template <typename T>
void foo(T&& x);
```

is not always a normal rvalue reference.

When `T` is deduced, `T&&` becomes a **forwarding reference**.

It can bind to both lvalues and rvalues:

```c++
int a = 42;

foo(a);   // OK, lvalue
foo(42);  // OK, rvalue
```

What happens:

| Call      | `T` deduced as | Parameter after collapsing |
| --------- | -------------- | -------------------------- |
| `foo(a)`  | `int&`         | `int&`                     |
| `foo(42)` | `int`          | `int&&`                    |

So the same function template can accept both cases.

### Why `std::forward` is needed

Inside the function, `x` has a name.

So even if its type is `T&&`, the expression `x` is always an lvalue.

```c++
template <typename T>
void foo(T&& x) {
    bar(x); // x is always an lvalue expression
}
```

If we want to preserve the original value category, we use `std::forward<T>`:

```c++
template <typename T>
void foo(T&& x) {
    bar(std::forward<T>(x));
}
```

Now:

* if caller passed an lvalue, `bar` receives an lvalue
* if caller passed an rvalue, `bar` receives an rvalue

This is called **perfect forwarding**.

> `std::move` always turns an expression into an xvalue.
> `std::forward<T>` preserves whether the original argument was an lvalue or rvalue.
{: .prompt-warning }

## Manipulating Value Categories

This part introduces common tools used to manipulate or inspect value categories:

* `std::move`
* `std::forward`
* `std::decay`
* `decltype`
* `std::declval`
* deducing `this` in C++23

### std::move

```c++
std::move( expression );
```

`std::move` is a utility function that produces an **xvalue** expression.  
It is basically equivalent to:

```c++
static_cast<typename std::remove_reference<T>::type&&>(t)
```

So `std::move(x)` does **not** move anything by itself.  
It only casts `x` to an rvalue reference type, so overload resolution may choose the move path.

```c++
void foo(int& x) {
    cout << "int&";
}

void foo(const int& x) {
    cout << "const int&";
}

void foo(int&& x) {
    cout << "int&&";
}
```

Now:

```c++
int a = 73;
int& b = a;
const int& c = a;
const int&& d = 42;

foo(std::move(b)); // int&        -> foo(int&&)
foo(std::move(c)); // const int&  -> foo(const int&) !!
foo(std::move(d)); // const int&& -> foo(const int&) !!
```

`std::move(b)` gives an xvalue of type `int`, so it can bind to `int&&`.  
But `c` and `d` are const.
So `std::move(c)` and `std::move(d)` produce const rvalues.

A normal `int&&` cannot bind to const data, because that would drop `const`.  
So the best overload becomes `foo(const int&)`.

> `std::move` preserves constness.
> Moving from a const object usually does not call the normal move constructor.
{: .prompt-warning }

### std::forward

```c++
std::forward<T>( expression );
```

`std::forward` preserves the original value category of an argument passed to a template.

It is commonly used with forwarding references:

```c++
template <class T>
void Wrapper(T&& t) {
    Foo(std::forward<T>(t));
}
```

Without `std::forward`:

```c++
template <class T>
void NFWrapper(T&& t) {
    Foo(t);
}
```

Here, `t` has a name, so the expression `t` is always an lvalue.

```c++
int a = 73;
const int& lca = a;

Wrapper(a);     // int&
NFWrapper(a);   // int&

Wrapper(lca);   // const int&
NFWrapper(lca); // const int&

Wrapper(6);     // int&&
NFWrapper(6);   // int&
```

The last two are the important part.

`Wrapper(6)` uses `std::forward<T>(t)`, so the rvalue stays an rvalue.

But `NFWrapper(6)` passes `t` directly. Since `t` has a name, it becomes an lvalue expression.

> `std::forward<T>(x)` preserves the original value category.  
> `std::move(x)` always casts to an xvalue.
{: .prompt-tip }

### std::decay

```c++
std::decay<T>::type   // C++11
std::decay_t<T>       // C++14 alias template
```

`std::decay` is a type trait.
It performs conversions similar to what happens when using `auto`.

It does these main conversions:
1. Array to pointer
2. Function to function pointer
3. Remove references and cv-qualifiers (`const`, `volatile`)

> `std::decay_t<T>` gives the type that `T` would become if passed by value to a function.  
> So it removes references/top-level `const` `volatile`, and converts arrays/functions into pointers.
{: .prompt-info }

Example:

```c++
template <typename T, typename U>
struct decay_is_same :
    std::is_same<typename std::decay<T>::type, U>
{};
```

Then:

```c++
decay_is_same<int&, int>::value; // true
```

because `std::decay<int&>::type` becomes `int`.

More examples:

```c++
std::decay_t<const int&>  // int
std::decay_t<int[3]>      // int*
std::decay_t<int(double)> // int(*)(double)
```

> `std::decay_t<T>` is useful when you want the plain value type.
> But it can be dangerous if you actually need to preserve references or constness.
{: .prompt-warning }

### decltype

```c++
decltype( expression )
```

`decltype` gives the type of an expression.
Unlike `auto`, `decltype` can preserve the value category.

For an expression of type `T`:

| Expression category | `decltype(expression)` gives |
| ------------------- | ---------------------------- |
| lvalue              | `T&`                         |
| xvalue              | `T&&`                        |
| prvalue             | `T`                          |

Example:

```c++
int&& foo(int& i) {
    return std::move(i);
}
```

Now:

```c++
int i = 73;

auto a = foo(i);           // int
decltype(auto) b = foo(i); // int&&
```

`auto` drops the reference and gives a plain `int`.  
But `decltype(auto)` preserves what `foo(i)` actually returns, which is `int&&`.

#### Parentheses matter

There is one annoying rule:

```c++
int&& a = 42;

decltype(a) b = 42;   // int&&
decltype((a)) c = 73; // int&
```

It is because `decltype(a)` uses the declared type of the variable `a`, so it gives `int&&`.  
But `decltype((a))` treats `(a)` as an expression.
Since `a` is a named variable, `(a)` is an lvalue expression.
So `decltype((a))` gives `int&`.

> `decltype(x)` for a **plain variable name** gives the declared type.  
> `decltype((x))` looks at the expression category, and named variables are lvalues.
{: .prompt-warning }

`decltype` is useful when:
1. The type is unknown.
2. We want to preserve the value category.

Example:

```c++
template <typename T, typename U>
decltype(auto) Add(T t, U u) {
    return t + u;
}
```

Another example:

```c++
template <typename T>
decltype(auto) Wrapper(T&& t) {
    return std::forward<T>(t);
}
```

Here `decltype(auto)` avoids accidentally decaying the return type.

> The `T` prvalue doesn't materialize, so `T` can be an incomplete type.
> `decltype(auto)` preserves the exact type and value category of the return expression.
{: .prompt-info }

### std::declval

```c++
std::declval<T>()
```

`std::declval<T>()` is a utility that gives an expression of type `T&&` without needing to construct a real object.  
This is useful in unevaluated contexts, especially with `decltype`.

Example:

```c++
struct Type {
    int a;
    int Foo() { return 42; }

private:
    Type() {}
};
```

We cannot do:

```c++
Type t; // Error, constructor is private
```

But we can still inspect member types:

```c++
decltype(std::declval<Type>().a) b = 73;
```

This works because `std::declval<Type>()` does not actually create a `Type` object.  
It only creates an expression for type checking.

For a normal data member `a`, `std::declval<Type>().a` is an xvalue expression of type `int`, because `std::declval<Type>()` is an xvalue of type `Type`.

However, `decltype(std::declval<Type>().a)` does not use the value-category rule here. Because this is an **unparenthesized member access expression**, decltype gives the declared type of the member `a`, which is `int`.

But if we write:

```c++
decltype((std::declval<Type>().a)) c = 73;
```

Then the extra parentheses force decltype to use the general expression rule.
Since `std::declval<Type>().a` is an xvalue expression, `decltype((std::declval<Type>().a))` gives `int&&`.

> `std::declval` should only be used in unevaluated contexts, such as inside `decltype`.
{: .prompt-danger }


#### Value categories with `declval`

```c++
struct Type {
    int a;
    int& ra = a;

    int getA() { return int(73); }
    int& getRefA() { return ra; }

private:
    Type(int i) : a(int(i)) {}
};
```

Then:

```c++
std::declval<Type>().a;         // xvalue
std::declval<Type>().ra;        // lvalue
std::declval<Type>().getA();    // prvalue
std::declval<Type>().getRefA(); // lvalue
```

So `declval` is often used together with `decltype` to transform between “type world” and “expression world”.

### Deducing `this` in C++23

C++23 introduces **deducing `this`**.

It lets us write the object parameter explicitly:

```c++
template <typename T>
void Foo(this T&& self) {}
```

Before this, we often needed multiple overloads:

```c++
struct Type {
    auto Foo() const&;
    auto Foo() &;
    auto Foo() &&;
};
```

With explicit object parameter syntax, these can be written as:

```c++
struct Type {
    auto Foo(this const Type&);
    auto Foo(this Type&);
    auto Foo(this Type&&);
};
```

And with a forwarding reference:

```c++
struct Type {
    template <typename Self>
    auto Foo(this Self&& self);
};
```

This lets one member function handle different value categories of the object it is called on.

> Deducing `this` is like applying forwarding-reference ideas to the object itself.
{: .prompt-tip }

#### `like_t` and `forward_like`

Deducing `this` also motivates helper ideas like:

```c++
like_t<T, U>
```

This applies the **cv/ref qualifiers** of `T` onto `U`.

Examples:

```c++
like_t<double&, int>        // int&
like_t<const double&, int>  // const int&
like_t<double&&, int>       // int&&
like_t<const double&&, int> // const int&&
```

And:

```c++
forward_like<T>(u)
```

means:

```c++
forward<like_t<T, decltype(u)>>(u)
```

So it forwards `u` using the cv/ref qualifiers of `T`.

> `std::forward<T>` preserves the value category of a function argument.  
> `std::forward_like<T>(u)` forwards `u` as if it had the cv/ref qualifiers of `T`.
{: .prompt-info }

### Summary

* `std::move(x)` casts `x` to an xvalue.
* `std::forward<T>(x)` preserves the original value category in generic code.
* `std::decay_t<T>` gives the plain value-like type.
* `decltype(expr)` can preserve value category.
* `std::declval<T>()` creates a fake expression for type checking, usually inside `decltype`.
* Deducing `this` lets member functions deduce the value category of the object they are called on.
