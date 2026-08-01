---
title: Cool C++ Features and Weird Details
date: 2026-02-21 00:00:00 +0800
categories: [cpp]
tags: [cpp, c++]
description: Some useful and cursed C++ features
math: true
---

C++ has a lot of small features that are either useful, cursed, or both.

This post is just a collection of things I want to remember.

## Array Indexing is Symmetric

```c++
int arr[5] = {1, 2, 3, 4, 5};

printf("%d\n", arr[3]); // 4
printf("%d\n", 3[arr]); // 4
```

This works because:

```c++
arr[3]
```

is defined as:

```c++
*(arr + 3)
```

And:

```c++
3[arr]
```

is defined as:

```c++
*(3 + arr)
```

Pointer addition is commutative here, so both access the same element.

> This is valid C++, but please do not write `3[arr]` unless you are trying to summon demons.
{: .prompt-warning }

## Struct Alignment and Padding

Consider this struct:

```c++
struct A {
    char a; // 1 byte
    int  b; // 4 bytes, wants 4-byte alignment
    char c; // 1 byte
};

printf("%zu\n", sizeof(A)); // usually 12
```

The size is not just:

```c++
1 + 4 + 1 = 6
```

because members need to satisfy alignment requirements.

A typical layout is:

```text
a      padding      b b b b      c      padding
1 byte 3 bytes      4 bytes      1 byte 3 bytes
```

So the total becomes 12 bytes.

The compiler also pads the end of the struct so that arrays work correctly:

```c++
A arr[10];
```

Each `A` object must still have proper alignment.

### Reordering Members

We can reduce padding by grouping smaller members together:

```c++
struct B {
    char a; // 1 byte
    char c; // 1 byte
    int  b; // 4 bytes
};

printf("%zu\n", sizeof(B)); // usually 8
```

Typical layout:

```text
a      c      padding      b b b b
1 byte 1 byte 2 bytes      4 bytes
```

So `B` is smaller than `A`.

> Struct member order can affect memory usage.
> This matters more when you store millions of objects.
{: .prompt-tip }

## Compiler Optimizations

```c++
int x = 5;
int y = x * 2;
```

The compiler may optimize this to:

```c++
int y = 10;
```

because `x * 2` can be known at compile time.

This kind of optimization is called **constant folding**.

Of course, real compilers do way more than this:

* remove unused code
* inline functions
* simplify expressions
* unroll loops
* vectorize loops

> The important idea: C++ source code is not a literal list of CPU instructions.
> The optimizer is allowed to transform your code as long as the observable behavior stays the same.
{: .prompt-info }

## Unsafe C Library Functions

Some old C functions are very unsafe if used carelessly.

### strcpy

```c++
char buffer[10];

strcpy(buffer, "This is a long string that exceeds the buffer size!");
```

`strcpy` does not check whether the destination buffer is large enough.

If the source string is too long, it writes past the end of the array.

That is a **buffer overflow**.

Prefer C++ types when possible:

```c++
std::string s = "This is safe";
```

### atoi

```c++
char str[] = "xyz";
int num = atoi(str);
```

`atoi` gives poor error handling.
If the input is invalid, it just returns `0`, which is ambiguous.

Better alternatives:

```c++
std::stoi("123");
```

or, for low-level parsing:

```c++
std::from_chars(...);
```

> Old C APIs are powerful, but many of them trust the programmer way too much.
{: .prompt-warning }

## Digraphs and Trigraphs

C++ has alternative spellings for some symbols.

| Symbol | Digraph | Trigraph |
| ------ | ------- | -------- |
| `{`    | `<%`    | `??<`    |
| `}`    | `%>`    | `??>`    |
| `[`    | `<:`    | `??(`    |
| `]`    | `:>`    | `??)`    |
| `#`    | `%:`    | `??=`    |

Digraph example:

```c++
%:include <iostream>

int main() <%
    int a<:3:> = {1, 2, 3};
    return 0;
%>
```

This is equivalent to:

```c++
#include <iostream>

int main() {
    int a[3] = {1, 2, 3};
    return 0;
}
```

Trigraphs existed for old systems where some characters were hard to type.

> Digraphs still exist.
> Trigraphs were removed in C++17.
> Either way, do not use them unless you enjoy cursed archaeology.
{: .prompt-warning }

## `main` is Not the Real Start

We usually think the program starts here:

```c++
int main(int argc, char** argv) {
    // ...
}
```

But the operating system does not directly “start C++” from `main`.

A lower-level entry point, often called `_start`, runs first.

Conceptually:

```c++
void _start() {
    setup_runtime();
    int result = main(argc, argv);
    exit(result);
}
```

Before `main`, the runtime may:

* set up stack/environment
* initialize global/static objects
* initialize libc / C++ runtime
* prepare `argc` and `argv`

After `main`, it also:

* destroys static objects
* flushes streams
* exits the process

> `main` is the C++ entry point.
> `_start` is closer to the real OS-level entry point.
{: .prompt-info }

## A Byte is Not Always 8 Bits

In C++:

```c++
sizeof(char) == 1
```

is always true.

But this means:

```text
sizeof(char) == 1 byte
```

not necessarily:

```text
1 byte == 8 bits
```

The number of bits in a byte is given by:

```c++
#include <climits>

CHAR_BIT
```

On almost all modern machines:

```c++
CHAR_BIT == 8
```

But the C++ standard does not require this.

> In normal competitive programming and desktop programming, assuming 8-bit bytes is fine.
> But technically, C++ only guarantees `sizeof(char) == 1`.
{: .prompt-info }

## Integer Literal Prefixes

```c++
auto binary = 0b1010; // binary, 10
auto octal  = 012;    // octal, 10
auto hex    = 0xA;    // hexadecimal, 10
```

Integer literal prefixes:

| Prefix      | Base | Example  |
| ----------- | ---: | -------- |
| `0b` / `0B` |    2 | `0b1010` |
| leading `0` |    8 | `012`    |
| `0x` / `0X` |   16 | `0xA`    |

The octal one is the most dangerous.

```c++
int x = 010; // 8, not 10
```

> Leading zero means octal.
> This is one of the most annoying C/C++ legacy traps.
{: .prompt-warning }

## Recursive Lambda with Deducing `this` (C++23)

Before C++23, recursive lambdas often needed tricks like `y_combinator` or passing `self` manually.

In C++23, we can write:

```c++
auto dfs = [&](this auto&& self, int u) -> void {
    for (int v : graph[u]) {
        self(v);
    }
};

dfs(0);
```

Here, `self` refers to the lambda itself.

This makes recursive lambdas much cleaner.

Older style:

```c++
auto dfs = [&](auto&& self, int u) -> void {
    for (int v : graph[u]) {
        self(self, v);
    }
};

dfs(dfs, 0);
```

C++23 version removes the annoying extra `self(self, ...)`.

> This is very nice for DFS-style code, but online judges may not support C++23 yet.
{: .prompt-warning }

## Three-Way Comparison `<=>` (C++20)

The spaceship operator can generate comparisons automatically.

```c++
#include <compare>

struct Node {
    int x, y, id;

    auto operator<=>(const Node&) const = default;
};
```

This compares members in declaration order:

```text
x first, then y, then id
```

With `= default`, C++ can generate comparison operators for us.

### Custom Ordering

```c++
#include <compare>

struct Point {
    int x, y;

    std::strong_ordering operator<=>(const Point& other) const {
        if (auto cmp = x <=> other.x; cmp != 0) {
            return cmp;
        }
        return other.y <=> y; // y descending
    }

    bool operator==(const Point& other) const = default;
};
```

This sorts by:

```text
x ascending
y descending
```

> If you write custom `<=>`, also default or define `operator==`.
{: .prompt-tip }

## `ranges::sort` with Projection (C++20)

Normally, to sort by `.second`:

```c++
sort(a.begin(), a.end(), [](auto const& x, auto const& y) {
    return x.second < y.second;
});
```

With ranges projection:

```c++
ranges::sort(a, {}, [](auto const& p) {
    return p.second;
});
```

The middle `{}` means “use the default comparator”.

So this means:

```text
sort by projected key p.second
```

For structs, member pointer projection is even cleaner:

```c++
struct Edge {
    int u, v, w;
};

vector<Edge> e;

ranges::sort(e, {}, &Edge::w);
```

This sorts edges by weight.

> Use `auto const& p` in the projection if the element is large.
> `auto p` copies the element.
{: .prompt-warning }

## `if` / `switch` Initializer (C++17)

C++17 lets us declare a variable inside an `if` condition:

```c++
if (auto it = mp.find(x); it != mp.end()) {
    cout << it->second << '\n';
}
```

The variable `it` only exists inside the `if` / `else` statement.

This avoids leaking temporary variables into the outer scope.

Equivalent older style:

```c++
auto it = mp.find(x);
if (it != mp.end()) {
    cout << it->second << '\n';
}
```

Use case:

```c++
if (auto [it, ok] = st.insert(x); ok) {
    // inserted successfully
}
```

> This is useful when the variable is only needed for the condition.
{: .prompt-tip }

## `<bit>` Utilities (C++20)

C++20 added useful bit functions in `<bit>`.

```c++
#include <bit>

std::popcount(x);
std::countl_zero(x);
std::countr_zero(x);
```

Common ones:

| Function                 | Meaning                                |
| ------------------------ | -------------------------------------- |
| `std::popcount(x)`       | number of set bits                     |
| `std::countl_zero(x)`    | leading zero bits                      |
| `std::countr_zero(x)`    | trailing zero bits                     |
| `std::has_single_bit(x)` | whether `x` is a power of two          |
| `std::bit_width(x)`      | number of bits needed to represent `x` |

Example:

```c++
unsigned x = 12; // 1100

std::popcount(x);    // 2
std::countr_zero(x); // 2
```

These functions are safer than compiler builtins like:

```c++
__builtin_clz(x);
__builtin_ctz(x);
```

because the standard functions are well-defined for `0`.

```c++
std::countr_zero(0u); // OK
```

But builtins like `__builtin_ctz(0)` are undefined behavior.

> These functions work on unsigned integer types.
> Prefer unsigned values when doing bit tricks.
{: .prompt-warning }

## Template Definition and Explicit Instantiation

Templates are usually **fully defined** in header files.

```c++
// mycode.hpp
template<typename T>
T mymax(T a, T b) {
    return b < a ? a : b;
}
```

This is necessary because the compiler must see the complete template body when it generates a type-specific version.

Example:

```c++
#include "mycode.hpp"

int main() {
    int a = mymax(3, 5);           // generates mymax<int>
    double b = mymax(2.5, 4.7);   // generates mymax<double>
}
```

The compiler effectively creates:

```c++
int mymax<int>(int a, int b);
double mymax<double>(double a, double b);
```

Each `.cpp` file that uses the template can instantiate the versions it needs.

| Approach               | Who generates the function? | Supported types                  |
| ---------------------- | --------------------------- | -------------------------------- |
| Definition in header   | The `.cpp` file using it    | Any compatible type              |
| Explicit instantiation | The template’s `.cpp` file  | Only manually instantiated types |

Explicit instantiation allows the template definition to stay inside a `.cpp` file.

```c++
// mycode.hpp
template<typename T>
T mymax(T a, T b);
```

```c++
// mycode.cpp
#include "mycode.hpp"

template<typename T>
T mymax(T a, T b) {
    return b < a ? a : b;
}

template int mymax<int>(int, int);
```

This line:

```c++
template int mymax<int>(int, int);
```

forces `mycode.cpp` to generate the `int` version of `mymax`.

Another file can then use it:

```c++
#include "mycode.hpp"

int main() {
    int x = mymax(3, 5); // OK: mymax<int> was generated
}
```

However, using another type fails unless that type is also explicitly instantiated.

```c++
double x = mymax(3.2, 5.7); // linker error
```

To support `double`, add:

```c++
template double mymax<double>(double, double);
```

Then `mycode.cpp` contains:

```c++
template int mymax<int>(int, int);
template double mymax<double>(double, double);
```

> A template definition in a header supports any compatible type.
> Explicit instantiation supports only the specific types listed in the `.cpp` file.
{: .prompt-warning }

## Forwarding References and `const T&`

A forwarding reference can deduce `T` as a reference type.

```c++
template <typename T>
void f(T&& a) {
    const T& b = a;
    b = 2;
}
```

Example:

```c++
int main() {
    int a = 1;
    f(a);
    return a; // returns 2
}
```

Because `a` is an lvalue, template deduction gives:

```c++
T = int&
```

Therefore:

```c++
const T& b = a;
```

becomes conceptually:

```c++
const (int&)& b = a;
```

Adding `const` to a reference type has no effect, and reference collapsing applies:

```c++
int& &   -> int&
int& &&  -> int&
int&& &  -> int&
int&& && -> int&&
```

So `b` is actually:

```c++
int& b = a;
```

Therefore this is valid:

```c++
b = 2;
```

and it modifies the original variable.

To make the referenced object const, remove the reference from `T` first:

```c++
#include <type_traits>

template <typename T>
void f(T&& a) {
    const std::remove_reference_t<T>& b = a;

    // b = 2; // compile error: b refers to a const int
}
```

Another option is `std::as_const`:

```c++
#include <utility>

template <typename T>
void f(T&& a) {
    const auto& b = std::as_const(a);

    // b = 2; // compile error
}
```

> `const T&` does not always mean “const reference to the underlying object.”
> If `T` is already a reference type, the added `const` does not make the object const.
{: .prompt-warning }

## Calling a Dependent Member Template

This code does **not compile**:

```c++
template<class T>
struct A {
    template<class K>
    void foo() {}
};

template<class T>
void bar(A<T>& a) {
    a.foo<T>(); // error
}
```

`A<T>` is a **dependent type** because it depends on template parameter `T`.

While parsing `bar`, the compiler does not yet know whether `foo` is a member template. It may interpret `<` as the less-than operator instead of the start of template arguments.

We must use the `template` disambiguator:

```c++
template<class T>
void bar(A<T>& a) {
    a.template foo<T>();
}
```

Full example:

```c++
template<class T>
struct A {
    template<class K>
    void foo() {}
};

template<class T>
void bar(A<T>& a) {
    a.template foo<T>();
}

int main() {
    A<int> a;
    bar(a); // calls a.foo<int>()
}
```

The keyword does not declare a new template. It tells the compiler:

> Treat `foo` as a template when parsing the following `<T>`.

It is commonly required after `.`, `->`, or `::` when accessing a member of a dependent type:

```c++
object.template function<T>();
pointer->template function<T>();
Type<T>::template Nested<U>;
```

## C++ Version Cheat Sheet

### C++98 / C++03 — Classic C++

Introduced the foundations of traditional C++.

```c++
std::vector<int> values;
std::sort(values.begin(), values.end());
```

Main features:

| Feature    | Meaning                              |
| ---------- | ------------------------------------ |
| STL        | containers, iterators and algorithms |
| Templates  | generic programming                  |
| Exceptions | `try`, `catch`, `throw`              |
| RTTI       | `dynamic_cast`, `typeid`             |
| Namespaces | prevent naming conflicts             |

> C++03 mostly fixed and clarified C++98 rather than adding major features.

### C++11 — Modern C++ Begins

C++11 significantly changed how C++ is written.

```c++
auto x = 10;

auto square = [](int x) {
    return x * x;
};

for (int value : values) {
    std::cout << value << '\n';
}
```

Main features:

| Feature                | Example                       |
| ---------------------- | ----------------------------- |
| Type deduction         | `auto x = 10;`                |
| Lambdas                | `[](int x) { return x * 2; }` |
| Move semantics         | `std::move(x)`                |
| Rvalue references      | `T&&`                         |
| Null pointer           | `nullptr`                     |
| Range-based loops      | `for (auto x : values)`       |
| Compile-time functions | `constexpr`                   |
| Variadic templates     | `template<class... Ts>`       |
| Smart pointers         | `unique_ptr`, `shared_ptr`    |
| Concurrency            | `thread`, `mutex`, `atomic`   |

> C++11 introduced move semantics, lambdas, smart pointers and modern resource management.

### C++14 — C++11 Polish

C++14 mainly improved and simplified C++11 features.

```c++
auto square = [](auto x) {
    return x * x;
};

auto ptr = std::make_unique<int>(42);
```

Main features:

| Feature               | Example                            |
| --------------------- | ---------------------------------- |
| Generic lambdas       | `[](auto x) { return x; }`         |
| Return-type deduction | `auto f() { return 42; }`          |
| Relaxed `constexpr`   | loops and local variables allowed  |
| Variable templates    | `template<class T> constexpr T pi` |
| Binary literals       | `0b101010`                         |
| Digit separators      | `1'000'000`                        |
| `make_unique`         | `std::make_unique<T>()`            |

> C++14 is mostly a quality-of-life update to C++11.

### C++17 — Cleaner Everyday C++

C++17 added many practical language and library features.

```c++
auto [name, score] = get_result();

if (auto it = map.find(key); it != map.end()) {
    std::cout << it->second;
}
```

Main language features:

| Feature                           | Example                    |
| --------------------------------- | -------------------------- |
| Structured bindings               | `auto [x, y] = pair;`      |
| Compile-time branching            | `if constexpr (...)`       |
| Class template argument deduction | `std::pair p{1, 2};`       |
| Fold expressions                  | `(args + ...)`             |
| Inline variables                  | `inline static int value;` |
| Guaranteed copy elision           | avoids certain copies      |

Important library types:

```c++
std::optional<int>
std::variant<int, std::string>
std::any
std::string_view
std::filesystem::path
```

Example:

```c++
std::optional<int> find_value();

if (auto value = find_value()) {
    std::cout << *value;
}
```

> C++17 focused on ergonomics, generic programming and useful vocabulary types.

---

### C++20 — Major Language Upgrade

The four headline features are:

```text
Concepts
Ranges
Coroutines
Modules
```

#### Concepts

Concepts provide readable template constraints.

```c++
#include <concepts>

template<std::integral T>
T add(T a, T b) {
    return a + b;
}
```

#### Ranges

Ranges simplify algorithm composition.

```c++
#include <ranges>

for (int x : values | std::views::filter([](int x) {
                 return x % 2 == 0;
             })) {
    std::cout << x;
}
```

#### Coroutines

```c++
co_await operation();
co_yield value;
co_return result;
```

Other important features:

| Feature                 | Meaning                           |
| ----------------------- | --------------------------------- |
| Modules                 | alternative to textual headers    |
| `<=>`                   | three-way comparison              |
| `consteval`             | must run at compile time          |
| `constinit`             | ensures static initialization     |
| Designated initializers | `Point{.x = 1, .y = 2}`           |
| `std::span`             | non-owning contiguous view        |
| `std::format`           | type-safe formatting              |
| `std::jthread`          | automatically joining thread      |
| `<bit>`                 | standard bit utilities            |
| `source_location`       | source-code call-site information |

> Remember C++20 as: **concepts, ranges, coroutines and modules**.

### C++23 — Completing C++20

C++23 mainly improved C++20 and added useful library facilities.

#### Deducing `this`

```c++
struct Value {
    int x;

    template<typename Self>
    auto&& get(this Self&& self) {
        return std::forward<Self>(self).x;
    }
};
```

#### `if consteval`

```c++
constexpr int calculate(int x) {
    if consteval {
        return compile_time_calculation(x);
    } else {
        return runtime_calculation(x);
    }
}
```

#### `std::expected`

Represents either a successful value or an error.

```c++
std::expected<int, std::string>
parse_number(std::string_view input);
```

#### Printing

```c++
#include <print>

std::println("Answer: {}", 42);
```

Other features:

| Feature                  | Meaning                        |
| ------------------------ | ------------------------------ |
| `std::expected`          | result-or-error type           |
| `std::print` / `println` | formatted output               |
| `std::mdspan`            | multidimensional array view    |
| `std::stacktrace`        | stack information              |
| `std::ranges::to`        | convert ranges into containers |
| More range adaptors      | `zip`, `chunk`, `slide`, etc.  |
| `import std;`            | standard-library module        |
| Range-for lifetime fix   | reduces dangling references    |

> C++23 mainly completes C++20 and improves library usability.

### Features People Commonly Mix Up

| Feature                      | Version     |
| ---------------------------- | ----------- |
| Lambdas                      | C++11       |
| `std::move`                  | C++11       |
| `unique_ptr`                 | C++11       |
| `make_unique`                | C++14       |
| Generic lambdas              | C++14       |
| Structured bindings          | C++17       |
| `if constexpr`               | C++17       |
| `optional`, `variant`, `any` | C++17       |
| `string_view`                | C++17       |
| Filesystem library           | C++17       |
| Concepts                     | C++20       |
| Ranges                       | C++20       |
| Coroutines                   | C++20       |
| Modules                      | C++20       |
| `std::format`                | C++20       |
| `std::span`                  | C++20       |
| `std::expected`              | C++23       |
| `std::print`                 | C++23       |
| Deducing `this`              | C++23       |
| Reflection                   | draft C++26 |
