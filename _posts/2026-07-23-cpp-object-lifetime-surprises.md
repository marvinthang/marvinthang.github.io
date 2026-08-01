---
title: "Surprises in Object Lifetime"
date: 2026-07-23 00:00:00 +0800
categories: [cpp]
tags: [cpp, c++, cppcon, object lifetime, temporaries, references, string-view, initializer-list, structured-bindings]
description: "Notes from Surprises in Object Lifetime - Jason Turner - CppCon 2018"
---

Source: [Surprises in Object Lifetime - Jason Turner - CppCon 2018](https://youtu.be/uQyT-5iWUow)

Slides: [CppCon 2018 presentation materials](https://github.com/CppCon/CppCon2018/blob/master/Presentations/surprises_in_object_lifetime/surprises_in_object_lifetime__jason_turner__cppcon_2018.pdf)

A well-defined construction/destruction cycle is a key feature of C++. It lets us reason about object lifetime, but sometimes there are surprises—sometimes for the better, sometimes not.

## What is an object?

How is an `int` different from something containing an `int`?

```c++
struct S { int i; };
int i;
```

With uniform initialization syntax, the differences are not so clear:

```c++
struct S { int i; };

int use_s() {
    static_assert(sizeof(S) == sizeof(int));
    S s{15};
    int& i = reinterpret_cast<int&>(s); // don't do this in real code
    i = 23;
    return s.i;
}

int use_int() {
    static_assert(sizeof(int) == sizeof(int));
    int s{15};
    int& i = reinterpret_cast<int&>(s);
    i = 23;
    return i;
}
```

Both types are trivially constructible, trivially destructible, trivially copyable, and object types:

```c++
static_assert(std::is_trivially_constructible_v<S>);
static_assert(std::is_trivially_constructible_v<int>);
static_assert(std::is_trivially_destructible_v<S>);
static_assert(std::is_trivially_destructible_v<int>);
static_assert(std::is_trivially_copyable_v<S>);
static_assert(std::is_trivially_copyable_v<int>);
static_assert(std::is_object_v<S>);
static_assert(std::is_object_v<int>);
```

The standard says:

> An object type is a (possibly cv-qualified) type that is not a function type, not a reference type, and not cv `void`.

## Object lifetime

### Lifetime begins

The lifetime of an object of type `T` begins when:

1. storage with the proper alignment and size for type `T` is obtained; and
2. if the object has non-vacuous initialization, its initialization is complete.

There are additional rules for union members and subobjects.

### Lifetime ends

The lifetime of an object `o` of type `T` ends when:

1. if `T` is a class type with a non-trivial destructor, the destructor call starts; or
2. the storage occupied by the object is released or reused by an object that is not nested within `o`.

### Returning a reference to a local object

```c++
#include <iostream>

const int& get_data() {
    const int i = 5;
    return i;
}

int main() {
    std::cout << get_data();
}
```

What is printed? Unknown. A compiler can warn: `reference to stack memory returned`.

Wrapping the reference makes it even more confusing:

```c++
#include <functional>
#include <iostream>

std::reference_wrapper<const int> get_data() {
    const int i = 5;
    return i;
}

int main() {
    std::cout << get_data();
}
```

Clang and GCC differ in the warnings they produce, and it really depends on the compiler version, it may warn, it may compile error, or it may compile and run with UB.

> Simple standard-library wrappers around references confuse analysis.
{: .prompt-warning }

## Strings

### Returning a string literal

```c++
#include <iostream>
#include <string>

const char* get_data() {
    return "Hello World";
}

int main() {
    std::cout << get_data();
}
```

This prints `Hello World`.

Evaluating a string literal produces a string-literal object with **static storage duration**. Static objects are valid for the entirety of the program.

The same applies to a `std::string_view` into the literal:

```c++
std::string_view get_data() {
    return "Hello World";
}
```

The `std::string_view` contains pointers into the statically constructed string literal, so this also prints `Hello World`.

### Returning a view into a local string

```c++
std::string_view get_data() {
    std::string s = "Hello World";
    return s;
}
```

What is printed? Unknown. The returned `std::string_view` points into data owned by the local `std::string`.

### A local character array

```c++
std::string_view get_data() {
    const char s[] = "Hello World"; // local array
    return s;                       // decays to pointer, initializes string_view
}

int main() {
    std::cout << get_data(); // no warnings
}
```

The character array is local even though it was initialized from a string literal.

`const char s[]` create a local array, but `const char *s` creates a pointer to a string literal. The former has automatic storage duration, the latter has static storage duration.

> Strings live longer than you think they will, except when they don't.
{: .prompt-warning }

## Containers

Given the same tracing type with an additional `S(int)` constructor:

```c++
struct S {
    S() { puts("S()"); }
    S(int) { puts("S(int)"); }
    S(const S&) noexcept { puts("S(const S &)"); }
    S(S&&) noexcept { puts("S(S&&)"); }
    S& operator=(const S&) {
        puts("operator=(const S&)");
        return *this;
    }
    S& operator=(S&&) {
        puts("operator=(S&&)");
        return *this;
    }
    ~S() { puts("~S()"); }
};
```

### `push_back`

```c++
std::vector<S> vec;
vec.push_back(S{1});
```

The output is:

```text
S(int)
S(S&&)
~S()
~S()
```

For a non-trivially destructible type, the destructor of a moved-from object must still be called.

> Moved-from objects still have to be destroyed. For non-trivial types, this is non-trivial.
{: .prompt-info }

### `emplace_back`

```c++
std::vector<S> vec;
vec.emplace_back(S{1});
```

The output is the same as `push_back`:

```text
S(int)
S(S&&)
~S()
~S()
```

This is an improper use of `emplace_back`. Its purpose is to call the constructor of the object directly.

```c++
std::vector<S> vec;
vec.emplace_back(1);
```

Now the output is:

```text
S(int)
~S()
```

> Even without a named object, we have to think about lifetime.
{: .prompt-info }

## Temporaries

```c++
#include <cstdio>

struct S {
    S() { puts("S()"); }
    ~S() { puts("~S()"); }
};

S get_value() { return {}; }

int main() {
    const auto& val = get_value();
    puts("Hello World");
}
```

The output is:

```text
S()
Hello World
~S()
```

The lifetime of the temporary returned by `get_value()` is extended because it is assigned to a reference.

### Recursive lifetime extension

```c++
struct S {
    const int& m;
};

int main() {
    const S& s = S{1};
    return s.m;
}
```

`main` returns `1`, not a dangling reference. The temporary `S` object is lifetime-extended because it is assigned to a reference, and the member `m` is lifetime-extended because it is a reference to a temporary.

> Lifetime-extension rules apply recursively to member initializers.
{: .prompt-info }

## Initializer lists

### `std::vector<std::string>` and small-string optimization

```c++
std::vector<std::string> vec{"a", "b"};
```

There is almost certainly only one dynamic allocation: the vector's allocation. Every standard-library implementation uses a small-string optimization (SSO).

> `std::string` is highly optimized; don't underestimate it.
{: .prompt-info }

With long strings:

```c++
std::vector<std::string> vec{
    "a long string of characters",
    "b long string of characters"
};
```

There are five allocations:

1. one for the first hidden string;
2. one for the second hidden string;
3. one for the vector;
4. one for the copy of the first string; and
5. one for the copy of the second string.

An `initializer_list` is implemented by creating a hidden `const` array of the expected type. The code is approximately equivalent to:

```c++
const std::string __data[]{
    "a long string of characters",  // alloc 1
    "b long string of characters"   // alloc 2
};

// vector: alloc 3
// copy of str1: alloc 4
// copy of str2: alloc 5
std::vector<std::string> vec{
    std::initializer_list<std::string>{__data, __data + 2}
};
```

> `std::initializer_list<>` invocations create hidden `const` arrays.
{: .prompt-warning }

### `std::array`

With C++17 CTAD:

```c++
std::array a{
    "a long string of characters",
    "b long string of characters"
};
```

There are zero dynamic allocations. The type is deduced as:

```c++
std::array<const char*, 2>
```

If the elements are `std::string`, there are exactly two allocations.

That is because `std::array` has no constructors. It is effectively:

```c++
template<typename T, std::size_t Size>
struct array {
    T _M_elems[Size];
};
```

Initializer-list syntax directly initializes its internal data structure; it does **not** use `std::initializer_list<>`.

> `std::array` has zero constructors, for efficiency.
{: .prompt-info }

## Ranged `for` loops

```c++
#include <iostream>
#include <vector>

struct S {
    std::vector<int> data{1, 2, 3, 4, 5};
    const auto& get_data() const { return data; }
};

S get_s() { return S{}; }

int main() {
    for (const auto& v : get_s().get_data()) {
        std::cout << v;
    }
}
```

What is printed? Unknown.

The loop is approximately equivalent to:

```c++
int main() {
    {
        auto&& __range = get_s().get_data(); // dangling reference
        auto __begin = begin(__range);
        auto __end = end(__range);

        for (; __begin != __end; ++__begin) {
            const auto& v = *__begin;
            std::cout << v;
        }
    }
}
```

Because there is no lifetime extension for function return references, the temporary `S` object is destroyed at the end of the full expression, leaving a dangling reference. That means if we use `get_s().data` instead, it will work.

C++20 `for-init` solution for this case:

```c++
int main() {
    for (const auto s = get_s();
         const auto& v : s.get_data()) {
        std::cout << v;
    }
}
```

Its approximate equivalent keeps `s` alive for the loop:

```c++
int main() {
    {
        const auto s = get_s();
        auto&& __range = s.get_data(); // no dangling reference
        auto __begin = begin(__range);
        auto __end = end(__range);

        for (; __begin != __end; ++__begin) {
            const auto& v = *__begin;
            std::cout << v;
        }
    }
}
```

> Ranged-`for` loops create hidden variables that have their own lifetime questions.
{: .prompt-warning }

> **C++23** introduces the solution specifically for this case: temporaries in a range-for initializer live until the loop ends.  
> So `for (auto x : get_s().get_data()) {}` is safe in C++23, but `auto&& x = get_s().get_data();` still creates a dangling reference.
{: prompt-info }

## `if-init`

What warning might this give?

```c++
int get_val();
double get_other_val();

int main() {
    if (const auto x = get_val(); x > 5) {
        // do something with x
    } else if (const auto x = get_other_val(); x < 5) {
        // do something else with x
    }
}
```

The second `x` shadows the first, and it creates a warning (with flag `-Wshadow`). The code is approximately equivalent to:

```c++
int main() {
    {
        const auto x = get_val();
        if (x > 5) {
            // do something with x
        } else {
            const auto x = get_other_val(); // shadowing
            if (x < 5) {
                // do something else with x
            }
        }
    }
}
```

> `if-init` variables are visible in the `else` blocks as well.
{: .prompt-info }

## RVO

```c++
S get_S() {
    return {};
}

int main() {
    get_S();
}
```

The output is:

```text
S()
~S()
```

RVO also applies through multiple return calls:

```c++
S get_S() { return {}; }
S get_other_S() { return get_S(); }

int main() {
    S s = get_other_S();
}
```

The output remains:

```text
S()
~S()
```

This is required as of C++17 and had already been implemented by compilers for many years.

> RVO is super awesome. Rely on it.
{: .prompt-tip }

## Subobjects

```c++
struct Holder {
    S s;
    int i;
};

Holder get_Holder() { return {}; }

S get_S() {
    S s = get_Holder().s;
    return s;
}

int main() {
    S s = get_S();
}
```

The output is:

```text
S()
S(S&&)
~S()
~S()
```

The sequence is:

```c++
Holder get_Holder() { return {}; } // initializes Holder: S()

S get_S() {
    S s = get_Holder().s; // rvalue initializes s: S(S&&), then ~S()
    return s;             // RVO applied
}

int main() {
    S s = get_S(); // nothing printed here
}                  // ~S()
```

> Moves happen automatically with rvalues. There is no need to help the compiler.
{: .prompt-tip }

## Structured bindings

Change the previous example to use a structured binding:

```c++
Holder get_Holder() { return {}; }

S get_S() {
    auto [s, i] = get_Holder();
    return s;
}

int main() {
    S s = get_S();
}
```

The output is now:

```text
S()
S(const S&) // copy, not move
~S()
~S()
```

The slides show this approximate equivalent:

```c++
S get_S() {
    auto e = get_Holder();
    auto& s = e.s;
    auto& i = e.i;
    return s; // RVO is not applied to a reference
}
```

The mechanism is strutured binding in case of copying is: create a hidden variable `e` of type `Holder`, then create references to its members. The return statement returns a reference, so RVO is not applied.

> Structured bindings create hidden values whose bindings are references. References are not objects, so RVO and automatic moves cannot happen.
{: .prompt-warning }

## Delegating constructors

For a normally completed constructor, the destructor is called:

```c++
struct S {
    int i{};
    S() = default;
    S(int i_) : i{i_} {}
    ~S() { puts("~S()"); }
};
```

If the constructor throws, the destructor is not called because construction did not complete:

```c++
S(int i_) : i{i_} {
    throw 1;
}
```

Now delegate to the default constructor:

```c++
struct S {
    int i{};
    S() = default;

    S(int i_)
        : S{} {
        i = i_;
        throw 1;
    }

    ~S() { puts("~S()"); }
};
```

This time the destructor is called. Once the delegated-to constructor completes, the object's lifetime has begun.

This is an interesting use from Howard Hinnant:

```c++
struct S {
    int* ptr{nullptr};
    int* ptr2{nullptr};

    S() = default;

    S(int val1, int val2)
        : S{} { // make sure destructor is called
        ptr = new int(val1);
        ptr2 = new int(val2);
    }

    ~S() {
        delete ptr;
        delete ptr2; // deleting nullptr is well-defined
    }
};
```

If one of the `new` calls throws, the destructor is called and cleans up the other pointer.

However, use `std::unique_ptr` instead.

> An object's lifetime has begun after any constructor has completed.
{: .prompt-info }

Anywhere the specification says that the compiler transforms code, there might be a surprise lurking.

## Avoiding lifetime issues

### Think about lifetime

#### Do not name temporaries

```c++
auto get_first() {
    auto [first, second] = get_pair();
    return first; // bad idea
}


auto get_first() {
    return get_pair().first; // good idea
}
```

In first example, `first` is a lvalue and a reference, so the function have to call copy constructor to return a value. 

In the second example, `get_pair().first` is an xvalue, so the function can return move constructor.

#### Consider requiring all structured bindings to be references

```c++
auto get_sum() {
    // Makes it clear that we are playing with hidden references.
    const auto& [first, second] = get_pair();
    return first + second;
}
```

This makes it clear that we are playing with hidden references.

### Use the tools

#### Warn all the things

Use warnings and checks such as:

```text
-Wshadow
```

MSVC and Clang-Tidy Core Guidelines checks can catch issues such as array-to-pointer conversion.

#### Sanitize

The examples that can cause a crash are trivial to catch with tests that use sanitizers.

#### Carefully use `initializer_list<>`

- Understand the difference between an initializer list and `initializer_list<>`. The standard section `[dcl.init.list]` has 12 subclauses.
- Take advantage of direct initialization for type safety and performance.
- Only use `initializer_list<>` constructors for trivial or literal types.

#### `constexpr` all the things

What would this return?

```c++
int& get_val() {
    int i{};
    return i; // dangling reference
}

int do_thing() {
    return ++get_val(); // invalid dereference
}

int main() {
    auto val = do_thing();
    return val; // unknown
}
```

`constexpr` does not allow UB, although compiler enforcement varies:

```c++
constexpr int& get_val() {
    int i{};
    return i;
}

constexpr int do_thing() {
    return ++get_val();
}

int main() {
    constexpr auto val = do_thing();
    return val;
}
```

The ranged-`for` example can also be made `constexpr` so the dangling reference is diagnosed during constant evaluation:

```c++
#include <array>

struct S {
    const std::array<int, 5> data{1, 2, 3, 4, 5};
    constexpr const auto& get_data() const { return data; }
};

constexpr S get_s() { return S{}; }

constexpr int sum() {
    int i = 0;
    for (const auto& v : get_s().get_data()) {
        i += v;
    }
    return i;
}

int main() {
    constexpr const int s = sum();
}
```

The local character-array example can be exposed in the same way:

```c++
constexpr std::string_view get_value() {
    const char str[] = "Hello World";
    return str;
}

int main() {
    constexpr auto sv = get_value(); // will not compile
    std::cout << sv;
}
```
