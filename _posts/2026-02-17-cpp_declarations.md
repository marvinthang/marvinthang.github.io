---
title: Declarations in C++
date: 2026-02-17 14:45:00 +0800
categories: [cpp]
tags: [cpp, cppcon, declarations, c++]
description: Back to Basics. Declarations in C++ - Ben Saks - CppCon 2022
math: true
---
Source: [Back to Basics: Declarations in C++ - Ben Saks - CppCon 2022
](https://www.youtube.com/watch?v=IK4GhjmSC6w&list=PLHTh1InhhwT47Xpx7Cn-bPw9Qygjr98rs&index=3)

## Entities and Properties

### Entity

A computer program is essentially:

* Entities
* Actions involving those entities

Entities in C++:

* function
* namespace
* object
* template
* type
* value

### Properties
Properties of declared name:

| Property         | Object | Function | Label |
| ---------------- | ------ | -------- | ----- |
| Scope            | yes    | yes      | yes   |
| Type             | yes    | yes      | no    |
| Storage duration | yes    | no       | no    |
| Linkage          | yes    | yes      | no    |

## Declarations and Definitions

* Declaration tells name and type/signature (some properties). It may or may not allocate storage/provide a body.

* Definition is a **declaration** that actually creates the entity, that is
  * object $\rightarrow$ allocate storage
  * function $\rightarrow$ provide body
  * types (struct) $\rightarrow$ provide type definition

* In C++, an object declaration (outside a class) is also a **definition unless it contains *extern* specifier and no initializer**:


```c++
int i;              // definition
extern int j;       // non-defining declaration
extern int k = 42;  // definition
```

### Declaration

Every object and function declaration has two main parts:
* declaration specifiers
* declarators (including declarator-id or name)

For example: `static unsigned long int *x[N]`
* `static unsigned long int` are declaration specifiers
* `*x[N]` is declarator
* `x` is declarator-id

Each declaration specifier is either **type** or **non-type specifier**.

* Type specifier: modify other type specifiers
  * A sequence of keywords such as `int`, `unsigned`, `long`, or `double`
  * an idenfier or qualified name that names a type, such as `std::string`
  * a template specilization, such as `vector<long double>`
* Non-type specifier: apply directly to the declarator-id
  * a **storage class** specifier: `extern`, `static`, `thread_local`
  * a **function** specifier: `inline`, `virtual`
  * other specifier: `friend`, `typedef`

A declarator is a declarator-id, possibly surrounded by operators:

| Precedence | Operator         | Meaning                                               |
| ---------- | ---------------- | ----------------------------------------------------- |
| Highest    | ( )              | grouping                                              |
|            | [ ] <br> ( )     | array <br> function                                   |
| Lowest     | * <br> & <br> && | pointer <br> (lvalue) reference <br> rvalue reference |

> Order of declaration specifiers doesn't matter.
{: .prompt-tip }

```c++
const unsigned long cul; // const unsigned long
long unsigned const cul; // same thing
unsigned const long cul; // same
```

### ***const*** keyword
`const` is a **type specifier**, like `long` and `unsigned`, it modifies other type specifiers.

Example: `const int *v[N]`, then **const** modifies `int`, thus
* `v` is "array of N pointers to **const** `int`", 
* **not** "**const** array of N pointers to `int`".

> `const` and `volatile` are only symbols that can appear **either as declaration specifiers or in declarators**.
{: .prompt-info }


`*const` turns the pointer into a **const pointer**, it is effectively a single operator with the same precedence as *.

> `const (int*)` is equivalent to `int *const`. The type here is `(int*)` and const modifies the whole type, thus it is a const pointer to `int`.
{: .prompt-warning }

> Trick: Read from right to left 
{: .prompt-tip }

```cpp
widget *const cpw    // const pointer to `widget`
widget *const *pcpw  // pointer to const pointer to `widget`
widget **const cpw   // const pointer to (non-const) pointer to `widget`
```
How to declare like what you intend:
  1. Write the declaration without `const`.
  2. Then, place `const` to the immediate right of type specifier or operator that you want it to modify.
  
* Example: "array of N **<font color="red">const pointer</font>** to **<font color="red">volatile uint32_t</font>**"
  * Start by writing without `const` and `volatile`: "array of N ~~<font color="red">const</font>~~ **<font color="red">pointer</font>** to ~~<font color="red">volatile</font>~~ **<font color="red">uint32_t</font>**": `uint_32_t *x[N]`
  * Then add `const` to the right of * and `volatile` to the right of uint_32: `uint_32_t volatile *const x[N]`

### Declarator Initializer
```c++
int n = 42; // "equal" initializer
int n (42); // "parenthesized" initializer
int n {42}; // "braced" initializer
```

### ***constexpr*** keyword
`constexpr` is declaration specifier, it **isn't a type specifier** as it modifies **declarator-id** not other type specifier
```c++
char constexpr | *      p // constexpr pointer to char
char           | *const p // const pointer to char
```
Both are the same but have **different initialization requirements**. 

> The initializer must be a **const expression** in `constexpr`.
{: .prompt-info }

## Using ***typename*** with Dependent Names

Template parameter lists use keyword `typename` to declare template type parameters. 

> You could use `class` instead of `typename` here (but ony in template parameter lists).
{: .prompt-tip }

```c++
template <typename T, typename P>
class widget;
```

Another use of `typename`

```c++
template <typename T>
T foo(T x) {
  ~~~
}
```
Compiler  can't generate code for an instantiation as it doesn't know what is T yet.
### Two-Phase Translation 

On first reading, compiler can't detect all possible errors, it tries to do as much checking as it can to report errors as early as possible.

* The **1st phase**: compiler **parses the template declaration**. This happens just once for each template.
* The **2nd phase**: compiler **instantiates the template** for a particular combination of template arguments the first time that combo is needed.

### Member type
Consider this function:
```c++
template <typename T>
T::size_type munge(T const &a) {
    T::size_type *i(T::npos);
    ~~~
}
```
This template works only for a type `T` that has `size_type` and `npos` as members.

Compiler only knows that `T` represents a type, but it **doesn't know** that:
* `T::size_type` is supposed to be a type, or
* `T::npos` is supposed to be a constant.
It can't know until it knows the argument substituted for `T` in a given instantialization.

Suppose:
* `T::size_type` is a type, and
* `T::npos` is a type

Then it becomes a **function declaration**, declaring `i` as a function:
  * with an unamed parameter of type `T::npos`,
  * returning a "pointer to `T::size_type`".

Suppose:
* `T::size_type` is a type, and
* `T::npos` is a constant, object, or function (anything but a type)

Then it becomes an **object declaration**, declaring `i` as an object:
  * of type "pointer to `T::size_type`"
  * initialized with the value `T::npos`.

Suppose:
* `T::size_type` is not a type, and
* `T::npos` is not a type

Then it becomes a **multiply expression**, with LHS is `T::size_type`, RHS is `i(T::npos)` might be:
  * a function call, or
  * a function-like cast.

### Dependent vs Non-dependent name

* A name appearing in a template whose meaning depends on one or more template parameters is a **<font color="red">dependent name</font>**.
  * In the `munge` template:
    * `T::size_type` and `T::npos` are dependent names.
    * They depends on template type parameter `T`.
  * A dependent name may have **different meaning of each instantiation** of the template.
* Name that are not dependent are **<font color="red">non-dependent names</font>**
  * A non-dependent name has the **same meaning in every instantiation** of the template.

Compiler needs to know whether a dependent name such as `T::size_type` is indeed a type, or something else. **If it’s not a type (or a template name), the compiler doesn’t care** what it is.

**Types — and only types — distinguish declarations from expressions.**

> A dependent name is assumed **not** a type unless the name is qualified by the keyword `typename`.
{: .prompt-tip }

The definition for the `munge` function template should look like:
```c++
template <typename T>                 // (1)
typename T::size_type munge(T const& a) {   // (2)
    typename T::size_type* i(T::npos);      // (3)
    ~~~
}
```
- On (1), `typename` tells the compiler that `T` is a type.
- On (2) and (3), the `typename` in `typename T::size_type` doesn’t modify `T`; it modifies `size_type`.

> You can't use `class` instead of `typename` in this way.
{: .prompt-danger }

## Rvalue References vs. Forwarding References

### Rvalue References
When `&&` appears in a declarator, it usually declares an **rvalue reference**, as in:

```c++
void doIt(string &&arg);   // for rvalues
```

>An rvalue reference **must bind to an rvalue**.
{: .prompt-info }

```c++
string s1 = "Hello";
string s2 = "Goodbye";

doIt(s1);        // Error: s1 is an lvalue
doIt(s1 + s2);   // OK: s1 + s2 is an rvalue
```
### Forwarding References

However, sometimes `&&` in a declarator means **forwarding reference** rather than rvalue reference. For example: 
```c++
template <typename T>  
void dispatch(T &&arg);  // a forwarding reference
```

> Unlike an rvalue reference, a forwarding reference can bind to **either an lvalue or an rvalue**.
{: .prompt-info }

We can use forwarding references to write *forwarding functions* - that is, functions that pass (forward) their arguments to another function unmodified.

A forwarding reference "remembers" whether it’s bound to an lvalue or to an rvalue.
  - We can use `std::forward` to pass that knowledge on to the forwarded-to function.
  - The forwarded-to function can use that knowledge to optimize, such as by using move semantics for rvalues.

### How to determine Rvalue or Forwarding References

`arg` is a forwarding reference iff:
#### - `arg` has no cv-qualifiers
- A forwarding reference may not be declared `const` or `volatile`.
- This is because `const` on a reference type is pointless, because you cannot modify the reference itself (`const (T&)` is const reference to `T`, not reference to a const object, so it is equivalent to `T&`).
- In this declaration, `arg2` is an rvalue reference:

```c++
template <typename T>  
void func2(T const &&arg2);   // an rvalue reference (to const T)
```


#### - `arg` is in a "deduction context"
Here, `arg` is in a deduction context because the type `T` may be deduced from a template argument:

```c++
template <typename T>  
void dispatch(T &&arg);      // a forwarding reference

dispatch(3);                 // calls dispatch<int>
dispatch(3.5);               // calls dispatch<double>
```

Not every part of a template is a deduction context, as this example shows:

```c++
template <typename T>  
void dispatch(T &&arg) {  
    T &&temp = f(arg);  
    ~~~  
}
```
- `arg` is a forwarding reference, but `temp` is an **rvalue reference** - it’s **not** declared in a deduction context.
  - The type argument for `T` was determined when `dispatch` was called.
  - Nothing inside the function can change it.

Similarly, this `x` is an **rvalue reference**, **not** a forwarding reference:

```c++
template <typename T>  
class C {  
public:  
    void mf(T &&x);  
    ~~~  
};
```
- The type argument for `T` is set when the `C` object is created: `C<int> c;`
- Because `c` is `C<int>`, `c.mf` expects an `int &&` as its argument.

> A declaration that uses the keyword `auto` is also a deduction context, thus it is **forwarding reference**:
{: .prompt-tip }

```c++
auto &&r1 = 3;      // r1 is int &&
auto &&r2 = 3.5;    // r2 is double &&
```
