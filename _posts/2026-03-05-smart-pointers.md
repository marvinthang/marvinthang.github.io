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


- Single: don't use `++p`, `--p`, or `p[n]`
- Array: can use `++p`, `--p`, and `p[n]`

### Ownership

- Owner must free the memory when done
- Non-owner must never free the memory

### Nullability

- Some pointers can never be null (e.g. `this` pointer)
- Some pointers can be null (e.g. optional pointer parameters)

It would be nice if the type system helped enforce that/
Unfortunately, the type system doesn’t help.
`T*` can be used for all combinations of those characteristics.

## Smart Pointers

Behaves like a pointer (... at least one of the roles of a pointer):
- Points to an object
- Can be dereferenced with `*` and `->`

Adds additional "smart" semantics to (often) limit behavior to certain of a pointer’s possible roles

"Smart" can be almost anything:
- Automatic release resources (most common)
- Enforce restrictions (e.g. non-null)
- Extra safety checks (e.g. bounds checking)

Sometimes the smarts are only in the name:
- `gsl::owner<T>` is just a typedef of `T*`;  it only has meaning for those reading the code

## When to use raw pointers

- Non-owning pointer to an object (use a smart pointer for all owning pointers instead)
- Use a span type in place of non-owning pointers to arrays: C++20 `std::span`, or `gsl::span`

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

### Basic usage - function
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

### Basic usage - class
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

### Basic Usage - RAII

Very useful for implementing RAII, See See “Back to Basics: RAII” by Andre Kostur

## SHARED_PTR
