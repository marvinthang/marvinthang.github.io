---
title: Overload Resolution in C++
date: 2026-05-13 00:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, c++, overload resolution, overload, overload set, candidate, viable, conversion ranking, tie breaker, ambiguity]
description: "Back to Basics: Overload Resolution - CppCon 2021"
math: true
---

Source: [Back to Basics: Overload Resolution - CppCon 2021](https://youtu.be/b5Kbzgx1w9A?si=DsDiVbqOCwqcIDLm)

## Overload Resolution

### Overload vs Override

**Overloading** means multiple functions have the same name, but different parameter types.

```c++
void f(int);
void f(double);
void f(std::string);
```

This is **compile-time polymorphism**.
The compiler chooses the function based on the argument types.

**Overriding** is different.
It happens with inheritance and virtual functions, when method in the child class has the same name as a method in the parent class

```c++
struct Fruit {
    virtual void eat() {
        std::cout << "eat fruit\n";
    }
};

struct Apple : Fruit {
    void eat() override {
        std::cout << "eat apple\n";
    }
};
```

Here, both classes have a function named `eat`.
But this is not overloading.
`Apple::eat` overrides `Fruit::eat`.

The difference:

| Feature         | Overload                         | Override           |
| --------------- | -------------------------------- | ------------------ |
| Applies to      | function, method, or constructor | method             |
| Happens with    | same name, different parameters  | inheritance        |
| Chosen at       | compile time                     | runtime            |
| Based on        | argument types                   | actual object type |
| Needs `virtual` | no                               | yes                |

### Declaring Overloads

Overloading applies to:

* free functions
* member functions
* constructors
* operators

> In this post, I will usually just say **function** to refer to all of them.
{: .prompt-info }

Function declarations are overloads of each other when they:

* have the exact same name
* are visible from the same scope
* have different parameter types

```c++
void doThing(int);
void doThing(int, double);
```

These two declarations form an overload set because they have the same name, are visible from the same scope, and have different parameter lists.

> The **order of declarations** does not matter.
{: .prompt-warning }

### What Is Overload Resolution

**Overload resolution** is the process of selecting the most appropriate overload.

```c++
void doThing(int);
void doThing(double);

doThing(42);    // calls doThing(int)
doThing(3.14);  // calls doThing(double)
```

This happens at **compile time**.

The compiler only considers:

* the argument types being passed
* how those argument types match the parameter types

It does **not** consider the actual runtime values.

```c++
void f(int);
void f(double);

int x = 42;
f(x); // argument type is int, so f(int) is selected
```

The value `42` is not important here.  
The type `int` is.

If the compiler cannot choose one specific overload, the call is ambiguous.

Function templates also participate in overload resolution.

```c++
void f(char);

template <typename T>
void f(T);

f(42); // calls f<int>(int)
```

Even though the non-template overload exists, the template gives an exact match.  
So it wins.

However, if a function template and a non-template function are **equally good**, the **non-template function is preferred**.

### Invalid Overloads

Some declarations look like overloads, but are actually invalid.

#### Different return type only

Two functions cannot differ only by return type.

```c++
int f(int);
double f(int); // error
```

The parameter list is the same, so this is considered the same function declared twice.

The reason is that using the return value is optional:

```c++
f(42); // which return type should decide the call?
```

So return type alone is not part of overload selection.

#### Different default arguments only

Default arguments also do not create a different overload.

```c++
void g(int);
void g(int = 0); // error
```

Default arguments change how a function can be called, but they do not change the function signature.

#### Static vs non-static member function

Inside a class, `static` alone also does not make a separate overload.

```c++
struct X {
    void f(int);
    static void f(int); // error
};
```

Both still have the same name and the same parameter list.

### When to Use Overloads vs Templates

A common question is whether we should write:

* several overloads, or
* one function template

Use **overloads** when the implementation changes for different types.

A good example is `std::string` constructors.

```c++
std::string s1{"hello"};        // from const char*
std::string s2{5, 'x'};         // from count + character
std::string s3{std::move(s1)};  // from std::string&&
```

These constructors all create a `std::string`, but the implementation is different for each input form.

Use a **template** when the function body does the same thing for many types.

```c++
std::sort(data.begin(), data.end());
```

The same algorithm works whether `data` is a `std::vector<int>`, `std::vector<double>`, or something else with suitable iterators.

So the rough rule is:

| Use       | When                                           |
| --------- | ---------------------------------------------- |
| overloads | different types need different implementations |
| template  | same logic works for many types                |

### Why This Gets Complicated

For simple cases, overload resolution usually picks what we expect.

But it becomes complicated quickly because of:

* implicit conversions
* pointer and reference types
* templates
* default arguments
* user-defined conversions

Sometimes the compiler selects a valid overload, but not the one we expected.

That is why overload resolution is not just “find the function with the same name”.  
The compiler has to build a candidate set, remove invalid candidates, rank the remaining ones, and then decide whether there is one best match.

## How Overload Resolution Works

Before overload resolution starts, the compiler first runs **name lookup**.

Name lookup finds every visible function declaration with the requested name.  
This full list is called the **overload set**.

Overload resolution then works roughly like this:

1. put the overload set into a list of **candidates**
2. remove invalid candidates, called **not viable** candidates
3. rank the remaining viable candidates:
  * process of ranking the remaining candidates is how the
compiler finds the single best match
  * best candidate match may be the least bad match
4. choose the single best match
  * if exactly one function in the candidate list ranks higher than all others, it wins the overload resolution process
  * if there is a tie for the highest ranking, then tie breakers are used


A candidate can be not viable for two main reasons.

First, the number of arguments does not match.

```c++
void doThing();                   // not viable
void doThing(int, bool = true);   // viable

doThing(38);
```

Passing too many arguments is always invalid.  
Passing fewer arguments is only valid if the missing parameters have default arguments.

Second, the argument type cannot be converted to the parameter type, even after considering implicit conversions.

```c++
void doThing();             // not viable
void doThing(int);          // viable
void doThing(std::string);  // not viable

doThing(38);
```

## Conversion Ranking

When more than one candidate is viable, the compiler compares how good each argument-to-parameter match is.

A conversion means changing a value from one type to another. Examples:

* `int` to `float`
* string literal to pointer
* enum to `int`
* `char*` to `void*`
* `const char*` to `std::string`
* some user-defined type `X` to some other type `Y`

```c++
void doThing(float);

doThing(38); // int -> float using implicit conversion
```

### Implicit and Explicit Conversions

Some conversions happen implicitly.

```c++
char str[] = "ABC";
int data = str[0]; // char -> int
```

Other conversions are explicit:
* `static_cast`, `dynamic_cast`, `const_cast`, `reinterpret_cast` or c style casts
```c++
double x = 3.14;
int y = static_cast<int>(x);
```

* C++ also has functional casts:
```c++
if (std::string("root") == currentDirectory) {
    // ...
}
```

> This syntax is called a functional cast. For a class type, it constructs a temporary object, so `std::string("root")` still calls a `std::string` constructor that can take a `const char*`.
{: .prompt-info }

For overload resolution, implicit conversions are especially important because they decide whether a candidate is viable and how good the match is.

### Standard Conversion Categories

The standard conversion categories, from better to worse, are:

1. exact match
2. lvalue transformations
3. qualification adjustments
4. numeric promotions
5. numeric conversions

The slides group the first three as “no conversion” level when ranking.

So the rough ranking is:

| Rank  | Kind                                                           |
| ----- | -------------------------------------------------------------- |
| best  | exact match / lvalue transformation / qualification adjustment |
| next  | numeric promotion                                              |
| next  | numeric conversion                                             |
| worse | user-defined conversion                                        |
| worst | ellipsis conversion                                            |

#### Exact Match

An exact match means no real conversion is needed.

```c++
void f(int);

f(42); // exact match
```

This is better than any promotion, conversion, user-defined conversion, or ellipsis match.

#### Lvalue Transformations

These are still considered very good matches.

They include:

* lvalue-to-rvalue conversion
* array-to-pointer conversion
* function-to-pointer conversion

Example:

```c++
void f(int*);

int a[3]{};
f(a); // array-to-pointer conversion
```

Even though `a` is an array, it can decay to a pointer to its first element.

#### Qualification Adjustments

* qualification conversion (adding `const` or `volatile`)
* function pointer conversion (new in C++17)

```c++
void lookUp(std::string const*);
void lookUp(std::string*);

std::string* p = new std::string("text");
lookUp(p); // chooses std::string*
```

Both overloads are viable:

```c++
void lookUp(std::string const*); // adding const is allowed
void lookUp(std::string*);       // exact match
```

But `std::string*` is the better match because it does not need to add `const`.

> `std::string* const` means the **pointer itself is const**.
> For a by-value parameter, that `* const` is ignored in overloading because the pointer is copied into the function anyway.  
> So it is basically the same as `std::string*` in that case.
{: .prompt-info }

#### Numeric Promotions

Promotions are better than general numeric conversions.

Integral promotions include:

* `short` to `int`
* `unsigned short` to `int` or `unsigned int`
* `bool` to `int`
* `char` to `int` or `unsigned int`
* a few more however it must be defined in the standard

> There is no `int` to `long` or `long long` promotion, because the standard does not require that `long` can represent all values of `int`.  
> If the standard does not define a promotion between two types, it is not a promotion, even if it seems like one.
{: .prompt-warning }

Floating-point promotion includes:

* `float` to `double`

```c++
void f(int);

char c = 'A';
f(c); // char -> int promotion
```

#### Numeric Conversions

Numeric conversions are weaker than promotions.

They include:

* integral conversions
* floating-point conversions
* floating-integral conversions
* pointer conversions
* pointer-to-member conversions
* boolean conversions

Integral data types are defined by the C++ standard.
For examples: bool, char, short, int, long

If the standard defines converting between integral type `A` 
and integral type `B` is a promotion, it is not a conversion.

```c++
void count(long);

count(42); // int -> long conversion
```

Here, `int` to `long` is a valid standard conversion, but it is not an integral promotion.

This distinction matters because overload resolution ranks promotions above conversions.

#### User-Defined Conversions

A user-defined conversion is an implicit conversion to or from a class type.

This includes standard library types too.

```c++
void showMsg(std::string);

const char* msg = "Text";
showMsg(msg); // const char* -> std::string
```

This works because `std::string` can be constructed from `const char*`.

But user-defined conversions rank lower than standard conversions.

#### Ellipsis Conversion

The weakest match is an ellipsis conversion.

```c++
void f(...);

f(42);
```

This is the C-style varargs fallback.  
It is viable for many calls, but it ranks below normal conversions.

## Tie Breakers

After conversion ranking, there can still be more than one candidate that looks equally good.  
In that case, overload resolution uses tie breakers.

One important tie breaker is:

> If a non-template function and a template function are equally good, the non-template function is preferred.

```c++
void f(int);

template <typename T>
void f(T);

f(42); // calls f(int)
```

Here both overloads match `int` exactly.  
Since they are tied, the non-template overload wins.

But this rule only matters when they are actually tied.

```c++
void doThing(char);

template <typename T>
void doThing(T);

doThing(42);
```

Here the template wins.

Why?

```c++
void doThing(char);       // int -> char conversion
void doThing<int>(int);   // exact match
```

The template gives an exact match, while the non-template needs a conversion.  
So this is not a tie. The better match wins before the non-template tie breaker is used.

Another tie breaker is that an implicit conversion which requires **fewer steps** is better than one that requires more steps.

```c++
void f(int*);
void f(const int*);

int a[3];
f(a);
```

For `f(int*)`, the conversion is: `int[3]` -> `int*`.  
For `f(const int*)`, the conversion is: `int[3]` -> `int*` -> `const int*`.

Therefore, `f(int*)` is a better match because it requires fewer conversions.

### C++20 Concepts

C++20 added another tie breaker for constrained templates.

Concepts can put constraints on template parameters, limiting which types are allowed.

```c++
template <typename T>
void f(T);

template <std::integral T>
void f(T);

f(42);
```

Both templates can accept `int`, but the second one is more constrained.

So the constrained overload is selected.

The important detail:

> Constraints do not change the normal overload resolution ranking.  
> They are used only as a tie breaker.

So the compiler still first checks viability and ranks conversions.  
Only when multiple constrained templates are otherwise tied does it choose the more constrained one.

## Fixing Ambiguous Calls

Sometimes overload resolution fails because there is no single best match.

```c++
void f(char);
void f(long);

f(42); // ambiguous
```

The compiler can see multiple viable candidates, but cannot prove that one is better than the others.

There are several ways to fix this.

### Add or Remove an Overload

If two overloads keep fighting each other, the overload set itself may be the problem.

```c++
void f(char);
void f(long);
void f(int);

f(42); // now f(int) is the best match
```

Adding a more direct overload can make the call clear.

Removing an unnecessary overload can also remove the ambiguity.

### Prevent Unwanted Implicit Conversions

Sometimes ambiguity happens because a type can be implicitly converted in too many ways.

One common fix is to mark constructors as `explicit`.

```c++
struct X {
    explicit X(int);
};
```

Now `int` will not silently convert to `X` in normal function calls.

This keeps the overload set cleaner because fewer candidates become viable accidentally.

### Remove Templates with SFINAE

Function templates can also be removed from the candidate set if they cannot be instantiated.

This is the idea behind SFINAE:

> Substitution Failure Is Not An Error.

If template substitution fails, the compiler does not immediately reject the whole program.  
Instead, that function template is simply not added as a viable candidate.

In modern C++, concepts and `requires` clauses are usually the cleaner way to express this.

```c++
template <typename T>
requires std::integral<T>
void f(T);
```

Now this overload only participates for integral types.

### Convert the Argument Explicitly

Another simple fix is to make the conversion yourself.

```c++
void f(char);
void f(long);

f(static_cast<long>(42)); // calls f(long)
```

This tells the compiler exactly which path you want.

For class types, explicitly construct the object:

```c++
void show(std::string);

show(std::string("hello"));
```

This is clearer than relying on an implicit conversion from a string literal.

### When No Candidate Is Viable

Another possible error is not ambiguity, but **no matching function**.

```c++
void doThing(char);

doThing('x', nullptr); // error: no matching function
```

The compiler may still list possible candidates in the error message, but none of them are viable.

Here, `doThing(char)` exists, but it takes one argument.  
The call passes two arguments, so the candidate is rejected.

### Debugging the Wrong Overload

Overload resolution can also compile successfully but choose an overload you did not expect.

This is hard to debug because there is usually no clean way to ask the compiler:

> Why did you choose this overload?

Some practical tricks:

* change the argument type and see which overload changes
* add an explicit cast to force the intended overload
* temporarily add another overload to make the call ambiguous and inspect the compiler error

The compiler error often prints the candidate list, which can help you see what overloads were considered.

## Examples and Surprises

### Numeric Conversions

A common trap is assuming that “closer looking” numeric types are always preferred.

```c++
void doThing(char);
void doThing(long);

doThing(42); // ambiguous
```

`42` has type `int`.

Both overloads are viable:

```c++
void doThing(char); // int -> char conversion
void doThing(long); // int -> long conversion
```

But neither conversion is better than the other.  
So the compiler cannot choose one best overload, and the call is ambiguous.

This is why the difference between **promotion** and **conversion** matters.

### Multiple Parameters

Overload resolution compares candidates parameter by parameter.

```c++
void doThing_A(double, int, int);
void doThing_A(int, double, double);

doThing_A(4, 5, 6); // ambiguous
```

For the first overload:

```c++
void doThing_A(double, int, int);
// 4 -> double : conversion
// 5 -> int    : exact match
// 6 -> int    : exact match
```

For the second overload:

```c++
void doThing_A(int, double, double);
// 4 -> int    : exact match
// 5 -> double : conversion
// 6 -> double : conversion
```

The first overload is better for the second and third arguments.  
The second overload is better for the first argument.

There is no overload that is better for every argument, so the call is ambiguous.

But this one is different:

```c++
void doThing_B(int, int, double);
void doThing_B(int, double, double);

doThing_B(4, 5, 6);
```

For the first overload:

```c++
void doThing_B(int, int, double);
// 4 -> int    : exact match
// 5 -> int    : exact match
// 6 -> double : conversion
```

For the second overload:

```c++
void doThing_B(int, double, double);
// 4 -> int    : exact match
// 5 -> double : conversion
// 6 -> double : conversion
```

The first overload is at least as good for every argument, and better for the second argument.

So the first overload wins.

The rule is:

> One candidate wins only if it is no worse for every argument, and better for at least one argument.

### References

References are one of the easiest places where overload resolution becomes surprising.

#### int& vs int

```c++
void doThing(int&);
void doThing(int);

int main() {
    int x = 42;
    doThing(x); // ambiguous
}
```

`x` is an lvalue of type `int`.

Both overloads are viable:

```c++
void doThing(int&); // binds directly to x
void doThing(int);  // copies x
```

Neither one is considered strictly better, so the call is ambiguous.

> lvalue and rvalue references are not considered better than by-value parameters, even though they look more specific.
{: .prompt-info }

But if we pass an rvalue:

```c++
void doThing(int&);
void doThing(int);

int main() {
    doThing(42); // calls doThing(int)
}
```

`int&` cannot bind to the temporary `42`, so only `doThing(int)` is viable.

#### int& vs int&&

```c++
void doThing(int&);
void doThing(int&&);

int main() {
    int x = 42;
    doThing(x); // calls doThing(int&)
}
```

`x` is an lvalue, so it binds to `int&`.

The `int&&` overload is not viable because an rvalue reference cannot bind to an lvalue.

For an rvalue:

```c++
void doThing(int&);
void doThing(int&&);

int main() {
    doThing(42); // calls doThing(int&&)
}
```

Now `42` is an rvalue, so it binds to `int&&`.

The `int&` overload is not viable because a non-const lvalue reference cannot bind to an rvalue.

So this pair behaves cleanly:

| Argument    | Selected overload |
| ----------- | ----------------- |
| lvalue `x`  | `int&`            |
| rvalue `42` | `int&&`           |

#### Bit-fields

Bit-fields have a weird edge case.

```c++
void doThing(int&);
void doThing(...);

struct MyStruct {
    int m_data : 5;
};

int main() {
    MyStruct obj;
    doThing(obj.m_data);
}
```

At first, overload resolution selects:

```c++
void doThing(int&);
```

because `obj.m_data` looks like an lvalue `int`, and `int&` is better than ellipsis.

But then the program still fails to compile.

The reason is that a non-const lvalue reference cannot actually bind to a bit-field.

So overload resolution can choose the `int&` overload first, then the call is rejected afterward.

Adding this does not fix it:

```c++
void doThing(int&);
void doThing(const int&);
void doThing(...);
```

The compiler still prefers the better overload according to overload resolution rules, but binding a reference to a bit-field has extra restrictions.

This is a good example of why “the selected overload” and “the call is valid” are not always the same intuition.
