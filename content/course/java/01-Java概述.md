---
title: "第 1 章 · Java 概述"
---

# 第 1 章 · Java 概述

学 Java 的第一晚,我印象最深的不是语言本身,而是配环境变量的痛苦:装完 JDK 敲 `java -version` 有反应、`javac` 却「不是内部或外部命令」,上网一查才知道 Java 把「能跑」和「能编译」拆成了两个东西。这一章就从这个困惑开始,把 Java 的家底讲清楚:它凭什么「一次编写,到处运行」、JDK/JRE/JVM 三个缩写到底谁包含谁、第一个程序怎么写,以及每个初学者都会撞上的那几条编译错误。

## 1.1 三十年简史:为什么会有 Java

1991 年,Sun 公司的 James Gosling 团队想给机顶盒、家电写通用软件,搞出一门叫 Oak 的语言;机顶盒市场没成,赶上互联网爆发,1995 年更名 Java 转身杀入 Web(Applet 小程序当年红极一时),后来成为企业级开发的事实标准。2010 年 Sun 被 Oracle 收购,Java 归了 Oracle。

版本史里值得记四个节点,每个都改变了这门语言:JDK 1.2(1998)拆出 J2SE/J2EE/J2ME 三个方向(平台化);JDK 1.5(2004)泛型、枚举、增强 for、注解齐发(语法现代化);JDK 1.8(2014)Lambda 与 Stream(函数式编程入场,今天企业代码的半壁江山);JDK 11/17/21(LTS 长期支持版,模块化落地,也是你该装的那个)。选版本的经验法则:**跟 LTS 走**,17 或 21,别用 8 之外的老古董,也别追最新非 LTS 版(生产环境少有人陪).

## 1.2 WORA:一次编写,到处运行的代价与收益

Java 的招牌是「Write Once, Run Anywhere」,机制一句话:**Java 编译成字节码(bytecode),由各平台的 JVM 翻译执行**。同一份 `.class` 文件,Linux 的 JVM 和 Windows 的 JVM 都认,平台差异被 JVM 吸收掉了。

学过计组课的同学会发现这个设计和 ISA 惊人地像:JVM 定义了一套「虚拟指令集」(字节码),这份合同之下,任何平台只要实现 JVM,就能跑所有 Java 程序。C 语言编译成各平台原生机器码(快,但换平台要重编),Java 编译成一份字节码(跨平台,但要 JVM 中转)。天下没有免费的抽象,Java 付的账单有三张:**启动和执行多一层**(JIT 即时编译追平不少,但冷启动仍慢)、**内存被 GC 接管**(省心,但不可控,计组第 9 章 C 的 malloc 惨案在 Java 里不存在,换来的是 GC 暂停)、**没有指针运算**(安全,计组第 14 章的 UB 案卷在 Java 里整个消失)。值不值?企业级市场已经投票:稳定、人多、生态大,值。

## 1.3 JDK、JRE、JVM:套娃关系

三个缩写的包含关系:**JDK ⊃ JRE ⊃ JVM**。

- **JVM**(Java 虚拟机):执行字节码的引擎,1.2 节的主角。
- **JRE**(Java 运行环境):JVM + 核心类库。只跑程序,JRE 够了。
- **JDK**(Java 开发工具包):JRE + 编译器 javac + 调试器 jdb + 打包工具 jar 等。写代码必须 JDK。

我当年那个「java 有反应 javac 没反应」的谜题,答案就是:装的是 JRE(或只配了 java 的路径)。装 JDK、配 `JAVA_HOME` 指向 JDK 根目录、把 `%JAVA_HOME%\bin`(Windows)或 `$JAVA_HOME/bin`(Linux/Mac)加进 PATH,一套流程走完,`java -version` 和 `javac -version` 都有输出才算就绪。

## 1.4 第一个程序与第一波报错

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello Java!");
    }
}
```

```text
$ javac Hello.java      # 生成 Hello.class(字节码)
$ java Hello            # JVM 执行(注意:不带 .class 后缀)
Hello Java!
```

三个规矩和三波报错,提前踩坑:

- **public 类名必须和文件名一致**。类叫 Hello,文件必须叫 `Hello.java`,否则:`class Hello is public, should be declared in a file named Hello.java`。
- **main 签名一个字都不能少**。写成 `void main(String[] args)`(少 static)会得到「main method not found in class Hello」;写成 `String args` (丢中括号)直接编译不过。初学就背标准签名 `public static void main(String[] args)`,第 6 章(方法)会解释每个词的意思。
- **运行时不带 .class**。`java Hello.class` 会报「Could not find or load main class」,因为 JVM 要的是类名不是文件名。

`System.out.println` 这行先当咒语用:System 是个类,out 是它的标准输出流,println 是「打印并换行」。等学完第 8 章(面向对象下),这句话的每个点都会被拆开解释。

## 1.5 和其他语言对个账

| 维度 | Java | C(指针课) | Python | C++ |
|---|---|---|---|---|
| 编译目标 | 字节码 → JVM | 原生机器码 | 解释执行 | 原生机器码 |
| 内存 | GC 全管 | 手动 malloc/free | GC | 手动/智能指针 |
| 指针 | 无(引用受控) | 裸指针 | 无 | 有 |
| 类型检查 | 编译期,强 | 编译期,可绕过(强转) | 运行期,弱 | 编译期,强 |

这张表里每一格都是前面课程讲过的故事:C 列的每一项都能在指针课找到对应的血泪章节;Python 的弱类型灵活但运行期才爆炸;Java 的选择是「编译期把错误拦住 + 运行期有 GC 和边界检查兜底」。作为学生,我的真实体验是:Java 写起来啰嗦(打印一行字要 `System.out.println`,第 14 章你会看到它连多线程都要显式同步),但它的报错信息确实教养很好,栈回溯直接指到行号,配合 IDE 几乎无死角。

## 常见错误

- **环境变量配了没生效**。Windows 改完 PATH 要重开终端;Linux 的 ~/.bashrc 改完要 source。验证方式永远是重开终端跑 `javac -version`。
- **类名和文件名不一致**。多类的文件里,public 类只能有一个且必须同名文件;非 public 类可以共存一个文件(第 8 章讲访问权限时回收这个伏笔)。
- **用记事本+记不住的命令行硬磕**。初学就装 IntelliJ IDEA(社区版免费)或 VS Code + Java 插件,IDE 会替你处理 90% 的环境痛苦;命令行编译的本事,在理解了 1.3 的层次之后再回头练也不迟。

## 练习

1. 动手:装 JDK(选 17 或 21 LTS),完成 `java -version` 和 `javac -version` 双验证;故意把文件名改成 hello.java 编译,抄录报错原文。
2. 动手:`javap -c Hello.class` 反汇编你的第一个类,看看「字节码」长什么样(会看到 aload_0、invokevirtual 之类的虚拟指令),和计组课第 4 章的 RISC-V 指令对照,感受「虚拟 ISA」。
3. 思考:Java 把「编译产物」设计成与平台无关的字节码,而 C 直接编译成平台机器码。从「软件分发」(当年靠光盘/U盘)的历史背景想想 WORA 为什么在 1996 年是杀手锏,在 Docker 容器(本站 Linux/Docker 课程)普及的今天,这个卖点还剩多少?
4. 思考:对比 `System.out.println("hi")` 和 C 的 `printf("hi\n")` 和 Python 的 `print("hi")`,三者的语法复杂度和背后的机制(类库调用 vs 可变参数函数 vs 内置函数)各是什么?Java 的啰嗦换来了什么?
