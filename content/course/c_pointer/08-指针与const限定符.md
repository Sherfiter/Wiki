---
title: "第 8 章 · 指针与 const 及限定符"
---

# 第 8 章 · 指针与 const 及限定符

`const` 是给编译器看的「承诺」，`restrict` 和 `volatile` 则是给编译器看的「优化提示」。指针和这三个限定符结合，是区分「熟练」与「精通」的分水岭。

## 7.1 从右往左读 const

`const` 和指针结合，位置不同、意义不同。**从变量名往左读**最清楚：

```c
const int *p;      // p 是「指向 const int 的指针」：指向的内容不能改
int const *p;      // 与上面完全相同（const 在 int 前后等价）
int *const p;      // p 是「const 指针」：指针本身不能改
const int *const p; // 指针和内容都不能改
```

| 声明 | 读作 | 能改 `*p` | 能改 `p` |
|---|---|---|---|
| `const int *p` | 指向常量的指针 | ❌ | ✅ |
| `int *const p` | 常量指针 | ✅ | ❌ |
| `const int *const p` | 指向常量的常量指针 | ❌ | ❌ |

```c
int x = 1, y = 2;
const int *p = &x;   // 允许：用「只读视角」看 x
// *p = 10;          // ❌ 编译错误
p = &y;              // ✅ 指针本身可改

int *const q = &x;   // q 永远指向 x
*q = 10;             // ✅ 可改内容
// q = &y;           // ❌ 编译错误
```

> 关键心智：`const int *p` **不代表 x 真是常量**，只代表「**通过 p 这个指针，你不许写**」。同一块内存，可以有只读视角，也可以有可写视角。

## 7.2 丢弃 const 是危险的

把 `const` 指针强转成非 const 再写，是典型的自欺欺人：

```c
const int x = 10;
int *p = (int*)&x;   // 丢掉 const
*p = 20;             // ❌ 未定义行为（若 x 真在只读段，直接崩）
```

- 如果 `x` 是**只读段/常量**，写它是 UB，可能段错误。
- 即使侥幸没崩，编译器可能已经按「x 恒为 10」做了优化，`*p = 20` 后的行为完全不可预期。

## 7.3 函数参数用 const：接口即文档

只读参数写 `const`，是 C 里最实用的习惯——既防手滑，又是自文档：

```c
void print(const char *s);          // 承诺不修改 s
void copy(char *dst, const char *src);  // 只改 dst，不改 src
```

这让调用者放心传字符串字面量，也让编译器能在只读段复用数据。

## 7.4 restrict：承诺「不别名」

`restrict`（C99）告诉编译器：**这个指针指向的内存，只能通过这一个指针访问**，没有别的指针和它指向同一块。编译器据此做激进优化。

```c
void add(int n, int *restrict a, const int *restrict b) {
    for (int i = 0; i < n; i++) a[i] += b[i];
}
```

- 若 a、b 重叠（别名），`restrict` 就违背了，行为**未定义**。
- 效果：编译器可以并行/重排内存访问，不必每次写 `a[i]` 都担心影响 `b[i]` 的读。
- 典型收益在数值计算、`memcpy`（原型里 `restrict` 让编译器用 SIMD 批量拷贝）。

```c
void *memcpy(void *restrict dest, const void *restrict src, size_t n);
// 注意：dest 和 src 重叠时该用 memmove，而不是 memcpy
```

## 7.5 volatile：每次都从内存读

`volatile` 和 `const` 相反——它告诉编译器：**这个变量可能被「你之外的东西」改变**，每次访问都必须真的读写内存，不许缓存进寄存器、不许省略。

```c
volatile int *status = (int*)0x4000;  // 内存映射 IO 寄存器
while (*status == 0) { /* 忙等 */ }   // 每次循环都重新读内存
```

典型用途：

- **内存映射硬件寄存器**（MMIO）：设备会自己改值。
- **信号处理器 / 多线程共享标志**：`sig_atomic_t` + `volatile`。
- **`setjmp`/`longjmp` 之间被改的变量**。

> 注意：`volatile` **不是**线程同步工具，不保证原子性、不建内存屏障。多线程正确同步要用 `_Atomic`（C11）或锁，`volatile` 只是「别优化掉这次访问」。

## 7.6 限定符与指针的「内层/外层」

限定符也有层级，和指针层级对应：

```c
int *volatile p;        // p 是 volatile 指针（指针本身易变）
volatile int *p;        // 指向 volatile int（指向的内容易变）
const int *const p;     // 指向 const 的 const 指针
```

## 7.7 与汇编 / 其他语言对照

- **汇编**：`const`/`restrict` 是**纯编译期**概念，进汇编后消失，只影响优化；`volatile` 直接阻止优化，强制生成每次访问指令。
- **Java**：`final` 类似 `const`（引用不可改绑，对象内容仍可变，类似 `T *const`）；没有 `restrict` 和 `volatile` 的对应物（Java 的 `volatile` 是内存屏障语义，完全不同）。
- **C++**：`const`/`volatile` 语义与 C 相同，还有 `constexpr`；`restrict` 在 C++ 非标准，各家编译器用 `__restrict`。
- **Python**：无类型系统层面的 const，纯靠约定（`_name`、`NAME`）。

> 一句话：**`const` 是「不许通过我写」、`restrict` 是「只有我能访问」、`volatile` 是「别优化、每次都读」。** 三个都是和编译器签的契约，违约的代价是未定义行为。
