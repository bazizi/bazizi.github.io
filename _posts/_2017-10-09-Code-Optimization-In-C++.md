---
layout: post
title:  "A Few Code Optimization Techniques In C++"
date:   2017-10-09
tags:
- C++
- Optimization
---

Recently I learned about a few interesting optimization techniques in C++ that I decided to share in here:

### 1 - Compile-time Evaluation

The idea is that you do certain calculations during the compile time to save time during the run-time of your program. There are multiple ways this can be achieved:

#### 1.1 Using macros instead of functions:

Using function-macros instead of regular functions can be both good and bad.

- Advantage:
    - When you use regular functions (especially in cases when that function is called many times) you keep adding and removing the function to/from the top of the stack. A function macro , however, is basically a code replacement that happens at **compile-time** and there are actually no functions being called at **run-time**

- Disadvantage:
    - The disadvantage of using function macros is that sometimes debugging at run-time becomes extremely difficult (if not impossible)

**Example Without Using Macros:**

```cpp
#include <stdio.h>

bool isEven(unsigned int i)
{
    return i % 2 == 0;
}
int main(int argc, char const *argv[]) {
    unsigned int n = 100;
    for (unsigned int i = 0; i < n; i++) {
        if(isEven(i))
        {
            printf("Number '%d' is even!\n", i);
        }
    }
    return 0;
}
```

**Example Using Macros:**

```cpp
#include <stdio.h>

#define ISEVEN(i)\
    i % 2 == 0

int main(int argc, char const *argv[]) {
    unsigned int n = 100;
    for (unsigned int i = 0; i < n; i++) {
        if(ISEVEN(i))
        {
            printf("Number '%d' is even!\n", i);
        }
    }
    return 0;
}
```

In the above example, all instances of `ISEVEN(i)` will be replaced with `i % 2 == 0` during compile time, therefore avoiding adding a function on call-stack at run-time (of course if we ignore the fact that the `%` operator itself is basically a function!).


#### 1.2 Meta-programming Using Templates

In certain cases when functions do calculations on *constant values*, we can do those calculations at `compile-time` and during `run-time` just return the result (without doing any run-time calculations!).

> What this means is that regardless of the time-complexity of your function, during run-time you will always get **O(1)** time complexity!

**Example: Getting the n-th Fibonacci sequence without meta-programming (Exponential run-time complexity):**

```cpp
#include <stdio.h>

int fibo(const unsigned long int n)
{
    switch(n)
    {
        case 1:
        case 2:
        {
            return 1;
        }        
    }
    return fibo(n-1) + fibo(n-2);
}


int main(int argc, char const *argv[]) {
    const unsigned long int n = 99999;
    printf("%d\n", fibo(n));
    return 0;
}
```

**Example: Getting the n-th Fibonacci sequence using meta-programming (`O(1)` run-time complexity!!!):**

```cpp
#include <stdio.h>

template<const unsigned long int n>
struct metaFibo
{    
    static const unsigned long int value = metaFibo<n-1>::value + metaFibo<n-2>::value;
};

template<>
struct metaFibo<1>
{
    static const unsigned long int value = 1;    
};

template<>
struct metaFibo<2>
{
    static const unsigned long int value = 1;    
};


int main(int argc, char const *argv[]) {
    const unsigned long int n = 99999;
    printf("%d\n", metaFibo<n>::value);
    return 0;
}
```

Of course in the above example, the compile-time will still be exponential.

### 2 - Loop Unrolling

Loops are expensive control structures. The idea is to minimize the number of times you iterate through a loop and instead repeat your code multiple times. Of course in terms of design, this is not always a good idea, but sometimes you might want to sacrifice good design for optimization.

**Example Without Loop Unrolling:**

```cpp
#include <stdio.h>

bool isEven(unsigned int i)
{
    return i % 2 == 0;
}
int main(int argc, char const *argv[]) {
    unsigned int n = 100;
    for (unsigned int i = 0; i < n; i++) {
        if(isEven(i))
        {
            printf("Number '%d' is even!\n", i);
        }
    }
    return 0;
}
```


**Example Using Loop Unrolling:**

```cpp
#include <stdio.h>

#define PRINTIFEVEN(i)\
    if( (i) % 2 == 0)\
    {\
        printf("Number '%d' is even!\n", i);\
    }


int main(int argc, char const *argv[]) {
    unsigned int n = 100;
    // Note how at each iteration we increment i 5 times!
    // This is to reduce the total number of iterations
    for (unsigned int i = 0; i < n; i += 5) {
        PRINTIFEVEN(i)
        PRINTIFEVEN(i+1)
        PRINTIFEVEN(i+2)
        PRINTIFEVEN(i+3)
        PRINTIFEVEN(i+4)
    }
    return 0;
}
```

I think it is obvious that in terms of time-complexity both codes are `O(n)` and this optimization improvement is just because of how instructions are executed by the CPU.


### 3 - Loop Unswitching

Sometimes you can move `if-statements` out of your loops and instead repeat your loops twice (or multiple times). This technique makes your program more efficient by avoiding evaluating the boolean expression (i.e., `if-statement`) each time through the loop.

**Example Without Loop Unswitching:**

```cpp
// Source: https://stackoverflow.com/questions/18681363/c-can-the-compiler-optimize-this-code-segment
void foo(const int constant)
{
    for(int i = 0; i < 1000000; i++) {
        // do stuff
        if(constant < 10) {              // Condition is tested million times :(
            // inner loop stuff
        }
    }
}
```


**Example Using Loop Unswitching:**

```cpp
// Source: https://stackoverflow.com/questions/18681363/c-can-the-compiler-optimize-this-code-segment

void foo(const int constant)
{
    if (constant < 10) {
        for(int i = 0; i < 1000000; i++) {
            // do stuff

           // inner loop stuff here
        }
    } else {
        for(int i = 0; i < 1000000; i++) {
            // do stuff

            // NO inner loop stuff here
        }
    }
}
```
