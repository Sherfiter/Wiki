---
title: "第 8 章 · 指针与 const 限定符"
---

# 第 8 章 · 指针与 const 限定符

const 和指针的组合,是每个 C 学习者都要过的「读声明」关:`const int *p`、`int *const p`、`const int *const p`,三胞胎考倒一片。本章的目标有三个:把声明读法练成肌肉记忆(从右往左)、把「const 是视角不是属性」这个本质说透(违它的约就是 UB)、顺带把另外两个限定符 restrict 和 volatile 一起结清,它们是 C 优化世界的三张契约。原文小节编号错成 7.x,一并修正。

## 8.1 读法:从右往左,一步一个修饰

```c
const int *p;         // p 是 指针 → 指向 int → int 是 const:内容不可改,指针可改
int *const p;         // p 是 const → 常量指针 → 指向 int:指针不可改,内容可改
const int *const p;   // 双 const:都不许改
```

口诀:「const 在 * 左边,约束内容;const 在 * 右边,约束指针本身」。三行的可改矩阵:

| 声明 | `*p = x` 改内容 | `p = &y` 改指向 |
|---|---|---|
| `const int *p` | ✗ | ✓ |
| `int *const p` | ✓ | ✗ |
| `const int *const p` | ✗ | ✗ |

(`int const *p` 和 `const int *p` 完全等价,const 贴左贴右随缘,但贴 * 的位置决定约束对象,这个不能乱。)

## 8.2 本质:const 是「视角」,不是「内存属性」

最容易误解的一点:`const int *p = &x;` **不代表 x 真的是常量**。x 本身可能是个普通 int,只是「通过 p 这条路」不许写:

```c
int x = 10;                    // x 完全可写
const int *p = &x;             // p 是只读视角
// *p = 20;                    // 编译错误:这条路禁行
x = 20;                        // 直接走 x 这条路,完全合法

const int y = 10;              // 这次 y 真是 const
int *q = (int *)&y;            // 强转丢掉 const
*q = 99;                       // UB:y 在只读段可能崩;编译器按 y≡10 优化,行为不可测
```

前半段是 const 的正确用途(一个变量,多种访问权限);后半段是违约(强转丢 const 再写),后果见计组课 UB 的经典描述:编译器可能早就把所有读 y 的地方替换成 10,你写进去的 99 根本没人看见。「通过某种途径写 const 对象」是未定义行为,第 14 章的清单会再见到它。

## 8.3 函数参数:const 用得最多、性价比最高的地方

只读参数一律加 const,这是 C 工程的门槛级习惯:

```c
size_t my_strlen(const char *s);              // 承诺:不改 s
char *my_strcpy(char *dst, const char *src);  // 只改 dst,src 只读
```

三个收益:调用者放心传字符串字面量和其他只读数据;编译器帮你拦截函数体内的手滑;接口自文档(看到 const 就知道谁是入参谁是出参)。glibc 的原型全是这个风格,你的代码没理由不跟。

## 8.4 restrict:把「不重叠」写进契约

restrict(C99)是对编译器的性能承诺:**这块内存只会通过这个指针访问**,没有别名。有了承诺,编译器才敢做重排和向量化:

```c
void add_arrays(int n, int *restrict a, const int *restrict b) {
    for (int i = 0; i < n; i++)
        a[i] += b[i];      // 有 restrict:编译器知道写 a 不会影响读 b,放心流水
}
```

没有 restrict 时,编译器必须防着 `a` 和 `b` 指向同一块内存(写 a[i] 可能改变 b[i] 的值),每次都要保守;有了 restrict, SIMD 批量处理解锁,数值代码常见百分之几十的提速。违约的代价照例是 UB:glibc 的 memcpy 原型就带 restrict,所以**重叠拷贝必须用 memmove**(它内部的启发式会先判断方向再拷),这是这个契约最著名的应用场景。

## 8.5 volatile:每次都来真的

volatile 和 restrict 方向相反,它是**负优化**契约:告诉编译器「这个变量会被你看不见的东西改变」,于是不许缓存进寄存器、不许合并访问、不许假设两次读值相同:

```c
volatile int *status = (volatile int *)0x4000;   // 假设是设备状态寄存器
while (*status == 0) { }    // 没有 volatile:编译器只读一次,死循环;有 volatile:每轮真读
```

三大用武之地:MMIO 硬件寄存器(计组课第 9 章:设备状态自己会变)、信号处理函数共享的 sig_atomic_t 变量、setjmp/longjmp 跨越的局部变量。**必须钉死的一条**:volatile 不是线程同步工具,它不保证原子性、不建立内存屏障,多线程标志位请用 C11 的 `_Atomic` 或锁。把 volatile 用在普通多线程代码上,是我见过最流行的「感觉在防,其实在裸奔」的写法。

## 常见错误

- **三胞胎读反**。8.1 的矩阵背熟;拿不准就从右往左读一遍。
- **以为 const 让编译器把变量放进只读段**。局部 const 变量照样在栈上,「能不能写」取决于它声明的类型,和内存位置是两回事(全局 const 才可能进 .rodata)。
- **memcpy 拷重叠区间**。UB,轻则数据错乱,重则SIMD指令行为诡异;重叠一律 memmove。
- **多线程标志用 volatile 就放心了**。不原子、无屏障, races 照样发生;用 _Atomic。

## 练习

1. 手算:解释 `int *(*p)[3]`、`int (*(*p)[3])()`(别慌,第 13 章的方法论,这里只需第一个)分别读作什么;写出「指向「含 5 个 const char* 的数组」的指针」的声明。
2. 动手:写 `void swap_if_larger(int *restrict a, int *restrict b)`,测试重叠调用(`swap_if_larger(&x, &x)`)是否真的违约(用 -O2 看汇编里是否出现激进优化);再对比 memcpy 与 memmove 在 `memcpy(buf, buf+1, 7)` 下的输出差异。
3. 动手:模拟 MMIO:用一块普通数组假装设备寄存器,开一个线程(或用 gdb 手改内存)修改它,主循环读它的值,分别在有、无 volatile 下观察编译器(-O2)生成的循环是否重新加载。
4. 思考:`const` 关键字在 C 里的执行者是编译器(编译期拦截),在内存硬件层几乎没有痕迹(局部变量照样可写)。对比 Java 的 final、硬件的写保护页(操作系统课第 6 章),说说「不可变」在三个层次上分别由谁执行、各能拦住谁。
