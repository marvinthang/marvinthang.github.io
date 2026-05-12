---
title: Name Lookup and Overload Resolution in C++
date: 2026-05-12 00:00:00 +0800
categories: [c++]
tags: [c++, c++con, templates, c++]
description: Back to Basics - Name Lookup and Overload Resolution in C++ - Mateusz Pusz - CppCon 2022


math: true
---

Source: [Back to Basics - Name Lookup and Overload Resolution in C++ - Mateusz Pusz - CppCon 2022](https://youtu.be/iDX2d7poJnI?si=4V2219zrGrwpK5O_)

## Why Overload Functions?

Name lookup and overload resolution are among the most complex compile-time features in C++.

When we write:

```c++
print(x);
```

the compiler first needs to **find** declarations named `print`, then choose the **best matching** one.

That is why we need two ideas:

* **name lookup**: find possible declarations
* **overload resolution**: choose the best one

Before going into the rules, let’s see why C++ allows multiple functions to have the same name.

## Overload Sets

An **overload set** is a group of functions or function templates with the same name.

```c++
void print(const X& x);
void print(const Y& y);
```

This is better than forcing different names:

```c++
void print_X(const X& x);
void print_Y(const Y& y);
```

Both functions represent the same operation: printing.
Only the argument type is different.  
This gives us a terse, robust, and fast interface.

### Ad Hoc Polymorphism

Overloading is a form of **ad hoc polymorphism**.

It means one function name can have different implementations for a limited set of specified types.

```c++
void print(const X& x);
void print(const Y& y);
```

Then:

```c++
X x;
Y y;

print(x); // calls print(const X&)
print(y); // calls print(const Y&)
```

In C++, multiple functions and function templates may **share the same name**. Each of them must have **a different set of parameters or template parameter constraints**, and may provide different return types.  
The compiler selects the best matching function at compile time.

### Generic Programming

Overloads are also useful for generic programming.

```c++
void print(const X& x);
void print(const Y& y);

template <typename T>
void log(const T& v) {
    print(v);
}
```

`log` does not need dynamic polymorphism or a base class like this:

```c++
void print(const printable& v);
```

It can just call `print(v)`, and overload resolution will pick the correct function.

In modern C++, we can also write a generic overload directly:

```c++
void print(const auto& v);
```

So overloads help us create a single interface entry point without always needing virtual functions.

### Operator Overloading

Overloading also gives user-defined types natural syntax.

```c++
MyInt a{1}, b{2};
auto res = a + b;
```

This is nicer than writing:

```c++
MyInt a{1}, b{2};
auto res = add(a, b);
```

So operator overloading is basically function overloading with nicer syntax.

### Customization Points

Overloading also lets user-defined types plug into existing C++ APIs.

For example, stream output:

```c++
struct X {
    int value;
};

std::ostream& operator<<(std::ostream& os, const X& x);
```

Then we can write:

```c++
X x;
std::cout << x << "\n";
```

The syntax stays the same, but the behavior is customized for `X`.

### Good Overload Sets

Overloads should be used only for operations that are roughly equivalent.

Good:

```c++
void print(int a);
void print(int a, int base);
void print(const std::string&);
```

All of them mean “print something”.

Bad:

```c++
void print_int(int a);
void print_based(int a, int base);
void print_string(const std::string&);
```

This loses the idea of one shared operation.

But overloads can also be bad if the same name is used for unrelated things.

Good:

```c++
void open_gate(Gate& g);                         // remove obstacle from garage exit lane
void fopen(const char* name, const char* mode);  // open file
```

Bad:

```c++
void open(Gate& g);                              // remove obstacle from garage exit lane
void open(const char* name, const char* mode = "r"); // open file
```

Both are called `open`, but they do unrelated jobs.
That makes the call site harder to understand.

A good overload set should have these properties:

* correctness can be judged at the call site without knowing which overload is picked
* one comment can describe the full set
* every overload is doing “the same thing”

Example:

```c++
void vector<T>::push_back(const T&);
void vector<T>::push_back(T&&);
```

Both overloads still mean “add an element to the vector”.

```c++
v.push_back("hello"s);
v.push_back(std::move(world));
```

If we remove the second overload, the behavior is still the same, but the performance may be worse.

So this is a good overload set: same meaning, different efficiency.

## Function Call Pipeline

Calling a function in C++ can involve many steps:

1. name lookup
2. template argument deduction
3. overload resolution
4. member access rules
5. function template specializations
6. virtual dispatch
7. deleting functions

In this post, we focus mainly on the first and third steps:

* **name lookup**
* **overload resolution**

Because these answer the main question:

> When I write `f(x)`, which `f` is actually called?

## Name Lookup

Name lookup is the process of associating a name with the declaration that introduced it.

For function calls, the result of name lookup is a set of candidate functions.  
Only after that does overload resolution choose the best one.

There are two main forms:

- **qualified name lookup**: the name appears on the right side of `::`
- **unqualified name lookup**: the name does not appear on the right side of `::`

For example: `std::cout`.

Here, `cout` is looked up with **qualified name lookup**, because it is on the right side of `std::`.

Before looking up `cout`, the compiler must first look up `std`.

```c++
#include <iostream>

int main() {
    struct std {};

    // std::cout << "fail\n";  // Error: unqualified lookup for std finds the struct
    ::std::cout << "ok\n";     // OK: ::std means the global namespace std
}
```

`::std::cout` works because there is nothing on the left side of the first `::`.
In that case, lookup starts from the global namespace.

### Qualified Name Lookup

A qualified name can refer to:

* a class member
* a namespace member
* an enumerator

```c++
namespace N {
    int value;
}

int x = N::value;
```

For `N::value`, the compiler first finds `N`, then looks for `value` inside `N`.

If the name starts with `::`, only declarations in the global namespace scope are considered.

```c++
::std::cout
```

This forces the compiler to use the global `std`, not some local declaration named `std`.

### Unqualified Name Lookup

Unqualified lookup is used for names like: `func(x)`.

The compiler searches scopes from the inside outward.
It stops **as soon as** it finds **at least one declaration** with the matching name.

This is important: the declaration does not have to be a function.

Once a matching name is found, outer scopes are not searched anymore.

```c++
namespace my_namespace {
    void func(const std::string&);

    namespace internal {
        void func(int);

        namespace deep {
            void test() {
                std::string s("hello");
                func(s);
            }
        }
    }
}
```

Inside `deep::test`, unqualified lookup searches:

1. `deep`
2. `internal`
3. `my_namespace`

It finds `func(int)` in `internal`, so lookup stops there.
It does not continue to `my_namespace::func(const std::string&)`.

So the call fails:

```c++
func(s); // Error: cannot convert std::string to int
```

Even though a better overload exists in the outer namespace, it is hidden.

### Nested Namespace Pitfall

This rule can also silently choose a worse overload.

```c++
namespace my_namespace {
    void func(double);

    namespace internal {
        void func(int);

        namespace deep {
            void test() {
                func(3.14);
            }
        }
    }
}
```

The compiler finds `internal::func(int)` first and stops.
So `func(3.14)` calls `func(int)`, converting `3.14` to `int`.

The program still compiles, but it may not do what we expect.

> To avoid this kind of problem, keep namespaces flat and shallow when possible.
{: .prompt-tip }

### Nested Overloads in Classes

The same hiding rule also applies in class hierarchies.

```c++
struct Base {
    void func(double);
};

struct Derived : Base {
    void func(int);
};

Derived d;
d.func(3.14);
```

`Derived::func(int)` hides `Base::func(double)`.

So this calls: `Derived::func(int)` not `Base::func(double)`

Again, lookup finds the name in the inner scope first, then stops.

### Lookup from Regular Functions

Declarations that appear later are not visible to earlier function bodies.

```c++
void func(int);
void func(double);

namespace N1 {
    void test() {
        std::string s("hello");
        func(s);
    }

    void func(const std::string&);
}
```

Inside `test`, only the earlier global overloads are visible:

```c++
void func(int);
void func(double);
```

The later `N1::func(const std::string&)` is not found.

So this call fails:

```c++
func(s); // Error: no matching function
```

Name lookup depends on where the call is written, not on declarations that appear later.

## Argument-Dependent Lookup (ADL)

Argument-dependent lookup, or ADL, is an extra lookup rule for unqualified function calls.

For a call like:

```c++
func(x);
```

ADL also searches namespaces associated with the argument types.

```c++
namespace N2 {
    struct X {};
    void func(const X&);
}

namespace N1 {
    void test(N2::X x) {
        func(x);
    }
}
```

`func` is not declared inside `N1`.

But `x` has type `N2::X`, so ADL also searches namespace `N2`.
Therefore it finds: `N2::func(const X&)`.

So this works:

```c++
N2::X x;
N1::test(x); // OK, finds N2::func by ADL
```

### Type Aliases and ADL

ADL uses the real underlying type, not just the alias name.

```c++
namespace a {
    using my_array = std::vector<int>;

    void print(const my_array& array) {
        // ...
    }
}

void foo(const a::my_array& array) {
    print(array);
}
```

This does not find `a::print`.

The alias `a::my_array` is just `std::vector<int>`.
After resolving the alias, the associated namespace is `std`, not `a`.
So ADL does not search namespace `a`.

If we want ADL to find `a::print`, we need a real type declared in namespace `a`:

```c++
namespace a {
    struct my_array {
        std::vector<int> data;
    };

    void print(const my_array& array) {
        // ...
    }
}

void foo(const a::my_array& array) {
    print(array); // OK, ADL searches namespace a
}
```

### Hidden Friends

A hidden friend is a friend function declared and defined inside a class, taking that class type as an argument.

```c++
namespace N2 {
    struct X {
        friend void func(const X&) {
            // ...
        }
    };
}
```

This function is not found by normal qualified lookup:

```c++
N2::X x{};

N2::func(x); // Error: func is not a member of N2
```

But it can be found by ADL:

```c++
namespace N1 {
    void test(N2::X x) {
        func(x); // OK, found by ADL
    }
}
```

Hidden friends are useful for operators and customization points.

```c++
struct X {
    friend bool operator==(const X&, const X&) {
        return true;
    }
};
```

Prefer hidden friends over global non-member functions for common customization points, even if the function does not need private access.

One benefit is that hidden friends are only considered when the class type is involved.
They do not pollute candidate sets for unrelated argument types, so lookup and overload resolution have less work to do.

### Lookup from Function Templates

Templates add another layer because lookup happens in two phases.

```c++
namespace N1 {
    void test(auto v) {
        func(v);    // OK
        func(123);  // Error
    }

    void func(int);
}

namespace N2 {
    struct X {};
    void func(const X&);
}
```

When `N1::test(x)` is instantiated with `N2::X`, the call
`func(v)`
depends on the template parameter.
So ADL can happen later, at instantiation time. It finds `N2::func(const X&)`.

But `func(123)` does not depend on a template parameter.
So the compiler needs to find `func` when the template is defined.

At that point, `N1::func(int)` has not been declared yet.
So the call is ill-formed.

Another example:

```c++
namespace N1 {
    void test(auto v) {
        func(v);
    }
}

namespace N2 {
    struct X {};
}

void func(const N2::X&);
```

Even though `func(const N2::X&)` appears before the call to `N1::test(x)`, it is not found by ADL.

ADL searches the associated namespace of `N2::X`, which is `N2`.
But this `func` is in the global namespace, not in `N2`.

So the call fails.

## Dependent Names

Inside a template, some names may depend on template parameters.  
Their meaning can be different for different instantiations.

```c++
template <typename T>
struct X : B<T> {              // B<T> depends on T
    typename T::A* pa;         // T::A depends on T

    void f(B<T>* pb) {
        static int i = B<T>::i; // B<T>::i depends on T
        pb->j++;               // pb->j depends on T
    }
};
```

A name is **dependent** if its meaning depends on a template parameter.  
Name lookup works differently for dependent and non-dependent names.

### Binding of Dependent and Non-dependent Names

A **non-dependent name** is looked up and bound when the template is defined.

```c++
void g(double);

template <class T>
struct S {
    void f() const {
        g(1); // g is non-dependent, bound here
    }
};

void g(int);
```

Then:

```c++
g(1);      // calls g(int)

S<int> s;
s.f();     // calls g(double)
```

Inside `S::f`, the call `g(1)` does not depend on `T`.
So it is bound at the template definition point, where only `g(double)` is visible.

Even though `g(int)` is a better match later, it is too late.

> Non-dependent names are looked up early.
> Dependent names are looked up later, when the template is instantiated.
{: .prompt-tip }

### Customization Points

Dependent lookup is useful for generic customization points.

```c++
// convert.h
template <typename T>
void convert(std::string_view str, T& out) {
    // default implementation
}

template <typename T>
T from_string(std::string_view str) {
    T t;
    convert(str, t);
    return t;
}
```

Now a user-defined type can provide its own overload:

```c++
// price.h
struct price {
    int value;
};

void convert(std::string_view str, price& p) {
    convert(str, p.value);
}
```

Then:

```c++
#include "convert.h"
#include "price.h"

price p = from_string<price>("123");
```

The call `convert(str, t)` depends on `T`, so lookup can find the overload for `price` later.

This is the basic idea behind many customization points: generic code calls a dependent function, and user code provides the overload for its own type.

### Swapping the Type

A common example is `swap`.

Suppose we write a wrapper type:

```c++
template <typename T>
struct wrapper {
    T data_;
};

template <typename T>
void swap(wrapper<T>& lhs, wrapper<T>& rhs)
    noexcept(std::is_nothrow_swappable_v<T>)
{
    // what should go here?
}
```

We want to swap the stored `T`.

Possible implementations:

```c++
swap(lhs.data_, rhs.data_);
std::swap(lhs.data_, rhs.data_);
std::ranges::swap(lhs.data_, rhs.data_);
```

They are not equivalent.

#### std::swap

```c++
std::swap(lhs.data_, rhs.data_);
```

This compiles, but it may ignore custom `swap` overloads found by ADL.

```c++
struct X {};

void swap(X&, X&) {
    std::cout << "my swap\n";
}
```

For `wrapper<X>`, `std::swap` does not call this custom `swap`.
It directly calls `std::swap`.

So it works syntactically, but not semantically.

#### Unqualified swap

```c++
swap(lhs.data_, rhs.data_);
```

This can find custom `swap` by ADL, but it may fail for types without a custom overload.

For example:

```c++
wrapper<int> i1, i2;
swap(i1, i2); // inner swap(data_, data_) may fail
```

There is no user-defined namespace for `int`, so ADL does not find anything.

#### using std::swap

The traditional solution is:

```c++
template <typename T>
void swap(wrapper<T>& lhs, wrapper<T>& rhs)
    noexcept(std::is_nothrow_swappable_v<T>)
{
    using std::swap;
    swap(lhs.data_, rhs.data_);
}
```

The `using` declaration brings `std::swap` into local scope.
Then the unqualified call can use:

* a custom `swap` found by ADL, if one exists
* `std::swap` as a fallback

So this works for both:

```c++
wrapper<std::string> s1, s2;
swap(s1, s2);

wrapper<X> x1, x2;
swap(x1, x2);

wrapper<int> i1, i2;
swap(i1, i2);
```

### Customization Point Object

C++20 ranges often use a **customization point object**.

For example:

```c++
std::ranges::swap(a, b);
```

This is not a normal function overload set.
It is an object with `operator()`.

The important idea:

* the public entry point `std::ranges::swap` is found by qualified lookup
* the actual customization function `swap(a, b)` is found only through ADL

A simplified version looks like this:

```c++
namespace std::ranges {
    namespace swap_impl {
        void swap(); // poison pill

        template <typename T>
        inline constexpr bool has_customization =
            requires(T& t) {
                swap(t, t); // ADL
            };

        struct fn {
            template <typename T>
            constexpr void operator()(T& lhs, T& rhs) const {
                if constexpr (has_customization<T>) {
                    swap(lhs, rhs); // ADL
                } else {
                    ::std::swap(lhs, rhs); // fallback
                }
            }
        };
    }

    inline constexpr swap_impl::fn swap;
}
```

The entry point itself is not found by ADL:

```c++
std::ranges::swap(x1, x2);
```

But inside it, the customization call uses ADL:

```c++
swap(lhs, rhs);
```

This gives a controlled customization mechanism with a safe fallback.

## Function Template Specializations Are Not Overloads

Explicit **function template specializations** do not participate in overload resolution.

```c++
template <class T>
void f(T);        // #1: primary template for all types

template <>
void f(int*);     // #2: specialization of #1 for int*

template <class T>
void f(T*);       // #3: primary template for pointer types

f(new int{1});
```

This calls `#3`, not `#2`.

Reason:

* overload resolution considers non-template functions and primary function templates
* **explicit specializations** are **not** overloads
* specializations are checked only after overload resolution selects their primary template

Here, overload resolution chooses `#3` because `T*` is a better primary template for `int*`.

So the specialization of `#1` is not considered.

> Prefer overloads over explicit function template specializations when customization is intended.
{: .prompt-tip }

## Overload Resolution

Overload resolution selects the most appropriate overload at compile time.

It uses the candidate set produced by name lookup.

```c++
void f(int);
void f(double);

f(1);   // chooses f(int)
f(1.2); // chooses f(double)
```

The choice is based on argument types and conversions, not runtime values.

### Overload Resolution Process

Overload resolution first removes candidates that cannot be called.

A candidate is not viable if:

* it has more parameters than arguments
* it has fewer parameters than arguments, unless default arguments exist
* its constraints are not satisfied
* the arguments are not implicitly convertible to the parameter types

Then the remaining viable candidates are ranked.

If exactly one viable function is better than all others, that function is called.
Otherwise, the call is ambiguous and compilation fails.

### Conversion Ranking

For each viable candidate, the compiler ranks the implicit conversion sequence from each argument to the corresponding parameter.

The main ranks are:

| Rank | Category     | Examples                                      |
| ---- | ------------ | --------------------------------------------- |
| 1    | exact match  | no conversion, trivial conversions            |
| 2    | promotion    | integral promotion, floating-point promotion  |
| 3    | conversion   | standard conversions                          |
| 4    | user-defined | conversion constructors, conversion operators |
| 5    | ellipsis     | C-style variadic argument `...`               |

Lower rank is better.

```c++
void f(int);
void f(double);

f(1); // exact match for int
```

So `f(int)` wins.

### Tie Breakers

If two candidates have the same conversion rank, tie breakers may decide the winner.

Common tie breakers include:

* fewer conversion steps wins
* binding `T&&` to an rvalue is better than binding `const T&` to an rvalue
* less cv-qualified references or pointers are preferred

If no tie breaker can decide, the call is ambiguous.

```c++
void f(long);
void f(double);

f(1); // ambiguous on many compilers
```

Both candidates require a conversion from `int`.
Neither is clearly better, so compilation fails.
