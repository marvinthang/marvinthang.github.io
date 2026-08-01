---
title: "Back to Basics: The C++ Abstract Machine"
date: 2026-07-23 00:00:00 +0800
categories: [cpp]
tags: [cpp, c++, cppcon, abstract machine, as-if rule, observable behavior, undefined behavior, object lifetime, memory model]
description: Notes on the C++ abstract machine, observable behavior, the as-if rule, behavior categories, memory, objects, threads, and expression evaluation.
---

Source: [Back to Basics: The Abstract Machine - Bob Steagall - CppCon 2020](https://github.com/BobSteagall/CppCon2020)

When we write C++ code, we are not programming a particular Intel, AMD, ARM, or other physical processor directly. We are writing a program for the **C++ abstract machine**. The compiler and linker translate the operations of that abstract machine into operations for the target system.

That distinction explains a great deal of C++: portability, optimization, implementation-defined behavior, unspecified behavior, undefined behavior, objects and lifetimes, and even why the generated instructions do not need to resemble the source code.

## What is an abstract machine?

An abstract machine is an imaginary computer used to define how programs execute. It is a machine because it supports step-by-step execution, but it is abstract because it omits most details of real hardware.

Depending on the language or implementation, an abstract machine may have a conceptual instruction set, registers, and memory model tailored to the source language. It bridges the gap between a high-level language and the many physical systems on which that language can run.

For a programming-language specification, it is the notional executor of a program. A real implementation does not need to build that machine literally. It must reproduce the behavior the language specification requires.

The C++ abstract machine can therefore be viewed as a portable abstraction over the operating system, kernel, and hardware. It is the semantic boundary between a C++ program and the system that eventually executes it.

## Why languages need abstract machines

We want to describe complex information-processing tasks in a language humans can read and maintain. We then want tools—primarily the compiler and linker in C++—to transform those descriptions robustly into executable programs.

The physical targets vary enormously:

- general-purpose processors from Intel, AMD, ARM, MIPS, Power, SPARC, Alpha, and others;
- GPUs and specialized coprocessors from vendors such as NVIDIA, AMD, and Intel;
- embedded processors, microcontrollers, and FPGAs; and
- different operating systems, kernels, calling conventions, and execution environments.

Creating a separate source language and toolchain model for every platform would be impractical. An abstract machine lets the language specify one semantic model while each implementation maps that model onto its target.

It also manages complexity. Most of the time, application programmers do not want to reason about cache organizations, register allocation, instruction encodings, or every operating-system detail. They want language abstractions that represent the problem domain while still translating effectively to hardware.

## The goals shaping C++

The language goals cited in the talk include support for:

- performance-critical software;
- software and language evolution;
- code that is straightforward to read, understand, and write;
- practical safety guarantees and testing mechanisms;
- fast, scalable development; and
- hardware architectures, operating systems, and environments as they evolve.

For performance-critical work, C++ aims to:

- give programmers control over performance-relevant details;
- make performance reasonably predictable; and
- leave no need for a lower-level general-purpose language beneath it.

C++ pursues those goals by defining types and operations that implementations can map closely onto hardware. Fundamental types such as `char`, `int`, and `double` correspond naturally to memory entities and machine operations. Pointers, references, and arrays correspond to hardware addressing capabilities.

C++ does not require a language-level interpreter or managed virtual machine between the program and the target. A particular implementation is still free to use any architecture it wants; the important point is that the language model permits high-quality direct code generation.

The abstract machine is deliberately close enough to common hardware that its operations can usually be translated efficiently.

## Source code, abstract machine, and physical machine

The relationship is:

```text
source code describes operations on the C++ abstract machine
                            |
                       implementation
                    (compiler + linker)
                            |
                            v
machine code executes on the physical machine
```

The programmer describes abstract-machine operations. The implementation validates the program under the language rules and maps those operations into an executable image for the physical target.

The generated code does not have to copy the structure or exact sequence of abstract-machine steps. It only has to produce an allowed observable result.

> When we write C++ code, we are writing to the C++ abstract machine.
{: .prompt-info }

## A parameterized, nondeterministic machine

The C++ standard describes a **parameterized nondeterministic abstract machine**. Those words each carry an important consequence.

### The implementation need not mirror the model

The standard places no structural requirement on a conforming implementation. A compiler does not need to contain a component that literally simulates every abstract-machine operation.

Instead, for a well-formed program with defined behavior, an implementation must behave like one possible execution of the abstract machine for the same program and input.

This freedom is what permits different compiler pipelines, runtime environments, ABIs, instruction sets, and optimization strategies.

### Parameterized

Some properties are **implementation-defined**. They are parameters chosen by an implementation and documented for its users.

Different parameter choices produce different conforming instances of the abstract machine. A 16-bit embedded implementation and a 64-bit desktop implementation can both conform while choosing different sizes, alignments, limits, and other documented properties.

### Nondeterministic

Some properties are **unspecified**. The standard provides one or more permissible outcomes but does not require the implementation to document or consistently choose one particular outcome.

Consequently, the same program and input may have several valid abstract-machine executions. A conforming physical execution needs to match one of them.

### Operations can be undefined

For an undefined operation, the standard imposes no requirements. If a possible execution of a program encounters undefined behavior, the implementation is not constrained by the abstract-machine contract for that execution—not even necessarily for effects appearing earlier in source order.

This is why undefined behavior is more serious than merely receiving an unpredictable value at the point of the mistake. Optimizers reason under the assumption that the program stays within the defined language rules.

## The as-if rule

The **as-if rule** lets an implementation transform a program in any way as long as the result is indistinguishable, through the program's required observable behavior, from an allowed execution of the abstract machine.

For example, the implementation can:

- eliminate a computation whose value is unused and whose removal has no observable effect;
- fold expressions at compile time;
- keep an object in a register instead of materializing it in memory;
- combine, reorder, or replace instructions; and
- omit an object entirely when the program cannot observe its absence.

This is not a loophole around the language rules. It is one of the language rules. C++ specifies the behavior that must be preserved rather than prescribing the physical instructions used to produce it.

```cpp
int square(int value) {
    int result = value * value;
    return result;
}
```

The abstract description contains a local object and a multiplication. A compiler may inline the function, propagate a constant argument, fold the multiplication, and emit no separate storage for `result`. If no defined observation can distinguish that translation from the abstract execution, it is valid.

> Source order is not a promise of instruction-for-instruction execution. The contract is the allowed observable behavior.
{: .prompt-tip }

## Observable behavior and side effects

The C++20 wording discussed in the talk identifies minimum observable requirements including:

- accesses through volatile glvalues, evaluated according to the abstract-machine rules;
- data written to files at program termination, matching one possible abstract execution; and
- interactive I/O behavior that delivers prompting output before the program waits for input.

The exact wording and paragraph numbers can move between standard editions, but the governing idea remains: an implementation must preserve the externally observable contract required by the applicable standard and library specifications.

An **expression** is a sequence of operators and operands that specifies a computation. Evaluating it may produce a value and may also cause **side effects**—changes to the state of the execution environment.

Examples of side effects include:

- modifying an object;
- accessing an object through a volatile glvalue;
- calling a library I/O function; and
- calling another function that performs such operations.

Not every side effect is independently observable outside the abstract machine. The optimizer may remove or transform internal state changes when no defined observation can tell the difference.

### Equivalent result, different execution

Imagine that the abstract machine and physical machine both receive the same input and produce the same required output and interactions. The abstract execution may reach two observable events after 20 and 25 conceptual operations, while the physical execution reaches its corresponding events after 137 and 1,729 instructions or internal operations.

The operation counts and timing do not need to match. The implementation's responsibility is equivalence at the required observation points, not a synchronized trace of internal steps.

## Categories of program behavior

Several standard terms describe how much freedom an implementation has. They should not be used interchangeably.

| Category | Program status | Implementation obligation |
| -------- | -------------- | ------------------------- |
| Well-formed | Satisfies syntax, diagnosable semantic rules, and the one-definition rule | Translate it subject to the rest of the standard's rules. |
| Implementation-defined | Valid construct with a choice that depends on the implementation | Choose a permitted behavior and document it. |
| Unspecified | Valid construct with multiple permitted outcomes | Produce a permitted outcome; documentation is not required. |
| Undefined behavior | Execution performs an operation for which the standard imposes no requirements | No behavior is required and a diagnostic is generally not required. |
| Ill-formed | Violates syntax or a diagnosable semantic rule | Issue at least one diagnostic. |
| Ill-formed, no diagnostic required | Violates a rule that implementations are not required to diagnose | No diagnostic is required; an executed program has no defined guarantee. |

### Well-formed programs

A well-formed C++ program is constructed according to the syntax rules, diagnosable semantic rules, and the one-definition rule. In practical terms, it is a program the implementation considers valid under the selected language mode.

Well-formed does not mean that every possible execution has defined behavior. A well-formed program can still dereference a null pointer at runtime or overflow a signed integer for particular input.

### Implementation-defined behavior

Implementation-defined behavior depends on the implementation, which must document its choice. This is the parameterization of the abstract machine.

Examples include:

- `sizeof(void*)`, the size of an object pointer;
- `CHAR_BIT`, the number of bits in a byte;
- the text returned by `std::bad_alloc::what()`; and
- behavior depending on an implementation-supplied locale.

Portable code may query or account for these properties. Code targeting a known implementation may deliberately rely on its documented choices.

### Unspecified behavior

Unspecified behavior selects a result from a set of valid outcomes. The implementation does not have to document the selection, and it may make different selections in different instances.

Examples from the talk include:

- permitted differences in argument evaluation order;
- whether identical string literals share storage; and
- permitted properties of storage returned by successive allocation requests, such as relative order and contiguity.

Do not write correctness logic that requires one unspecified outcome.

### Undefined behavior

Undefined behavior is behavior for which the standard imposes no requirements. Compilers are generally not required to diagnose it, and the resulting program is not required to behave meaningfully.

Examples include:

- dereferencing a null pointer;
- accessing outside an array's bounds;
- overflowing a signed integer; and
- accessing an object's stored value through an incompatible type when no language exception permits it.

Undefined behavior gives the optimizer powerful assumptions. For example, because defined signed addition cannot overflow, an optimizer may transform surrounding control flow on the assumption that overflow never occurs.

> Undefined behavior does not mean “the implementation picks one unusual result.” It removes the language's behavioral requirements for that execution.
{: .prompt-warning }

### Ill-formed programs

An ill-formed program violates a syntax rule or diagnosable semantic rule. The implementation must issue a diagnostic, even if it also supports an extension that assigns the code some meaning.

The standard commonly uses terms such as *shall*, *shall not*, and *ill-formed* to state requirements whose violation makes a program ill-formed.

After issuing the required diagnostic, an implementation may continue as an extension, but that does not make the program portable standard C++.

### Ill-formed, no diagnostic required

Some semantic violations may span translation units or otherwise be impractical to diagnose reliably. These are classified as **ill-formed, no diagnostic required** (IFNDR).

Examples include:

- certain violations of the one-definition rule;
- a constructor delegating to itself, directly or indirectly; and
- inconsistent declarations across translation units, such as declaring a function `[[noreturn]]` in one translation unit but not another.

The compiler may accept the source without warning. Acceptance does not make the program valid.

## The structure of the C++ abstract machine

The talk organizes the abstract machine around three connected components:

1. **Memory**, which provides storage.
2. **Objects**, most of which occupy that storage and carry type, value, and lifetime.
3. **Threads**, which evaluate expressions and perform operations on objects.

## Memory

Conceptually, the abstract machine's memory is a flat space:

- all parts of available memory are equally reachable under the language rules;
- there is no language-level cache or memory hierarchy;
- there are no abstract-machine registers;
- there is no formal stack region, although the standard discusses stack unwinding as an operation;
- heterogeneous GPU or coprocessor memory is not part of this basic model; and
- memory access has no abstract latency cost.

Physical systems plainly do have registers, caches, stacks, NUMA effects, and heterogeneous memories. Those details matter to performance, ABIs, operating systems, extensions, and implementation behavior, but the basic language semantics do not model their latency hierarchy.

### Bytes and addresses

Abstract-machine memory is composed of bytes. The standard specifies minimum representational properties for a byte; it does not simply define a byte as eight bits on every possible implementation. `CHAR_BIT` reports the implementation's number of bits per byte.

The memory available to a program consists of one or more sequences of contiguous bytes. Every byte has a unique location—its address—and programs represent addresses with pointers.

Within the constraints of the type, lifetime, access, and concurrency rules, program operations can potentially reach objects throughout this memory.

## Objects

Program operations create, initialize, refer to, access, modify, and destroy **objects**. An object has properties including:

- size;
- alignment;
- storage duration;
- lifetime;
- type;
- value; and
- optionally, a name.

An object can have at most one memory location. Under the as-if rule, however, two objects may share an address, or an object may not be stored in memory at all, when no defined program observation can distinguish the choice.

### Object storage and addresses

An object that has a memory location occupies a contiguous sequence of one or more bytes. Its address is the address of its first byte.

```cpp
std::int32_t value;
std::int32_t* pointer = &value;
```

The pointer is itself an object whose value represents an address. The object representation of `value` occupies contiguous bytes; the pointer object has its own representation elsewhere unless optimization removes the need to materialize it.

### Arrays, members, and padding

Array elements are laid out contiguously and are indexable from `0` through `N - 1`. Class objects may contain padding between members or at the end to satisfy alignment and layout requirements.

```cpp
struct S {
    short x;
    char z;
};

S values[3];
```

Each `S` object may contain padding, but the three array elements are contiguous in the sense required for array pointer arithmetic: `values + 1` points to the next complete `S` object.

### One-past-the-end pointers

C++ permits a pointer one position past the end of an array. An individual non-array object behaves like a single-element array for this purpose.

```cpp
std::int32_t value;
std::int32_t* value_end = &value + 1;

S values[3];
S* array_end = values + 3;
```

One-past pointers are essential for half-open ranges such as `[begin, end)`. They may be formed and compared as permitted, but they must not be dereferenced.

### Pointer comparisons

Equality comparisons can determine whether compatible pointers represent the same address or pointer value. Built-in relational ordering has portable structural meaning for pointers within the same array, including its one-past position, and for certain pointers to members within the same complete object.

```cpp
S values[3];
S other;

S* begin = &values[0];
S* last = &values[2];
S* unrelated = &other;

bool same = begin == last;       // valid, false
bool ordered = begin < last;     // valid array ordering
bool equal = begin == unrelated; // valid equality comparison
```

Do not use built-in relational comparison to infer a portable address order between unrelated objects. When a strict total order over pointers is needed for a generic facility, use the standard comparison function object such as `std::less<>`, which supplies the library's required strict total order.

## Storage duration

Storage duration describes the minimum potential duration of the storage containing an object. It is distinct from the object's lifetime.

### Automatic storage duration

Most local variables and function parameters have automatic storage duration. Their storage is associated with entry into and exit from the relevant block or function invocation, subject to the precise language rules and optimization under the as-if rule.

```cpp
void work() {
    Widget local;
}
```

Local variables declared `static`, `thread_local`, or in applicable cases `extern` do not have ordinary automatic storage duration.

### Dynamic storage duration

Dynamic storage is obtained and released through dynamic allocation facilities. `new`-expressions can create objects in dynamic storage, and matching `delete`-expressions can destroy them and release that storage.

```cpp
Widget* widget = new Widget;
delete widget;
```

In normal application code, RAII containers and smart pointers should own dynamic objects so allocation and lifetime cleanup remain exception-safe.

### Static storage duration

Objects with static storage duration have storage lasting for the program. This category includes namespace-scope objects and objects declared `static` under the applicable rules.

There is one program-wide instance of such an object rather than one per ordinary block invocation or thread.

```cpp
Widget global_widget;

Widget& instance() {
    static Widget local_static;
    return local_static;
}
```

### Thread storage duration

Objects declared `thread_local` have thread storage duration. Each thread has its own corresponding object instance, whose storage lasts for that thread.

```cpp
thread_local unsigned request_count = 0;
```

## Object lifetime

Storage and lifetime are related but not identical. Storage can exist before an object's lifetime begins and remain after its lifetime ends.

In the common case, the lifetime of an object of type `T` begins when:

1. storage with suitable size and alignment has been obtained; and
2. initialization is complete.

The lifetime commonly ends when:

- the object is destroyed;
- for a class type, its destructor call begins;
- its storage is released; or
- its storage is reused by another object that is not nested within it.

The full standard includes important special rules for unions, implicit-lifetime types, allocator-created arrays, nested objects, and storage reuse. The central lesson is that having an address and enough bytes is not by itself proof that an object of the desired type is alive there.

## Threads of execution

A **thread of execution** is a single flow of control in a program. It begins with an invocation of a top-level function and recursively includes the function calls performed by that flow.

A C++ program can have multiple threads running concurrently. Every thread can potentially access the program's objects and functions, subject to access, lifetime, and synchronization rules.

When one thread creates another, the new thread—not the creating thread—invokes the new thread's top-level function.

### The main thread and `main`

Every hosted C++ program begins with a main thread that invokes `main`. Implementations must support at least these forms:

```cpp
int main() {
}

int main(int argc, char** argv) {
}
```

An implementation may support additional parameter forms, but `main` must return `int`. It is a special function with restrictions: among other things, a program cannot overload it, call it recursively or directly, make it a coroutine, or declare it `static`, `inline`, `constexpr`, or deleted. It cannot be given a language-linkage specification, and a global variable cannot be named `main`.

Static-storage objects are initialized as part of program startup according to the initialization rules and are destroyed during program termination. Every program therefore has at least the main thread, whose top-level function is `main`.

## From functions to expressions

Executing a function means executing its statements. Statements contain expressions, and expressions specify computations through operators and operands.

Evaluating an expression can:

- compute a value;
- identify an object, bit-field, or function; and
- cause side effects that change execution state and perhaps observable behavior.

The rules governing evaluation depend heavily on the expression's type and **value category**.

## Expression value categories

Every C++ expression has a type and belongs to a value category. The primary taxonomy is:

```text
                 expression
                /          \
             glvalue      rvalue
             /    \       /    \
         lvalue  xvalue  xvalue  prvalue
```

`xvalue` appears under both groupings because it is both a glvalue and an rvalue.

### Glvalue

A **glvalue** is an expression whose evaluation determines the identity of an object, bit-field, or function. It answers, conceptually, “which entity?”

### Prvalue

A **prvalue** is an expression whose evaluation initializes an object or bit-field, or computes the value of an operand as required by its context. It primarily supplies a value rather than a persistent identity.

### Xvalue

An **xvalue** is a glvalue that denotes an object or bit-field whose resources can be reused. The result of applying `std::move` to an ordinary object is the familiar example.

```cpp
std::string text = "hello";
std::string moved_to = std::move(text);
```

`std::move(text)` is an xvalue expression. It identifies `text`, while marking it as eligible for operations that may reuse its resources.

### Lvalue

An **lvalue** is a glvalue that is not an xvalue. It identifies an object or function without designating its resources as expiring.

```cpp
int value = 42;
value; // lvalue expression
```

### Rvalue

An **rvalue** is a prvalue or an xvalue. This grouping collects expressions that commonly participate in value computation, temporary materialization, or resource movement.

The traditional mnemonic that lvalues “have names” and rvalues are “unnamed temporaries” is only an approximation. A named variable is an lvalue expression even when its type is an rvalue reference, and class prvalues can materialize temporary objects. The formal definitions based on identity and value computation are more reliable.

## Putting the model together

The abstract machine gives one coherent interpretation of a C++ program:

1. Source code describes operations on memory, objects, and threads in the abstract machine.
2. Threads execute functions, statements, and expressions.
3. Expression rules determine values, identities, and side effects.
4. Objects occupy or are modeled as occupying storage, with types, values, storage durations, and lifetimes.
5. The standard permits parameterized and nondeterministic choices while defining the set of allowed executions.
6. The implementation translates the program for a physical target.
7. Under the as-if rule, the physical execution may be radically different internally, but it must match one permitted observable behavior for every defined execution.

This model is why reading generated assembly alone cannot define what C++ source means. Assembly shows one implementation's translation for one target and set of options. The abstract machine and the language rules define the program's portable semantics.

## Summary

- C++ source describes operations on the C++ abstract machine.
- Compilers and linkers translate those operations into operations for physical machines.
- Implementations need to preserve permitted observable behavior, not abstract-machine step counts or source-shaped instruction sequences.
- The as-if rule enables optimization whenever defined observations remain unchanged.
- Implementation-defined behavior is documented parameterization; unspecified behavior is a permitted but undocumented choice; undefined behavior has no requirements.
- Memory, objects, and threads form the core structure of the model.
- Object storage, storage duration, and lifetime are different concepts.
- Threads evaluate expressions, whose types and value categories govern computation and identity.

Understanding this model changes the question from “what instructions does this line execute?” to the more useful question: “what behavior does the C++ abstract machine require an implementation to preserve?”
