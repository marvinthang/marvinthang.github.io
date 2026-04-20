---
title: Move Semantics in C++
date: 2026-04-20 00:00:00 +0800
categories: [cpp]
tags: [cpp, cppcon, move-semantics, c++]
description: Back to Basics. Move Semantics - Andreas Fertig - CppCon 2022
math: true
---

Source: [Back to Basics: Move Semantics - Andreas Fertig - CppCon 2022](https://youtu.be/knEaMpytRMA?si=VoUHIc-h8lCsWAW3)

## Overloads

Before talking about move semantics, we first need to see what C++ already had.

Suppose we write these two overloads:

```c++
void Fun(std::vector<int>& byRef) {
    std::cout << "byRef\n";
}

void Fun(const std::vector<int>& byConstRef) {
    std::cout << "byConstRef\n";
}
```

And then use them like this:

```c++
void Use() {
    std::vector v{2, 3, 4};
    const std::vector cv{5, 6, 7};

    Fun(v);
    Fun(cv);
    Fun({3, 5, 6});
}
```

The output is:

```
byRef
byConstRef
byConstRef
```

So C++ does this:

* `Fun(v)` calls `Fun(std::vector<int>&)`
* `Fun(cv)` calls `Fun(const std::vector<int>&)`
* `Fun({3, 5, 6})` also calls `Fun(const std::vector<int>&)`

### What is happening here?

The first two calls are expected:
- `v` is a non-const lvalue, so it binds to `T&`.
- `cv` is a const lvalue, so it cannot bind to `T&`. It binds to `const T&` instead.

The interesting case is this one:

```c++
Fun({3, 5, 6});
```

This creates a temporary `std::vector<int>`.
That temporary is an **rvalue**, not an lvalue.

A non-const lvalue reference cannot bind to it, so this overload is not viable:

```c++
void Fun(std::vector<int>& byRef)
```

But a const lvalue reference **can** bind to a temporary, so C++ chooses:

```c++
void Fun(const std::vector<int>& byConstRef)
```

### Why `const T&` is not enough

So far, temporaries already have a place to go: `const T&`.

That is safe, but it also means C++ still puts these two cases together:

* a real const object
* a temporary object

Those are not the same thing.
* A const object should not be modified.  
* A temporary, on the other hand, is often about to disappear anyway.

So `const T&` is good enough for correctness, but it is still too restrictive.  
It lets us observe a temporary, but not treat it as something we may steal resources from.

What we really want is a third overload:

```c++
void Fun(std::vector<int>&& byRvalueRef);
```
This gives temporaries their own path.

Then C++ can say:
* lvalue → `T&`
* const lvalue → `const T&`
* rvalue / temporary → `T&&`

That is the key setup for move semantics.

## Rvalue references and `std::move`

Now suppose we add one more overload:

```c++
void Fun(std::vector<int>& byRef) {
    std::cout << "byRef\n";
}

void Fun(const std::vector<int>& byConstRef) {
    std::cout << "byConstRef\n";
}

void Fun(std::vector<int>&& byRvalueRef) {
    std::cout << "byMoveRef\n";
}
```

And use the same calls again:

```c++
void Use() {
    std::vector v{2, 3, 4};
    const std::vector cv{5, 6, 7};

    Fun(v);
    Fun(cv);
    Fun({3, 5, 6});
}
```

Now the output becomes:

```
byRef
byConstRef
byMoveRef
```

So after adding `T&&`, the first two calls still behave the same:

* `v` goes to `T&`
* `cv` goes to `const T&`

But the temporary is different now.

```c++
Fun({3, 5, 6});
```

This temporary is an rvalue, so C++ now prefers the new overload:

```c++
void Fun(std::vector<int>&& byRvalueRef)
```

This `&&` parameter is an **rvalue reference**.
So now temporaries no longer fall back to `const T&`. They get their own overload.

Before, C++ could only say:

* this is a mutable lvalue
* this is either a const lvalue or a temporary

Now it can say one more thing:
* this is an rvalue, so use the rvalue overload

That is exactly what move semantics needs.

Once temporaries have their own overload, functions and types can treat them differently.
Instead of only observing them through `const T&`, they can use the move path.

### Triggering the rvalue overload

So far, the rvalue overload is only picked for temporaries:

```c++
Fun({3, 5, 6});
````

But a named object is still an lvalue:

```c++
void Use() {
    std::vector v{2, 3, 4};
    Fun(v);
}
```

So this still calls:

```c++
void Fun(std::vector<int>& byRef)
```

not the rvalue overload.

If we want to trigger the rvalue overload for `v`, we can cast it:

```c++
void Use() {
    std::vector v{2, 3, 4};
    Fun(static_cast<std::vector<int>&&>(v));
}
```

So overload resolution now picks:

```c++
void Fun(std::vector<int>&& byRvalueRef)
```

Writing that cast directly is ugly, so we normally use `std::move`:

```c++
#include <utility>

void UseMove() {
    std::vector v{2, 3, 4};
    Fun(std::move(v));
}
```

`std::move` does not move anything by itself. It only casts its argument to an expression that can bind to `T&&`.

So before `std::move`, `v` is an lvalue and goes to `T&`.
After `std::move(v)`, the expression becomes an rvalue and can go to `T&&`.

> `std::move` does not move. It only enables the move path. 
{: .prompt-warning }

### Some notes about `std::move`

At this point, there are a few important things to keep in mind:

- `std::move` is only a cast.
- Temporary objects already use the move path by default.
- We use `std::move` only when we have a named object and want to treat it as an rvalue.
- Move semantics is just an additional overload that is allowed to steal resources from the source object.

> `std::move` does not perform the move itself. It only makes moving possible.
{: .prompt-warning }

## Value categories

To understand move semantics better, we now need a slightly more precise vocabulary.

At the highest level, expressions are split into:
* **lvalue**
* **rvalue**

But in modern C++, rvalue is further split into:
* **xvalue**
* **prvalue**

So the full picture is:

![Desktop View](/assets/img/posts/cpp/move-semantics-1.png){: width="972" height="589" }

That sounds annoying at first, but for move semantics we only need a few simple examples.

```c++
Object base{};
Object obj2 = base;
Object obj3 = GetValue();        // suppose GetValue() returns Object&&
Object obj4 = std::move(base);
Object obj5 = GetOtherValue();   // suppose GetOtherValue() returns Object
Object obj6 = 5;
```

Here:

* `base` is an **lvalue**
* `GetValue()` is an **xvalue**
* `std::move(base)` is an **xvalue**
* `GetOtherValue()` is a **prvalue**
* `5` is also a **prvalue**

### The main intuition

An **lvalue** is something with identity that we usually treat as a persistent object.

A **prvalue** is a *pure temporary value*.

An **xvalue** is also an *expiring value*, but unlike a prvalue, it usually refers to an existing object that we are allowed to move from.

That is why `std::move(base)` is an xvalue, not a prvalue.
`base` still exists.
We are just saying it may now be treated as an expiring object.

### What matters for move semantics

For this topic, the most important points are:

* named objects like `base` are usually **lvalues**
* `std::move(x)` produces an **xvalue**
* temporaries like `5` are usually **prvalues**
* both xvalues and prvalues are **rvalues**

So when people say “move works on rvalues”, that includes both:

* prvalues
* xvalues

That is why both a temporary object and `std::move(obj)` can trigger the move path.


## Why move can be faster

Now we can see where move semantics actually helps.

Suppose a `string` stores its characters in heap memory:

```c++
class string {
    size_t mLen{};
    std::unique_ptr<char[]> mData{};

public:
    string(const char* data);               // constructor

    string(const string& rhs);              // copy constructor
    string& operator=(const string& rhs);   // copy assignment

    string(string&& rhs);                   // move constructor
    string& operator=(string&& rhs);        // move assignment

    char* c_str() const { return mData.get(); }
};
```

For the copy operations, we must allocate new memory and duplicate the characters:

```c++
// copy constructor
string::string(const string& rhs)
: mLen{rhs.mLen}, mData{std::make_unique<char[]>(rhs.mLen)} {
    std::copy_n(rhs.mData.get(), mLen, mData.get());
}

// copy assignment
string& string::operator=(const string& rhs) {
    if (&rhs != this) {
        mLen = rhs.mLen;
        mData = std::make_unique<char[]>(mLen);
        std::copy_n(rhs.mData.get(), mLen, mData.get());
    }
    return *this;
}
```

That is the expensive path.

The move operations are different:

```c++
// move constructor
string::string(string&& rhs)
: mLen{std::exchange(rhs.mLen, 0)}, mData{std::exchange(rhs.mData, nullptr)}
{}

// move assignment
string& string::operator=(string&& rhs) {
    if (&rhs != this) {
        mLen = std::exchange(rhs.mLen, mLen);
        mData = std::exchange(rhs.mData, std::move(mData));
    }
    return *this;
}
```

Here we do not allocate new memory and do not copy the characters.
We just transfer ownership of the existing buffer from `rhs` to `*this`.

That is where the performance win comes from.

So the key difference is:

* copy constructor / copy assignment: allocate and duplicate the resource
* move constructor / move assignment: transfer the resource

For resource-owning types, move can be much cheaper than copy because it avoids the expensive part.

## Moved-from objects

Consider this code:

```c++
string src{"Hello"};
string other{std::move(src)};
std::cout << src.c_str();
```

After the move, `src` is a **moved-from object**.

That does **not** mean `src` is destroyed.
It also does **not** mean `src` is invalid.

A moved-from object is still valid, but its value is generally **unknown**.

C++ move is usually **non-destructive**. That means the source object still exists after the move, but we should not assume much about its state.

In practice, a moved-from object must at least be:

* destroyable
* assignable

Anything more than that depends on the type.

> Never rely on the value of a moved-from object.
{: .prompt-warning }

If we want to use it again, we should first put it back into a known state, usually by assigning a new value to it.

For example:

```c++
string src{"Hello"};
string other{std::move(src)};

src = string{"World"};
std::cout << src.c_str();
```

This is fine, because after the assignment, `src` is back in a valid and known state.

## Why `noexcept` matters

Move support alone is not the full story.
For the STL, `noexcept` also matters.

Consider this type:

```c++
struct Object {
    Object() { printf("ctor\n"); }
    Object(const Object&) { printf("copy ctor\n"); }
    Object& operator=(const Object&) { printf("copy assign\n"); return *this; }
    Object(Object&&) { printf("move ctor\n"); }
    Object& operator=(Object&&) { printf("move assign\n"); return *this; }
};
```

And then:

```c++
int main() {
    std::vector<Object> v{};
    v.push_back(Object{});

    printf("second element\n");
    v.push_back(Object{});
}
```

Output:

```
ctor
move ctor
second element
ctor
move ctor
copy ctor
```

Even though `Object` has move operations, `std::vector` may still choose copying when it needs to reallocate its elements.

Now compare that with the same type after adding `noexcept`:

```c++
struct Object {
    Object() { printf("ctor\n"); }
    Object(const Object&) { printf("copy ctor\n"); }
    Object& operator=(const Object&) { printf("copy assign\n"); return *this; }
    Object(Object&&) noexcept { printf("move ctor\n"); }
    Object& operator=(Object&&) noexcept { printf("move assign\n"); return *this; }
};
```

Once the move operations are marked `noexcept`, the move path becomes much more useful to the container.

The reason is exception safety.

When `std::vector` grows, it may need to relocate its existing elements into new storage.
If it starts moving elements and one move throws in the middle, some old elements may already have been modified, so rolling back cleanly becomes hard.

Copying avoids that problem: if a copy throws, the original elements are still untouched in the old storage, so the vector can keep its old valid state when an exception happens.

That is why, for move-aware types, `noexcept` is often an important part of the design.

## std::move vs std::forward

### `std::move` is not always the right thing

Consider this function:

```c++
void Innocent(std::string& value) {
    std::string local = std::move(value);
}
```

And then:

```c++
void Use() {
    std::string s{"A very very very very very very loooooong "
                  "string to defeat the small string "
                  "optimization SSO; hopefully."};
    Innocent(s);
    std::cout << "'" << s << "'";
}
```

The output is:

```
''
```

So even though `Innocent` only takes `value` as an lvalue reference, it still moves from it. That is the problem.

From the caller side, `s` is still a normal named object.
But inside the function, `std::move(value)` says that we may treat it as an rvalue, so the move path is used.

This is why `std::move` is not automatically the right thing.
Using it means we may leave the source object in a moved-from state.

So the rule is simple:

* use `std::move` only when you really no longer need that object
* do not use it just because “move is faster”

### Use `std::forward` in templates

The previous example used a normal lvalue reference parameter:

```c++
void Innocent(std::string& value);
```

But the same mistake also appears in templates. Consider this version:

```c++
template<typename T>
void Innocent(T&& value) {
    std::string local = std::move(value);
}
```

At first, this may look more generic and more powerful.
But it still has the same problem.

If we call it with an lvalue:
```c++
void Use() {
    std::string s{"A very very very very very very loooooong "
                  "string to defeat the small string "
                  "optimization SSO; hopefully."};
    Innocent(s);
    std::cout << "'" << s << "'";
}
```

then `value` is actually bound to that lvalue.
So using `std::move(value)` still forces the move path and may leave `s` moved-from. 

The correct tool here is `std::forward`:

```c++
template<typename T>
void Innocent(T&& value) {
    std::string local = std::forward<T>(value);
}
```

Now the value category is preserved:

* if the caller passes an lvalue, it stays an lvalue
* if the caller passes an rvalue, it stays an rvalue 

So in templates, `std::move` is usually too aggressive.
`std::forward` is the right tool when we want to pass the argument onward without changing whether it was an lvalue or an rvalue.

### Move or forward

If the type is fixed, use `std::move` when we want to treat the object as movable.

```c++
void Fun(Object p) {
    x = std::move(p);
}

Object o{/* ... */};
x = std::move(o);
```

But if the object comes from deduction, then it may represent either an lvalue or an rvalue.
In that case, we should preserve the original value category with `std::forward`.

```c++
template<class T>
void Fun(T&& p) {
    x = std::forward<T>(p);
}

auto&& o{/* ... */};
x = std::forward<decltype(o)>(o);
```

So the rule is:

* use `std::forward` when the object comes from deduction and you want to preserve its value category
* otherwise, use `std::move` when you want to treat the object as movable

### Perfect forwarding

Here is a more typical use of `std::forward`:
```c++
struct Apple {
    Apple(const std::string& s) { std::cout << "lvalue: " << s << '\n'; }
    Apple(std::string&& s) noexcept { std::cout << "rvalue: " << s << '\n'; }
};

template<typename T, typename U>
auto make(U&& value) {
    return T{ std::forward<U>(value) };
}
```

And then:
```c++
void Use() {
    std::string str{"Hello"};

    Apple x{make<Apple>(str)};
    Apple y{make<Apple>("World"s)};
}
```

The output is:

```
lvalue: Hello
rvalue: World
```

This works because `std::forward<U>(value)` preserves the original value category:

* if the caller passes an lvalue, it stays an lvalue
* if the caller passes an rvalue, it stays an rvalue

That is why this is called **perfect forwarding**.
We pass the argument onward without accidentally turning every case into a move.

## Use move only rarely

- In general, the compiler is our friend.
- Temporary objects are automatically moved.
- For return values, the compiler might apply optimizations such as copy elision. You do not beat copy elision with `std::move`.

## Compiler-generated special members

Move semantics is also tied to the compiler-generated special member functions.

Consider this class:

```c++
class Object {
    int* _data{};

public:
    Object() : _data{new int{6}} {}
    ~Object() { delete _data; }
};
```
This class owns heap memory.

That means the default copy operations are no longer good enough, because the compiler-generated copy would only copy the pointer, not the pointed-to value.
Then two objects would end up owning the same memory.

That is a problem, because when both objects are destroyed, they would both try to delete the same memory, leading to undefined behavior.

So we need to define the copy operations ourselves:

```c++
class Object {
    int* _data{};

public:
    Object() : _data{new int{6}} {}
    ~Object() { delete _data; }

    Object(const Object& rhs) : _data{new int{*rhs._data}} {}

    Object& operator=(const Object& rhs) {
        if (&rhs != this) {
            delete _data;
            _data = new int{*rhs._data};
        }
        return *this;
    }
};
```

At this point, something important happens.

Once we start declaring special member functions ourselves, the compiler may stop generating some of the others for us.

In particular, declaring copy operations or a destructor affects whether move operations are still implicitly generated.

So move semantics is not just about writing `T&&` and `std::move`.
It is also connected to how the compiler generates or suppresses the special members of a class.

This is one reason people talk about the **Rule of Five**:

* destructor
* copy constructor
* copy assignment operator
* move constructor
* move assignment operator

If your type manages a resource manually, these functions are usually connected.

![Desktop View](/assets/img/posts/cpp/move-semantics-2.png){: width="972" height="589" }

### What `defaulted`, `not declared`, and `deleted` mean

These three words are easy to confuse:

- **defaulted**: the compiler generates it for you
- **not declared**: the compiler does not even provide it
- **deleted**: the compiler declares it, but using it is an error

That last case is important.

A deleted function still participates in overload resolution. It just cannot be called.

### Declaring constructors affects the default constructor

If we declare **any constructor**, then the compiler no longer implicitly declares the default constructor.

This is the usual rule people already know:
once we write a constructor, the compiler stops giving us the no-argument constructor for free.

### Declaring destructor or copy operations kills implicit move

The more important part for move semantics is this: if we declare any of these ourselves:

- destructor
- copy constructor
- copy assignment operator

then the move constructor and move assignment operator are no longer implicitly declared.

This is because the compiler assumes that if we are doing manual resource management, then we probably want to control copying and moving ourselves as well, so it does not give us move support automatically.

### Declaring move operations kills implicit copy

If we declare a move constructor or move assignment operator, the compiler treats the type as having an explicit **move-aware** design, and often effectively a **move-only** direction unless we also declare copy ourselves.

So the compiler does not silently generate copy operations anymore.
Instead, the implicit copy constructor and copy assignment operator become deleted.

This also prevents an rvalue from quietly **falling back** to copy construction when move exists.

So if we want both move and copy, we must declare both explicitly.

## Ref-qualifiers

Move semantics can also be used on member functions.

Consider this `append` function:

```c++
class string {
    size_t mLen{};
    std::unique_ptr<char[]> mData{};

    void Concat(const char* s);

public:
    string(const char* data);
    string(const string& rhs);
    string& operator=(const string& rhs);
    string(string&& rhs);
    string& operator=(string&& rhs);

    char* c_str() const { return mData.get(); }

    string& append(const char* s) {
        Concat(s);
        return *this;
    }
};
```

This works fine for normal objects:

```c++
string s{"Hello"};
s.append(", world!");
std::cout << s.c_str();
```

But it also allows this:

```c++
string s2 = string{"Hello"}.append(", world!");
```

Here, `append()` is called on a temporary.
Returning `string&` still works, but it makes the result an lvalue, which means we cannot trigger the move constructor anymore.

Ref-qualifiers fix that:

```c++
class string {
    size_t mLen{};
    std::unique_ptr<char[]> mData{};

    void Concat(const char* s);

public:
    string(const char* data);
    string(const string& rhs);
    string& operator=(const string& rhs);
    string(string&& rhs);
    string& operator=(string&& rhs);

    char* c_str() const { return mData.get(); }

    string& append(const char* s) & {     // add & here, so this is only for lvalues
        Concat(s);
        return *this;
    }

    string&& append(const char* s) && {   // add && here, so this is only for rvalues
        Concat(s);
        return std::move(*this);
    }
};
```

Now we have two versions:

* `append(...) &` is called when `*this` is an lvalue
* `append(...) &&` is called when `*this` is an rvalue

So if `append()` is called on a normal object, we return `string&`.
If it is called on a temporary, we return `string&&` and keep the move path available.
