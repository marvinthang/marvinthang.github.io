---
title: C++ Concurrency Notes
date: 2026-06-15 10:00:00 +0800
categories: [cpp]
tags: [cpp, concurrency, multithreading, parallel programming]
description: Notes on C++ threads, ownership, argument passing, shared data, race conditions, mutexes, and thread-safe interfaces.
math: true
---

## Managing Threads

`joinable()` **only** checks whether a `std::thread` still **represents a thread of execution**, not whether that thread is currently running. A finished thread remains joinable until `join()` or `detach()` is called.

Destroying a joinable `std::thread` calls `std::terminate()`. You must explicitly choose to either wait for the thread with `join()` or release ownership with `detach()`.

After a thread is joined or detached, the `std::thread` object no longer owns that thread of execution.

> Destroying a joinable `std::thread` calls `std::terminate()`, even if the underlying thread has already finished, unless `join()` or `detach()` was called first.
{: .prompt-warning }

> Detaching is dangerous when the thread uses pointers or references to **local variables**. The spawning function may return while the detached thread is still running, leaving the detached thread with dangling references and UB.
{: .prompt-warning }

## Thread Ownership

`std::thread` is **movable** but not copyable. This is what lets you transfer thread ownership into functions, return it from functions, or store threads in move-aware containers like `std::vector`.

Because a `std::thread` has unique ownership, assigning a new thread to a `std::thread` object that already owns a joinable thread calls `std::terminate()`. You must first resolve the old thread by calling `join()` or `detach()`.

## Passing Arguments

Thread arguments are **copied by default** into internal storage. Later, those stored values are passed to the thread function as **rvalues**. This is true even if the thread function's parameter type looks like a reference.

To pass a real reference into a thread function, wrap the argument with `std::ref()`.

Move-only types, such as `std::unique_ptr`, must be passed with `std::move()` so ownership is transferred into the new thread.

Be careful with implicit conversions. If you pass a `char*` to a thread function that expects a `std::string`, the conversion can happen inside the new thread, not necessarily in the spawning thread. If the original buffer goes out of scope first, the new thread may read invalid memory. Convert explicitly before launching the thread.

```c++
void f(int i, std::string const& s);

std::thread t(f, 3, "hello");
```

Even though `f` takes a `std::string` as its second parameter, the string literal is initially passed to the `std::thread` constructor as a `char const*`. The conversion to `std::string` happens later, when the copied argument is used to invoke the thread function.

That detail matters more when the argument points to a local buffer:

```c++
void f(int i, std::string const& s);

void oops(int some_param) {
    char buffer[1024];
    sprintf(buffer, "%i", some_param);

    std::thread t(f, 3, buffer);
    t.detach();
}
```

In this case, there is a significant chance that `oops()` exits before the new thread converts `buffer` to a `std::string`. Once `oops()` returns, `buffer` no longer exists, so the detached thread may access invalid memory.

The fix is to explicitly convert the buffer to a `std::string` before passing it to the thread constructor:

```c++
void f(int i, std::string const& s);

void oops(int some_param) {
    char buffer[1024];
    sprintf(buffer, "%i", some_param);

    std::string str(buffer);
    std::thread t(f, 3, str);
    t.detach();
}
```

Now the conversion happens in the spawning thread. The `std::thread` constructor stores its own copy of the `std::string`, so the new thread is no longer dependent on the local character buffer.

### References and `std::ref`

We cannot pass a non-const reference to a temporary object, so the following code will not compile:

```c++
void f(int i, std::string& s);

std::thread t(f, 3, std::string("hello")); // Error
```

The thread constructor stores a copy of each argument and then passes those stored values as rvalues to the thread function. A non-const lvalue reference cannot bind to that rvalue.

To pass a non-const reference, keep an object alive outside the thread and wrap it with `std::ref()`:

```c++
void f(int i, std::string& s);

std::string str("hello");
std::thread t(f, 3, std::ref(str));
```

This mechanism is similar to `std::bind()`, which also copies its arguments by default and requires `std::ref()` when you want reference semantics.

### Member Functions

You can pass a member function pointer to a thread constructor, but you must also pass the object instance as the first argument:

```c++
class MyClass {
public:
    void memberFunction(int i) {
        // Do something with i
    }
};

MyClass obj;
std::thread t(&MyClass::memberFunction, &obj, 42);
```

The thread invokes the member function using the object pointer or reference you provide, followed by the rest of the arguments.

## Hardware Scaling and Identification

`std::thread::hardware_concurrency()` provides a runtime hint for how many hardware threads may run concurrently. This can help you divide workloads dynamically and avoid oversubscription, where creating too many runnable threads hurts performance through excessive context switching.

Each thread has a `std::thread::id`.

* `thread.get_id()` returns the ID of the thread owned by a `std::thread`; if none exists, it returns the default “no thread” ID.
* `std::this_thread::get_id()` returns the current thread’s ID.
* Thread IDs can be copied, compared, ordered, hashed, used as container keys, and printed for logging.
* Equal IDs refer to the same thread, or both represent “no thread.”
* Thread IDs are useful for associating data or behavior with particular threads.
* Their printed values are implementation-defined and have no semantic meaning.

## Race Conditions and Data Races

* Race condition: The result depends on timing or ordering between threads.

* Data race: Two or more threads access the same memory location concurrently, at least one access is a write, and there is no proper synchronization.

A program can have a race condition even if there is no direct data race. For example, every stack member function may lock correctly, but the sequence `empty() -> top() -> pop()` can still be logically unsafe.

## Avoiding Problematic Race Conditions

There are three broad ways to avoid problematic race conditions.

First, protect the data structure with a synchronization mechanism such as a mutex. The goal is to make sure only the modifying thread can see the intermediate broken state. Other threads should see either the state before the update or the state after the update, never the half-updated state.

Second, change the data structure design so each modification is made from small indivisible steps, and each step preserves the invariant. This is the idea behind lock-free programming. It is harder because you must reason carefully about atomic operations, memory ordering, which thread can see which values, and when updates become visible.

Third, use transaction-style updates. A thread does work privately, records the changes it wants to make, and then tries to commit them in one step. If another thread changed the data meanwhile, the transaction fails and restarts. C++ does not provide normal built-in support for software transactional memory in the standard thread library, but the concept is useful.

## Structuring Protected Data

Usually, the mutex and the data it protects should be placed together in a class.

```cpp
class protected_list {
private:
    std::list<int> data;
    mutable std::mutex m;

public:
    void add(int value) {
        std::lock_guard<std::mutex> lock(m);
        data.push_back(value);
    }

    bool contains(int value) const {
        std::lock_guard<std::mutex> lock(m);
        return std::find(data.begin(), data.end(), value) != data.end();
    }
};
```

This makes the relationship clear: `m` protects `data`. It also lets the class control access to the data.

But simply putting a mutex inside a class is not enough. The interface must not leak protected data.

```cpp
std::list<int>& get_data() {
    std::lock_guard<std::mutex> lock(m);
    return data;
}
```

This is broken because after the function returns, the lock is gone, but the caller still has a reference to the protected data. The caller can then access `data` without locking the mutex.

This is also dangerous:

```cpp
void func(some_data& protected_data) {
    // do something with protected_data
}
template<typename Function>
void process_data(Function func) {
    std::lock_guard<std::mutex> lock(m);
    func(data);
}
```

It looks protected because `func(data)` is called while holding the lock. But if `func` is user-supplied, it may store a pointer or reference to `data` somewhere else.

## Interface-Level Race Conditions

Using a mutex internally does not automatically make an interface safe. Sometimes the race condition comes from the interface itself.

A normal stack interface often has:

```cpp
bool empty() const;
T& top();
void pop();
```

In single-threaded code, this is fine:

```cpp
if (!s.empty()) {
    int value = s.top();
    s.pop();
    do_something(value);
}
```

This works because nothing can change the stack between the calls. With a shared stack, another thread can modify the stack between operations.

### Designing a Thread-Safe Stack Interface

A natural idea is to combine `top()` and `pop()`:

```cpp
T pop();
```

This removes the interface race, but it creates an exception-safety problem.

Suppose the stack stores `std::vector<int>`:

```cpp
std::stack<std::vector<int>> s;
```

Copying a `std::vector<int>` may allocate memory, and allocation can throw `std::bad_alloc`. If `pop()` removes the value first, then tries to return or copy it, and the copy throws, the value is lost.

### Safe Pop Options

#### OPTION 1: PASS IN A REFERENCE

The caller provides a variable where the popped value should be stored.

```cpp
void pop(T& value) {
  std::lock_guard<std::mutex> lock(m);

    if (data.empty()) {
      throw empty_stack();
    }

    value = data.top();
    data.pop();
}

std::vector<int> result;
some_stack.pop(result);
```

This combines `top()` and `pop()` under one lock. The disadvantages are that the caller must construct a `T` object before calling `pop()`, constructing `T` may be expensive or require unavailable arguments, and `T` must be assignable.

#### OPTION 2: REQUIRE A NO-THROW COPY CONSTRUCTOR OR MOVE CONSTRUCTOR

Returning `T` directly can be safe:

```cpp
T pop();
```

You can express this requirement with type traits such as:

```cpp
std::is_nothrow_copy_constructible<T>
std::is_nothrow_move_constructible<T>
```

This gives a simple interface, but it restricts what types can be stored in the stack.

#### OPTION 3: RETURN A POINTER TO THE POPPED ITEM

```cpp
std::shared_ptr<T> pop();
```

A pointer can be copied without throwing, so the function can safely return the pointer after removing the item from the stack.

```cpp
std::shared_ptr<T> pop() {
    std::lock_guard<std::mutex> lock(m);

    if (data.empty()) {
        throw empty_stack();
    }

    std::shared_ptr<T> const result =
        std::make_shared<T>(data.top());

    data.pop();

    return result;
}
```

The important detail is that `result` is created before `data.pop()`. If creating or copying the `T` fails, the stack is not modified. The tradeoff is extra memory-management overhead, including possible heap allocation.

#### OPTION 4: PROVIDE BOTH OPTION 1 AND EITHER OPTION 2 OR 3

```cpp
std::shared_ptr<T> pop();
void pop(T& value);
```

This gives users flexibility. They can choose convenience with `auto value = s.pop();`, or avoid `shared_ptr` overhead with `T value; s.pop(value);`.

### Example Thread-Safe Stack

Notice that there is no `top()`. `pop()` combines read and remove. Assignment is deleted. `empty()` may still exist, but it is only a hint; another thread may change the stack immediately after `empty()` returns. Correct code should call `pop()` and handle `empty_stack` if needed.

```cpp
#include <exception>
#include <memory>
#include <mutex>
#include <stack>

struct empty_stack : std::exception {
    const char* what() const noexcept {
        return "empty stack";
    }
};

template<typename T>
class threadsafe_stack {
private:
    std::stack<T> data;
    mutable std::mutex m;

public:
    threadsafe_stack() {}

    threadsafe_stack(const threadsafe_stack& other) {
        std::lock_guard<std::mutex> lock(other.m);
        data = other.data;
    }

    threadsafe_stack& operator=(const threadsafe_stack&) = delete;

    void push(T new_value) {
        std::lock_guard<std::mutex> lock(m);
        data.push(std::move(new_value));
    }

    std::shared_ptr<T> pop() {
        std::lock_guard<std::mutex> lock(m);

        if (data.empty()) {
            throw empty_stack();
        }

        std::shared_ptr<T> const result =
            std::make_shared<T>(data.top());

        data.pop();

        return result;
    }

    void pop(T& value) {
        std::lock_guard<std::mutex> lock(m);

        if (data.empty()) {
            throw empty_stack();
        }

        value = data.top();
        data.pop();
    }

    bool empty() const {
        std::lock_guard<std::mutex> lock(m);
        return data.empty();
    }
};
```

The copy constructor locks `other.m` before copying `other.data`, because another thread may be modifying `other` while we copy it. The copy is done inside the constructor body instead of the initializer list so the mutex can be locked before copying the data.

Copy assignment is deleted because it is not clear how to implement it safely. If we want to assign one stack to another, we must lock both mutexes. But if two threads try to assign stacks to each other at the same time, they can deadlock.

But copy construction is safe because it only locks one mutex. The new stack is not shared with any other thread yet, so no other thread can be modifying it.

## Locking Granularity

A mutex must protect the entire operation that maintains an invariant, not just its individual steps.

If locking is too fine-grained, race conditions may still occur. For example, deleting a node from a linked list updates multiple pointers, so protecting each node independently may not preserve the list’s invariant. The lock must cover the complete delete operation.

However, locking too broadly also hurts performance. A single global mutex may ensure correctness, but it forces unrelated operations to block each other, increasing contention and reducing concurrency.

Fine-grained locking may require acquiring multiple mutexes in one operation, which can introduce deadlock.

## 3.2.4 Avoiding Deadlock

```c++
class some_big_object;
void swap(some_big_object& lhs,some_big_object& rhs);
class X {
private:
    some_big_object some_detail;
    std::mutex m;
public:
    X(some_big_object const& sd):some_detail(sd){}
    friend void swap(X& lhs, X& rhs) {
        if (&lhs==&rhs) return;

        std::lock(lhs.m,rhs.m);
        std::lock_guard<std::mutex> lock_a(lhs.m,std::adopt_lock);
        std::lock_guard<std::mutex> lock_b(rhs.m,std::adopt_lock);
        
        swap(lhs.some_detail,rhs.some_detail);
    }
};
```

`std::lock` locks multiple mutexes **without deadlock**. It may lock them in any order, but it guarantees that all locks are acquired before returning. If it cannot acquire all locks, it releases any locks it has already acquired and tries again.

The `std::adopt_lock` tag tells the `std::lock_guard` that the mutex is already locked, so it should not attempt to lock it again.

C++17 introduced `std::scoped_lock`, which can lock multiple mutexes at once and automatically unlock them when it goes out of scope. It is a simpler alternative to `std::lock` and `std::lock_guard`:

```c++
void swap(X& lhs, X& rhs) {
    if (&lhs==&rhs) return;

    std::scoped_lock lock(lhs.m, rhs.m);
    swap(lhs.some_detail, rhs.some_detail);
}
```

This example also use CTAD (Class Template Argument Deduction, C++17) to deduce the template arguments for `std::scoped_lock` from the constructor arguments.

However, `std::lock` and `std::scoped_lock` does not prevent deadlock if the mutexes are acquired separately.

### 3.2.5 Guidelines for Avoiding Deadlock

Deadlock can still occur without locks:
```c++
std::thread t1, t2;

t1 = std::thread([&] {
    t2.join(); // waits for t2
});

t2 = std::thread([&] {
    t1.join(); // waits for t1
});

t1.join();
t2.join();
```

#### Avoid nested locks

Don't acquire a lock if you already hold one. If you must acquire multiple locks, use `std::lock` or `std::scoped_lock` to acquire them all at once.

#### Avoid calling user-supplied code while holding a lock

#### Acquire locks in a fixed order

#### Use a lock hierarchy

When code tries to lock a mutex, it isn't permitted to lock that mutex if it already holds a lock from a lower layer. You can check this at runtime by assigning layer numbers to each mutex and keeping a record of which mutexes are locked by each thread. 

This is a common pattern, but C++ STD does not provide built-in support for it.

```c++
#include <iostream>
#include <thread>
#include <mutex>
#include <climits>

class hierarchical_mutex {
private:
    std::mutex internal_mutex;
    unsigned long const hierarchy_value;
    unsigned long previous_hierarchy_value;
    static thread_local unsigned long this_thread_hierarchy_value;
    
    void check_for_for_hierarchy_violation() {
        if(this_thread_hierarchy_value <= hierarchy_value) {
            throw std::logic_error("mutex hierarchy violated");
        }
    }
    
    void update_hierarchy_value () {
        previous_hierarchy_value = this_thread_hierarchy_value;
        this_thread_hierarchy_value = hierarchy_value;
    }
public:
    explicit hierarchical_mutex (unsigned long value) : hierarchy_value(value), previous_hierarchy_value(0) {}
    
    void lock() {
        check_for_for_hierarchy_violation();
        internal_mutex.lock();
        update_hierarchy_value();
    }
    void unlock() {
        if(this_thread_hierarchy_value!=hierarchy_value)
            throw std::logic_error(“mutex hierarchy violated”); 
        this_thread_hierarchy_value = previous_hierarchy_value;
        internal_mutex.unlock();
    }
    
    bool try_lock() {
        check_for_for_hierarchy_violation();
        if (!internal_mutex.try_lock()) {
            return false;
        }
        update_hierarchy_value();
        return true;
    }
};

thread_local unsigned long hierarchical_mutex::this_thread_hierarchy_value(ULONG_MAX);
```

Even though out-of-order unlocking does not cause deadlock, but to avoid the hierarchy violation, the mutex must be unlocked in the reverse order of locking. Other mechnisms are possible, but this is a simple and effective one.

#### Extending these guidelines beyond locks

For example, it is a bad idea to wait for a thread while holding a lock.

Similarly, if you're going to wait for a thread to finish, it might be worth identifying a thread hierarchy, so that a thread waits only for threads lower down the hierarchy.

### 3.2.6 Flexible locking with `std::unique_lock`

It does not always own the mutex. You can pass `std::adopt_lock` and `std::defer_lock` to the constructor to indicate that the mutex is already locked or that it should not be locked yet.

The lock can be acquired and released multiple times on `std::unique_lock` object (not the mutex).

The flexibility of `std::unique_lock` comes at a cost. It is larger than `std::lock_guard`, and it has more overhead for locking and unlocking.

It has a flag to indicate whether it currently owns the mutex. This flag is checked on every lock and unlock operation, which adds small overhead. This flag can be queried by calling `owns_lock()`.

> Unless you're going to be transferring lock ownership (`std::unique_lock` is moveable), or doing something else that requires `std::unique_lock`, you should prefer `std::scoped_lock` if it's available.
{: .prompt-warning }

## Alternative facilities for protecting shared data

### Protecting shared data during initialization

Using a mutex to do it may introduce extra overhead. A double-checking pattern is:

```c++
std::shared_ptr<some_resource> resource_ptr;
std::mutex resource_mutex;
void foo() {
    std::unique_lock<std::mutex> lk(resource_mutex);
    if(!resource_ptr) {
        resource_ptr.reset(new some_resource);
    }
    lk.unlock();
    resource_ptr->do_something();
}
```

This is not thread-safe because the pointer maybe assigned before the object is fully constructed, making one thread call `do_something()` on a partially constructed object.

Since C++11, you can use `std::call_once` to ensure that a function is called exactly once:

```c++
std::shared_ptr<some_resource> resource_ptr;
std::once_flag resource_flag;
void init_resource() {
  resource_ptr.reset(new some_resource);
}
void foo() {
    std::call_once(resource_flag,init_resource);
    resource_ptr->do_something();
}
```

We can also create thread-safe lazy-initialization of a class member using `std::call_once`:

```c++
class X {
private:
    connection_info connection_details;
    connection_handle connection;
    std::once_flag connection_init_flag;
    void open_connection() {
        connection=connection_manager.open(connection_details);
    }
public:
    X(connection_info const& connection_details_): connection_details(connection_details_) {}
    void send_data(data_packet const& data) {
        std::call_once(connection_init_flag,&X::open_connection,this);
        connection.send_data(data);
    }
    data_packet receive_data() {
        std::call_once(connection_init_flag,&X::open_connection,this);
        return connection.receive_data();
    }
};
```

In this example, the initialization is done either by the first call to `send_data()` or `receive_data()`.

The syntax is the same as the other functions in STD that accepts callable objects, such as constructors of `std::thread` and `std::bind`.

> `std::once_flag` is not movable or copyable, just like `std::mutex`. So if you use them as a class member, you must define these special member functions explicitly. Otherwise, the compiler will generate them, and the program will not compile.
{: .prompt-warning }

Because from C++11, static local variables are initialized in a thread-safe manner, we can also use a static local variable to implement lazy initialization where a single global instance is needed:

```c++
class my_class;
my_class& get_my_class_instance() {
    static my_class instance;
    return instance;
}
```

### Protecting rarely updated data structures

Using reader-writer locks. C++14 features `std::shared_timed_mutex`, and C++17 features `std::shared_mutex`.

`std::shared_timed_mutex` supports additional operations, so it might be less efficient if you don't need those operations. 

```c++
class dns_cache {
    // ...
    mutable std::shared_mutex cache_mutex;

public:
    dns_entry find_entry(std::string const& domain) const {
        std::shared_lock<std::shared_mutex> lk(cache_mutex); // read lock
        // ...
    }
    void add_entry(std::string const& domain, dns_entry const& entry) {
        std::unique_lock<std::shared_mutex> lk(cache_mutex); // write lock
        // ...
    }
}
```

### Recursive locking

With `std::mutex`, trying to lock the same mutex twice is UB. With `std::recursive_mutex`, the same thread can lock the mutex multiple times, but it must unlock it the same number of times before another thread can acquire the lock.

But most of the time, if you think you want a recursive mutex, you probably need to change your design instead.

Sometimes, a public member function calls another as part of its operations. The quick and dirty solution is to make the mutex recursive.  
But this is not recommended because the second member function needs to work even when called with the invariants broken (because the first member function has not finished yet).

A better solution is to refactor the code so that the public function calls a private helper function that does not lock the mutex.

## 4. Synchronizing concurrent operations

### 4.1.1. Condition variables

`std::condition_variable` is a synchronization primitive that allows threads to wait until notified by another thread. It is used in conjunction with a mutex to protect shared data.

There is also `std::condition_variable_any`, which can work with any lock type that meets the BasicLockable requirements, not just `std::unique_lock<std::mutex>`.

```c++
std::mutex mut;
std::queue<data_chunk> data_queue;
std::condition_variable data_cond;

void data_preparation_thread() {
    while (more_data_to_prepare()) {
        data_chunk const data=prepare_data();
        {
            std::lock_guard<std::mutex> lk(mut);
            data_queue.push(data);
        }
        data_cond.notify_one();
    }
}

void data_processing_thread() {
    while(true) {
        std::unique_lock<std::mutex> lk(mut);
        data_cond.wait(
            lk,[]{return !data_queue.empty(); });
        data_chunk data = data_queue.front();
        data_queue.pop();
        lk.unlock();

        process(data);
        if (is_last_chunk(data))
            break;
    }
}
```

Note that we push data into the queue in a smaller scope, so you notify the condition variable after releasing the lock. This is a good practice to avoid waking up a waiting thread only to have it block again on the mutex.

When the waiting thread reacquires the mutex and checks the condition, if it isn’t in direct response to a notification from another thread, it’s called a **spurious wake**.

> Therefore, it isn't advisable to use a function with side effects for the condition check.
{: .prompt-warning }

### 4.1.2. Building a thread-safe queue with condition variables

```c++
#include <queue>
#include <memory>
#include <mutex>
#include <condition_variable>

template<typename T>
class threadsafe_queue {
private:
    mutable std::mutex mut;
    std::queue<T> data_queue;
    std::condition_variable data_cond;
public:
 threadsafe_queue() {}
    threadsafe_queue(threadsafe_queue const& other) {
        std::lock_guard<std::mutex> lk(other.mut);
        data_queue=other.data_queue;
    }
    void push(T new_value) {
        std::lock_guard<std::mutex> lk(mut);
        data_queue.push(new_value);
        data_cond.notify_one();
    }
    void wait_and_pop(T& value) {
        std::unique_lock<std::mutex> lk(mut);
        data_cond.wait(lk,[this]{return !data_queue.empty();});
        value=data_queue.front();
        data_queue.pop();
    }
    std::shared_ptr<T> wait_and_pop() {
        std::unique_lock<std::mutex> lk(mut);
        data_cond.wait(lk,[this]{return !data_queue.empty();});
        std::shared_ptr<T> res(std::make_shared<T>(data_queue.front()));
        data_queue.pop();
        return res;
    }
    bool try_pop(T& value) {
        std::lock_guard<std::mutex> lk(mut);
        if(data_queue.empty())
            return false;
        value=data_queue.front();
        data_queue.pop();
        return true;
    }
    std::shared_ptr<T> try_pop() {
        std::lock_guard<std::mutex> lk(mut);
        if(data_queue.empty())
            return std::shared_ptr<T>();
        std::shared_ptr<T> res(std::make_shared<T>(data_queue.front()));
        data_queue.pop();
        return res;
    }
    bool empty() const {
        std::lock_guard<std::mutex> lk(mut);
        return data_queue.empty();
    }
};
```

### 4.2. Waiting for one-off events with futures

There are two sorts of futures in C++ STD: `std::future` and `std::shared_future`.

An instance of `std::future` is the one and only instance that refers to its associated event, whereas multiple instances of `std::shared_future` can refer to the same event. A `std::shared_future` can be copied, but a `std::future` cannot.

In the `std::shared_future` case, all the instances will become ready at the same time, and they may all access any data associated with the event. 

`std::future<void>` should be used where there’s no associated data.

#### 4.2.1. Returning values from background tasks (`std::async`)

```c++
#include <future>
#include <iostream>
int find_the_answer_to_ltuae();
void do_other_stuff();
int main() {
    std::future<int> the_answer=std::async(find_the_answer_to_ltuae);
    do_other_stuff();
    std::cout<<"The answer is "<<the_answer.get()<<std::endl;
}
```

```c++
#include <string>
#include <future>
struct X {
    void foo(int,std::string const&);
    std::string bar(std::string const&);
};

X x;
auto f1=std::async(&X::foo,&x,42,"hello"); // call x.foo(42,"hello")
auto f2=std::async(&X::bar,x,"goodbye");   // call tmpx.bar("goodbye"), where tmpx is a copy of x

struct Y {
    double operator()(double);
};

Y y;
auto f3=std::async(Y(),3.141);          // call tmpy(3.141), where tmpy is move-constructed from Y()
auto f4=std::async(std::ref(y),2.718);  // call y(2.718)

X baz(X&);
std::async(baz,std::ref(x)); // call baz(x)

class move_only {
public:
    move_only();
    move_only(move_only&&)
    move_only(move_only const&) = delete;
    move_only& operator=(move_only&&);
    move_only& operator=(move_only const&) = delete;
    void operator()();
};

auto f5=std::async(move_only()); // call tmp(), where tmp is move-constructed from move_only()
```

By default, it’s up to the implementation whether `std::async` starts a new thread, or whether the task runs synchronously when the future is waited for.  
In most cases this is what you want, but you can specify which to use with an additional parameter to `std::async` before the function to call. This parameter is of the type `std::launch`:

- `std::launch::deferred`: indicate that the function call is to be deferred until a non-timed waiting function such as
`wait() `or `get()` is called. It executes synchronously in the thread that
performs that first wait.
- `std::launch::async`: indicate that the function call is to be run asynchronously in a separate thread.
-  `std::launch::deferred | std::launch::async` (default): indicate that the implementation may choose.

If the function call is deferred, it may never run. For example:
```c++
auto f6=std::async(std::launch::async,Y(),1.2);             // run in new thread
auto f7=std::async(std::launch::deferred,baz,std::ref(x));  // run when f7.wait() or f7.get() is called
auto f8=std::async(
    std::launch::deferred | std::launch::async,             // implementation chooses
    baz,std::ref(x));
auto f9=std::async(baz,std::ref(x));                        // implementation chooses
f7.wait();                                                  // invoke deferred call
```

#### 4.2.2. Associating a task with a future (`std::packaged_task`)

The type don't have to match exactly; you can construct a `std::packaged_task<double(doubl)>` from a function that takes an `int` and return a `float` because the types are implicitly convertible.

The return type of the specified function signature identifies the type of the `std::future<>` returned from the `get_future()` member function, whereas the argument list of the function signature is used to specify the signature of the packaged task’s function call operator.

```c++
template<>
class packaged_task<std::string(std::vector<char>*,int)> {
public:
    template<typename Callable>
    explicit packaged_task(Callable&& f);
    std::future<std::string> get_future();    // returns a `std::future<std::string>` that will hold the result of the task
    void operator()(std::vector<char>*,int);  // invokes the task with the specified arguments (`std::vector<char>*` and `int` in this case)
};
```

The `std::packaged_task` object is a callable object, and it can be wrapped in a `std::function` object, passed to a `std::thread` as the thread function, passed to another function that requires a callable object, or even invoked directly.

You can thus wrap a task in a `std::packaged_task` and retrieve the future before passing the `std::packaged_task` object elsewhere to be invoked in due course. 

##### Passing tasks between threads

This is a common pattern for GUI applications. Often, there is a single GUI thread that handles all the user interface events, and other threads that perform background work. The background threads can post tasks to the GUI thread to update the user interface.

```c++
#include <deque>
#include <mutex>
#include <future>
#include <thread>
#include <utility>

std::mutex m;
std::deque<std::packaged_task<void()> > tasks;
bool gui_shutdown_message_received();
void get_and_process_gui_message();

void gui_thread() {
    while(!gui_shutdown_message_received()) {
        get_and_process_gui_message();
        std::packaged_task<void()> task;
        {
            std::lock_guard<std::mutex> lk(m);
            if(tasks.empty())
                continue;
            task=std::move(tasks.front());
            tasks.pop_front();
        }
        task();
    }
}

std::thread gui_bg_thread(gui_thread);

template<typename Func>
std::future<void> post_task_for_gui_thread(Func f) {
    std::packaged_task<void()> task(f);
    std::future<void> res=task.get_future();
    std::lock_guard<std::mutex> lk(m);
    tasks.push_back(std::move(task));
    return res;
}
```

#### 4.2.3. Making (std::)promises

```c++
#include <future>
void process_connections(connection_set& connections) {
    while(!done(connections)) {
        for(connection_iterator connection=connections.begin(),end=connections.end();
                connection!=end; ++connection) {
            if(connection->has_incoming_data()) {
                data_packet data=connection->incoming();
                std::promise<payload_type>& p=
                connection->get_promise(data.id);
                p.set_value(data.payload);
            }
            if(connection->has_outgoing_data()) {
                outgoing_packet data=connection->top_of_outgoing_queue();
                connection->send(data.payload);
                data.promise.set_value(true);
            }
        }
    }
}
```

The code above shows how to use `std::promise` to communicate between threads. Each connection has a promise associated with it, and when data is received or sent, the promise is fulfilled by calling `set_value()`.
* When a connection has incoming data, the promise is retrieved using `get_promise()` and the payload is set using `set_value()`, which will make the associated future ready and allow any waiting threads to retrieve the payload.
* When a connection has outgoing data, the promise is set to true after the data is sent, which will make the associated future ready and allow any waiting threads to know that the data has been sent.

#### 4.2.4 Saving an exception for the future

If the function call invoked as part of `std::packaged_task` or `std::async` throws an exception, the exception is stored in the future in place of a stored value, the future becomes ready, and a call to `get()` will rethrow the exception. (Note: the standard leaves it unspecified whether it is the original exception object that’s rethrown or a copy; different compilers and libraries make different choices on this matter)

`std::promise` has a `set_exception()` to store an exception in the associated future.

```c++
extern std::promise<double> some_promise;
try {
    some_promise.set_value(calculate_value());
}
catch(...) {
    some_promise.set_exception(std::current_exception());
}
```

This use `std::current_exception()` to retrieve the thrown exception.

> We shouldn't use `catch(const std::exception& e)`, partly because `set_exception()` takes a `std::exception_ptr`, not a `std::exception`. We can cast the `std::exception` to `std::exception_ptr` using `std::make_exception_ptr()`, but that would create a copy of the exception object, and also the static type of the exception is `std::exception`, so the dynamic type information is sliced. `std::current_exception()` returns a `std::exception_ptr` that points to the original exception object, preserving its dynamic type.

> `set_exception()` requires a `std::exception_ptr`, so the caught exception object cannot be passed directly. Using `std::make_exception_ptr(e)` would create a new exception object based on the static type of `e`, which is `std::exception`, causing slicing if the original exception was a derived type such as `std::runtime_error`.  
> Instead, `std::current_exception()` obtains an `std::exception_ptr` referring to the currently handled exception while preserving its dynamic type. catch (...) is often used so that non-`std::exception` exceptions are preserved as well.
{: .prompt-warning }

We can also use:
```c++
some_promise.set_exception(std::make_exception_ptr(std::logic_error("foo ")));
```
This is much cleaner than using a try/catch block if the type of the exception is known, and it should be used in preference; not only does it simplify the code, but it also provides the compiler with greater opportunity to optimize the code.

Another way to store an exception in a future is to destroy the `std::promise` or `std::packaged_task` without calling either of the set functions on the promise or invoking the packaged task. The destructor of `std::promise` or `std::packaged_task` will store a `std::future_error` exception with an error code of `std::future_errc::broken_promise` in the associated future.

#### 4.2.5. Waiting from multiple futures

`std::shared_future<T>` allows multiple consumers to access the same asynchronous result. It is copyable, and each thread should normally receive its own copy.

Different copies may safely call `wait()` or `get()` while referring to the same shared state. There is only one stored result, and for a non-reference type `T`, `std::shared_future<T>::get()` returns `const T&`, so every caller observes the same object. The result must therefore not be modified concurrently.

> Multiple threads should not concurrently access the exact same `std::shared_future` object without synchronization. Instead, give each thread its own copy.
{: .prompt-warning }

To convert a `std::future<T>` into a `std::shared_future<T>`, call `std::future<T>::share()` or move the `std::future<T>` into the constructor of `std::shared_future<T>`. The original `std::future` becomes invalid after ownership is transferred.


```c++
std::promise<int> p;
std::future<int> f(p.get_future());
assert(f.valid());
std::shared_future<int> sf(std::move(f));
assert(!f.valid());
assert(sf.valid()); 

std::promise<std::string> p;
std::shared_future<std::string> sf(p.get_future()); 

std::promise< std::map< SomeIndexType, SomeDataType, SomeComparator, SomeAllocator>::iterator> p;
auto sf=p.get_future().share(); 

std::promise<std::string> p;
std::shared_future sf(p.get_future()); // C++17 CTAD
```

### 4.3 Waiting with a time limit

#### 4.3.1. Clocks

A clock class provides four things:

* **Current time:** `Clock::now()`, returning `Clock::time_point`.
* **Time-point type:** the `time_point` member type used to represent points on that clock’s timeline.
* **Tick period:** `Clock::period`, a `std::ratio` representing the nominal seconds per tick. For example, 25 ticks per second means `std::ratio<1, 25>`. The actual observed period may differ, especially when the exact period is unknown or varies at runtime.
* **Steadiness:** `Clock::is_steady` is `true` when time advances uniformly and never moves backward.

Main standard clocks:

* `std::chrono::system_clock`: represents wall-clock time and supports conversion to and from `std::time_t`. It is usually not steady because system time may be adjusted.
* `std::chrono::steady_clock`: monotonic and suitable for measuring elapsed time and implementing timeouts.
* `std::chrono::high_resolution_clock`: provides the smallest available tick period, but may simply be an alias for another clock.

All are defined in `<chrono>`.

#### 4.3.2. Durations

Durations are handled by the `std::chrono::duration` class template.

The first parameter is the representation type (such as `int`, `long`, or `double`). The second parameter is a `std::ratio` representing the tick period (how many seconds per tick).

```c++
std::chrono::duration<short, std::ratio<60, 1>> // represents a duration in minutes, with a `short` representation type
std::chrono::duration<double, std::ratio<1, 1000>> // represents a duration in milliseconds, with a `double` representation type
```

The STD library provides type aliases for common durations:
```c++
using std::chrono::nanoseconds;
using std::chrono::microseconds;
using std::chrono::milliseconds;
using std::chrono::seconds;
using std::chrono::minutes;
using std::chrono::hours;
```

For convenience, there are a number of predefined literal suffix operators for durations in the `std::chrono_literals` namespace:
```c++
using namespace std::chrono_literals;
auto one_day = 24h; // 24 hours
auto half_an_hour = 30min; // 30 minutes
auto one_second = 1s; // 1 second
```
These suffixes are equivalent to using the predefined duration typedefs, so `15ns` and `std::chrono::nanoseconds(15)` are equivalent.

> Floating-point duration literals such as `2.5min` create a floating-point `std::chrono::duration` with an implementation-chosen representation type: `duration<floating-point type, std::ratio<60>>`.  
> To control precision or range, construct the duration explicitly: `std::chrono::duration<long double, std::ratio<60>> d{2.5L};`
{: .prompt-warning }

Conversion between durations is implicit where it does not require truncation of the value. Explicit conversion can be done with `std::chrono::duration_cast`:
```c++
std::chrono::milliseconds ms(54802);
std::chrono::seconds s= std::chrono::duration_cast<std::chrono::seconds>(ms);
```

The result is **truncated** (rounded toward zero) not rounded, so `s` will be 54 seconds, not 55 seconds.

```c++
std::future<int> f=std::async(some_task);
if(f.wait_for(std::chrono::milliseconds(35))==std::future_status::ready)
  do_something_with(f.get());
```

The `wait` function returns `std::future_status::timeout` if the wait times out, `std::future_status::ready` if the future is ready, or `std::future_status::deferred` if the future is deferred.

#### 4.3.3. Time points

Time points are handled by the `std::chrono::time_point` class template.

The first parameter is the clock type, and the second parameter is the unit of measurement. The value of a time point is the length of time (in multiples of the specified duration) since a specific point in time called the **epoch** of the clock.

The epoch is not directly available to query by C++ STD. Typical epochs are:
* Unix epoch (1970-01-01 00:00:00 UTC)
* the instant when the computer running the application booted up

You can get `time_since_epoch()` for a given `time_point`, which returns a `duration` representing the time elapsed since the epoch.

You can add durations and subtract durations from time points, and you can subtract two time points to get a duration.

```c++
std::chrono::time_point<std::chrono::system_clock, std::chrono::minutes> // represents a time point in minutes since the epoch of `std::chrono::system_clock`
std::chrono::system_clock::time_point tp=std::chrono::system_clock::now();
std::chrono::system_clock::duration d=tp.time_since_epoch();
std::chrono::system_clock::time_point tp2(d); // construct a time_point from a duration since the epoch
std::chrono::system_clock::time_point tp3=tp+d; // add a duration to a time_point
std::chrono::system_clock::time_point tp4=tp-d; // subtract a duration
std::chrono::system_clock::duration d2=tp2-tp; // subtract two time_points to get a duration
```

To wait for a condition variable with a timeout, use:
```c++
#include <condition_variable>
#include <mutex>
#include <chrono>
std::condition_variable cv;
bool done;
std::mutex m;
bool wait_loop() {
    auto const timeout= std::chrono::steady_clock::now()+
    std::chrono::milliseconds(500);
    std::unique_lock<std::mutex> lk(m);
    while(!done) {
        if(cv.wait_until(lk,timeout)==std::cv_status::timeout)
        break;
    }
    return done;
}
```

This way, the overall length of the loop is bounded. If you use `wait_for()` instead, the loop could run for an unbounded length of time if spurious wakes occur.

#### 4.3.4. Functions that accept timeouts

| Class / namespace                                                              | Functions                                                                          | Return values                                                                                                                                                                                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `std::this_thread` namespace                                                   | `sleep_for(duration)`<br>`sleep_until(time_point)`                                 | N/A                                                                                                                                                                                                     |
| `std::condition_variable` or `std::condition_variable_any`                     | `wait_for(lock, duration)`<br>`wait_until(lock, time_point)`                       | `std::cv_status::timeout` or `std::cv_status::no_timeout`                                                                                                                                               |
| `std::condition_variable` or `std::condition_variable_any`                     | `wait_for(lock, duration, predicate)`<br>`wait_until(lock, time_point, predicate)` | `bool`&mdash;the return value of the predicate when woken                                                                                                                                               |
| `std::timed_mutex`, `std::recursive_timed_mutex`, or `std::shared_timed_mutex` | `try_lock_for(duration)`<br>`try_lock_until(time_point)`                           | `bool`&mdash;`true` if the lock was acquired, `false` otherwise                                                                                                                                         |
| `std::shared_timed_mutex`                                                      | `try_lock_shared_for(duration)`<br>`try_lock_shared_until(time_point)`             | `bool`&mdash;`true` if the lock was acquired, `false` otherwise                                                                                                                                         |
| `std::unique_lock<TimedLockable>`                                              | `unique_lock(lockable, duration)`<br>`unique_lock(lockable, time_point)`           | N/A&mdash;`owns_lock()` on the newly constructed object returns `true` if the lock was acquired, `false` otherwise                                                                                      |
| `std::unique_lock<TimedLockable>`                                              | `try_lock_for(duration)`<br>`try_lock_until(time_point)`                           | `bool`&mdash;`true` if the lock was acquired, `false` otherwise                                                                                                                                         |
| `std::shared_lock<SharedTimedLockable>`                                        | `shared_lock(lockable, duration)`<br>`shared_lock(lockable, time_point)`           | N/A&mdash;`owns_lock()` on the newly constructed object returns `true` if the lock was acquired, `false` otherwise                                                                                      |
| `std::shared_lock<SharedTimedLockable>`                                        | `try_lock_for(duration)`<br>`try_lock_until(time_point)`                           | `bool`&mdash;`true` if the lock was acquired, `false` otherwise                                                                                                                                         |
| `std::future<ValueType>` or `std::shared_future<ValueType>`                    | `wait_for(duration)`<br>`wait_until(time_point)`                                   | `std::future_status::timeout` if the wait timed out, `std::future_status::ready` if the future is ready, or `std::future_status::deferred` if the future holds a deferred function that has not started |

### 4.4. Using synchronization of operations to simplify code

#### 4.4.1. Functional programming with futures

Parallel quick sort is a good example of using futures to simplify code. The algorithm is as follows:
```c++
template<typename T>
std::list<T> parallel_quick_sort(std::list<T> input) {
    if(input.empty()) {
        return input;
    }
    std::list<T> result;
    result.splice(result.begin(),input,input.begin());
    T const& pivot=*result.begin();
    auto divide_point=std::partition(input.begin(),input.end(),
        [&](T const& t){return t<pivot;});
    std::list<T> lower_part;
    lower_part.splice(lower_part.end(),input,input.begin(),divide_point);
    std::future<std::list<T> > new_lower(
        std::async(&parallel_quick_sort<T>,std::move(lower_part)));
    auto new_higher(
        parallel_quick_sort(std::move(input)));
    result.splice(result.end(),new_higher);
    result.splice(result.begin(),new_lower.get());
    return result;
}
```
If the library decides there are too many spawned tasks (perhaps because the number of tasks has exceeded the available hardware concurrency), it may switch to spawning the new tasks synchronously. They will run in the thread that calls `get()` rather than on a new
thread, thus avoiding the overhead of passing the task to another thread when this
won’t help the performance.

> The STD does not guarantee intelligent scaling or a thread pool: an implementation may create excessive threads or defer all tasks. Use a controlled thread pool when predictable resource usage is required.
{: .prompt-warning }

#### 4.4.2. Synchronizing operations with message passing

Communicating Sequential Processes
```c++
struct card_inserted {
    std::string account;
};
class atm {
    messaging::receiver incoming;
    messaging::sender bank;
    messaging::sender interface_hardware;
    void (atm::*state)();
    std::string account;
    std::string pin;

    void waiting_for_card() {
        interface_hardware.send(display_enter_card());
        incoming.wait().handle<card_inserted>([&](card_inserted const& msg) {
            account=msg.account;
            pin="";
            interface_hardware.send(display_enter_pin());
            state=&atm::getting_pin;
        });
    }
    void getting_pin() {
        incoming.wait().handle<digit_pressed>([&](digit_pressed const& msg) {
            unsigned const pin_length=4;
            pin+=msg.digit;
            if(pin.length()==pin_length) {
                bank.send(verify_pin(account,pin,incoming));
                state=&atm::verifying_pin;
            }
        }).handle<clear_last_pressed>([&](clear_last_pressed const& msg) {
            if(!pin.empty()) {
                pin.resize(pin.length()-1);
            }
        }).handle<cancel_pressed>([&](cancel_pressed const& msg) {
            state=&atm::done_processing;
        });
    }

public:
    void run() {
        state=&atm::waiting_for_card;
        try {
            for(;;) {
                (this->*state)();
            }
        } catch(messaging::close_queue const&) {
        }
    }
};
```

This style of program design is called the **Actor model**. there are several discrete actors in the system (each running on a separate thread), which send messages to each other to perform the task at hand, and there’s no shared state except that which is directly passed via messages.

#### 4.4.3. Continuation-style concurrency with the Concurrency TS

This is new feature of `std::experimental::future` in the Concurrency TS.

```c++
std::experimental::future<int> find_the_answer;
auto fut=find_the_answer();
auto fut2=fut.then(find_the_question);
assert(!fut.valid()); // fut is invalid after the continuation is created
assert(fut2.valid());
```

The continuation is passed a ready future that holds the result of the original future.

Assuming `find_the_answer()` returns an `int`, then `find_the_question()` signature is:
```c++
int find_the_question(std::experimental::future<int> the_answer);
```

This is because the continuation was chained by end up holding a value or an exception. So when passing the future, the continuation can handle the exception.

#### 4.4.4. Chaining continuations

To process user login, you may write something like this:
```c++
void process_login(std::string const& username,std::string const& password) {
    try {
        user_id const id=backend.authenticate_user(username,password);
        user_data const info_to_display=backend.request_current_info(id);
        update_display(info_to_display);
    } catch(std::exception& e){
        display_error(e);
    }
}
```

However, you don't want sequential code, you want asynchronous code so you're not blocking the UI thread. With plain `std::async`, you could punt it all to a background thread like this but that would still block that thread, consuming resources while doing nothing but waiting for the tasks to complete:
```c++
std::future<void> process_login(std::string const& username,std::string const& password) {
    return std::async(std::launch::async,[=](){
        try {
            user_id const id=backend.authenticate_user(username,password);
            user_data const info_to_display=backend.request_current_info(id);
            update_display(info_to_display);
        } catch(std::exception& e){
            display_error(e);
        }
    });
}
```

You need continuations to avoid blocking the background thread while waiting for the results of the asynchronous operations. You can chain continuations like this:
```c++
std::experimental::future<void> process_login(std::string const& username,std::string const& password) {
    return spawn_async([=](){
        return backend.authenticate_user(username,password);
    }).then([](std::experimental::future<user_id> id){
        return backend.request_current_info(id.get());
    }).then([](std::experimental::future<user_data> info_to_display){
        try{
            update_display(info_to_display.get());
        } catch(std::exception& e){
            display_error(e);
        }
    });
}
```

But this only divides the task into individual parts, and they're still blocking calls. You need the backend to return futures that become ready when the data is ready, without blocking any threads.

In this case, `backend.async_authenticate_user(username,password)` will
now return a `std::experimental::future<user_id>` rather than a plain `user_id`.

Thanksfully, if the continuation function returns a `std::experimental::future<T>`, the continuation will automatically unwrap it and return a `std::experimental::future<T>` instead of a `std::experimental::future<std::experimental::future<T>>`. This is called **continuation unwrapping**.

```c++
std::experimental::future<void> process_login(std::string const& username,std::string const& password) {
    return backend.async_authenticate_user(username,password)
    .then([](std::experimental::future<user_id> id){
        return backend.async_request_current_info(id.get());
    }).then([](std::experimental::future<user_data> info_to_display){
        try{
            update_display(info_to_display.get());
        } catch(std::exception& e){
            display_error(e);
        }
    });
}
```

`std::experimental::shared_future`:

```c++
auto fut=spawn_async(some_function).share();
auto fut2=fut.then([](std::experimental::shared_future<some_data> data){
    do_stuff(data);
});
auto fut3=fut.then([](std::experimental::shared_future<some_data> data){
    return do_other_stuff(data);
});
```

`fut` is `std::experimental::shared_future`, but `fut2` and `fut` are `std::experimental::future`.

#### 4.4.5. Waiting for more than one future

Suppose we have a large volume of data to process, and each item can be processed independently. We can divide the data into chunks, and process each chunk in a separate thread. When all the chunks are processed, we can gather the results:
```c++
std::future<FinalResult> process_data(std::vector<MyData>& vec) {
    size_t const chunk_size=whatever;
    std::vector<std::future<ChunkResult>> results;
    for(auto begin=vec.begin(),end=vec.end();beg!=end;){
        size_t const remaining_size=end-begin;
        size_t const this_chunk_size=std::min(remaining_size,chunk_size);
        results.push_back(std::async(process_chunk,begin,begin+this_chunk_size));
        begin+=this_chunk_size;
    }
    return std::async([all_results=std::move(results)](){
        std::vector<ChunkResult> v;
        v.reserve(all_results.size());
        for(auto& f: all_results) {
            v.push_back(f.get());
        }
        return gather_results(v);
    });
}
```

However, the waiting thread have to wait for each task individually, it will repeatedly be woken by the scheduler as each result becomes available, and then go back to sleep again when it finds another result that is not yet ready. Not only does this occupy the thread doing the waiting, but it adds additional context switches as each future becomes ready, which adds additional overhead.

With `std::experimental::when_all`, this waiting and switching can be avoided.

```c++
std::experimental::future<FinalResult> process_data(std::vector<MyData>& vec) {
    size_t const chunk_size=whatever;
    std::vector<std::experimental::future<ChunkResult>> results;
    for(auto begin=vec.begin(),end=vec.end();beg!=end;){
        size_t const remaining_size=end-begin;
        size_t const this_chunk_size=std::min(remaining_size,chunk_size);
        results.push_back(spawn_async(process_chunk,begin,begin+this_chunk_size));
        begin+=this_chunk_size;
    }
    return std::experimental::when_all(results.begin(),results.end())
    .then([](std::future<std::vector<std::experimental::future<ChunkResult>>> ready_results){
        std::vector<std::experimental::future<ChunkResult>> all_results=ready_results.get();
        std::vector<ChunkResult> v;
        v.reserve(all_results.size());
        for(auto& f: all_results) {
            v.push_back(f.get());
        }
        return gather_results(v);
    });
}
```

#### 4.4.6. Waiting for the first future in a set with when_any

Suppose you are searching a large dataset for a value that meets particular criteria, but
if there are multiple such values, then any will do.

Here, you can use `std::experimental::when_any` to gather the futures together,
and provide a new future that is ready when at least one of the original set is ready. 
Whereas `when_all` gave you a future that wrapped the collection of futures you passed
in, when_any adds a further layer, combining the collection with an index value that
indicates which future triggered the combined future to be ready into an instance of
the `std::experimental::when_any_result` class template.

```c++
std::experimental::future<FinalResult> find_and_process_value(std::vector<MyData> &data){
    unsigned const concurrency = std::thread::hardware_concurrency();
    unsigned const num_tasks = (concurrency > 0) ? concurrency : 2;
    std::vector<std::experimental::future<MyData *>> results;
    auto const chunk_size = (data.size() + num_tasks - 1) / num_tasks;
    auto chunk_begin = data.begin();
    std::shared_ptr<std::atomic<bool>> done_flag = std::make_shared<std::atomic<bool>>(false);
    for (unsigned i = 0; i < num_tasks; ++i) {
        auto chunk_end = (i < (num_tasks - 1)) ? chunk_begin + chunk_size : data.end();
        results.push_back(spawn_async([=] {
            for (auto entry = chunk_begin;!*done_flag && (entry != chunk_end);++entry) {
                if (matches_find_criteria(*entry)) {
                    *done_flag = true;
                    return &*entry;
                }
            }
            return (MyData *)nullptr;
        }));
        chunk_begin = chunk_end;
    }
    std::shared_ptr<std::experimental::promise<FinalResult>> final_result =
        std::make_shared<std::experimental::promise<FinalResult>>();
    struct DoneCheck {
        std::shared_ptr<std::experimental::promise<FinalResult>> final_result;
        DoneCheck(std::shared_ptr<std::experimental::promise<FinalResult>> final_result_)
            : final_result(std::move(final_result_)) {}
        void operator()(
              std::experimental::future<
                std::experimental::when_any_result<
                  std::vector<
                    std::experimental::future<MyData *>>>> 
                  results_param) {
            auto results = results_param.get();
            MyData *const ready_result = results.futures[results.index].get();
            if (ready_result) {
                final_result->set_value(process_found_value(*ready_result));
            } else {
                results.futures.erase(results.futures.begin() + results.index);
                if (!results.futures.empty()) {
                    std::experimental::when_any(
                        results.futures.begin(), 
                        results.futures.end()
                    ).then(std::move(*this));
                } else {
                    final_result->set_exception(std::make_exception_ptr(std::runtime_error("Not found")));
                }
            }
        }
    };
    std::experimental::when_any(results.begin(), results.end())
        .then(DoneCheck(final_result));
    return final_result->get_future();
}
```

This have to use `shared_ptr` to manage the lifetime of the promise and the done flag, because the continuation may be invoked after the `find_and_process_value()` function has returned.

You write the continuation as a class because you want to reuse it recursively.

When one of the initial tasks is ready, the `DoneCheck` function call operator is invoked.

`when_all()` and `when_any()` have two forms:

* **Iterator-range overload:** accepts futures from a container and returns results stored in a `std::vector`.
* **Variadic overload:** accepts futures directly and returns results stored in a `std::tuple`, allowing different future types.

```c++
std::experimental::future<int> f1=spawn_async(func1);
std::experimental::future<std::string> f2=spawn_async(func2);
std::experimental::future<double> f3=spawn_async(func3);
std::experimental::future<
    std::tuple<
        std::experimental::future<int>,
        std::experimental::future<std::string>,
        std::experimental::future<double>>> result=
    std::experimental::when_all(std::move(f1),std::move(f2),std::move(f3));
```

#### 4.4.7. Latches and barriers in the Concurrency TS

### Latch vs Barrier

`std::latch` is a one-shot countdown synchronization object. Any thread may decrement its counter, including multiple times. Once the counter reaches zero, all waiters are released, and the latch remains permanently ready.

`std::barrier` synchronizes a fixed group of participating threads in repeated phases. Each thread arrives once per phase and waits until all participants arrive. When all threads arrive, they are released, and the barrier resets for the next phase.

#### 4.4.8. A basic latch type: std::experimental::latch

```c++
id foo(){
    unsigned const thread_count=...;
    latch done(thread_count);
    my_data data[thread_count];
    std::vector<std::future<void> > threads;
    for(unsigned i=0;i<thread_count;++i)
        threads.push_back(std::async(std::launch::async,[&,i]{
            data[i]=make_data(i);
            done.count_down();
            do_more_stuff();
        }));
    done.wait();
    process_data(data,thread_count);
}
```

Note that everything is captured by reference, except `i`.

It is safe to access `data` in the `process_data` call `g`, even though it is stored by
tasks running in other threads, because the latch is a synchronization object, so
changes visible to a thread that call `count_down` are guaranteed to be visible to a
thread that returns from a call to wait on the same latch object. 

Formally, the call to `count_down` synchronizes with the call to `wait`.

#### 4.4.9. std::experimental::barrier: a basic barrier

The Concurrency TS provides `std::experimental::barrier` and `std::experimental::flex_barrier`.

### `std::barrier`

`std::barrier` synchronizes a group of threads across repeated processing phases.

Each thread performs its work independently, then calls `barrier.arrive_and_wait()`. All participating threads wait until everyone has arrived. They are then released together, and the barrier resets for the next phase.

A thread may permanently leave future phases with `barrier.arrive_and_drop()`. This counts as its arrival for the current phase and reduces the required participant count for later phases.


```c++
result_chunk process(data_chunk);
std::vector<data_chunk> divide_into_chunks(data_block data, unsigned num_threads);

void process_data(data_source &source, data_sink &sink) {
    unsigned const concurrency = std::thread::hardware_concurrency();
    unsigned const num_threads = (concurrency > 0) ? concurrency : 2;
    std::experimental::barrier sync(num_threads);
    std::vector<joining_thread> threads(num_threads);
    std::vector<data_chunk> chunks;
    result_block result;
    for (unsigned i = 0; i < num_threads; ++i) {
        threads[i] = joining_thread([&, i] {
            while (!source.done()) {
                if (!i) {
                    data_block current_block = source.get_next_data_block();
                    chunks = divide_into_chunks(current_block, num_threads);
                }
                sync.arrive_and_wait();
                result.set_chunk(i, num_threads, process(chunks[i]));
                sync.arrive_and_wait();
                if (!i) {
                    sink.write_data(std::move(result));
                }
            }
        });
    }
} 
```

#### 4.4.10. std::experimental::flex_barrier

`flex_barrier` is like `barrier`, but its constructor also accepts a completion function.

```c++
std::experimental::flex_barrier sync(
    count,
    [] {
        // runs once after all participants arrive
        return next_count;
    }
);
```

The completion function:
* runs exactly once per phase on one arriving thread;
* performs serial work between phases;
* returns the required participant count for the next phase.

Unlike `arrive_and_drop()`, the next count may increase or decrease. The programmer must ensure exactly that many threads arrive in the next phase.

```c++
void process_data(data_source &source, data_sink &sink) {
    unsigned const concurrency = std::thread::hardware_concurrency();
    unsigned const num_threads = (concurrency > 0) ? concurrency : 2;
    std::vector<data_chunk> chunks;
    auto split_source = [&] {
        if (!source.done()) {
            data_block current_block = source.get_next_data_block();
            chunks = divide_into_chunks(current_block, num_threads);
        }
    };
    split_source();
    result_block result;

    std::experimental::flex_barrier sync(num_threads, [&] {
        sink.write_data(std::move(result));
        split_source();
        return -1;
    });
    std::vector<joining_thread> threads(num_threads);
    for (unsigned i = 0; i < num_threads; ++i) {
        threads[i] = joining_thread([&, i] {
            while (!source.done()) {
                result.set_chunk(i, num_threads, process(chunks[i]));
                sync.arrive_and_wait();
            }
        });
    }
}
```
