---
title: An Introduction to Multithreading in C++20
date: 2026-07-23 00:00:00 +0800
categories: [cpp]
tags: [cpp, c++, concurrency, multithreading, cppcon]
description: An Introduction to Multithreading in C++20 - Anthony Williams - CppCon 2022
math: true
---

Source: [An Introduction to Multithreading in C++20 - Anthony Williams - CppCon 2022](https://youtu.be/A7sVFJLJM-A?si=84JShv82DP5ztvgl)

## Choosing a concurrency model

There are two fundamental reasons to use multiple threads:

- **Scalability:** finish work faster by running parts of it in parallel.
- **Separation of concerns:** keep conceptually independent activities independent, even when raw performance is not the priority.

The reason for introducing concurrency should drive the design.

### Scaling and Amdahl's law

If the goal is scalability, Amdahl's law limits the maximum possible speedup:

$$
S = \frac{1}{(1-p) + \frac{p}{n}}
$$

where:

- $S$ is the maximum speedup multiplier;
- $p$ is the fraction of the program that can run in parallel; and
- $n$ is the number of processors.

The sequential portion eventually dominates, however many processors are added.

### Parallel algorithms

Many standard-library algorithms accept an execution policy:
```c++
std::vector<MyData> data = /* ... */;

std::sort(
    std::execution::par,
    data.begin(),
    data.end(),
    MyComparator{});
```

Also look for consecutive operations that can be fused. For example, a parallel transform followed by a parallel reduction makes two passes and introduces a **boundary** between them:

```c++
std::transform(std::execution::par, /* ... */);
std::reduce(std::execution::par, /* ... */);
```

`std::transform_reduce` can combine that work:

```c++
std::transform_reduce(std::execution::par, /* ... */);
```

### Independent tasks

Another scalable design is to divide the work into many independent tasks and submit them to a thread pool.

```c++
thread_pool pool;

void foo() {
    execute(pool, [] { do_work(); });
    execute(pool, [] { do_other_work(); });
}
```

The pool controls the worker count while the application exposes enough independent work to keep those workers busy.

## Cooperative cancellation

Long-running operations often need a cancel button, timeout, shutdown path, or another way to stop early. Forcibly terminating a thread is undesirable: it can interrupt the thread while invariants are broken, locks are owned, or resources are only partly updated.

C++20 instead provides cooperative cancellation through `std::stop_source`, `std::stop_token`, and `std::stop_callback`. It is purely cooperative: if the target operation never checks or registers for cancellation, a stop request does nothing to that operation.

1. Create a `std::stop_source`.
2. Obtain its `std::stop_token`.
3. Pass the token to a new thread or task.
4. Call `source.request_stop()` when the operation should stop.
5. Have the operation periodically call `token.stop_requested()`.
6. Exit or clean up when cancellation is requested.

```c++
void stoppable_func(std::stop_token token) {
    while (!token.stop_requested()) {
        do_stuff();
    }
}

void stopper(std::stop_source source) {
    while (!done()) {
        do_something();
    }
    source.request_stop();
}
```

### Custom Cancellation with `std::stop_callback`

Polling is not useful while a task is blocked inside another API. `std::stop_callback` can adapt a stop token to an existing cancellation mechanism, such as cancellation of asynchronous I/O:

```c++
Data read_file(std::stop_token token, std::filesystem::path filename) {
    auto handle = open_file(filename);
    std::stop_callback callback(token, [&] {
        cancel_io(handle);
    });
    return read_data(handle); // blocking
}
```

The callback remains registered for its lifetime. A stop request invokes it so that the blocking operation can be interrupted by the mechanism understood by that API.

The callback is invoked in the thread that calls `request_stop()`.

## Starting and managing threads

For a new C++20 codebase:

- use `std::jthread` for directly managed threads in almost all cases
- use `std::async` when you want a result
- use `std::thread` only if you have no choice

The advantage of `std::jthread` is **ownership-safe** cleanup plus integrated **cooperative cancellation**.

### `std::jthread` overview

`std::jthread x{Callable, Args...}` do:
* Create a new `std::stop_source` - `src`
* Create a new thread running `Callable(src.get_token(), Args...)` if `Callable` can be invoked with a `std::stop_token` as its **first argument**, otherwise run `Callable(Args...)`

### Destructor semantics

The destructor will request stop and join the thread.

```c++
void thread_func(
        std::stop_token token,
        std::string arg1,
        int arg2) {
    while (!token.stop_requested()) {
        do_stuff(arg1, arg2);
    }
}

void foo(std::string text) {
    std::jthread thread{thread_func, text, 42};
    do_stuff();
} // requests stop, then joins
```

The cancellation API is:

```c++
std::jthread thread{some_callable};

std::stop_source source = thread.get_stop_source();
std::stop_token token = thread.get_stop_token();
bool first_request = thread.request_stop(); // equivalent to source.request_stop()
```

## Latches

`std::latch` is a single-use counter that lets threads wait until its count reaches zero:

1. Construct it with a non-zero count.
2. One or more threads decrease the count.
3. Other threads may wait for it to be signalled.
4. When the count reaches zero, the latch is **permanently** signalled and all waiting threads wake.

| Operation                  | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `std::latch latch{count};` | Create a latch with the initial count.                       |
| `latch.count_down();`      | Decrease the count and trigger the latch if it reaches zero. |
| `latch.wait();`            | Wait until the latch is triggered.                           |
| `latch.arrive_and_wait();` | Count down, then wait for the latch.                         |

### Coordinating multithreaded tests

Latches are also useful for arranging a test so several threads begin the interesting operation together:

1. Set up the test data.
2. Construct a latch whose count is the number of test threads.
3. Start those threads.
4. Make the first action in each thread `test_latch.arrive_and_wait()`.
5. Once every thread reaches the latch, they are all unblocked to run the test code.

This does not prove every possible interleaving, but it can reliably create useful contention in a test.

## Barriers

`std::barrier` is **reusable**. It coordinates participating threads in a sequence of phases:

1. Construct a barrier with a non-zero expected count and, optionally, a completion function.
2. One or more threads arrive during a phase.
3. Some or all of them wait for the phase to complete.
4. When the count reaches zero, one participating thread runs the completion function, the waiting threads are released, and the count resets for the next phase.

Its main operations are:

| Operation                                  | Meaning                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `std::barrier barrier{count, completion};` | Create a reusable barrier with an expected count and completion function.                   |
| `auto token = barrier.arrive();`           | Decrease the count and obtain an arrival token. The last arrival triggers phase completion. |
| `barrier.wait(std::move(token));`          | Wait for the phase represented by the token to complete.                                    |
| `barrier.arrive_and_wait();`               | Arrive and wait in one operation.                                                           |
| `barrier.arrive_and_drop();`               | Arrive without waiting and permanently reduce the expected count for later phases.          |

All participants must follow a compatible arrival protocol. If one exits a loop while the others still expect it, those threads can wait forever; a departing participant can use `arrive_and_drop()` when appropriate.

### `std::barrier::arrival_token`

An `arrival_token` is an **opaque, move-only receipt** identifying the barrier phase in which `arrive()` happened.

```cpp
auto token = barrier.arrive();
do_independent_work();
barrier.wait(std::move(token));
```

This will wait until the phase represented by `token` completes.

We want to use `arrival_token` to avoid the ABA problem: if a thread arrives, does some work, and then waits, the barrier may have completed one or more phases in the meantime. The token ensures that the wait is for the same phase as the arrival.

## Futures, promises, and tasks

Futures provide a one-shot transfer of a value or exception between threads. Several producers can create the shared state behind a `std::future<T>`:

- `std::async` launch a task that returns a value
- `std::promise` explicit set a value
- `std::packaged_task` wrap a task that returns a value

### `std::future<T>`

| Operation                       | Meaning                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `std::future<T> future;`        | Create an empty future with no shared state.                   |
| `future.valid()`                | Check whether it refers to shared state.                       |
| `future.wait()`                 | Block until the result is ready.                               |
| `future.wait_for(duration)`     | Wait up to a relative duration.                                |
| `future.wait_until(time_point)` | Wait until an absolute time point.                             |
| `future.get()`                  | Wait, then retrieve the value or rethrow the stored exception. |

```c++
void blocking(std::future<int> future) {
    future.wait(); // `get()` already waits, so `wait()` is optional
    do_stuff(future.get());
}

void polling(std::future<int> future) {
    using namespace std::chrono_literals;

    if (future.wait_for(0s) == std::future_status::ready) { // this is a non-blocking check
        do_stuff(future.get());
    }
}
```

### `std::promise<T>`

A promise is the explicit producer end of the shared state:

| Operation                    | Meaning                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `std::promise<T> promise;`   | Create a promise with a new shared state.               |
| `promise.get_future()`       | Obtain that state's future; this can be done only once. |
| `promise.set_value(value)`   | Make the value ready.                                   |
| `promise.set_exception(ptr)` | Make an exception ready.                                |

Passing a value:

```c++
std::promise<MyData> promise;
std::future<MyData> future = promise.get_future();

std::jthread consumer{[future = std::move(future)]() mutable {
    do_stuff(future.get());
}};

std::jthread producer{[&promise] {
    promise.set_value(make_data());
}};
```

Passing an exception uses the same channel:

```c++
std::promise<MyData> promise;
std::future<MyData> future = promise.get_future();

std::jthread consumer{[future = std::move(future)]() mutable {
    do_stuff(future.get()); // rethrows MyException
}};

std::jthread producer{[&promise] {
    promise.set_exception(
        std::make_exception_ptr(MyException{}));
}};
```

### Launching a result-producing task with `std::async`

With an explicit `std::launch::async` policy, `std::async` launches `func(arg1, arg2)` asynchronously and returns a future for the call's result:

```c++
auto future = std::async(
    std::launch::async,
    func,
    arg1,
    arg2);

auto result = future.get();
```

If the future is destroyed before `get()` is called, the destructor blocks until the asynchronous operation completes. 

If the launch policy is `std::launch::deferred`, the call is deferred until `get()` or `wait()` is called, and it **runs in the calling thread**.

### Shared futures

Use `std::shared_future<T>` when multiple threads must receive the same result. It is copyable, and each copy can call `get()`:

```c++
std::promise<MyData> promise;
std::shared_future<MyData> result =
    promise.get_future().share();

std::jthread first{[result] { do_stuff(result.get()); }};
std::jthread second{[result] { do_stuff(result.get()); }};
```

## Mutexes

C++ provides six mutex types:

- `std::mutex`: the default choice for most code;
- `std::timed_mutex`;
- `std::recursive_mutex`;
- `std::recursive_timed_mutex`;
- `std::shared_mutex`; and
- `std::shared_timed_mutex`.

Lock and unlock mutexes through RAII wrappers:

- `std::scoped_lock`: the default choice, including when acquiring multiple mutexes;
- `std::unique_lock`: a movable lock with deferred locking, timed operations, and manual unlock/relock support;
- `std::lock_guard`: a minimal single-mutex scope guard; and
- `std::shared_lock`: a shared-ownership guard for shared mutexes.

## Waiting for data

### Condition variables

`std::condition_variable` lets a thread sleep until it is notified. The predicate is essential: it handles spurious wakeups and checks the shared state under the mutex.

### Cancelling a wait

C++20's stop-token-aware wait overload is provided by `std::condition_variable_any`:

```c++
std::condition_variable_any condition;

void wait_for_data(std::stop_token token) {
    std::unique_lock lock{mutex};

    bool data_ready = condition.wait(lock, token, [] {
        return data.has_value();
    });

    if (!data_ready) {
        return; // cancellation won the race
    }

    Data result = std::move(*data);
    lock.unlock();
    process_data(result);
}
```

 ## Semaphores

A semaphore represents a number of available slots. Acquiring a slot decreases the count; releasing a slot increases it. An acquire attempted when the count is zero either blocks or fails, depending on the operation used.

Semaphore ownership is not tied to a particular thread. One thread may release a slot acquired by another, and a release does not require that the same thread previously acquired it.

Semaphores can be used to construct mutexes, latches, barriers, and many other synchronization mechanisms. *The Little Book of Semaphores* explores these patterns, though application code is usually better served by the higher-level facility that directly represents its intent.

C++20 provides:

- `std::counting_semaphore<max_count>` for a count between zero and an implementation-supported maximum; and
- `std::binary_semaphore`, an alias for `std::counting_semaphore<1>`, with either one free slot or none.

The acquisition operations are:

- `acquire()`, which blocks until a slot is available;
- `try_acquire()`, which attempts without blocking;
- `try_acquire_for(duration)`, which waits up to a duration; and
- `try_acquire_until(time_point)`, which waits until a deadline.

`release()` returns one or more slots.

```c++
std::counting_semaphore<5> slots{5};

void func() {
    slots.acquire();
    do_stuff(); // at most five threads can be here
    slots.release();
}
```

The standard semaphore itself is not an RAII guard. If `do_stuff()` can throw, wrap the acquired permit in an application-specific scope guard so the slot is always released.

## Atomics

Atomic variables are the lowest-level synchronization primitive covered here. The primary template is `std::atomic<T>`.

For the primary template, `T` must be an eligible, cv-unqualified, **bitwise comparable**, **trivially copyable** type with the required copy/move construction and assignment properties. 

Atomic compare-and-exchange is defined in terms of the stored value representation rather than an overloaded `operator==`. 

C++ also provides dedicated `std::atomic<std::shared_ptr<U>>` and `std::atomic<std::weak_ptr<U>>` specializations.

An atomic operation is indivisible with respect to other atomic accesses to the same object, but `std::atomic<T>` is not necessarily lock-free. An implementation may use an internal lock.

The types guaranteed to be lock-free are:

- `std::atomic_flag`;
- `std::atomic_signed_lock_free`; and
- `std::atomic_unsigned_lock_free`.

On most common platforms, atomic integral and pointer types are also lock-free, but portable code must not assume this. Query a type at compile time with:

```c++
static_assert(std::atomic<T>::is_always_lock_free);
```

An individual object can also be queried at runtime with `object.is_lock_free()`.

Atomics are powerful but require precise reasoning about atomic read-modify-write operations, memory ordering, and object lifetimes. Prefer an appropriate higher-level synchronization facility unless atomics are genuinely necessary.

## Practical defaults

For new C++20 code, a useful order of preference is:

1. Avoid directly managing threads when a parallel algorithm or task abstraction already fits.
2. Use `std::jthread` when a dedicated thread is appropriate.
3. Use `std::stop_token` for cooperative cancellation.
4. Use `std::future`, `std::latch`, or `std::barrier` when the problem matches their one-shot result, countdown, or phased-coordination models.
5. Use `std::mutex` for most remaining shared-state protection.
6. Reach for `std::atomic` only in the rarer cases that justify its lower-level complexity.
