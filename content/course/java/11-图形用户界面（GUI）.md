---
title: "第 11 章 · 图形用户界面（GUI）"
---

# 第 11 章 · 图形用户界面（GUI）

## 11.1 AWT 概述

AWT（Abstract Window Toolkit）是 Java 最早的 GUI 库，通过“重量级组件”调用操作系统原生控件，外观随平台不同。核心类在 `java.awt` 包：`Frame`、`Panel`、`Button`、`TextField` 等。

## 11.2 事件处理

GUI 采用**事件驱动模型**：用户操作（点击、按键）触发事件对象，由注册的监听器响应。

```java
Button b = new Button("确定");
b.addActionListener(e -> System.out.println("点击了"));
```

- 事件源（组件）→ 事件对象 → 事件监听器（回调）。
- 常用监听接口：`ActionListener`、`MouseListener`、`KeyListener`、`WindowListener`。
- 用**匿名内部类**或 Lambda 简洁实现监听器。

## 11.3 布局管理器

布局管理器决定组件在容器中的位置与尺寸，而非硬编码坐标：

- **FlowLayout**：从左到右排列，放不下换行。
- **BorderLayout**：分东南西北中五个区域（Frame 默认）。
- **GridLayout**：等分网格。
- **GridBagLayout**：最灵活的网格，可控跨行跨列。
- **CardLayout**：卡片式切换。

## 11.4 AWT 绘图

重写 `paint(Graphics g)` 或 `paintComponent`，用 `Graphics` 的 `drawLine/drawRect/drawOval/fillRect/drawString` 绘制图形。坐标原点在左上角。

## 11.5 Swing

Swing 是 AWT 之上的“轻量级组件”库（纯 Java 绘制，跨平台外观一致），核心类以 `J` 开头：

- 顶层容器：`JFrame`、`JDialog`。
- 常用组件：`JButton`、`JLabel`、`JTextField`、`JTextArea`、`JComboBox`、`JMenuBar`、`JScrollPane`、`JPanel`。

```java
JFrame f = new JFrame("标题");
f.setSize(400, 300);
f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
f.add(new JButton("按钮"));
f.setVisible(true);
```

## 11.6 与其他语言对比

| 维度 | Java Swing | C++ Qt | Python tkinter |
|---|---|---|---|
| 跨平台 | JVM 一致 | 优秀 | 一般 |
| 外观 | 略过时 | 原生感强 | 较朴素 |
| 布局 | 布局管理器 | 布局 + 手动 | 布局管理器 |
| 现状 | 已被 JavaFX 取代 | 主流桌面 | 教学/小工具 |

> 关键差异：Java 靠 JVM 实现“一次编写处处运行”的 GUI；C++ Qt 是高性能桌面应用首选；Python 的 tkinter 适合快速小工具。Java 桌面 GUI 现已边缘化，主流转向 Web/移动端，官方推荐 JavaFX 取代 Swing。
