---
title: The C++ Memory Model
date: 2026-07-16 00:00:00 +0800
categories: [cpp]
tags: [cpp, c++, concurrency, memory model, atomics, memory ordering, acquire release, synchronization]
description: Notes on the C++ memory model, compiler and CPU reordering, happens-before, atomics, memory orders, fences, and synchronization tools.
---

Source: [C++ Memory Model: from C++11 to C++23 - Alex Dathskovsky - CppCon 2023](https://youtu.be/SVEYNEWZLo4?si=QzED8HyPAL2VrtnI)

## Does the processor execute the program we wrote?

The short answer is: **usually not instruction by instruction**.

The **compiler** may inline functions, keep values in registers, eliminate dead code, unroll or vectorize loops, and reorder independent operations. The **processor** may use branch prediction, caches, store buffers, speculative execution, and out-of-order execution.

These transformations are essential for performance. In a single-threaded program, they are normally invisible because of the **as-if rule**:

> An implementation may transform a program in any way as long as the observable behavior of the C++ abstract machine is preserved.
{: .prompt-info }

### Dynamic scheduling

- instruction fetched
- instruction dispatched to instruction queue
- the instruction waits in the queue untils its input operands are ready
- if operands are ready, the instruction is allowed to leave the queue and execute before earlier instructions
- the instruction is issued to a functional unit
- only if all older instructions have completed, the instruction is allowed to commit its results to the architectural state

Check for structural hazards:
- an instruction can be issued iff a functional unit is available
- an instruction stalls if no functional unit is available

Check for data hazards:
- an instruction can be executed iff all its input operands are ready (have been calculated or loaded from memory)
- an instruction stalls if any of its input operands are not ready

As-if rule is not always the case:
- programs with UB
- copy elision, the compiler may remove calls to move and copy ctors even if they have side effects

## Why concurrency changes the picture

Consider two attempts to enter a critical section:

```cpp
// Thread 1                     // Thread 2
flag1 = 1;                     flag2 = 1;
if (flag2 == 0) {              if (flag1 == 0) {
    critical_section();            critical_section();
}                              }
```

This is **not a valid lock**. If `flag1` and `flag2` are ordinary integers, the program has **data races** and therefore **UB**. Even if they are atomic, weak ordering can still allow both threads to observe `0` unless the chosen memory order prevents that outcome.

> The central question is not whether operations appear in source order. It is:  
 What ordering and visibility guarantees does the C++ abstract machine give to another thread?
{: .prompt-info }

## Sequential consistency

- **Global order:** all operations from all threads appear in one global order.
- **Program order:** each thread's operations appear in that order according to its program order.

Modern hardware does not provide this model for every normal memory access for free. Enforcing it everywhere would prevent many optimizations and require expensive coordination between cores.

C++ instead gives us synchronization operations. Informally, **SC for DRF** says that programs which avoid data races with appropriate synchronization can be understood as interleavings of thread actions.

## The vocabulary of ordering

The memory model becomes much easier once four relationships are separated.

### Sequenced-before

Within one thread, **sequenced-before** describes the evaluation order required by the C++ abstract machine.

```cpp
int data = 42;                 // A
ready.store(true);             // B
```

`A` is sequenced-before `B`.

### Modification order

Every atomic object has its own total **modification order**. All threads agree on the order in which modifications to **that one atomic object** occurred.

This **does not automatically create a global order** involving other atomic objects or ordinary memory.

### Synchronizes-with

A synchronization operation in one thread may **synchronize-with** an operation in another thread. A common example is an acquire load that reads the value written by a release store on the same atomic object.

### Happens-before

**Happens-before** combines intra-thread sequencing with inter-thread synchronization.

If:

1. `A` is sequenced-before `B`,
2. `B` synchronizes-with `C`, and
3. `C` is sequenced-before `D`,

then `A` happens-before `D`.

This is the relationship that makes an ordinary write in one thread safely visible to an ordinary read in another thread.

> **Happens-before is the correctness relationship to look for.** “This instruction probably runs first” is not a portable synchronization argument.
{: .prompt-tip }

## `volatile` is not thread synchronization

`volatile` **does not make an object atomic**. It does not create a happens-before relationship, and it does not make a compound operation such as `++value` indivisible.

```cpp
volatile bool ready = false;
int payload = 0;

// Thread 1
payload = 42;
ready = true;

// Thread 2
while (!ready) {}
std::cout << payload;
```

This program is **still racy**. `volatile` does not publish `payload` safely.

`volatile` is good to tell the **compiler** it shouldn't optimize the memory reads and writes order, but the **CPU** may still reorder them. It is intended for memory-mapped I/O, signal handlers, and other special cases.

> `volatile` most uses are deprecated in C++20:  
> Is += a single atomic instruction?  
> `foo(int volatile n)`, `int volatile foo()` are meaningless.
{: .prompt-warning }

## Atomic does not mean lock-free

An atomic type is **guaranteed to be indivisible**. It is not guaranteed to be lock-free.

```cpp
std::atomic<__int128> x;
std::cout << x.is_lock_free() << '\n';
```

## Atomic memory orders

The memory order controls how an atomic operation relates to other memory operations.

| Memory order           | Main guarantee                                                                              | Typical use                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `memory_order_relaxed` | Atomicity and per-object modification order only                                            | Statistics and independent counters                              |
| `memory_order_acquire` | Later operations cannot move before the acquire                                             | Reading a published state or taking a lock                       |
| `memory_order_release` | Earlier operations cannot move after the release                                            | Publishing a state or releasing a lock                           |
| `memory_order_acq_rel` | Both acquire and release on a read-modify-write operation                                   | Updating ownership or lock state                                 |
| `memory_order_seq_cst` | Acquire/release guarantees plus one global order for all sequentially consistent operations | Default and easiest atomic ordering                              |
| `memory_order_consume` | Orders operations carrying a dependency from the load                                       | Avoid in new code; implementations generally treat it as acquire |

### Relaxed ordering

Relaxed operations guarantee **atomicity**, but they **do not synchronize unrelated memory**.

The atomic flag itself is race-free, but there is **no happens-before relationship** protecting `payload`.

### Release and acquire

A **release** operation publishes everything sequenced before it. An **acquire** operation that observes that release makes the published work visible after the acquire.

```cpp
#include <atomic>
#include <cassert>

int payload = 0;
std::atomic<bool> ready{false};

void producer() {
    payload = 42;
    ready.store(true, std::memory_order_release);
}

void consumer() {
    while (!ready.load(std::memory_order_acquire)) {
        // wait
    }

    assert(payload == 42);
}
```

The acquire must **actually observe the relevant release**, or a value from the appropriate release sequence. Merely placing an acquire load somewhere in the consumer is not enough.

### Sequentially consistent ordering

Sequentially consistent operations have acquire/release behavior where appropriate and participate in a **single total order** observed consistently by all threads.

For example:

```cpp
std::atomic<bool> x{false}, y{false};
int r1, r2;

// Thread 1
x.store(true, std::memory_order_release);
r1 = y.load(std::memory_order_acquire);

// Thread 2
y.store(true, std::memory_order_release);
r2 = x.load(std::memory_order_acquire);
```

The outcome `r1 == false && r2 == false` is possible with acquire/release because the CPU can reorder the stores and loads. With sequential consistency, that outcome is **impossible**, the CPU must respect the global order of operations.

This is the **strongest and most intuitive atomic ordering**. It may require stronger instructions or barriers on some architectures, but it is often the correct starting point.

## A spinlock and why ordering matters

A minimal spinlock can be built with `std::atomic_flag`:

```cpp
#include <atomic>

class spinlock {
private:
    std::atomic_flag flag = ATOMIC_FLAG_INIT;

public:
    void lock() noexcept {
        while (flag.test_and_set(std::memory_order_acquire)) {
            // spin
        }
    }

    void unlock() noexcept {
        flag.clear(std::memory_order_release);
    }
};
```

The successful `test_and_set` is an **acquire operation**. It prevents protected reads and writes from moving before the lock acquisition. `clear` is a **release operation**, so protected work stays before the unlock and becomes visible to the next thread that acquires the lock.

Using relaxed ordering for both operations would make the flag atomic, but it would **not make the ordinary data inside the critical section safe**.

This distinction can produce a particularly surprising optimization:

```cpp
std::atomic<bool> locked{false};
std::uint64_t shared_value = 0;

void increment_badly() {
    bool expected = false;

    while (!locked.compare_exchange_weak(
        expected, true,
        std::memory_order_relaxed,
        std::memory_order_relaxed)) {
        expected = false;
    }

    ++shared_value;
    locked.store(false, std::memory_order_relaxed);
}
```

The flag is atomic, but the supposed lock does not establish synchronization for `shared_value`. Concurrent accesses to `shared_value` are a **data race**. Because the program has **undefined behavior**, the compiler may keep `shared_value` in a register or move its load outside a loop, producing results that look impossible from the source.

The lock needs **acquire on successful acquisition** and **release on unlock**:

```cpp
void increment_safely() {
    bool expected = false;

    while (!locked.compare_exchange_weak(
        expected, true,
        std::memory_order_acquire,
        std::memory_order_relaxed)) {
        expected = false;
    }

    ++shared_value;
    locked.store(false, std::memory_order_release);
}
```

> Prefer `std::mutex` unless a carefully measured workload shows that a spinlock is appropriate. A spinlock wastes CPU time while waiting and performs poorly when the critical section is long or the owning thread is descheduled.
{: .prompt-warning }

## Atomic fences

`std::atomic_thread_fence` creates an ordering constraint without attaching acquire or release semantics directly to the atomic access.

```cpp
int payload = 0;
std::atomic<bool> ready{false};

// Thread 1
payload = 42;
std::atomic_thread_fence(std::memory_order_release);
ready.store(true, std::memory_order_relaxed);

// Thread 2
while (!ready.load(std::memory_order_relaxed)) {
    // wait
}
std::atomic_thread_fence(std::memory_order_acquire);
assert(payload == 42);
```

Here the relaxed store and load carry the value between threads, while the release and acquire fences provide ordering around them.

The placement matters:

- **Release fence:** must be sequenced-before the publishing atomic store.
- **Acquire fence:** must be sequenced-after the atomic load that observes the publication.

In most code, putting release and acquire directly on the store and load is clearer:

```cpp
payload = 42;
ready.store(true, std::memory_order_release);

while (!ready.load(std::memory_order_acquire)) {
    // wait
}
assert(payload == 42);
```

Fences are a **low-level tool**. They are useful in specialized lock-free algorithms, but they make the correctness argument easier to get wrong.

> Prefer acquire and release directly on the atomic operations when possible. It keeps the ordering attached to the value that carries the message.
{: .prompt-tip }

## Thread-local storage

`thread_local` gives **each thread its own instance** of an object:

```cpp
thread_local std::vector<int> scratch_buffer;
```

Because different threads access **different objects**, this can remove sharing and therefore remove the need for synchronization. It is useful for caches, scratch storage, and per-thread state.

It should not be used as hidden global state without considering initialization, destruction, memory usage, and behavior in thread pools.

## The higher-level synchronization toolbox

The standard library contains tools that express common coordination patterns more directly than hand-written atomics.

> Prefer the tool that directly describes the coordination pattern. Hand-written atomics should be the exception, not the default.
{: .prompt-tip }

### Semaphores and counting semaphores (C++20)

`std::counting_semaphore` is a C++20 synchronization primitive that allows threads to control access to a limited number of resources. It maintains a count of available permits, and threads can acquire or release permits as needed.

```cpp
std::binary_semaphore start_speaking{0}, person1_spoke{0}, person2_spoke{0};

void person_speak(std::string_view text, std::binary_semaphore& start, std::binary_semaphore& next) {
    start.acquire();
    std::cout << text << '\n';
    next.release();
}

int main() {
    std::jthread person1(person_speak, "Hello!", std::ref(start_speaking), std::ref(person1_spoke));
    std::jthread person2(person_speak, "How are you?", std::ref(person1_spoke), std::ref(person2_spoke));

    start_speaking.release(); // Start the conversation
    person2_spoke.acquire(); // Wait for the conversation to finish

    std::cout << "Conversation finished.\n";
}
```

> `std::couting_semaphore` is neither copyable nor movable. It is designed to be used as a shared resource among threads, and its state is managed internally to ensure proper synchronization.
{: .prompt-info }

### `std::jthread` and `std::stop_source` (C++20)

```cpp
std::binary_semaphore start_speaking{0}, person1_spoke{0}, person2_spoke{0};

void person_speak(std::string_view text, std::binary_semaphore& start, std::binary_semaphore& next, std::stop_token stop_token) {
    start.acquire();
    while (!stop_token.stop_requested()) {
        std::cout << text << '\n';
        std::this_thread::sleep_for(1s);
    }
    next.release();
}

void stop_speaking(std::stop_source person1_stop_source, std::stop_source person2_stop_source) {
    std::this_thread::sleep_for(5s);
    person1_stop_source.request_stop();
    std::this_thread::sleep_for(5s);
    person2_stop_source.request_stop();
}

int main() {
    std::stop_source person1_stop_source{}, person2_stop_source{};

    std::jthread person1(person_speak, "Hello!", std::ref(start_speaking), std::ref(person1_spoke), person1_stop_source.get_token());
    std::jthread person2(person_speak, "How are you?", std::ref(person1_spoke), std::ref(person2_spoke), person2_stop_source.get_token());

    start_speaking.release(); // Start the conversation
    std::jthread stopper(stop_speaking, person1_stop_source, person2_stop_source);
    person2_spoke.acquire(); // Wait for the conversation to finish

    std::cout << "Conversation finished.\n";
}
```

`std::stop_source` and `std::stop_token` provide a cooperative cancellation mechanism for threads. A thread can check its `stop_token` to determine if it should stop execution, allowing for graceful termination of long-running tasks.

Both are copyable and movable but still own the same underlying stop state. `std::stop_source` can be used to request a stop, while `std::stop_token` can be used to check if a stop has been requested.

### `std::latch` and `std::barrier` (C++20)

`std::latch`: A one-shot synchronization point initialized with a counter; threads may wait until other threads decrement the counter to zero, after which it stays permanently open.

```cpp
std::vector<std::string_view> people {"Alice", "Bob", "Charlie"};
std::vector<std::jthread> workers;
std::latch jobs{people.size()}, go_home{1};

auto job = [&jobs, &go_home](std::string_view name) {
    std::cout << name << " is working...\n";
    std::this_thread::sleep_for(1s);
    std::cout << name << " finished work.\n";
    jobs.count_down();

    go_home.wait();
    std::cout << name << " is going home.\n";
};

for (auto& person : people) {
    workers.emplace_back(job, person);
}

jobs.wait();
std::cout << "Go Home!\n";
go_home.count_down();
std::cout << "Done!\n";
```

`std::barrier`: A reusable synchronization point where a fixed group of threads wait for each other at the end of each phase, then all continue to the next phase together.

```cpp
std::vector<std::string_view> people {"Alice", "Bob", "Charlie"};
std::vector<std::jthread> workers;

auto on_complete = []() {
    static int phase = 0;
    std::cout << (phase++ == 0 ? "Go Home!\n" : "Done!\n");
};
std::barrier sync{people.size(), on_complete};

auto job = [&sync](std::string_view name) {
    std::cout << name << " is working...\n";
    std::this_thread::sleep_for(1s);
    std::cout << name << " finished work.\n";
    sync.arrive_and_wait();

    std::cout << name << " is going home.\n";
    sync.arrive_and_wait();
};

for (auto& person : people) {
    workers.emplace_back(job, person);
}
```

### `std::call_once` and `std::once_flag` (C++11)

`std::call_once` and `std::once_flag` provide a mechanism to ensure that a particular function is executed only once, even in the presence of multiple threads. This is useful for initializing shared resources or performing one-time setup.

```cpp
std::once_flag init_flag;

auto f = [&flag]() {
    static int x = 0;
    std::call_once(init_flag, []() {
        std::cout << "Initializing shared resource...\n";
        x = 42; // Perform initialization
    });
};

std::jthread t1(f);
std::jthread t2(f);
```

### `std::packaged_task` and `std::future` (C++11)

`std::packaged_task` and `std::future` provide a way to execute a function asynchronously and retrieve its result at a later time. This is useful for parallelizing work and managing dependencies between tasks.

```cpp
std::packaged_task<int(int, int)> sum([](int x, int y) {
    return x + y;
});

std::packaged_task mul_task([](int x, int y) {
    return x * y;
});

mul_task(10, 2);
sum_task(10, mul_task.get_future().get());

std::cout << "Result: " << sum_task.get_future().get() << '\n';
```

### `std::async` (C++11)

`std::async` provides a simple way to run a function asynchronously and obtain its result through a `std::future`. It can be used to launch tasks in separate threads or use a thread pool.

```cpp
auto async_task = std::async(std::launch::async, []() {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    return 42;
});

std::cout << "Result: " << async_task.get() << '\n';
```

`std::async` is basically `std::packaged_task`, but you don't have to manage the `std::future`.

### Static initialization is thread-safe (C++11)

Function-local static initialization is also thread-safe since C++11:

```cpp
Widget& instance() {
    static Widget widget;
    return widget;
}
```

If several threads reach the declaration concurrently, initialization occurs exactly once. Later calls observe the initialized object.
