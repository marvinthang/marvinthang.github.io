---
title: The C++ Core Guidelines
date: 2026-05-13 00:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, c++, core guidelines, cppcoreguidelines, guidelines]
description: "Back to Basics: The C++ Core Guidelines - Rainer Grimm - CppCon 2022"

math: true
---

Source: [Back to Basics: The C++ Core Guidelines - Rainer Grimm - CppCon 2022](https://youtu.be/UONLB7wBVSc?si=9XfB-xA4QzyF98xw)

## Why Guidelines Matter

C++ is a powerful language, but it is also a complex language used in complex domains.

That creates a problem: even if a program compiles, it does not mean the design is safe, clear, or maintainable.

Guidelines help us write C++ in a more disciplined way. They are especially important because:

* C++ has many language features, and many ways to express the same idea.
* A new C++ standard is published roughly every three years.
* C++ is often used in safety-critical domains.
* Small mistakes in ownership, lifetime, or type usage can become serious bugs.

So guidelines are not just about style.  
They help us make code easier to understand, harder to misuse, and safer to maintain.

The main idea is simple:
Reflect on your coding habits.
{: .prompt-tip }

## What the C++ Core Guidelines Cover

There are several well-known C++ guideline sets.

For example:

* **MISRA C++**
  * Used heavily in automotive, avionic, and medical domains.
  * Published for C++03 in 2008.

* **AUTOSAR C++14**
  * Based on C++14.
  * Used more and more in the automotive domain.

* **C++ Core Guidelines**
  * Community-driven.
  * Broader and more general-purpose.

The C++ Core Guidelines are large.  
They contain hundreds of rules, and each rule usually follows a similar structure:

* rule
* reference number
* reason
* examples
* alternatives
* exceptions
* enforcement
* notes
* discussion

The guidelines are organized into many topics:

* philosophy
* interfaces
* functions
* classes
* enumerations
* resource management
* expressions and statements
* performance
* concurrency
* error handling
* constants
* templates
* standard library
* Guidelines Support Library

So this post is not about memorizing every rule.  
It is about understanding the main direction: write C++ code that expresses intent clearly and avoids common traps.

## Philosophy: Express Intent Clearly

The philosophy section contains the metarules behind the more concrete rules.

The first idea is to **express intent directly in code**.

Code should say what it means.  
If a value represents a point, use a `Point`.  
If a function takes ownership, use a type that shows ownership.  
If something should not change, make it `const`.

Another idea is to write standard C++ and use supporting tools and libraries.

That means we should prefer normal ISO C++ facilities instead of relying on messy low-level tricks when there is a clearer standard alternative.

A program should also be as statically type-safe as possible.

If the compiler can catch a mistake, let it catch the mistake.  
When static checking is not enough, runtime errors should be caught early.

The guidelines also emphasize not wasting resources such as time and space.  
This does not mean blindly optimizing everything.  
It means avoiding unnecessary work and choosing designs that do not create avoidable overhead.

Finally, messy constructs should be hidden behind stable interfaces.

Sometimes low-level code is necessary.  
But the rest of the program should not have to deal with that mess directly.

So the philosophy is basically:

* make intent visible
* use the type system
* prefer standard tools
* avoid waste
* isolate unsafe or messy details

## Interfaces: Make Misuse Hard

An interface should make the intended usage clear.

A bad interface may still work, but it makes the caller guess what the arguments mean.

```c++
void showRectangle(double a, double b, double c, double d);
```

This function is hard to read from the call site.

```c++
showRectangle(0, 0, 100, 50);
```

Are these values:

* left, top, right, bottom?
* x, y, width, height?
* top-left and bottom-right coordinates?

The types do not help us.
All four arguments are just `double`, so accidentally swapping them still compiles.

A better interface uses stronger types:

```c++
struct Point {
    double x;
    double y;
};

void showRectangle(Point top_left, Point bottom_right);
```

Now the call site expresses the meaning more directly:

```c++
showRectangle(Point{0, 0}, Point{100, 50});
```

This is better because:

* the arguments are explicit
* the number of arguments is smaller
* similar values are grouped together
* the type system carries more meaning

The guideline here is not just “use structs everywhere”.
The point is to avoid APIs where several similar arguments can be passed in the wrong order without the compiler noticing.

Interfaces should be designed so that correct code is natural, and incorrect code is harder to write.

## Functions: Parameter Passing and Ownership

Function parameters should show how the function uses the argument.

The Core Guidelines distinguish between:

* **in**: the function only reads the value
* **in/out**: the function reads and modifies the value
* **out**: the function produces a value
* **consume / move from**: the function takes the value and may leave the original object moved-from

### Input Parameters

For small or cheap-to-copy types, pass by value.

```c++
void print(Point p);
void setWidth(int width);
```

This is simple and safe.
The function gets its own value.

For expensive-to-copy types, pass by `const&` if the function only reads.

```c++
void print(std::string const& name);
void draw(std::vector<Point> const& points);
```

This avoids copying while still preventing the function from modifying the argument.

If the function wants to keep its own copy, pass by value and move into storage.

```c++
class User {
public:
    void setName(std::string n) {
        name = std::move(n);
    }

private:
    std::string name;
};
```

This works well because:

* if the caller passes an lvalue, `n` is copied, then moved into `name`
* if the caller passes an rvalue, `n` is moved, then moved into `name`

So the interface stays simple, and the implementation can still use move semantics.

### Move-from Parameters

If a function explicitly wants to consume an object, use `X&&`.

```c++
void consume(std::string&& s);
```

This tells the caller that the function may move from the argument.

```c++
std::string s = "hello";
consume(std::move(s));
```

After this call, `s` is still valid, but we should not rely on its old value.

### In/Out Parameters

If the function needs to read and modify an existing object, use a non-const reference.

```c++
void normalize(std::vector<double>& values);
```

This makes the mutation visible at the call site:

```c++
normalize(values);
```

The function is not just reading `values`; it may change it.

### Output Parameters

For output, prefer returning a value.

```c++
std::string makeName();
```

This is usually clearer than:

```c++
void makeName(std::string& out);
```

Returning by value is normally efficient in modern C++ because of copy elision and move semantics.

Use output references only when there is a strong reason, such as:

* the object is extremely expensive or impossible to move
* the function needs to produce multiple outputs
* the API must reuse an existing object

### Ownership Semantics

Function parameter types should also communicate ownership.

```c++
void f(T value);                 // independent object
void f(T* ptr);                  // borrowed object, maybe nullable
void f(T& ref);                  // borrowed object, not null
void f(std::unique_ptr<T> ptr);  // takes ownership
void f(std::shared_ptr<T> ptr);  // shares ownership
```

So the parameter type is part of the documentation.

If a function takes `std::unique_ptr<T>` by value, it is saying: "I am taking ownership."

If a function takes `T&`, it is saying: "I am borrowing this object, and it must already exist."

The goal is to make ownership and mutation visible from the function signature.

> Use `T&` when the function requires a valid object and does not take ownership.  
> Use `T*` when the argument is optional, can be `nullptr`, or pointer-like semantics are important.
{: .prompt-tip }

## Classes: Invariants, Regular Types, and the Big Six

Classes are used to group data and behavior together.

A useful distinction is:

* use `struct` for simple data aggregates
* use `class` when the type has an invariant

An **invariant** is a condition that should always be true for a valid object.

```c++
struct Point {
    int x;
    int y;
};
```

`Point` is just two coordinates.
There is no strong rule that the constructor must protect.

But consider a date:

```c++
class Date {
public:
    Date(int yy, Month mm, char dd);

private:
    int y;
    Month m;
    char d;
};
```

A `Date` has rules:

* the month should be valid
* the day should be valid for that month
* the object should not represent nonsense like February 31

So `Date` should use a constructor to establish the invariant.

### Concrete Types

A **concrete type** is a normal value type.
It is not mainly used through a base class pointer or a class hierarchy.

Examples:

```c++
std::string
std::vector<int>
Point
Date
```

A concrete type should usually behave like a regular value.

That means it should support the usual operations consistently:

```c++
X();                  // default constructor
X(X const&);          // copy constructor
X& operator=(X const&); // copy assignment

X(X&&);               // move constructor
X& operator=(X&&);    // move assignment

~X();                 // destructor
swap(X&, X&);         // swap
operator==(X const&); // equality
```

The important idea is not that every type must manually define all of these.
The point is that if the type behaves like a value, its operations should make sense together.

### The Big Six

The “Big Six” are:

* default constructor
* copy constructor
* copy assignment
* move constructor
* move assignment
* destructor

The compiler can generate these automatically.

Sometimes we can explicitly request that with `= default`:

```c++
struct Widget {
    Widget() = default;
};
```

Sometimes we can forbid an operation with `= delete`:

```c++
struct UniqueHandle {
    UniqueHandle(UniqueHandle const&) = delete;
    UniqueHandle& operator=(UniqueHandle const&) = delete;
};
```

This is useful for resource-owning types where copying would be unsafe.

### Rule of Zero / Rule of Six

Special member functions are connected.

If a class owns a resource manually, then copy, move, and destruction usually affect each other.

So the guideline is:

* define none of them, if the compiler-generated behavior is correct
* define all relevant ones, if the type needs custom ownership behavior

This is the idea behind the **rule of zero** and **rule of six**.

The best case is usually rule of zero:

```c++
class User {
public:
    explicit User(std::string name)
        : name_(std::move(name)) {}

private:
    std::string name_;
};
```

Here `std::string` already manages its own resource.
So `User` does not need to write a destructor, copy constructor, move constructor, or assignments.

The class can let the compiler generate the right behavior.

If you manually manage a raw resource, then you must be much more careful:

```c++
class Buffer {
public:
    Buffer(std::size_t n)
        : size_(n), data_(new int[n]) {}

    ~Buffer() {
        delete[] data_;
    }

private:
    std::size_t size_;
    int* data_;
};
```

This destructor is not enough.
The compiler-generated copy operation would copy only the pointer, so two `Buffer` objects could try to delete the same array.

That is why manual resource management usually forces us to think about all special member functions together.

> Prefer storing resources in RAII members like `std::string`, `std::vector`, and `std::unique_ptr`.
> Then your class can often follow the rule of zero.
{: .prompt-tip }

## Classes: Constructors, Conversions, and Destructors

Constructors should establish the default behavior of an object clearly.

If a default constructor only initializes data members, prefer member initializers in the class body.

```c++
struct Widget {
    Widget() = default;

    explicit Widget(int w)
        : width(w) {}

private:
    int width = 640;
};
```

Here, `width = 640` describes the normal default state of the object directly where the data member is declared.

The constructor `Widget(int)` is only for a variation of that default behavior.

This keeps the class easier to read because the default value is not hidden inside a constructor body.

### Explicit Conversions

**Single-argument** constructors can accidentally become implicit conversions.

```c++
class B {};

class MyClass {
public:
    MyClass(int x);
    operator B() const;
};

void f(MyClass x);
void g(B b);

f(42); // allowed if constructor is not explicit
g(42); // allowed if conversion operator is not explicit
```

This may be surprising because `42` is an `int`, but the compiler is allowed to silently create a `MyClass` from it, and then convert that to `B` if needed.

Usually, this should be avoided.

```c++
class MyClass {
public:
    explicit MyClass(int x);
    explicit operator B() const;
};
```

Now the conversion must be written clearly:

```c++
f(MyClass{42});
g(static_cast<B>(MyClass{42})); // or g(B(MyClass(42)));
```

The goal is to avoid hidden conversions that make overload resolution or function calls harder to understand.

> Make **single-argument** constructors and conversion operators `explicit` unless implicit conversion is really part of the type’s intended meaning.
{: .prompt-tip }

### Destructors

A destructor is needed when a class must perform an action when the object dies.

For example:

* release memory
* close a file
* unlock a mutex
* return a handle
* stop or join a thread

But if the class only contains members that already clean themselves up, we usually do not need to write a destructor.

```c++
class User {
private:
    std::string name;
    std::vector<int> scores;
};
```

`std::string` and `std::vector` already manage their resources, so the compiler-generated destructor is enough.

For base classes, destructor design is important.

A base class destructor should usually be one of these:

```c++
class Base {
public:
    virtual ~Base() = default;
};
```

or:

```c++
class Base {
protected:
    ~Base() = default;
};
```

Use a **public virtual destructor** when objects may be deleted through a base pointer.

```c++
Base* p = new Derived;
delete p; // needs virtual destructor
```

Without a virtual destructor, deleting a derived object through a base pointer can fail to destroy the derived part correctly.

Use a **protected non-virtual destructor** when deleting through the base pointer should not be allowed.

```c++
class Base {
protected:
    ~Base() = default;
};
```

Now users cannot write:

```c++
Base* p = getDerived();
delete p; // not allowed
```

This prevents unsafe deletion through the base interface.

> When you delete a `Derived`, C++ runs the destructor of `Derived`, then the destructor of `Base`.
{: .prompt-tip }

### Destructors Should Not Fail

Destructors should not let exceptions escape.

A destructor often runs during cleanup, including stack unwinding after another exception.
If another exception escapes from a destructor at that time, the program may terminate.

So destructors should be `noexcept` in practice.

```c++
class File {
public:
    ~File() noexcept {
        close();
    }

private:
    void close() noexcept;
};
```

If cleanup can fail, the failure should usually be handled before destruction, or stored/logged in a way that does not throw from the destructor.

The destructor’s job is cleanup.
It should not create a second failure path during cleanup.

## Enumerations: Prefer `enum class`

Enumerations are used to represent a fixed set of related named constants.

```c++
enum class Day : char {
    mon,
    tue,
    wed,
    thu,
    fri,
    sat,
    sun
};
```

This is better than using plain integers.

```c++
int day = 3;
```

The value `3` does not explain itself.
But `Day::wed` carries meaning directly in the code.

### Plain `enum`

Old-style enums are weaker because the enumerators leak into the surrounding scope and can implicitly convert to integers.

```c++
enum Color {
    red,
    green,
    blue
};

int x = red; // allowed
```

This can be convenient, but it also makes the type less safe.

For example, different enums can accidentally mix with integers more easily than intended.

### enum class

Prefer scoped enums:

```c++
enum class Color {
    red,
    green,
    blue
};
```

Now the names are scoped:

```c++
Color c = Color::red;
```

And the enum does not implicitly behave like an `int`.

```c++
int x = Color::red; // error
```

This makes the type stronger.

If we really want the integer value, we must say so explicitly:

```c++
int x = static_cast<int>(Color::red);
```

### Underlying Type

We can specify the underlying integer type when needed.

```c++
enum class Day : char {
    jan = 1,
    feb,
    mar
};
```

This can be useful when:

* memory layout matters
* binary format matters
* interoperability with other APIs matters

But in normal code, we usually do not need to manually specify every value.

```c++
enum class Direction {
    up,
    down,
    left,
    right
};
```

The compiler can assign the values automatically.

### Main Rule

Use enumerations when a value must be one of a fixed set of named options.

Use `enum class` by default because it gives better scope and stronger type safety.

```c++
enum class Permission {
    read,
    write,
    execute
};
```

This is clearer and safer than passing raw integers or unrelated constants around.

## Resource Management: RAII

RAII stands for **Resource Acquisition Is Initialization**.

The core idea is:

* acquire a resource in a constructor
* release it in a destructor
* let object lifetime manage cleanup

So instead of writing manual acquire/release pairs:

```c++
m.lock();
// ...
m.unlock();
```

we use a guard object:

```c++
std::lock_guard lock(m);
// ...
```

When `lock` goes out of scope, the mutex is unlocked automatically.

This pattern is used throughout the standard library:

* `std::vector` manages dynamic memory
* `std::unique_ptr` manages owned heap objects
* `std::lock_guard` manages mutex locks
* `std::jthread` manages threads
* `std::fstream` manages files

The guideline is simple: avoid manual resource management when an RAII type can own the resource for you.

> If cleanup must always happen, put it in a destructor.
{: .prompt-tip }

## Expressions and Statements: Names and Arithmetic

Small code choices can still create large bugs.

Two simple examples are:

* bad names
* mixed signed and unsigned arithmetic

### Good Names

Good names are one of the most important parts of readable code.

A name should explain what the thing means.

```c++
int d;      // unclear
int days;   // better
```

The shorter the scope, the shorter the name can be.

```c++
for (int i = 0; i < n; ++i) {
    // i is fine here
}
```

But for a value used across a larger scope, a clearer name is better.

```c++
int remainingDays;
```

Avoid reusing the same name in nested scopes.

```c++
int count = 0;

for (...) {
    int count = 10; // confusing
}
```

Also avoid names that look almost the same.

```c++
if (i1 && l1 && ol && o1 && o0 && I0 && l0) {
    surprise();
}
```

This technically compiles, but nobody wants to debug this.

### Arithmetic

Be careful when mixing signed and unsigned numbers.

```c++
int x = -3;
unsigned int y = 7;

std::cout << x - y << '\n'; // 4294967286
std::cout << x + y << '\n'; // 4
std::cout << x * y << '\n'; // 4294967275
std::cout << x / y << '\n'; // 613566756
```

This does not behave like normal “math intuition”.

Because `y` is unsigned, `x` may be converted to an unsigned value before the operation.
So `-3` can become a very large unsigned number.

That means expressions like this can produce surprising results:

```c++
x - y
x + y
x * y
x / y
```

The guideline is simple: avoid mixing signed and unsigned arithmetic unless you really know what conversion will happen.

In normal code, prefer using one consistent integer type for related values.

```c++
int size = static_cast<int>(v.size());
```

or keep the whole expression unsigned only when negative values are impossible and the logic is actually unsigned.

> The dangerous part is not that unsigned exists.
> The dangerous part is accidentally forcing signed values into unsigned arithmetic.
{: .prompt-warning }

## Performance: Measure First, Then Optimize

Performance work should start with measurement, not guesses.

The famous warning is:

> “Premature optimization is the root of all evil.”  
> — Donald Knuth
{: .prompt-info }

This does not mean performance is unimportant.  
It means optimizing the wrong thing wastes time and can make the code worse.

Before optimizing, we should know:

* which part of the program is the bottleneck
* how fast the program needs to be
* how fast the program could realistically become

Use real-world data when measuring.  
A benchmark on fake input may optimize the wrong behavior.

Performance tests should also be versioned, just like normal code.  
Otherwise, it is hard to know whether a change made the program faster, slower, or just different.

### Enable Optimization

After measuring, write code that lets the compiler help.

Useful habits include:

* use move semantics when appropriate
* use `constexpr` when possible
* rely on the optimizer
* keep code local
* keep code simple
* give useful hints such as `noexcept` and `final`

The main point is not to micro-optimize every line.

The better rule is:

> Write simple code first. Measure. Then optimize the part that actually matters.
{: .prompt-tip }

## Concurrency: Prefer Safer Tools

Concurrent code is hard to reason about, so prefer tools that reduce lifetime and ownership mistakes.

For threads, prefer `std::jthread` over `std::thread`.

```c++
std::jthread worker([] {
    doWork();
});
```

`std::jthread` is RAII-friendly: when the object is destroyed, it requests stop and joins the thread automatically.

This is safer than manually managing a `std::thread`.

```c++
std::thread worker([] {
    doWork();
});

worker.join();
```

If we forget to `join()`, the program can terminate.
If we call `detach()`, the thread may keep running after the objects it uses are already gone.

So another guideline is:

```c++
worker.detach(); // avoid
```

Detached threads make lifetime harder to control.

### Passing Data Between Threads

Prefer passing small amounts of data by value.

```c++
std::jthread worker([id = userId] {
    process(id);
});
```

Now the thread owns its own copy of `id`.
It does not depend on some outside variable staying alive.

If multiple unrelated threads need shared ownership of the same object, use `std::shared_ptr`.

```c++
auto data = std::make_shared<Data>();

std::jthread worker([data] {
    use(data);
});
```

This makes the lifetime explicit: the object stays alive while at least one `shared_ptr` still owns it.

### Validate Concurrent Code

Concurrent bugs are often timing-dependent, so normal testing may miss them.

Use tools when possible:

* **ThreadSanitizer** for detecting data races at runtime
* **CppMem** for exploring small memory-model examples

For ThreadSanitizer, compile with:

```bash
-fsanitize=thread -g
```

These tools do not make concurrent code automatically correct, but they can catch bugs that are very hard to find manually.

> In concurrent code, lifetime and ownership bugs are amplified. Prefer RAII, avoid detached threads, and use tools to validate assumptions.
{: .prompt-tip }

## Error Handling

Error handling is not only about detecting that something went wrong.

A good error-handling strategy should do four things:

* detect the error
* transmit information about the error to some handler code
* preserve the valid state of the program
* avoid resource leaks

For example, opening a file can fail.

```c++
std::ifstream file("input.txt");

if (!file) {
    // handle the error
}
```

The important part is that the program should still remain in a valid state.

This is why error handling connects strongly with RAII.
If an error causes an early return or an exception, resources should still be cleaned up automatically.

```c++
void f() {
    std::fstream file("data.txt");

    if (!file) {
        return;
    }

    // use file
}
```

Even if the function returns early, `file` is destroyed normally, so the file handle is released.

The guideline is:

> When an error happens, the program should either recover cleanly or stop safely, without leaking resources or leaving objects half-broken.
{: .prompt-tip }

## Constants and Immutability

By default, prefer making objects immutable when they do not need to change.

```c++
const int maxRetries = 3;
```

This makes the intent clear: `maxRetries` is a fixed value.

Immutability also helps with correctness.
If an object cannot change, it cannot be accidentally modified later.

This is especially useful in concurrent code because immutable objects cannot be victims of data races.

### Physical vs Logical Constness

There are two kinds of constness:

* **physical constness**
* **logical constness**

Physical constness means the object is actually not changed.

```c++
struct Point {
    int x;
    int y;
};

void print(Point const& p) {
    // p.x = 1; // error
}
```

The object is `const`, so its data members cannot be modified.

Logical constness means the object behaves as if it does not change from the user’s point of view, even if some internal implementation detail changes.

For example, a class may cache a computed value:

```c++
class Shape {
public:
    double area() const {
        if (!cached) {
            cachedArea = computeArea();
            cached = true;
        }

        return cachedArea;
    }

private:
    double computeArea() const;

    mutable bool cached = false;
    mutable double cachedArea = 0.0;
};
```

Calling `area()` does not logically change the shape.
It only updates an internal cache.

That is why `mutable` can be used for implementation details that do not affect the logical value of the object.

### Do Not Modify Original Const Objects

Be very careful with `const_cast`.

```c++
const int x = 42;
int& y = const_cast<int&>(x);
y = 10; // undefined behavior
```

Casting away `const` from an object that was originally const, then modifying it, is undefined behavior.

`const_cast` can only be safe when the original object was not actually const.

```c++
int x = 42;
const int& cx = x;

int& y = const_cast<int&>(cx);
y = 10; // OK, original object was non-const
```

The guideline is simple:

> Use `const` to express values that should not change.
> Do not use `const_cast` to fight the type system.
{: .prompt-warning }

## Templates and Generic Programming

Templates are used when the same idea works for many different types.

For example, sorting does not fundamentally depend on whether the elements are `int`, `double`, or `std::string`.

```c++
template <typename T>
T maxValue(T a, T b) {
    return b < a ? a : b;
}
```

The function describes one generic algorithm, and the compiler generates the needed version for the concrete type.

### Use Function Objects for Custom Operations

Generic code often needs customizable behavior.

Instead of hardcoding one operation, we can pass the operation in.

```c++
std::sort(v.begin(), v.end(), [](auto const& a, auto const& b) {
    return a.score < b.score;
});
```

The lambda tells the algorithm how to compare the elements.

This keeps the algorithm generic while still allowing the caller to customize the behavior.

### Let the Compiler Deduce Template Arguments

Usually, we should let the compiler deduce template arguments.

```c++
auto x = maxValue(3, 5);
```

instead of writing:

```c++
auto x = maxValue<int>(3, 5);
```

Explicit template arguments are useful sometimes, but if deduction already works, the shorter version is clearer.

### Regular Types

Template arguments should usually behave like normal values.

That means the type should at least be **SemiRegular** or **Regular**.

Roughly:

* SemiRegular: can be copied, moved, destroyed, and default-constructed
* Regular: SemiRegular + equality comparison

This matters because many generic algorithms assume values can be copied, moved, assigned, or compared in predictable ways.

For example, a type used in standard containers should behave like a normal value unless the container is specifically designed for move-only objects.

The guideline is simple:

> Use templates when the same algorithm works for many types.
> Keep the required operations clear, and let the compiler check them.
{: .prompt-tip }

## The Standard Library: Prefer `std::array` and `std::vector`

For sequence containers, prefer `std::array` and `std::vector` over C-style arrays.

Use `std::array` when the size is known at compile time and small.

```c++
std::array<int, 4> values = {1, 2, 3, 4};
```

Use `std::vector` when the size is not known at compile time, or when the data may be large.

```c++
std::vector<int> values(n);
```

Both containers are usually better defaults than raw arrays because they:

* know their own size
* manage memory automatically
* work well with standard algorithms
* provide `.at()` for checked access
* have contiguous memory layout

For example:

```c++
std::vector<int> v = {1, 2, 3};

std::cout << v.size() << '\n';
std::cout << v.at(1) << '\n';
```

A raw array does not carry its size with it:

```c++
int a[3] = {1, 2, 3};
```

Once passed to a function, it can easily decay into a pointer, losing size information.

```c++
void f(int* p); // size is gone
```

With `std::array` or `std::vector`, the type keeps more information.

```c++
void f(std::vector<int> const& v);
void g(std::array<int, 3> const& a);
```

So the guideline is simple:

> Use `std::array` for small fixed-size sequences.  
> Use `std::vector` for dynamic-size sequences.  
> Avoid raw arrays unless there is a specific low-level reason.  
{: .prompt-tip }

## Further Information

The C++ Core Guidelines are large, so this post only gives a high-level overview.

For deeper reading, useful resources include:

* [C++ Core Guidelines Explained](https://www.modernescpp.com/index.php/c-core-guidelines-explained-best-practices-for-modern-c/)  
  A book by Rainer Grimm that explains selected Core Guidelines with examples.

* [Beautiful C++](https://www.oreilly.com/library/view/beautiful-c-30/9780137647767/)  
  A book by Guy Davidson and Kate Gregory covering 30 important Core Guidelines.

* [Modernes C++ Blog](https://www.modernescpp.com/)  
  Rainer Grimm’s blog, with many posts about modern C++ and Core Guidelines.

* [Modernes C++ Training / Courses](https://www.modernescpp.com/index.php/my-courses/)  
  Training material and courses around modern C++.

* [Modernes C++ Mentoring](https://www.modernescpp.org/modern-c-mentoring/)  
  A mentoring program for learning modern C++ in a structured way.

The main point is not to memorize every rule immediately.  
The goal is to build better habits:

* express intent clearly
* use stronger types
* manage resources with RAII
* prefer simple and local code
* measure before optimizing
* use tools for concurrency and safety
