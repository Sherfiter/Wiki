---
title: "第 9 章 · Java API"
---

# 第 9 章 · Java API

## 9.1 String 与 StringBuffer / StringBuilder

**String 是不可变对象**——任何“修改”都返回新对象，原字符串不变。

```java
String s = "hello";
String t = s.toUpperCase();   // s 不变，t 是新对象
```

常用操作：`length()`、`charAt(i)`、`substring`、`equals`、`indexOf`、`split`、`trim`、`valueOf`。

- 比较内容用 `equals`，比较引用才用 `==`。
- **StringBuilder / StringBuffer**：可变字符串，频繁拼接用它们避免创建大量中间对象。`StringBuilder` 非线程安全但快；`StringBuffer` 线程安全但慢。

```java
StringBuilder sb = new StringBuilder();
sb.append("a").append("b").append("c");
```

> 对比：C 用 `char[]` 或 `char*` 手动管理、易出错；C++ 的 `std::string` 可变且自动管理；Python 的 `str` 与 Java 一样不可变（频繁拼接同样应避免 `+`）。

## 9.2 System 与 Runtime

- `System.out/in/err`：标准输出/输入/错误流。
- `System.currentTimeMillis()`：毫秒时间戳；`System.exit()`：退出程序。
- `Runtime.getRuntime()`：获取运行时，如 `availableProcessors()`、`gc()`。

## 9.3 Math 与 Random

- `Math`：`abs/sqrt/pow/max/min/round/random` 等静态方法，及常量 `PI/E`。
- `Random`：伪随机数，`nextInt(bound)` 生成 `[0, bound)` 的随机整数。

## 9.4 包装类

为每个基本类型提供引用类型：`Integer`、`Double`、`Boolean` 等，用于泛型、集合等需要对象的场景。

- **自动装箱/拆箱**：基本类型与包装类自动互转。

```java
Integer x = 10;        // 自动装箱
int y = x;             // 自动拆箱
```

- 注意 `Integer` 缓存 `[-128, 127]`，此范围内 `==` 可能相等（引用复用），比较值应始终用 `equals`。

> 对比：C 无此概念；C++ 有 `std::optional` 等模板类；Python 一切皆对象，`int` 本身就是引用类型，无装箱需求。

## 9.5 Date / Calendar / DateFormat

- `Date` 表示时间点，多数方法已过时。
- `Calendar` 提供日期运算（加减年月日）。
- `SimpleDateFormat` 格式化/解析日期字符串。

> 现代项目推荐用 JDK 8 引入的 `java.time` 包（`LocalDate`、`LocalDateTime`、`Instant`、`Duration`），不可变、线程安全、API 更清晰，取代旧的 `Date/Calendar`。

## 9.6 与其他语言对比

- 字符串：C `char*`（手动）→ C++ `std::string`（可变）→ Java/Python `String/str`（不可变）。
- 时间：C 用 `time_t` 秒级整数；Java 的 `java.time` 是业界标杆，设计优于 C++ 早期与 Python `datetime`。
