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

### Properties

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
- [Back to Basics: Move Semantics](https://www.youtube.com/watch?v=ZG59Bqo7qX4), David Olsen, CppCon 2020

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

### Transfer ownership

```c++
auto a = std::make_unique<T>();
// ...
std::unique_ptr<T> b{ a.release() }; // DON'T DO THIS
// ...
a.reset(b.release());                // DON'T DO THIS
```

> Don't use `release()` to transfer ownership
{: .prompt-warning }

This works, but it’s not exception safe. If an exception is thrown between the two calls to `release()`, the memory will be leaked.

Use `move` semantics instead, and let `unique_ptr` handle the details:

```c++
auto a = std::make_unique<T>();
// ...
std::unique_ptr<T> b{ std::move(a) };
// ...
a = std::move(b);
```

To transfer ownership to a function, pass `std::unique_ptr` by value

To return ownership from a function, return `std::unique_ptr` by value

```c++
std::unique_ptr<float[]> science(
        std::unique_ptr<float[]> x,
        std::unique_ptr<float[]> y, int N) {
    auto z = std::make_unique<float[]>(N);
    saxpy(2.5, x.get(), y.get(), z.get(), N);
    // no need to delete x, y; unique_ptr does that
    return z;
}
```

Arguments are now `unique_ptr`, and return type is `unique_ptr`. 

The caller can use `std::move` to pass ownership of the arguments, and the return value will be moved to the caller.

```c++
WidgetBase* create_widget(InputType);
```

better communicates its intent if changed to

```c++
std::unique_ptr<WidgetBase> create_widget(InputType);
```

### Gotchas

#### Make sure only one unique_ptr for a block of memory

`unique_ptr` just assumes it is the only owner of the memory, the programmer must ensure that there are no other owners of the object.

You should never pass the same pointer to two different `unique_ptr`.

```c++
T* p = ...;
std::unique_ptr<T> a{p};
std::unique_ptr<T> b{p};
// crash due to double free
```

```c++
auto c = std::make_unique<T>();
std::unique_ptr<T> d{c.get()};
// crash due to double free
```

> Don’t create a unique_ptr from a pointer unless you know where the pointer came 
from and that it needs an owner
{: .prompt-warning }

#### unique_ptr doesn’t solve the dangling pointer problem

```c++
T* p = nullptr;
{
    auto u = std::make_unique<T>();
    p = u.get();
}
// p is now dangling and invalid
auto bad = *p; // undefined behavior
```
- `unique_ptr` will automatically delete the owned object when it goes out of scope, but it does not prevent other raw pointers from becoming dangling if they point to the same object.

#### Collection

`std::vector<std::unique_ptr<T>>` just works
- `std::vector` will call the destructor of `std::unique_ptr`, which will automatically delete the owned object when the vector is destroyed or when elements are removed.

```c++
{
    std::vector<std::unique_ptr<T>> v;
    v.push_back(std::make_unique<T>());
    std::unique_ptr<T> a;
    v.push_back(std::move(a));
    v[0] = std::make_unique<T>();
    auto it = v.begin();
    v.erase(it);
}
```

## SHARED_PTR

### Properties

- Owns memory
- Shared ownership
- Many std::shared_ptr objects work together to manage one object
- Automatically destroys the object and deletes the memory
- Copyable

- Defined in header `<memory>`
- One required template parameter, which is the pointed-to type

```c++
template <typename T>
struct shared_ptr {
    // ...
    using element_type = T;
    // ...
};
```

### SHARED OWNERSHIP

Ownership is shared equally
- No way to force a `shared_ptr` to give up its ownership

Cleanup happens when the last `shared_ptr` gives up ownership

### Reference counting

- Shared ownership implemented with reference counting
- Control block on the heap for bookkeeping

So in heap memory, there are two blocks:
- Control block: contains reference count and other bookkeeping information
- Object block: contains the actual object being managed

A `shared_ptr` contains a pointer to the object and a pointer to the control block.

When a `shared_ptr` is copied, the reference count in the control block is incremented.

When a `shared_ptr` is destroyed or reset, the reference count is decremented; if it reaches zero, the object is destroyed and the memory is freed.

### Implementation

```c++
template <typename T>
struct shared_ptr {
    // ...
    shared_ptr() noexcept;   // create empty shared_ptr
    explicit shared_ptr(T*); // starts owning the object
    ~shared_ptr() noexcept;  // decrements count, cleanup object if count == zero

    // copy constructor, increments count
    shared_ptr(shared_ptr const&) noexcept; 
    // move constructor, transfers ownership without incrementing count
    shared_ptr(shared_ptr&&) noexcept;      
    // move constructor from unique_ptr, takes ownership of the object
    shared_ptr(unique_ptr<T>&&); 
    // copy assignment operator, increments count of new object and decrements count of old object
    shared_ptr& operator=(shared_ptr const&) noexcept; 
    // move assignment operator, transfers ownership without incrementing count
    shared_ptr& operator=(shared_ptr&&) noexcept;
    // move assignment operator from unique_ptr, takes ownership of new object and releases ownership of old object
    shared_ptr& operator=(unique_ptr<T>&&); 

    T& operator*() const noexcept;  // dereference operator
    T* operator->() const noexcept; // member access operator

    void reset(T*); // give up ownership and take ownership of new pointer
    T* get() const noexcept; // get the raw pointer
    long use_count() const noexcept; // return count of shared owners
    explicit operator bool() const noexcept; // test for non-empty
    // ...
};
```

### MAKE_SHARED

```c++
template <typename T, typename... Args>
shared_ptr<T> make_shared(Args&&... args);
```

Combines together:
- **One memory allocation** for both the object and the control block
- Constructs a `T` with the given arguments
- Initializes the control block
- Wraps them in a `std::shared_ptr<T>` object

Prefer using make_shared to creating a shared_ptr directly

> Normal constructor of `shared_ptr` requires two memory allocations: one for the control block and one for the object, while `make_shared` only requires one allocation for both. This can lead to better performance and less memory fragmentation.
{: .prompt-tip }

### Shared ownership

To share ownership, additional `shared_ptr` objects **must be created or assigned from 
an existing `shared_ptr`**, not from the raw pointer.

```c++
{
    T* p = ...;
    std::shared_ptr<T> a(p);
    std::shared_ptr<T> b(p);
} // runtime error: double free
```

```c++
{
    auto a = std::make_shared<T>();
    std::shared_ptr<T> b(a.get());
} // runtime error: double free
```

Do this instead:

```c++
{
    auto a = std::make_shared<T>();
    std::shared_ptr<T> b(a);
    std::shared_ptr<T> c;
    c = b;
}
```

### Thread safety

Updating the same control block from different threads is thread safe

```c++
auto a = std::make_shared<int>(42);
std::thread t([](std::shared_ptr<int> b) {  // increment count
    std::shared_ptr<int> c = b;             // increment count
    work(*c);                               // read object
    // *c = 100;                            // update object, not thread safe, causes data race
}, a);                                      // decrement count

{
    std::shared_ptr<int> d = a;             // increment count
    a.reset((int*)nullptr);
    more_work(*d);                          // read object
    // *d = 100;                            // update object, not thread safe, causes data race
}                                           // decrement count
t.join();
```

When `a` is passed as an argument to the thread, 
compiler call the copy constructor of `shared_ptr`, incrementing count.
Thus when `a` is reset, the count is decremented but not zero, so it doesn't delete the object. 

When `d` is created, the count is incremented again, so when `d` goes out of scope, the count is decremented but not zero, so it doesn't delete the object.

When `t` joins, the count is decremented again, and if it reaches zero, the object is deleted.


> Only read object is safe, update the same managed object from different threads is not thread safe, causing data race
{: .prompt-warning }


> Update the same shared_ptr object from different threads is not thread safe
{: .prompt-warning }

```c++
auto a = std::make_shared<int>(42);
std::thread t([&]() {           // capture a by reference, not thread safe
    work(*a);                   // read
});
a = std::make_shared<int>(100); // write to a, not thread safe, causes data race
t.join(); 
```

#### Arrays

- `shared_ptr` added support for array types in C++17
- `make_shared` added support for array types in C++20
- Use array types with `shared_ptr` with caution
- Make sure your standard library is new enough

## UNIQUE_PTR VS SHARED_PTR

- Single owner: use `unique_ptr`
- Multiple owners: use `shared_ptr`
- Non-owning reference: use something else entirely
- When in doubt, prefer `unique_ptr`, as it 's easier to switch from `unique_ptr` to `shared_ptr` than the other way around

## Advanced stuff

### WEAK_PTR

A non-owning reference to a shared_ptr-managed object

Knows when the lifetime of the managed object ends

```c++
std::weak_ptr<int> w;
{
    auto s = std::make_shared<int>(42);
    // w points to same object as s, but does not own it (does not increment count)
    w = s;
    // create a shared_ptr from w (increments count if object is still alive, 
    // otherwise returns empty shared_ptr)
    std::shared_ptr<int> t = w.lock();
    // check if t is not empty before dereferencing
    if (t) printf("%d\n", *t);  // print 42
}
// s goes out of scope, object is destroyed, w becomes expired
std::shared_ptr<int> u = w.lock();
if (!u) printf("empty\n"); // print empty
```
**What is it good for?**

- `weak_ptr` only useful when object is managed by `shared_ptr`
- Caching
  - Keep a reference to an object for faster access
  - Don’t want that reference to keep the object alive
- Dangling references

### CUSTOM DELETERS

What if cleanup action is something other than calling delete ?

```c++
FILE* fp = fopen("readme.txt", "r");
fread(buffer, 1, N, fp);
fclose(fp); // better to use unique_ptr to automatically close the file when done
```

#### UNIQUE_PTR

`unique_ptr` has an extra defaulted template parameter for the delete

```c++
template <typename T, 
typename Deleter = std::default_delete<T>>
class unique_ptr;
```

- Type Deleter must have an `operator()(T*)`

- `make_unique` doesn’t support custom deleters
- `unique_ptr` with custom deleter must be constructed directly

```c++
struct fclose_deleter {
    void operator()(FILE* fp) const { fclose(fp); }  // deleter
};
using unique_FILE = std::unique_ptr<FILE, fclose_deleter>; // unique_ptr with custom deleter
{
    unique_FILE fp(fopen("readme.txt", "r"));
    fread(buffer, 1, N, fp.get());  // use get() to access the raw pointer for fread
}  // unique_FILE destructor calls fclose(fp) automatically
```

#### SHARED_PTR

Custom deleter for `shared_ptr` is passed to constructor, where it is type erased

```c++
struct fclose_deleter {
    void operator()(FILE* fp) const { fclose(fp); }
};
{
    std::shared_ptr<FILE> fp(fopen("readme.txt", "r"),
                             fclose_deleter{});  // pass custom deleter to shared_ptr constructor
    fread(buffer, 1, N, fp.get());
    std::shared_ptr<FILE> fp2(fp);
}  // fclose called automatically when last shared_ptr goes out of scope
```

### Casts

To have `share_ptr`s of different types that manage the same object,
using `dynamic_pointer_cast`, `static_pointer_cast`, `const_pointer_cast`, `reinterpret_pointer_cast`

```c++
std::shared_ptr<WidgetBase> p = create_widget(inputs);
std::shared_ptr<BlueWidget> b =
    std::dynamic_pointer_cast<BlueWidget>(p);
if (b) b->do_something_blue();
```

If the cast fails, `b` will be empty, but `p` will still own the object. If the cast succeeds, `b` will share ownership of the same object as `p`.

#### Aliasing Constructor

Two `shared_ptr`s use same control block, but have unrelated object pointers

Useful for pointers to subobjects of managed objects

```c++
struct Outer {
    int a;
    Inner inner;
};
void f(std::shared_ptr<Outer> op) {
    std::shared_ptr<Inner> ip(op, &op->inner);
    // ...
}
```
`ip` shares ownership of the same object as `op`, but points to `op->inner` instead of `op`. 

So we can pass `Inner` pointer around without worrying about the lifetime of `Outer`, because `ip` will keep `Outer` alive as long as `ip` is alive.

When the last `shared_ptr` owning the object goes out of scope, the entire object (including `inner`) will be destroyed.

### SHARED_FROM_THIS

To convert `this` into a `shared_ptr`
- Class inherits from `std::enable_shared_from_this<T>`
- Object is already managed by a `shared_ptr`
- `return this->shared_from_this();`

When the object is first owned by a `shared_ptr`, 
the library stores a hidden `weak_ptr` to the same control block inside the object.

Calling `shared_from_this()` creates a new `shared_ptr` that shares the same control block (same reference count).

This avoids creating a new control block with `std::shared_ptr<T>(this)`, which would cause double deletion.

Without `shared_from_this()`
```c++
struct Worker {
  void start() {
    // imagine this runs later (timer / thread / event loop)
    schedule_after_1s([this]{
      do_work(); // crash if object already destroyed
    });
  }
  void do_work();
};
```

With enable_shared_from_this
```c++
struct Worker : std::enable_shared_from_this<Worker> {
  void start() {
    auto self = shared_from_this(); // keep object alive
    schedule_after_1s([self]{
      self->do_work(); // safe, refcount holds it
    });
  }
  void do_work();
};

auto w = std::make_shared<Worker>();
w->start();
w.reset(); // even if caller drops it, callback still works safely
```

## Summary

### RAW POINTERS VS SMART POINTERS
- Raw pointers can fulfill lots of roles
  - Can’t fully communicate the programmer’s intent
- Smart pointers can be very powerful
  - Automatic tasks, especially cleanup
  - Extra checking
  - Limited API, to better express programmer’s intent
  

### STANDARD VS CUSTOM SMART POINTERS
Stadard C++ has two commonly used smart pointers
- `unique_ptr` and `shared_ptr`
- Use them whenever they fit your needs

Don’t limit yourself to standard smart pointers
- If your framework has smart pointers, use them
- Write your own if necessary
- [The Smart Pointers I Wish I Had](https://www.youtube.com/watch?v=CKCR5eFVrmc), Matthew Fleming, CppCon 2019

### GUIDELINES
- Use smart pointers to represent ownership
- Prefer `unique_ptr` over `shared_ptr`
- Use `make_unique` and `make_shared`
- Pass/return `unique_ptr` to transfer ownership between functions
