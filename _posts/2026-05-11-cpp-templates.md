---
title: Templates in C++
date: 2026-05-11 00:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, templates, c++]
description: Back to Basics. Templates in C++ - Nicolai Josuttis - CppCon 2022

math: true
---

Source: [Back to Basics: Templates in C++ - Nicolai Josuttis - CppCon 2022](https://youtu.be/HqsEHG0QJXU?si=aJdGG5g5DTH_bBIs)


## What are Templates?

Templates are C++'s way to write **generic code** for arbitrary **types** or **values**.

They are defined with `template<placeholders>`.
The placeholders are not fixed immediately. They only become clear when the generic code is used.

So a template is not directly the final code that runs.
It is more like a recipe for generating real code when needed.

> Templates are instantiated for each specific type or value used.
{: .prompt-info }

### More Than Text Replacement

Templates are far more than just text or code replacement.
They are a real C++ language feature with type checking, overload resolution, instantiation rules, and deduction rules.

They also became much more powerful than originally expected.  
The standard library depends heavily on them: `std::vector<T>`, `std::array<T, N>`, `std::unique_ptr<T>`, `std::optional<T>`, and many more.

The standard library depends heavily on templates.
In many places, templates are even more important than inheritance.

### Compile-Time Computation

They can even compute values at compile time:

```c++
template<int N>
struct Factorial {
    static constexpr int value = N * Factorial<N - 1>::value;
};

template<>
struct Factorial<0> {
    static constexpr int value = 1;
};

std::cout << Factorial<5>::value; // 120
```

Here, the compiler instantiates `Factorial<5>`, `Factorial<4>`, ..., `Factorial<0>` and computes the result during compilation.

## Function Templates

A function template is generic function code for arbitrary types.

```c++
template<typename T>
T mymax(T a, T b) {
    return b < a ? a : b;
}
```

Here, `T` is a template parameter.
When we call the function, the compiler deduces what `T` should be.

```c++
int i1 = 42, i2 = 77;
std::cout << mymax(i1, i2);      // T = int

std::cout << mymax(0.7, 33.4);   // T = double

std::string s{"hi"}, t{"world"};
std::cout << mymax(s, t);        // T = std::string
```

For each used type, the compiler compiles a specific function.

Conceptually:

```c++
int mymax(int a, int b) {
    return b < a ? a : b;
}
```

```c++
double mymax(double a, double b) {
    return b < a ? a : b;
}
```

```c++
std::string mymax(std::string a, std::string b) {
    return b < a ? a : b;
}
```

> A function template is not one final function.
> It is a pattern used to generate real functions for specific template arguments.
{: .prompt-info }

### Explicit Template Arguments

Usually, the compiler can deduce the template argument.

But we can also specify it explicitly:

```c++
s = mymax<std::string>("hi", "ho");
```

Here, we force `T` to be `std::string`.

Without `<std::string>`, `"hi"` and `"ho"` are string literals, so deduction would not directly mean `std::string`.

> Template arguments can be deduced by the compiler or explicitly specified by us.
{: .prompt-tip }

### Generic Iterating

Function templates are useful when the same code works for many different types.

For example, printing all elements in a collection:

```c++
template<typename T>
void print(const T& coll) {
    for (const auto& elem : coll) {
        std::cout << elem << '\n';
    }
}
```

Now we can use the same function template for different containers:

```c++
std::vector<int> v;
print(v);

std::set<std::string> s;
print(s);

std::vector<double> v2;
print(v2);
```

The compiler compiles different versions:

```c++
void print(const std::vector<int>& coll) {
    for (const auto& elem : coll) {
        std::cout << elem << '\n';
    }
}
```

```c++
void print(const std::set<std::string>& coll) {
    for (const auto& elem : coll) {
        std::cout << elem << '\n';
    }
}
```

So the template means:

> For any type `T`, compile this function if the function body makes sense for that `T`.
{: .prompt-tip }

### Templates in Header Files

Templates are usually defined in header files.  

#### Not only Declared, but Also Defined

That means we normally put the **full definition** there, not just the declaration.

```c++
// mycode.hpp
template<typename T>
T mymax(T a, T b) {
    return b < a ? a : b;
}
```

The reason is simple: when the compiler sees `mymax<int>`, it needs the function body to instantiate the real function.

Templates usually need their definitions visible at the point where they are used.
> {: .prompt-info }

#### No `inline` Needed

The reason is that templates are instantiated for specific template arguments.
The template definition itself is not the same as defining one ordinary function in every translation unit.

### `auto` Parameters for Ordinary Functions (C++20)

Since C++20, we can use `auto` in function parameters.

```c++
void printColl(const auto& coll) {
    for (const auto& elem : coll) {
        std::cout << elem << '\n';
    }
}
```

This is called an **abbreviated function template**.

It is basically equivalent to writing a normal function template.

```c++
template<typename T>
void printColl(const T& coll) {
    for (const auto& elem : coll) {
        std::cout << elem << '\n';
    }
}
```

> A function with `auto` parameters is still a function template. It is equivalent to a normal function template, except that `T` is not available.
{: .prompt-info }

### Requirements

Templates are generic, but they do not work for every type magically.  
The function body still has requirements on the type.

For example, `mymax(T, T)` function requires that:

* `T` can be copied or moved
* `operator <` (returning `bool` or something convertible to `bool`)

So this does not work:

```c++
std::cout << mymax(7, 33.4); // Error, cannot deduce a single `T`
```

We can fix it by specifying `T` explicitly:

```c++
std::cout << mymax<double>(7, 33.4); // OK
```

Another example:

```c++
std::complex<double> c1, c2;
std::cout << mymax(c1, c2); // Error, std::complex does not support <
```

Another one:

```c++
std::atomic<int> a1{8}, a2{15};
std::cout << mymax(a1, a2); // Error, copying is disabled
```

> A template only works for types that support all operations used inside the template body.
{: .prompt-warning }

### Concepts

Before C++20, template requirements were often implicit.
The compiler would only complain when the template body failed to compile for some type.

C++20 added **concepts**, which let us write these requirements explicitly.

For example, we can define a concept for types that support `<`:

```c++
template<typename T>
concept HasLessThan = requires (T x) {
    { x < x } -> std::convertible_to<bool>;
};

template<typename T>
requires std::copyable<T> && HasLessThan<T>
T mymax(T a, T b) {
    return b < a ? a : b;
}
```

Now the requirements are visible directly in the function declaration.

This says:

* `T` must be copyable
* `T` must support `<`
* `x < x` must produce something convertible to `bool`

> Concepts are named requirements for templates.
{: .prompt-info }

> Concepts do not make invalid code valid.
> They make the requirements explicit and usually give better errors.
{: .prompt-tip }


### Multiple Template Parameters amd Return Type

Templates can have more than one template parameter.

For example:

```c++
template<typename T1, typename T2>
void print(const T1& val1, const T2& val2) {
    std::cout << val1 << ' ' << val2 << '\n';
}
```

Now the two arguments do not have to have the same type.

```c++
int i1 = 42, i2 = 77;

print(i1, 0.7);     // T1 = int, T2 = double
```

This also works for strings:

```c++
std::string s{"hi"}, t{"world"};

print("hi", "world"); // T1 = char[3], T2 = char[6]
print("hi", s);       // T1 = char[3], T2 = std::string
```

> With multiple template parameters, each parameter can be deduced independently.
{: .prompt-info }

#### Return Type `auto`

Multiple parameters are easy when the function returns `void`.

But if the function returns something, we need to decide the return type.

For example:

```c++
template<typename T1, typename T2>
??? mymax(T1 a, T2 b) {
    return b < a ? a : b;
}
```

Now `a` and `b` may have different types.

```c++
int i = 42;
std::string s{"hi"};

auto a1 = mymax(i, 0.7);        // should return double
auto a2 = mymax(0.7, i);        // should return double
auto s1 = mymax("hi", s);       // should return std::string
auto s2 = mymax(s, "world");    // should return std::string
```

So the return type should be some kind of **common type** between `T1` and `T2`.

In this function, the type is determined by the conditional operator: `b < a ? a : b`. The result type depends on the rules of `?:`.

Since C++14, we can let the compiler deduce the return type:

```c++
template<typename T1, typename T2>
auto mymax(T1 a, T2 b) {
    return b < a ? a : b;
}
```

Now the compiler figures out the return type from the return statement.

This is especially useful in templates because guessing the return type manually is easy to get wrong.

> Return type `auto` is often useful for templates because the compiler can deduce the exact return type from the implementation.
{: .prompt-tip }

## Class Templates

Templates are not only for functions. We can also define **class templates**.  
A class template is class code for arbitrary types.

For example, we can write a generic `Stack`:

```c++
template<typename T>
class Stack {
private:
    std::vector<T> elems;

public:
    Stack();
    T top() const;
};
```

Here, `T` is the element type of the stack.
So we can create stacks for different types:

Now we can create different stack types:

```c++
Stack<int>                  // stack of int
Stack<std::string>          // stack of string
Stack<std::complex<double>> // stack of complex<double>
```

> A class template is a recipe for generating classes for specific template arguments.
{: .prompt-info }

### Implementing Class Templates

When defining member functions outside the class template, we need to repeat the template parameter list.

For the constructor:

```c++
template<typename T>
Stack<T>::Stack() {
}
```

For `top()`:

```c++
template<typename T>
T Stack<T>::top() const {
    assert(!elems.empty());
    return elems.back();
}
```

The first `T` is the return type.
`Stack<T>::top` means we are defining `top()` for the class template `Stack<T>`.

> When defining class template members outside the class, write both `template<typename T>` and `Stack<T>::`.
{: .prompt-tip }

### Member Functions Are Only Instantiated If Used

For class templates, the template argument does **not** have to support every operation that *could* appear in the class.

It only has to support the operations of member functions that are actually **used**.

Consider this `Stack`:

```c++
template<typename T>
class Stack {
private:
    std::vector<T> elems;

public:
    void push(const T& elem) {
        elems.push_back(elem);
    }

    T top() const {
        return elems.back();
    }

    void print() const {
        for (const T& elem : elems) {
            std::cout << elem << ' ';
        }
    }
};
```

The `print()` member function requires this to be valid: ```std::cout << elem;```. So `T` must support `operator<<` **only if we call `print()`**.

For example, this compiles and works fine:

```c++
Stack<int> si;

si.push(42);       // OK
int i = si.top();  // OK
si.print();        // OK, int supports <<
```

Now consider:

```c++
Stack<std::pair<int, double>> sp;
sp.push({6, 7});                         // OK since C++11
std::cout << sp.top().first << '\n';     // OK
```

This is still fine. But this does **not** compile:

```c++
sp.print(); // Error, std::pair has no operator<< by default
```

The class template itself is valid.
Only the call to `sp.print()` fails.

> Class template member functions are instantiated only when they are used.
{: .prompt-info }

### Class Template Argument Deduction (CTAD)

Before C++17, when using class templates, we usually had to specify the template arguments explicitly.

```c++
std::complex<int> c1(5, 3);
std::vector<int> v{0, 8, 15};
```

Since C++17, constructors can deduce class template arguments.
So we can write:

```c++
std::complex c2{5, 3};      // deduces std::complex<int>
std::complex c3(5, 3);      // deduces std::complex<int>
std::complex c4 = 42;       // deduces std::complex<int>

std::vector v2{0, 8, 15};   // deduces std::vector<int>
```

This is called **Class Template Argument Deduction**, or **CTAD**.

> CTAD lets the compiler deduce class template arguments from constructor arguments.
{: .prompt-info }

CTAD is nice when the deduction is obvious.

```c++
std::vector v{0, 8, 15}; // std::vector<int>
```

But some cases are less obvious:

```c++
std::vector v3{"all", "right"}; // deduces std::vector<const char*>, not std::vector<std::string>
```

This is because because `"all"` and `"right"` are string literals, so their decayed type is `const char*`.

Another example:

```c++
std::vector<int> v{0, 8, 15};

std::vector v4{v.begin(), v.end()}; // deduces std::vector<std::vector<int>::iterator>
```

So `v4` has two elements: `v.begin()` and `v.end()`.

If we want to copy the elements from `v`, we should write the type explicitly:

```c++
std::vector<int> v5{v.begin(), v.end()};
```

> Don't use CTAD unless the deduction is obvious.
{: .prompt-warning }

### Non-Type Template Parameters

Template parameters are not only types.
They can also be **values**.

For example:

```c++
template<typename T, int Sz>
class Stack {
private:
    T elems[Sz];
    int numElems;

public:
    Stack();
    void push(const T&);
    T pop();
};
```

Here, the template has two parameters:

```c++
typename T  // type parameter
int Sz      // non-type template parameter
```

So `T` decides the element type, and `Sz` decides the stack size.

```c++
Stack<int, 20> int20Stack;              // stack of at most 20 ints
Stack<int, 40> int40Stack;              // stack of at most 40 ints
Stack<std::string, 10> stringStack;     // stack of at most 10 strings
```

`Stack<int, 20>` and `Stack<int, 40>` are **different types**, even though both store `int`.

> Non-type template parameters let values become part of the type.
{: .prompt-info }

#### std::array

A common standard library example is `std::array`.

```c++
std::array<int, 8> a = {0, 8, 15};
```

Unlike `std::vector`, the size is part of the type.

```c++
std::array<int, 8>
std::array<int, 10>
```

These are different types.

Internally, `std::array` is basically a wrapper around a fixed-size C array:

```c++
template<typename T, size_t SZ>
struct array {
    T elems[SZ];

    size_t size() const {
        return SZ;
    }

    T& operator[](size_t idx) {
        return elems[idx];
    }

    const T& operator[](size_t idx) const {
        return elems[idx];
    }

    T* begin() {
        return &elems[0];
    }

    T* end() {
        return &elems[0] + SZ;
    }
};
```

So it has fixed-size contiguous storage, but also gives a nicer container interface.

```c++
std::array<int, 8> a = {0, 8, 15};

if (!a.empty()) {
    a.back() = 99999;
}

for (int i = 0; i < a.size(); ++i) {
    a[i] += 1;
}

std::sort(a.begin(), a.end());
```

> `std::array<T, N>` is like a fixed-size array with STL-style container operations.
{: .prompt-tip }

#### NTTP Types

Non-type template parameters originally supported values like:

- integral values: `int`, `long`, `enum`, ...
- `std::nullptr_t`
- pointers to globally visible objects/functions/members
- lvalue references to objects or functions

Not supported are:
- String literals (directly)
- Classes

Since C++20, more kinds of values are supported, including:

* floating-point values (`float`, `double`, ...)
* some class/data structures with public members
* lambdas

## Variadic Templates

Sometimes we want a template that accepts a variable number of arguments.

For example, we may want a `print()` function that can print any number of values:

```c++
print("hello", 7.5, str);
```

This is where **variadic templates** are useful.

A variadic template uses a **parameter pack**, which represents zero or more template arguments.

```c++
void print() {
}

template<typename T, typename... Types>
void print(T firstArg, Types... args) {
    std::cout << firstArg << '\n';
    print(args...);
}
```

`typename... Types` is a **template parameter pack**.  
And `Types... args` is a **function parameter pack**.

So `Types` represents multiple types, and `args` represents multiple function arguments.

### How the Recursion Works

Suppose we call:

```c++
std::string str = "world";
print("hello", 7.5, str);
```

The calls are expanded like this:


| Call                     | firstArg  | args...  |
| ------------------------ | --------- | -------- |
| print("hello", 7.5, str) | "hello"   | 7.5, str |
| print(7.5, str)          | 7.5       | str      |
| print(str)               | str       | empty    |
| print()                  | base case | none     |

So effectively, this:
```c++
print("hello", 7.5, str);
```
becomes:

```c++
std::cout << "hello" << '\n';
std::cout << 7.5 << '\n';
std::cout << str << '\n';
```

> Variadic templates often work by handling the first argument, then recursively processing the remaining pack.
{: .prompt-tip }

> The base case is important to stop the recursion when the pack is empty.
{: .prompt-warning }

### sizeof...

We can use `sizeof...` to get the number of elements in a parameter pack.

```c++
void print() {
}

template<typename T, typename... Types>
void print(const T& firstArg, const Types&... args) {
    std::cout << firstArg << '\n';

    std::cout << sizeof...(Types) << '\n';
    std::cout << sizeof...(args) << '\n';

    print(args...);
}
```

Both of these are valid:

```c++
sizeof...(Types) // number of types in the template parameter pack
sizeof...(args)  // number of function arguments in the function parameter pack
```

> `sizeof...` gives the number of elements in a parameter pack.
{: .prompt-info }

### Runtime `if` vs `if constexpr`

A common mistake is to write:

```c++
template<typename T, typename... Types>
void print(T firstArg, Types... args) {
    std::cout << firstArg << '\n';

    if (sizeof...(args) > 0) {
        print(args...);
    }
}
```

This looks reasonable, but it does not compile when `args` is empty.

Why? Because normal `if` is a **runtime if**.

Even if the condition is false, the statement inside still has to be valid C++ during compilation.

So when `args` is empty, `print(args...)` or `print()` still has to be valid:

If no `print()` overload exists, this is an error.

Since C++17, we can use `if constexpr`:

```c++
template<typename T, typename... Types>
void print(T firstArg, Types... args) {
    std::cout << firstArg << '\n';

    if constexpr (sizeof...(args) > 0) {
        print(args...);
    }
}
```

Now if the condition is false, the branch is discarded at compile time.

So if `args` is empty, the compiler does not need `print(args...)` to be valid.

> `if constexpr` is a compile-time if.
> If the condition is false, the branch is discarded during compilation.
{: .prompt-tip }

> Runtime `if` still requires both branches to be valid C++ code.
{: .prompt-warning }

## Bringing It All Together

Now let's combine a few ideas.

Suppose we want a generic function to add a value to a collection.

For `std::vector`, we can use `push_back()`:

```c++
template<typename Coll, typename T>
void add(Coll& coll, const T& val) {
    coll.push_back(val);
}
```

Then this works:

```c++
std::vector<int> coll;

add(coll, 42); // OK
```

But not all collections use `push_back()`.

For example, `std::set` and `std::unordered_set` use `insert()` instead.

So we may try to write another overload:

```c++
template<typename Coll, typename T>
void add(Coll& coll, const T& val) {
    coll.insert(val);
}
```

The idea is simple:

```c++
std::vector<int> v;
std::set<int> s;

add(v, 42); // should use push_back()
add(s, 42); // should use insert()
```

But this does **not** work yet.

Both function templates have the same parameter types:

```c++
Coll& coll, const T& val
```

So overload resolution cannot know which one to choose.

```c++
add(v, 42); // Error: ambiguous
add(s, 42); // Error: ambiguous
```

> Two unconstrained function templates with the same parameter shape can easily become ambiguous.
{: .prompt-warning }

### Fixing the Ambiguity with Concepts

We can use a concept to check whether a collection supports `push_back()`.

```c++
template<typename Coll>
concept HasPushBack = requires (Coll c, Coll::value_type v) {
    c.push_back(v);
};
```

Now we can constrain the `push_back()` overload:

```c++
void add(HasPushBack auto& coll, const auto& val) {
    coll.push_back(val);
}

void add(auto& coll, const auto& val) {
    coll.insert(val);
}
```

Now this works:

```c++
std::vector<int> coll1;
std::set<int> coll2;

add(coll1, 42); // OK, uses push_back()
add(coll2, 42); // OK, uses insert()
```

For `std::vector<int>`, the first overload is viable because `vector` has `push_back()`.

For `std::set<int>`, the first overload is not viable, so the second overload is used.

> Overload resolution prefers the more specialized constrained template when its constraint is satisfied.
{: .prompt-info }

### Fixing It with `requires` and `if constexpr`

Another way is to write only one function and choose the operation inside it.

```c++
void add(auto& coll, const auto& val) {
    if constexpr (requires { coll.push_back(val); }) {
        coll.push_back(val);
    }
    else {
        coll.insert(val);
    }
}
```

Here:

```c++
requires { coll.push_back(val); }
```

checks whether `coll.push_back(val)` is a valid expression.

If it is valid, we call `push_back()`.
Otherwise, we call `insert()`.

```c++
std::vector<int> coll1;
std::set<int> coll2;

add(coll1, 42); // OK, calls push_back()
add(coll2, 42); // OK, calls insert()
```

The important part is `if constexpr`.

If `push_back()` is not supported, that branch is discarded at compile time.

So for `std::set<int>`, the compiler does not try to compile:

```c++
coll.push_back(val);
```

because that branch is not selected.

> `requires` can test whether an expression is valid.
> `if constexpr` can then choose the correct code path at compile time.
{: .prompt-tip }
