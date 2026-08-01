---
title: C++ Mistakes
date: 2026-06-15 10:00:00 +0800
categories: [cpp]
tags: [cpp, programming, mistakes]
description: Common mistakes in C++ programming.
math: true
---

## CppQuiz #31 — Most vexing parse

> Initialization, function declaration ambiguity, temporary object, most vexing parse.

```c++
Y y(X());
y.f();
```

**Mistake:**

I thought `Y y(X());` constructs an object `y`.

**Correct:**

It declares a function `y` returning `Y`, taking one parameter of type “function taking no arguments and returning `X`”.

Function parameter types are adjusted, so the parameter becomes pointer-to-function:

```c++
Y y(X());       // function declaration
Y y(X (*)());   // adjusted form
```

So `y.f();` fails because `y` is a function, not an object.

**Why:**

In a parameter list, `X()` can mean: **function taking no arguments and returning X**

> C++ allows function declarations inside a function body. The function cannot be defined locally, but it can be declared there and defined later at namespace scope.
{: .prompt-tip }

> Function parameter adjustment:
```c++
int f();      // f is a function returning int
int (*f)();   // f is a pointer to function returning int
```
> These are different as normal declarations.  
> But as a function parameter, function type is **adjusted** to pointer-to-function type.
{: .prompt-warning }

> C++ also allows extra parentheses around declarators, so:
```c++
int i(int(x));
```
> is a function declaration equivalent to:
```c++
int i(int x);
```
{: .prompt-warning }

### Choosing rule

When a statement is syntactically ambiguous between:

* expression statement
* declaration statement

C++ chooses the **declaration**.

If the whole statement cannot syntactically be a declaration, it is an expression.

```c++
T(a);        // declaration: T a;
T(c) = 7;    // declaration: T c = 7;
T(e)[5];     // declaration: T e[5];

T(a)++;        // expression
T(a)->m = 7;   // expression
T(a, 5) << c;  // expression
```

Inside a declaration, function declaration can beat object construction:

```c++
Y y(X());  // function declaration, not object construction
```

This is the classic **most vexing parse**.

### Fix

Modern C++:

```c++
Y y{X{}};
```

Old-school:

```c++
Y y((X()));
```

### Appendix: extra cursed examples

```c++
T(*g)(double(3));
```

This is a declaration, but **not** a function pointer declaration.

It is parsed like:

```c++
T* g(double(3));
```

So `g` is a pointer to `T`, initialized by `double(3)`.

This may be semantically invalid, but parsing happens before semantic checking.

{: .prompt-warning }

For nested function declarations:

```c++
T1 (*(*b)(T2(c)))(int(d));
```

Parse from the name outward:

* b is a pointer to function - `(*b)`
  * taking parameter c of type T2 - `(*b)(T2(c))`
  * returning pointer to function - `(*(*b)(T2(c)))`
    * taking parameter d of type int - `(*(*b)(T2(c)))(int(d))`
    * returning T1 - `T1 (*(*b)(T2(c)))(int(d))`

Equivalent using aliases:

```c++
using Inner = T1 (*)(int);
using Outer = Inner (*)(T2);

Outer b;
```

But alone:

```c++
(*(*b)(T2(c)))(int(d));
```

this is an expression statement, because it does not start with a declaration specifier like `T1`.

### Extreme standard example

```c++
T1(a) = 3,
T2(4),
(*(*b)(T2(c)))(int(d));
```

C++ first tries to parse this as a declaration starting with type `T1`:

```c++
T1 a = 3,
   T2(4),
   ...;
```

Here: `T2(4)` is treated as declaring a variable named `T2` of type `T1`.

Then the final part fails, because it needs `T2` to be a type name, but `T2` has already been treated as a variable name.

> C++ does not first ask “does this make sense?”  
> If it can be parsed as a declaration, it is parsed as a declaration, even if the declaration is later ill-formed.
{: .prompt-warning }

[read more](https://en.wikipedia.org/wiki/Most_vexing_parse)
[standard wording](https://timsong-cpp.github.io/cppwp/std23/stmt.ambig)

## CppQuiz #??? — `std::future::get()` twice

> `std::future`, `std::promise`, shared state, one-shot result, undefined behavior.

```c++
std::promise<int> p;
std::future<int> f = p.get_future();

p.set_value(1);

std::cout << f.get();
std::cout << f.get();
```

**Mistake:**

I thought `f.get()` can be called multiple times.

**Correct:**

The first call: `f.get();` waits until the shared state is ready, retrieves the value, and releases the shared state.

So it prints: `1`.

After that: `f.valid() == false`

Calling `get()` again on this `std::future` is **undefined behavior**.

Many implementations throw `std::future_error`, but the standard says UB.

### Rule to remember

```c++
std::future<T>  // get once only
```

If I need to read the result multiple times, use:

```c++
std::shared_future<T>
```

---

### Extra `future` / `promise` rules

#### `future::get()` is one-shot

```c++
auto x = f.get(); // OK
auto y = f.get(); // UB
```

`get()` consumes the future’s shared state.

After `get()`:

```c++
f.valid() == false
```

Calling most member functions except destructor, move assignment, `share()`, and `valid()` on an invalid future is UB.

#### `future::wait()` does not consume

```c++
f.wait(); // OK
f.wait(); // OK
f.get();  // consumes
```

`wait()` only waits until the result is ready.

`get()` is the consuming operation.

#### `shared_future::get()` can be called multiple times

```c++
std::shared_future<int> sf = f.share();

sf.get(); // OK
sf.get(); // OK
```

Use `shared_future` when multiple reads are needed.

#### `future::share()` transfers the state

```c++
std::shared_future<int> sf = f.share();
```

After `share()`:

```c++
f.valid() == false
```

The shared state moves from `future` into `shared_future`.

#### `promise::get_future()` is one-shot

```c++
auto f1 = p.get_future(); // OK
auto f2 = p.get_future(); // throws std::future_error
```

A promise can create only one future for its shared state.

Calling `get_future()` again throws `std::future_error`.

#### `promise::set_value()` is one-shot

```c++
p.set_value(1); // OK
p.set_value(2); // throws std::future_error
```

A shared state can store only one result.

The result is either value or exception not both, and not multiple times.

#### `promise::set_exception()` stores an exception

```c++
try {
    throw std::runtime_error("oops");
} catch (...) {
    p.set_exception(std::current_exception());
}
```

Then:

```c++
f.get();
```

throws that stored exception.

#### Destroying an unset promise gives broken promise

```c++
std::future<int> f;

{
    std::promise<int> p;
    f = p.get_future();
} // promise destroyed without set_value / set_exception

f.get(); // throws std::future_error
```

If the promise dies before setting a value or exception, the future receives `broken_promise`.

## CppQuiz #235 — copying `std::initializer_list`

> `std::initializer_list`, backing array, shallow copy.

```c++
class C {
public:
    C() = default;
    C(const C&) { std::cout << 1; }
};

void f(std::initializer_list<C> i) {}

int main() {
    C c;
    std::initializer_list<C> i{c};
    f(i);
    f(i);
}
```

Creating:

```c++
std::initializer_list<C> i{c};
```

creates a hidden temporary array of `const C`.

The element is copy-initialized from `c`, so `C` is copied once and prints `1`.

But copying an `initializer_list` does **not** copy its elements.

So:

```c++
f(i);
f(i);
```

only copies the lightweight `initializer_list` object (with a pointer to the hidden array), not the underlying `C`.

## CppQuiz #44 — object slicing vs reference polymorphism

> Inheritance, virtual function, reference, object slicing.

```c++
X arr[1];
Y y1;

arr[0] = y1;

print(y1);
print(arr[0]);
```

**Mistake:**

I thought `Y` is always converted to `X`, so output is `XX`.

**Correct output:** `YX`

**Why:**

```c++
arr[0] = y1;
```

slices, because `arr[0]` is a real `X` object.
Only the `X` part of `y1` is copied; the `Y` part is lost.

So:

```c++
print(arr[0]); // X
```

But:

```c++
print(y1);
```

does **not** slice, because `print` takes a reference:

```c++
void print(const X& x)
```

A base reference binds to the original `Y` object without copying.

Inside `print(y1)`:

* static type:  `const X&`
* dynamic type: `Y`

Since `f()` is virtual:

```c++
print(y1); // Y
```

### Rule

```c++
X x = y;        // slicing
arr[0] = y;     // slicing

const X& r = y; // no slicing
const X* p = &y; // no slicing
```

> Base object copies slice.  
> Base references/pointers preserve dynamic type.
{: .prompt-tip }

## CppQuiz #4 — floating-point literal type

> Overload resolution, literal type, `float`, `double`.

```c++
void f(float)  { std::cout << 1; }
void f(double) { std::cout << 2; }

f(2.5);
f(2.5f);
```

**Mistake:**

I forgot that `2.5` has type `double`, not `float`.

**Correct output:**

```txt
21
```

### Rule to remember

```c++
2.5   // double
2.5f  // float
2.5L  // long double
```

No suffix = `double` by default.

## CppQuiz #259 — `char + char` integral promotion

> Integral promotion, usual arithmetic conversions, overload resolution.

```c++
void f(unsigned int) { std::cout << "u"; }
void f(int)          { std::cout << "i"; }
void f(char)         { std::cout << "c"; }

char x = 1;
char y = 2;

f(x + y);
```

`x + y` is **not `char`**. Before `+`, both `char`s go through **integral promotion**.

Usually: `char -> int` so most systems print: `i`

But the standard allows a rare case where: `char -> unsigned int` so this may also print: `u`

Both can be standard-conforming. But it will **not** print: `c`

### Why

For arithmetic operators like `+`, C++ applies usual arithmetic conversions.

Small integer types are promoted before arithmetic:

```c++
char
signed char
unsigned char
short
unsigned short
bool
```

usually become `int`.

So: `x + y` is not computed as `char + char`. It is computed after promotion.

## CppQuiz #250 — C-style ellipsis vs variadic template

> Templates, overload resolution, variadic function, parameter pack.

```c++
template<typename T>
void foo(T...) { std::cout << 'A'; }

template<typename... T>
void foo(T...) { std::cout << 'B'; }

foo(1);
foo(1, 2);
```

**Mistake:**

I thought both calls choose the first overload, so output is: `AA`

**Correct output:** `AB`

### Key difference

This one:

```c++
template<typename T>
void foo(T...)
```

is **not** a variadic template. It means roughly:

```c++
void foo(T, ...)
```

One real parameter of type `T`, then old C-style ellipsis.

But this one:

```c++
template<typename... T>
void foo(T...)
```

is a real **variadic template**. It has a parameter pack.

### foo(1)

Both overloads are viable:

```c++
foo<int>(int, ...) // first
foo<int>(int)      // second
```

The `...` consumes **zero** arguments here, so both match `1` exactly.

Since conversion ranking ties, C++ uses **template partial ordering**.

The first template has a fixed first parameter:

```c++
template<typename T>
void foo(T, ...)
```

The second is a pure pack:

```c++
template<typename... T>
void foo(T...)
```

A fixed first parameter is considered **more specialized** than a pure pack, so:

```c++
foo(1); // A
```

### foo(1, 2)

First overload:

```c++
foo<int>(int, ...)
```

Second argument `2` has to go into C-style ellipsis.

Second overload:

```c++
foo<int, int>(int, int)
```

Both arguments match normally.

Normal parameter match beats ellipsis match, so it prints: `B`

### Rule to remember

```c++
template<typename T>
void f(T...);       // one T + C-style ellipsis

template<typename... T>
void f(T...);       // variadic template parameter pack
```

C-style ellipsis is a weak fallback.

Parameter pack gives real typed parameters.

## CppQuiz #??? — `std::flat_map`, `std::min`, dangling reference

> `std::flat_map`, `operator[]`, reference invalidation, unspecified argument order.

```c++
std::flat_map<int, int> map;
std::cout << std::min(map[1], map[2]);
```

**Mistake:**

I thought this was about the default-initialized values of `map[1]` and `map[2]`, so it should print `0`.

**Correct:**

The trap is reference invalidation.

`std::min` takes arguments by const reference:

```c++
const T& min(const T& a, const T& b);
```

So:

```c++
std::min(map[1], map[2])
```

binds references to the results of `map[1]` and `map[2]`.

But the evaluation order of function arguments is unspecified.

If `map[2]` is evaluated first, it inserts key `2` and returns a reference to its value.

Then `map[1]` inserts key `1`.

`std::flat_map` stores data in vectors by default, so insertion can move elements and invalidate references.

Since `1 < 2`, inserting `1` before `2` invalidates the reference returned by `map[2]`.

Then `std::min` compares using a dangling reference → **undefined behavior**.

> `std::map`      = node-based, references stable on insert  
> `std::flat_map` = vector-based, insert may invalidate references
{: .prompt-warning }

### Short note: `std::flat_map` in C++23

`std::flat_map` is like `std::map`, but stored in sorted contiguous containers instead of tree nodes.

Comparison:

| Container       | Storage        | Lookup     | Insert/erase | Reference stability |
| --------------- | -------------- | ---------- | ------------ | ------------------- |
| `std::map`      | tree nodes     | `O(log n)` | `O(log n)`   | stable on insert    |
| `std::flat_map` | sorted vectors | `O(log n)` | `O(n)`       | can be invalidated  |

Use `std::flat_map` when:

* data is mostly built once, then queried many times
* map is small/medium sized
* iteration speed and cache locality matter
* memory overhead matters
* sorted order is needed

Avoid `std::flat_map` when:

* many random insert/erase operations
* you need stable references/iterators
* you store huge objects that are expensive to move
* you need node-based operations like extract/merge

### `std::map` — insert/erase while iterating

`std::map` is node-based.

Insertion does **not** invalidate existing iterators/references:

```c++
for (auto it = mp.begin(); it != mp.end(); ++it) {
    mp.insert({new_key, new_val}); // OK
}
```

But newly inserted elements may or may not be visited later, depending on key order.

Erasing current element: use returned iterator.

```c++
for (auto it = mp.begin(); it != mp.end(); ) {
    if (bad(it->first)) {
        it = mp.erase(it); // OK, moves to next
    } else {
        ++it;
    }
}
```

## CppQuiz #222 — `std::variant` default initialization

> `std::variant`, default constructor, first alternative, `index()`.

```cpp
std::variant<int, double, char> v;
std::cout << v.index();
```

**Mistake / missing rule:**

I got it right, but forgot that default-constructing a `variant` chooses the first alternative.

**Correct output:** `0`

**Why:**

For:

```cpp
std::variant<int, double, char> v;
```

the alternatives are:

```txt
index 0 -> int
index 1 -> double
index 2 -> char
```

Default constructor makes `v` hold a value-initialized first alternative:

```cpp
int{} // 0
```

So `v.index()` returns: `0`


So `v.index() == 0`.

## CppQuiz #295 — temporary lifetime until full-expression

> Temporary object, destructor, `c_str()`, full-expression, dangling pointer.

```cpp
#include <iostream>

char a[2] = "0";

struct a_string {
    a_string() { *a='1'; }
    ~a_string() { *a='0'; }
    const char* c_str() const { return a; }
};

void print(const char* s) { std::cout << s; }
a_string make_string() { return a_string{}; }

int main() {
    a_string s1 = make_string();
    print(s1.c_str());

    const char* s2 = make_string().c_str();
    print(s2);

    print(make_string().c_str());
}
```

**Mistake:**

At first I missed the temporary and guessed `111`.

Then I thought the temporary would be destroyed immediately after `c_str()` was used, so I guessed `100`.

**Correct output:** `101`

**Why:**

```cpp
a_string s1 = make_string();
print(s1.c_str());
```

`s1` is a real local object. It lives until the end of `main`, so this prints `1`.

---

```cpp
const char* s2 = make_string().c_str();
```

The temporary `a_string` lives until the end of this full-expression, meaning until the semicolon.

Then it is destroyed, setting `a` back to `0`.

So:

```cpp
print(s2); // 0
```

In real code, this is like storing `std::string(...).c_str()` → dangling pointer.

```cpp
print(make_string().c_str());
```

Here the temporary is a function argument.

It lives until the whole function call finishes, not just until `c_str()` returns.

So during `print(...)`, the temporary is still alive, and this prints `1`.

### Rule

Temporaries are destroyed at the end of the **full-expression**.

```cpp
const char* p = make_string().c_str();
// temporary dies here, at semicolon

print(make_string().c_str());
// temporary dies after print returns
```

> semicolon ends temporary lifetime  
> function argument temporary survives until function call ends
{: .prompt-warning }

## CppQuiz #226 — `mutable`, copy ctor, no implicit move

> `mutable`, copy constructor, move constructor, overload resolution, destructor count.

```cpp
struct X {
    X() { std::cout << "1"; }
    X(X &) { std::cout << "2"; }
    X(const X &) { std::cout << "3"; }
    X(X &&) { std::cout << "4"; }
    ~X() { std::cout << "5"; }
};

struct Y {
    mutable X x;
    Y() = default;
    Y(const Y &) = default;
};

Y y1;
Y y2 = std::move(y1);
```

**Mistake:**

I forgot three things:

1. `mutable` makes `x` non-const even through `const Y&`.
2. Declaring `Y(const Y&)` means `Y(Y&&)` is not implicitly declared.
3. Copying `x` creates another `X`, so two `X` objects are destroyed.

**Correct output:** `1255`

**Why:**

```cpp
Y y1;
```

default-constructs `y1.x`, so prints: `1`.

Then:

```cpp
Y y2 = std::move(y1);
```

does **not** move.

`std::move(y1)` makes `y1` an rvalue, but `Y` has no move constructor.

So it calls:

```cpp
Y(const Y&)
```

During memberwise copy, it copies:

```cpp
x
```

The parameter is `const Y&`, but `x` is `mutable`, so `other.x` is treated as non-const.

Therefore this overload wins:

```cpp
X(X&) // prints 2
```

not:

```cpp
X(const X&) // prints 3
```

At the end of `main`, both objects are destroyed:
* y2.x destroyed -> 5
* y1.x destroyed -> 5

So total: `1255`

### Rule

```cpp
mutable X x;
```

means `x` can be accessed as non-const even inside a `const Y&`.

```cpp
Y(const Y&) = default;
```

suppresses implicit move constructor generation.

So:

```cpp
std::move(y1)
```

does not guarantee moving. It only casts to rvalue. If no move constructor exists, copy constructor can still be called.

## CppQuiz #125 — static local variable in function template

> Function template specialization, static local variable.

```cpp
template <class T>
void f(T) {
  static int i = 0;
  std::cout << ++i;
}

f(1);
f(1.0);
f(1);
```

**Mistake:**

I thought there is only one `static int i`, so output is `123`.

**Correct output:** `112`

**Why:**

Each template specialization gets its own static local variable.

So C++ creates:

```cpp
f<int>     // has its own static i
f<double>  // has its own static i
```

Step by step:

```txt
f(1)   -> f<int>    -> int i becomes 1
f(1.0) -> f<double> -> double i becomes 1
f(1)   -> f<int>    -> int i becomes 2
```

> Each static local variable is unique to its function template specialization.
{: .prompt-warning }

## CppQuiz #148 — volatile read is a side effect

> `volatile`, unsequenced evaluation, side effect, undefined behavior.

```cpp
volatile int a;

int main() {
  std::cout << (a + a);
}
```

**Mistake:**

I thought `a` is zero-initialized, so `a + a` prints `0`.

**Correct:**

The program has **undefined behavior**.

**Why:**

`a` has static storage duration, so yes:

```cpp
a == 0
```

But the real issue is `volatile`.

Reading a `volatile` object is a **side effect**.

So in:

```cpp
a + a
```

there are two volatile reads of the same object.

For `+`, the left and right operands are **unsequenced** relative to each other.

So we have two unsequenced side effects on the same object → **UB**.

### Rule

```cpp
volatile int a;
a + a; // UB
```

because both reads are volatile side effects and are unsequenced.

### Safer version

```cpp
int x = a;
int y = a;
std::cout << x + y;
```

Now the volatile reads happen in separate full-expressions / statements, so they are sequenced.

### Mental model

```txt
normal int read     = just value computation
volatile int read   = side effect
```

`volatile` means “the read/write itself matters”, usually for memory-mapped I/O, signals, hardware-ish stuff.

It is **not** a thread-safety tool. Use atomics for that.

## CppQuiz #160 — virtual function + default argument

> Virtual dispatch, default arguments, static type vs dynamic type.

```cpp
struct A {
    virtual void foo(int a = 1) {
        std::cout << "A" << a;
    }
};

struct B : A {
    void foo(int a = 2) override {
        std::cout << "B" << a;
    }
};

A* b = new B;
b->foo();
```

**Mistake:**

I knew virtual dispatch calls `B::foo`, but I thought the default argument also comes from `B`.

**Correct output:** `B1`

**Why:**

```cpp
A* b = new B;
```

Inside:
* static type:  `A*`
* dynamic type: `B`

The function body is chosen by **dynamic type**, because `foo` is virtual: `B::foo(...)`

But the default argument is chosen by **static type**: `A* b`

So the default argument comes from:

```cpp
A::foo(int a = 1)
```

Therefore, `b->foo();` means:

```cpp
b->foo(1); // calls B::foo with a = 1
```

### Rule

* virtual function body -> dynamic type
* default argument      -> static type

> So avoid different default arguments in overridden virtual functions. It’s cursed.
{: .prompt-warning }

## CppQuiz #3 — floating to signed/unsigned overload ambiguity

> Overload resolution, floating-integral conversion, ambiguity.

```cpp
void f(int)      { std::cout << 1; }
void f(unsigned) { std::cout << 2; }

f(-2.5);
```

**Mistake:**

I thought `double -> unsigned` is not accepted, so it must call:

```cpp
f(int)
```

**Correct:**

The program is **ill-formed** because the overload call is ambiguous.

**Why:**

`-2.5` has type:

```cpp
double
```

Both overloads are viable:

```cpp
double -> int
double -> unsigned
```

Both are **floating-integral conversions**.

They have the same conversion rank, so neither overload is better.

Therefore:

```cpp
f(-2.5); // ambiguous
```

## CppQuiz #284 — `std::string::operator[]` at `size()`

> `std::string`, null terminator, `operator[]`, bounds.

```cpp
std::string out{"Hello world"};
std::cout << (out[out.size()] == '\0');
```

**Mistake:**

I might think:

```cpp
out[out.size()]
```

is out of bounds / UB.

**Correct output:** `1`

**Why:**

For `std::string`, `operator[]` is valid when:

```cpp
pos <= size()
```

If:

```cpp
pos == size()
```

it returns a reference to the null character:

```cpp
char{} // value 0
```

And:

```cpp
'\0'
```

also has value `0`.

So:

```cpp
out[out.size()] == '\0'
```

is true.

### Rule

```cpp
s[i]        // valid for i < s.size()
s[s.size()] // valid, gives '\0'
```

But do **not** modify it to anything except `'\0'`.

```cpp
s[s.size()] = 'x'; // UB
```

## CppQuiz #122 — `unsigned ll` typedef trap

> Typedef, declaration parsing, defining type specifier.

```cpp
typedef long long ll;

void foo(unsigned ll) { std::cout << "1"; }
void foo(unsigned long long) { std::cout << "2"; }

foo(2ull);
```

**Mistake:**

I thought `unsigned ll` means `unsigned long long`.

**Correct output:** `2`

**Exact rule:**

While parsing a `decl-specifier-seq`, if a type-name appears, it is treated as a type-name **only if there was no previous defining type specifier** in that same specifier sequence, except cv-qualifiers.

Here:

```cpp
unsigned ll
```

`unsigned` is already a defining type specifier and means `unsigned int`.

So `ll` is no longer parsed as the typedef name.
It is parsed as the parameter name.

Therefore:

```cpp
void foo(unsigned ll)
```

means:

```cpp
void foo(unsigned int ll)
```

not:

```cpp
void foo(unsigned long long)
```

So the overloads are:

```cpp
foo(unsigned int)        // prints 1
foo(unsigned long long)  // prints 2
```

`2ull` has type `unsigned long long`, so it calls the second overload.

### Rule to remember

```cpp
typedef long long ll;

unsigned ll; // unsigned int variable named ll
```

Typedef aliases are not macros. `unsigned` does not modify the alias.
