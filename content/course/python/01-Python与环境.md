---
title: "第 1 章 · Python 与环境"
---

# 第 1 章 · Python 与环境

Python 的第一道坎不是语法(语法最简单),是**环境**:装哪个版本、包怎么装、为什么别人的代码在我机器上跑不起来。本章把环境问题一次讲透(REPL、venv、pip),用「第一个脚本 + 第一次装库」的实操建立正确习惯——从 venv 开始的人,永远不会遇到「依赖地狱」。

## 1.1 解释器:Python 怎么跑

Python 是**解释执行**(计组课第 1 章的语言光谱:编译到字节码 + 虚拟机执行,和 Java 同款架构,只是字节码对用户透明)。跑 Python 的三种方式:

```bash
python3 hello.py        # 跑脚本文件
python3                 # 进入 REPL(交互式解释器)
python3 -c "print(1+1)" # 单行执行
```

**REPL**(Read-Eval-Print Loop)是 Python 的第一大杀器:输入一行立刻看到结果,试语法、算数、看文档(help(len))全靠它。「Python 学习快」的体验一半来自 REPL 的即时反馈——养成「不确定就开 REPL 试一下」的习惯,学习速度翻倍。

版本常识:只用 Python 3(Python 2 已于 2020 年退役,网上老教程的 print "xxx" 是 2 代遗物);版本号挑最新的稳定版(3.12+),`python3 --version` 验证。macOS/Linux 自带(但可能是旧版),Windows 去官网装并勾选「Add to PATH」(第 1 章计组课的 PATH 老朋友)。

## 1.2 第一个程序与运行

```python
# hello.py
print("Hello, Python!")
name = input("你叫什么?")
print(f"你好,{name}!")     # f-string:第 2 章正式讲
```

```text
$ python3 hello.py
Hello, Python!
你叫什么?思源
你好,思源!
```

和 Java 课对比:`public static void main(String[] args)` 的全部仪式,Python 用一个 `print` 直接开始(脚本从上到下执行,没有强制入口);和 C 指针课对比:没有类型声明、没有分号、没有编译——「跑起来之前」的仪式几乎为零。省下的仪式感换来的代价:类型错误跑到那行才炸(动态类型,第 2 章)、性能慢一个量级(解释 + 动态,计组课第 10 章 Python 慢的机器级解释)。

## 1.3 pip 与包管理:站在巨人肩上

Python 的生态武器是 PyPI(包仓库,50 万+ 包),装法一行:

```bash
pip install requests        # 装
pip list                    # 看装了什么
pip show requests           # 看版本和依赖
```

`import requests` 之后,HTTP 请求、Excel 读写、爬虫、AI 模型全是现成的。「 batteries included」(第 7 章标准库)+ 「PyPI 无所不包」是 Python 统治脚本/数据/AI 领域的根本原因。

## 1.4 venv:虚拟环境的救世主

直接往系统 Python 里装包,迟早撞上两个灾难:项目 A 要 requests 2.0、项目 B 要 1.0(版本打架);系统 Python 被改坏,连系统工具都挂(某些 Linux 发行版自己依赖 Python)。解法:**虚拟环境(venv)**,每个项目一个独立的 Python 世界:

```bash
python3 -m venv .venv       # 在项目目录创建虚拟环境
source .venv/bin/activate   # 激活(Linux/macOS;Windows 用 .venv\Scripts\activate)
pip install requests        # 装进这个隔离环境
deactivate                  # 退出
```

激活后 shell 提示符出现 `(.venv)`,此时 pip 装的一切只属于这个环境。**铁律:每个项目一个 venv,永不往系统里装包**。配套文件 `requirements.txt`(pip freeze > requirements.txt)记录本环境的包清单,别人 `pip install -r requirements.txt` 一键复现——软件工程课第 9 章「lock 文件保证可复现」的 Python 版。

(更现代的替代:uv(极快)、poetry(带锁文件与打包),思路一致:隔离 + 锁版本;先用 venv 学原理,再换工具。)

## 1.5 IDE 与学习路线

编辑器选择:VS Code + Python 插件(轻量通用)或 PyCharm(重但全);REPL 的进阶是 **Jupyter Notebook**(单元格交互执行,数据科学标配,第 10 章用它)。两个好习惯从第一天养成:报错信息**从下往上读**(Python 的 traceback 最后一行是病因)、`print()` 是最朴素的调试器(第 5 章再上正式工具)。

学习路线预告:第 2~4 章(语法与容器)是底座,务必配 REPL 每章敲一遍;第 8、9 章(生成器、装饰器)是 Python 精髓,「Pythonic」的分水岭;第 10 章实战可以反复回访。

## 常见错误

- **python 和 python3 分不清**。老系统 python 可能指向 2.x;永远显式用 python3(或建虚拟环境后的 python)。
- **pip 装错地方**。没激活 venv 就 pip install,包装进了系统/全局;`pip -V` 看路径确认(应含 .venv)。
- **文件名与库重名**。给自己的文件起名 requests.py,然后 import requests 导入的是自己(同名遮蔽);命名避开常用库名。
- **忘了 activate 就跑代码**。提示 ModuleNotFoundError,十有八九是环境没进对;先 `which python3` 确认。

## 练习

1. 动手:装好 Python 3.12+,建 venv 并激活,`pip -V` 与 `python3 -V` 的输出截图/记录;在 REPL 里跑 `import this`(Python 之禅,本书的精神纲领)。
2. 动手:写第一个脚本:问用户两个数,打印和、差、积、商(f-string 格式化,保留两位小数)。故意输入字母,观察报错原文,从下往上读一遍(第 5 章异常的预习)。
3. 动手:pip install cowsay(一个逗趣打印库),在 REPL 里 `import cowsay; cowsay.cow("Hello!")`;再 `pip freeze` 看看这个环境多了什么。
4. 思考:对比 Java 的 Maven/Gradle 和 Python 的 pip/venv:两边的「依赖隔离」哲学有何异同?为什么 Python 社区历史上默认「全局安装」而 Java 默认「项目级」?(提示:两者的典型部署场景,脚本 vs 企业应用。)
