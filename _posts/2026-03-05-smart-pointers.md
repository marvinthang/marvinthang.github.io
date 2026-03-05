---
title: Smart Pointers in C++
date: 2026-03-05 08:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, smart-pointers, c++, pointer, pointers]
description: Back to Basics. Declarations in C++ - Ben Saks - CppCon 2022
math: true
---
Source: [Back to Basics: C++ Smart Pointers - David Olsen - CppCon 2022](https://youtu.be/YokY6HzLkXs?si=lcCo9b8KTw_EFfqp)

## Raw Pointers

Raw pointers have too many uses. They can be used for:

### Single object vs. array

- Single: allocate with `new`, free with `delete`
- Array: allocate with `new[]`, free with `delete[]`


- Single: **don't** use `++p`, `--p`, or `p[n]`
- Array: can use `++p`, `--p`, and `p[n]`

### Ownership

- Owner must free the memory when done
- Non-owner must **never** free the memory

### Nullability

- Some pointers can **never** be null (e.g. `this` pointer)
- Some pointers can be null (e.g. optional pointer parameters)

It would be nice if the type system helped enforce that/
Unfortunately, the type system doesn’t help.
`T*` can be used for **all combinations** of those characteristics.

## Smart Pointers

Behaves like a pointer (... at least one of the roles of a pointer):
- Points to an object
- Can be dereferenced with `*` and `->`

Adds additional **smart** semantics to (often) limit behavior to certain of a pointer’s possible roles

**Smart** can be almost anything:
- Automatic release resources (most common)
- Enforce restrictions (e.g. non-null)
- Extra safety checks (e.g. bounds checking)

Sometimes the **smarts** are only in the name:
- `gsl::owner<T>` is just a typedef of `T*`;  it only has meaning for those reading the code

## Should I use raw pointers?

- Use raw pointer for **non-owning** pointer to an object (but use a smart pointer for all **owning pointers** instead)
- Use a span type in place of **non-owning pointers to arrays**: C++20 `std::span`, or `gsl::span`

## UNIQUE_PTR

- Owns memory
- Assumes it is the only owner
- Automatically destroys the object and deletes the memory
- Move-only type
- Defined in header `<memory>`
- One required template parameter, which is the pointed-to type

```c++
template <typename T>
struct unique_ptr {
    // ...
    using element_type = T;
    using pointer = T*;
    // ...
};
```

### Basic usage

#### Function

```c++
void calculate_more(HelperType&);
ResultType do_work(InputType inputs) {
    // create unique_ptr with newly allocated memory
    std::unique_ptr<HelperType> owner{new HelperType(inputs)}; 
    owner->calculate(); // dereference with `->`
    calculate_more(*owner); // dereference with `*`
    return owner->important_result(); // dereference with `->`
    // delete happens automatically when `owner` goes out of scope
}
```

#### Class

```c++
WidgetBase* create_widget(InputType);

class MyClass {
    std::unique_ptr<WidgetBase> owner;
public:
    MyClass(InputType inputs)
        : owner(create_widget(inputs)) { }
    ~MyClass() = default; 
    // delete happens automatically when MyClass object goes out of scope

    // ... member functions that use owner-> ...
};
```

#### RAII

Very useful for implementing RAII, See See "Back to Basics: RAII" by Andre Kostur


### Move-only type
`unique_ptr` is a move-only type, which means it can be moved but not copied.
- No copy constructor or copy assignment operator
- Unique ownership can’t be copied
- "Back to Basics: Move Semantics", David Olsen, CppCon 2020

### Sample Implementation

```c++
template <typename T>
class unique_ptr {
    T* ptr;                                           // pointer to the owned object
public:
    unique_ptr() noexcept : ptr(nullptr) { }          // default constructor
    explicit unique_ptr(T* p) noexcept : ptr(p) { }   // constructor from raw pointer
    ~unique_ptr() noexcept { delete ptr; }            // destructor that deletes the owned object
    // ...
};
```

- `noexcept` specifier indicates that the function is **not allowed** to let exceptions escape; if an exception is thrown, `std::terminate` will be called. This allows for certain optimizations and better performance.

- `explicit` keyword prevents implicit construction from raw pointers to `unique_ptr`, which can help avoid unintended ownership transfers and improve code safety.

```c++
template <typename T> struct unique_ptr {
    // ...
    unique_ptr(unique_ptr const&) = delete;             // delete copy constructor
    unique_ptr(unique_ptr&& o) noexcept                 // move constructor
        : ptr(std::exchange(o.ptr, nullptr)) { }
    unique_ptr& operator=(unique_ptr const&) = delete;  // delete copy assignment operator
    unique_ptr& operator=(unique_ptr&& o) noexcept {    // move assignment operator
        delete ptr;                                     // free memory
        ptr = std::exchange(o.ptr, nullptr);            // transfer ownership
        return *this;
    }
    // ...
};
```

- `std::exchange` is a function that assigns a new value to an object and returns the old value. In this case, it sets `o.ptr` to `nullptr` and returns the original pointer value of `o.ptr`, which is then assigned to `ptr`.

```c++
template <typename T>
struct unique_ptr {
    // ...
    T& operator*() const noexcept {        // dereference operator
        return *ptr;
    }
    T* operator->() const noexcept {       // member access operator
        return ptr;
    }

    T* release() noexcept {                // give up ownership and return the pointer
        T* old = ptr;
        ptr = nullptr;
        return old;
    }
    void reset(T* p = nullptr) noexcept {  // cleans up and take ownership of new pointer
        delete ptr;
        ptr = p;
    }
    T* get() const noexcept {              // get the raw pointer
        return ptr;
    }
    explicit operator bool() const noexcept { // test for non-empty
        return ptr != nullptr;
    }
};
```

### MAKE_UNIQUE

```c++
template <typename T, typename... Args>
unique_ptr<T> make_unique(Args&&... args);
```

Combines together:
- Allocates memory
- Constructs a T with the given arguments
- Wraps it in a std::unique_ptr<T>

Prefer using `make_unique` to creating a `unique_ptr` explicitly

> typename `T` can't be deducted, must be specified explicitly
{: .prompt-warning }

Example:

```c++
std::unique_ptr<HelperType> owner{new HelperType(inputs)};
```

is better written as

```c++
auto owner = std::make_unique<HelperType>(inputs);
```

Non-example:

```c++
std::unique_ptr<WidgetBase> owner;
MyClass(InputType inputs)
    : owner(create_widget(inputs)) { }
```

- `make_unique` doesn't help here, because allocation/construction happens within `create_widget`, which returns a raw pointer, and `make_unique` can only be used with direct construction of the object.

### Array specialization

`unique_ptr` is specialized for array types:
- Calls delete[] instead of delete
- Provides operator[]

`make_unique` is specialized for array types:
- Argument is number of elements, not constructor arguments

Example:

```c++
void science(double* data, int N) {
    auto temp = std::make_unique<double[]>(N*2); // allocate array of 2N doubles with T=double[]
    do_setup(data, temp.get(), N);
    if (not needed(data, temp.get(), N))
    return;
    calculate(data, temp.get(), N);
} // unique_ptr destructor calls delete[]
```

## SHARED_PTR
