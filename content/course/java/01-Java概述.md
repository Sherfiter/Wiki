---
title: "第 1 章 · Java 概述"
---

# 第 1 章 · Java 概述

## 1.1 Java 语言发展历史

Java 诞生于 1995 年，由 Sun 公司的 James Gosling 团队开发，前身是面向消费电子的 Oak，随互联网兴起转向 Web（Applet），后成为通用企业级语言。2010 年 Sun 被 Oracle 收购。

关键版本：

- **JDK 1.2（1998）**：拆分出 J2SE / J2EE / J2ME 三个方向。
- **JDK 1.5（2004）**：语法大跃进——泛型、自动装箱、增强 for、枚举、注解。
- **JDK 1.8（2014）**：Lambda 与 Stream，函数式编程进入 Java。
- **JDK 11 / 17 / 21**：LTS 版本，模块化（Jigsaw）落地。

## 1.2 Java 语言的优点

- **一次编写，到处运行（WORA）**：编译成字节码，由各平台 JVM 解释/即时编译执行。
- **内存安全**：垃圾回收（GC）自动管理堆内存，无手动释放。
- **强类型、面向对象**：类型错误在编译期暴露。
- **健壮**：异常机制、数组越界检查、无指针。
- **生态成熟**：庞大的类库与框架（Spring、Hadoop 等）。

## 1.3 Java 开发环境搭建

- **JDK**（开发工具包）包含 **JRE**（运行环境），JRE 包含 **JVM**。
- 安装 JDK 后配置 `JAVA_HOME` 与 `PATH`（加入 `bin` 目录）。
- `javac` 把源码编译成 `.class` 字节码，`java` 启动 JVM 执行字节码。

## 1.4 第一个 Java 程序

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello Java!");
    }
}
```

- 源文件名必须与 `public` 类名一致（`Hello.java`）。
- `main` 是程序入口，签名固定为 `public static void main(String[] args)`。
- 编译：`javac Hello.java`；运行：`java Hello`。

## 1.5 与其他语言对比

| 维度 | Java | C | C++ | Python |
|---|---|---|---|---|
| 编译模型 | 字节码 + JVM | 原生机器码 | 原生机器码 | 解释执行 |
| 内存管理 | GC | 手动 | 手动 / RAII | GC |
| 指针 | 无 | 有 | 有 | 无 |
| 面向对象 | 强制 | 无 | 可选 | 强制 |

> 核心差异：Java 用 JVM、GC 和无指针换来了跨平台与内存安全，代价是少许性能与底层控制力。C/C++ 追求极致性能与底层控制，代价是手动内存管理和更多未定义行为（UB）。
