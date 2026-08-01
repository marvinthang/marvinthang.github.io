---
title: Lifetime Management in C++
date: 2026-07-14 00:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, c++, lifetime-management, memory-management, resource-management]
description: "Back to Basics: Lifetime Management in Cpp - Phil Nash - CppCon 2024"
---

Source: [Back to Basics: Lifetime Management - Phil Nash - CppCon 2024](https://youtu.be/aMvIv6blzBs?si=s4GIgCsX10zCWQPd)

## C++ is value-based by default

- **C++ is complex, mostly for historical reasons.**
- **C++ is a value-based language by default — but there are traps.**

The recurring advice is:

> **"Do as the ints do."**

> **"Adhere to the principle of least astonishment."**

> **"Recognize that anything somebody can do, they will do. They'll throw exceptions, they'll assign objects to themselves, they'll use objects before giving them values."**

> **"As a result, make your classes easy to use correctly and hard to use incorrectly."**

## Special member functions

The six **special member functions (SMFs)** discussed in the deck are:

```cpp
T();
T(T const&);
T(T&&);
T& operator=(T const&);
T& operator=(T&&);
~T();
```

1. **The compiler will generate special member functions for you.**
2. **Defining some special member functions may delete, disable, or suppress some others.**

A useful explicit summary of the interactions:

- A user-declared ctor prevents the compiler from implicitly declaring a default ctor.
- A user-declared dtor suppresses implicit move construction and move assignment.
- A user-declared copy ctor or copy-assignment operator suppresses implicit move operations.
- A user-declared move ctor or move-assignment operator causes implicit copy operations to be deleted.


## Default construction and initialization

### Default member initializer

```cpp
struct Gadget {
    int i = 0;
};
```

For custom ctor, if we use member initializer list, the default member initializer is ignored:

```cpp
struct Gadget {
    int i = 0;
    Gadget(int i) : i(i) {}
};
```

Then `Gadget gadget(42);` will set `gadget.i` to `42`, not `0`.

But if we don't specify a member initializer list, the default member initializer is used, even if we assign it in the body of the constructor:

```cpp
struct Gadget {
    int i = 0;
    Gadget(int i) {
        this->i = i;
    }
};
```

The default member initializer is used to initialize `i` to `0`, and then the assignment in the body of the constructor sets it to `42`.

```cpp
struct Gadget {
    int i = 0;

    Gadget() = default;
    Gadget(int i) : i(i) {}
};
```

Prefer `= default` when the compiler-generated behavior is exactly what is wanted.

## A resource-owning `Widget`

### Mixed member initialization

```cpp
struct Widget {
    std::string name;
    int age;
    Gadget* gadget;
};
```




### Deep-copy constructor

The compiler-generated copy constructor copies the raw address. Both objects believe they own the same allocation.

So when both objects are destroyed, the same address is deleted twice, causing undefined behavior.

To fix this, the copy constructor must allocate a new `Gadget` and copy the contents of the original:

```cpp
struct Widget {
    std::string name = "widget";
    int age;
    Gadget* gadget;

    Widget()
        : age(42),
          gadget(new Gadget()) {}

    Widget(Widget const& other)
        : name(other.name),
          age(other.age),
          gadget(new Gadget(*other.gadget)) {}

    ~Widget() {
        delete gadget;
    }
};
```

Now each `Widget` owns a distinct `Gadget` allocation.

### Copy assignment

Copy construction and copy assignment are separate operations:

```cpp
Widget copy = original; // copy construction
copy = original;        // copy assignment
```

Even after implementing a deep-copy constructor, the compiler-generated copy-assignment operator still shallow-copies the raw pointer.

### Copy assignment

> Remember for copy assignment, the old resource must be released before the new resource is acquired. Otherwise, the old resource is leaked.
{: .prompt-warning }

```cpp
Widget& operator=(Widget const& other) {
    name = other.name;
    age = other.age;

    delete gadget; // delete the old resource
    gadget = new Gadget(*other.gadget);

    return *this;
}
```

This fixes the leak, but it has weak exception safety:

- If `new Gadget(...)` throws after `delete gadget`, the object no longer owns a valid resource.
- The pointer still contains a stale address unless reset.
- Destruction after the exception may attempt to delete that stale address.

To avoid this, the new resource should be allocated first, and only after that succeeds should the old resource be released:

```cpp
Widget& operator=(Widget const& other) {
    name = other.name;
    age = other.age;

    Gadget* temp = new Gadget(*other.gadget);
    delete gadget;
    gadget = temp;

    return *this;
}
```

This creates overhead for an extra allocation, but it is exception-safe. If the allocation fails, the original object remains unchanged.

We should avoid self-assignment, which can cause a double delete, or extra allocation and copy. A simple check can be added:

```cpp
Widget& operator=(Widget const& other) {
    if (this != &other) {
        name = other.name;
        age = other.age;

        Gadget* temp = new Gadget(*other.gadget);
        delete gadget;
        gadget = temp;
    }

    return *this;
}
```

## The Rule of Three

If a class directly manages a resource and needs any one of the following, it usually needs all three:

1. Destructor
2. Copy constructor
3. Copy-assignment operator

Why these three travel together:

- The destructor defines how ownership is released.
- The copy constructor defines how ownership is established for a new object.
- Copy assignment defines how an existing owner is replaced safely.

## Copy-and-swap

```cpp
Widget& operator=(Widget const& other) {
    Widget temp(other);

    using std::swap;
    swap(name, temp.name);
    swap(age, temp.age);
    swap(gadget, temp.gadget);

    return *this;
}
```

How it works:

1. `Widget temp(other)` performs the potentially throwing deep copy.
2. If construction fails, `*this` is unchanged.
3. The members of `*this` and `temp` are swapped.
4. `temp` now owns the old state of `*this`.
5. When `temp` is destroyed, it deletes the old resource.

`using std::swap;` followed by unqualified `swap(...)` makes standard overloads available while allowing argument-dependent lookup to find a more specialized swap for user-defined member types.

Copy-and-swap naturally handles self-assignment correctly, but it may be less efficient than a direct implementation because it requires an extra allocation and copy.

## Move construction

### `std::move` does not itself move anything

With only a copy constructor available:

```cpp
Widget widget;
Widget widget2 = std::move(widget);
```

The rvalue binds to `Widget const&`, so the copy constructor is called.

### Implementation

> We have to release the old resource from the moved-from object and transfer ownership to the new object.
{: .prompt-warning }

```cpp
Widget(Widget&& other)
    : name(std::move(other.name)),
      age(other.age),
      gadget(other.gadget) {
    other.gadget = nullptr;
}
```

Only the destination owns the allocation. Deleting `nullptr` in the moved-from object is safe.

### Use `std::exchange` and `noexcept`

The transfer can be written more directly:

```cpp
Widget(Widget&& other) noexcept
    : name(std::move(other.name)),
      age(other.age),
      gadget(std::exchange(other.gadget, nullptr)) {}
```

This matters because standard containers often prefer copying over moving during reallocation unless moving is known not to throw.

## Move assignment

If no move-assignment operator exists, copy assignment taking `Widget const&` can still accept the rvalue.
The operation performs a deep copy instead of transferring the allocation.

### Implementation

```cpp
Widget& operator=(Widget&& other) noexcept {
    name = std::move(other.name);
    age = other.age;
    gadget = std::exchange(other.gadget, nullptr);
    return *this;
}
```

There is an issue here, because the old resource is not released before the new resource is acquired. If `std::move(other.name)` throws, the old resource is leaked.

A resource-safe completion is:

```cpp
Widget& operator=(Widget&& other) noexcept {
    if (this != &other) {
        delete gadget;

        name = std::move(other.name);
        age = other.age;
        gadget = std::exchange(other.gadget, nullptr);
    }

    return *this;
}
```

An alternative is move-and-swap:

```cpp
Widget& operator=(Widget&& other) noexcept {
    using std::swap;
    swap(name, other.name);
    swap(age, other.age);
    swap(gadget, other.gadget);
    return *this;
}
```

The exact desired moved-from state is a design choice, but both objects must remain valid and every owned resource must still have exactly one owner.

## The Rule of Five

Once move semantics are considered, a directly resource-managing class may need all five operations:

```cpp
struct Widget {
    Widget();

    Widget(Widget const& other);
    Widget(Widget&& other) noexcept;

    Widget& operator=(Widget const& other);
    Widget& operator=(Widget&& other) noexcept;

    ~Widget();
};
```

The Rule of Five is an extension of the Rule of Three for types that explicitly manage ownership and also support efficient transfer.

## Moved-from objects

### Value-only type

```cpp
struct Widget {
    std::string name = "widget";
    int age = 42;
};
```

- The moved-to `std::string` receives the text.
- In this implementation/run, the moved-from string becomes empty.
- `int age` remains `42` because moving an `int` copies it.
- The C++ guarantee is only that a moved-from standard-library object remains **valid but in an unspecified state** unless a stronger guarantee is documented.

A moved-from object may be destroyed, assigned to, or otherwise used in operations that do not require a particular value.

## `std::unique_ptr` and the Rule of Zero

Replace the owning raw pointer with an ownership-managing value type:

```cpp
struct Widget {
    std::string name = "widget";
    int age = 42;
    std::unique_ptr<Gadget> gadget = std::make_unique<Gadget>();
};
```

What `std::unique_ptr` provides:

- Exclusive ownership.
- Automatic destruction.
- Move construction and move assignment transfer ownership.
- The moved-from `unique_ptr` becomes null.
- Copy construction and copy assignment are disabled.
- No custom destructor, move constructor, or move-assignment operator is needed in `Widget`.

This leads to the preferred rule.

## The Rule of Zero

```cpp
struct Widget {
    // only value types or managers
};
```

> **Always strive to have the compiler-generated special member functions do the right thing.**
{ .prompt-tip }

Use members such as:

- `std::string`
- `std::vector`
- `std::unique_ptr`
- `std::shared_ptr` when shared ownership is genuinely required
- Other RAII resource wrappers

Then the containing class can usually rely on compiler-generated lifetime operations.

## Beyond Three, Five, and Zero

<https://www.sonarsource.com/blog/beyond-the-rules-of-three-five-and-zero/>

| Category                 | When to use                                                                           | Rule(s)                                                | Special members shown                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Value types              | Simple direct values                                                                  | Rule of Zero                                           | None required                                                                           |
| Views                    | Non-owning managers                                                                   | Rule of Zero                                           | None required                                                                           |
| Polymorphic base classes | Classic OO hierarchies                                                                | Rule of Five with disabled copy and move (`DesDeMovA`) | `virtual ~T() = default`; deleted `operator=(T&&)` as the minimal suppression technique |
| Scoped managers          | Short-lived, on the stack                                                             | Rule of Five with disabled copy and move (`DesDeMovA`) | `~T()`; deleted `operator=(T&&)`                                                        |
| Unique managers          | Single ownership; can be stored; expensive or nonsensical to copy                     | Rule of Five with disabled copy                        | `~T()`; `T(T&&)`; `operator=(T&&)`                                                      |
| General managers         | Impart value semantics to managed resources, with full copying of independent objects | Rule of Five                                           | `~T()`; `T(T const&)`; `T(T&&)`; `operator=(T const&)`; `operator=(T&&)`                |

### `DesDeMovA` idea

The table's mnemonic refers to a minimal combination along the lines of:

- **Des**tructor declaration, plus
- **De**leted **Mov**e **A**ssignment.

Why this can disable all copying and moving:

- A user-declared destructor suppresses implicit move operations.
- A user-declared move-assignment operator causes implicit copy operations to be deleted.
- Declaring that move assignment itself as deleted prevents it from being used.

For a polymorphic base class, the destructor should normally be virtual:

```cpp
struct Base {
    virtual ~Base() = default;
    Base& operator=(Base&&) = delete;
};
```

The exact set of constructors and access controls still depends on the intended abstraction.
