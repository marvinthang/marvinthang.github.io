---
title: "SFINAE in C++"
date: 2026-08-09 00:00:00 +0800
categories: [cpp]
tags: [cpp, c++, sfinae, template, metaprogramming, enable_if, type_traits]
description: "SFINAE (Substitution Failure Is Not An Error) is a powerful feature in C++ template metaprogramming that allows for conditional compilation based on type traits and template specialization. It enables developers to write more flexible and type-safe code by allowing certain template instantiations to fail without causing compilation errors, thus enabling alternative implementations to be selected."
---

## C++98 Way

Use **overload** resolution, **ellipsis overload** and **sizeof** to perform compile-time detection in C++98.

```c++
template <class T> struct has_foo {
    typedef char yes[1];
    typedef char no[2];

    template <class U, U u> struct really_has;

    // return references `yes&` and `no&` because C++ does not allow to return arrays, or if we return char*, it will decay to pointer and lose the size information

    // `really_has` is used to check if `C` has a member function `void foo()`
    template <class C> static yes& test(really_has<void (C::*)(), &C::foo>*);

    // this use `const` because `foo()` may be a const member function `void foo() const`
    template <class C> static yes& test(really_has<void (C::*)() const, &C::foo>*);

    template <class C> static no& test(...);

    static const bool value = sizeof(test<T>(0)) == sizeof(yes);
};
```

We can also use this to check whether `foo()` is callable with zero arguments, ignoring its return type:

```c++
template <class C> static yes& test(char (*)[
  sizeof(
    (
      ((C*)0)->foo(), 1
    )
  )
]);
```

`(C*)0)->foo()` is used to check if `C` has a member function `foo()`, and `sizeof` creates an unevaluated context: the expression must be well-formed, but it is never executed, so the null pointer is never actually dereferenced.

### `enable_if`

* We use `enable_if` in function return type only, because:
  * there is case where the function have no parameter
  * if we use it in deduced parameter, for example `foo(typename enable_if<has_foo<T>::value, T>::type& t)`, the compiler can only deduce type of `t` if we use `foo<A>(a)`
* Even the version do nothing, it still have to use `enable_if` because overload resolution cannot choose between two functions with the same signature, so we need to use `enable_if` to make one of them invalid if the condition is not met.

```c++
template <bool B, class T = void> struct enable_if {};

template <class T> struct enable_if<true, T> { typedef T type; };

template <class T> typename enable_if<has_foo<T>::value, void>::type foo(T& t) {
    t.foo();
}

template <class T> typename enable_if<!has_foo<T>::value, void>::type foo(T&) {}
```

* `typename` is needed because `::type` is a dependent type.
* We put enable_if in the return type because it keeps the function parameter simple, so `T` can still be deduced normally from T& (calling `foo(a)` lets the compiler deduce `T` directly from the argument `a`).

Why not put it directly around the parameter type? If we write:
```c++
template <class T>
void foo(typename enable_if<has_foo<T>::value, T>::type& t);
```
then `T` appears inside `enable_if<...>::type`, which is a non-deduced context. The compiler cannot deduce `T` from `t`, so we would usually need to write: `foo<A>(a);`

* Both overloads use complementary `enable_if` conditions because: If both overloads have the same parameter list, return types are not considered when choosing between them. Therefore, both would otherwise be viable and the call would be ambiguous.

## C++11 Way

First solution with `decltype`, `declval`, and `constexpr`, we can simplify the implementation of `has_foo`:

```c++
template<class T> struct has_foo {
private:
    template<class C> static auto test(int)
        -> decltype(
            std::declval<C>().foo(),
            std::true_type()
        );

    template<class> static std::false_type test(...);

public:
    static constexpr bool value = decltype(test<T>(0))::value;
};
```

Second solution is:

```c++
// std::void_t is available in C++17, but we can implement it ourselves in C++11
template <class ...> using void_t = void;

template <class T, class = void> struct has_foo : std::false_type {};
template <class T> struct has_foo<T, void_t<decltype(std::declval<T>().foo())>> : std::true_type {};
```

## Generalized Detection Idiom

```c++
template <
    template<class...> class Op,
    class,
    class... Args
> struct is_detected_impl : std::false_type {};

template <
    template<class...> class Op,
    class... Args
> struct is_detected_impl<Op, void_t<Op<Args...>>, Args...> : std::true_type {};

template <
    template<class...> class Op,
    class... Args
> using is_detected = is_detected_impl<Op, void, Args...>;

// usage
template <class T> using foo_expr = decltype(declval<T>().foo());

is_detected<foo_expr, A>::value; // true if A has foo()
```

We must have `Op` and `Args` as template parameters, because if we put `Op<Args...>` directly in `void_t`, it will be evaluated immediately, and if it is not well-formed, it will cause a CE.

 By using `Op` and `Args` as template parameters, we can delay the evaluation of `Op<Args...>` until the specialization is instantiated, allowing us to use SFINAE to detect whether it is well-formed.

### Extension

```c++
struct nonesuch {};

template <
    class Default,
    class AlwaysVoid,
    template<class...> class Op,
    class... Args
> struct detector {
    using value_t = std::false_type;
    using type = Default;
};

template<
    class Default,
    template<class...> class Op,
    class... Args
> struct detector<
    Default,
    void_t<Op<Args...>>,
    Op,
    Args...
> {
    using value_t = std::true_type;
    using type = Op<Args...>;
};

template <
    template<class...> class Op,
    class... Args
> using is_detected = typename detector<nonesuch, void, Op, Args...>::value_t;

template <
    template<class...> class Op,
    class... Args
> using detected_t = typename detector<nonesuch, void, Op, Args...>::type;

template <
    class Default,
    template<class...> class Op,
    class... Args
> using detected_or_t = typename detector<Default, void, Op, Args...>::type;

template <
    class Expected,
    template<class...> class Op,
    class... Args
> using is_detected_exact = std::is_same<Expected, detected_t<Op, Args...>>;

template <
    class To,
    template<class...> class Op,
    class... Args
> using is_detected_convertible = std::is_convertible<detected_t<Op, Args...>, To>;
```

## Priority Tags

```c++
template <int N> struct priority_tag : priority_tag<N - 1> {};
template <> struct priority_tag<0> {};

template<class T> auto impl(T& x, priority_tag<2>) -> decltype(x.foo()) {
    return x.foo();
}

template<class T> auto impl(T& x, priority_tag<1>) -> decltype(foo(x)) {
    return foo(x);
}

template<class T> void impl(T&, priority_tag<0>) {
    // final fallback
}

// usage
impl(x, priority_tag<2>{}); // will call the highest-priority overload that is valid for `x`
```

The `priority_tag` is used to create a hierarchy of overloads, where higher-priority overloads are preferred over lower-priority ones.

## Tag Dispatching

```c++
void foo_impl(T& x, std::true_type) {
    x.foo();
}

void foo_impl(T&, std::false_type) {
}

template<class T>
void foo(T& x) {
    foo_impl(x, has_foo<T>{});
}
```
This is used before C++17 with `if constexpr`, which allows for compile-time branching based on type traits.
