---
title: "第 9 章 · Java API"
---

# 第 9 章 · Java API

Java 的核心竞争力一半在语言,一半在类库:你要的轮子,十有八九标准库里有。本章挑最常用的几件家什讲透:String 家族(含那个著名的拼接性能坑)、包装类与自动装箱(含那个 == 的续集)、Math/Random、以及新时间和旧时间的换代故事。学完这章,你写代码的速度会翻倍,踩坑率会减半。

## 9.1 String:不可变的一切

String 的头号特征:**不可变(immutable)**。任何「修改」都不动原对象,只产新的:

```java
String s = "hello";
String t = s.toUpperCase();    // s 还是 "hello",t 是新对象 "HELLO"
s = s + " world";              // s 变量指向了新对象,原来的 "hello" 原封不动
```

不可变带来三个直接后果。**安全共享**:字符串随便传(改不了),常量池能放心复用(第 8 章 == 之谜的另一半谜底:字面量在编译期进常量池,相同的字面量是同一个对象)。**每次拼接都在造新对象**:`s += x` 循环一万次,就是造一万次中间对象(旧对象全靠 GC 收尸),这是 Java 性能入门第一课。**hash 缓存**:String 的 hashCode 算一次存着,所以能当 HashMap 的键(第 10 章)。

常用方法速查:`length()`、`charAt(i)`、`substring(b, e)`(前含后不含)、`indexOf`、`split(",")`(返回 String[],参数是正则!)、`trim()`、`contains`、`equals/equalsIgnoreCase`、`String.valueOf(x)`(万物转字符串)。注意 `s1 + s2` 的编译器优化:单行拼接现代编译器会自动转 StringBuilder,但**循环内拼接必须自己显式 StringBuilder**(优化器不做跨迭代的优化):

```java
StringBuilder sb = new StringBuilder();     // 可变字符串,拼接专用
for (String w : words) sb.append(w).append(' ');
String s = sb.toString();
// StringBuffer = 线程安全版(方法全加锁),日常用 StringBuilder 即可
```

和 C 的 char* 手动管理(指针课第 6 章的 '\0' 血泪)相比,String 把内存、长度、编码全管了;不可变设计则和 Python 的 str 同款。

## 9.2 包装类与自动装箱:== 的续集

集合类只收对象(第 10 章),基本类型 int 进不了集合,于是每个基本类型配了一个包装类(Integer、Double、Boolean……),并配自动装箱/拆箱:

```java
Integer x = 10;        // 自动装箱:int → Integer(编译器插了 Integer.valueOf(10))
int y = x + 1;         // 自动拆箱:Integer → int(x.intValue() + 1)
```

方便的代价是两个陷阱。**陷阱一:== 的老坑换马甲**。Integer 缓存了 -128 到 127 的对象,这个范围内的 == 比较碰巧 true(同一缓存对象),范围外就是 false:

```java
Integer a = 127, b = 127;
System.out.println(a == b);        // true(缓存,同一对象)
Integer c = 128, d = 128;
System.out.println(c == d);        // false!两个独立对象
```

「面试题答 true 还是 false」不重要,纪律重要:**包装类比较内容永远 equals**,== 只用来判断 null。**陷阱二:NPE 新产地**。`Integer x = null; int y = x;` 拆箱 null 直接 NullPointerException,集合里取出的 Integer 记得判空再拆。

## 9.3 Math 与 Random:工具间的常客

Math 全静态方法:`abs`、`max/min`、`pow`、`sqrt`、`round`(四舍五入,注意返回 long)、`Math.PI`。Random 伪随机:

```java
Random r = new Random();           // 可传种子,同种子同序列(可复现实验)
int dice = r.nextInt(6) + 1;       // [0,6)+1 = 1~6,注意 nextInt(bound) 不含 bound
double prob = r.nextDouble();      // [0.0, 1.0)
```

「nextInt(6) + 1 忘 +1 得到 0~5」是新手高频事故;需要安全随机(密码学)用 SecureRandom,普通业务 Random 足够。

## 9.4 时间:新旧两朝

老 API(Date、Calendar、SimpleDateFormat)还在无数老代码里,新代码请直接用 JDK 8 的 java.time,它不可变、线程安全、API 说话像人话:

```java
LocalDate today = LocalDate.now();            // 2026-10-24
LocalDate payday = today.plusDays(7);         // 不可变:plus 返回新对象,同 String
LocalDateTime dt = LocalDateTime.of(2026, 10, 24, 21, 30);
Duration gap = Duration.between(start, end);

DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
String text = dt.format(f);                   // 格式化
LocalDateTime back = LocalDateTime.parse(text, f);   // 解析
```

旧 SimpleDateFormat 有个著名的坑(它**不是线程安全的**,多线程共享实例会算出荒唐日期),java.time 的 DateTimeFormatter 线程安全,这条也是老代码迁移的头号理由。月份从 1 数(Calendar 的月份从 0 数,历史事故之源)。

## 常见错误

- **循环里用 + 拼接字符串**。O(n²) 的隐形炸弹,几万条数据时接口突然超时,十有八九是它。
- **split 忘了参数是正则**。按 `.` 切分要写 `split("\\.")`(点在正则里是任意字符),按 `|` 切要 `split("\\|")`,直接传会得到诡异的空数组。
- **包装类用 == 比较**。9.2 陷阱一,-128/127 边界是面试和 bug 的双重常客。
- **用 Date 和 Calendar 新写代码**。除非维护老代码,新功能一律 java.time。

## 练习

1. 动手:性能实测:循环拼接 10 万次字符串,分别用 `s += x` 和 StringBuilder,计时对比(预期百倍级差距),用 JConsole 或任务管理器顺带观察 GC 行为。
2. 动手:验证 Integer 缓存:打印 `Integer.valueOf(127) == Integer.valueOf(127)` 和 128 版的结果;再用 equals 修复。写一句缓存范围注释贴在自己代码模板里。
3. 实现:单词统计器:读一段英文,按空格 split,统计每个单词出现次数(先用两个平行数组,第 10 章学 HashMap 后重写并对比代码量)。
4. 思考:String 为什么设计成不可变?从「HashMap 的键」「常量池共享」「线程安全」三个角度各推一条理由,再想想这个设计的不便(大量拼接)是怎么被 StringBuilder 这个「配套逃生门」解决的。
