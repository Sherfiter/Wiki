---
title: "第 11 章 · 图形用户界面(GUI)"
---

# 第 11 章 · 图形用户界面(GUI)

先说实话:Swing/AWT 在今天的就业市场里是「历史遗产」,真实的 Java 界面开发早已转向 Web 和移动端。但这一章照讲不误,而且我只讲一件事,因为它是全章真正值钱的部分:**事件驱动模型**。按钮点了之后谁在跑、监听器怎么被调回来、为什么 UI 卡死,这套模型是你以后学浏览器(本站 Web 前端课程的事件循环)、消息队列、回调式 API 的公共地基。组件本身,认识几个即可。

## 11.1 历史一分钟:AWT 与 Swing

AWT(1995)是最早的 GUI 库,控件直接包操作系统原生组件(重量级,外观随平台变);Swing(1998)在 AWT 之上用纯 Java 自绘控件(轻量级,跨平台外观一致,类名全带 J:JFrame、JButton)。今天的官方推荐是 JavaFX,教学仍在用 Swing(标准库自带,零依赖)。我们用 Swing 写示例,概念在 AWT/Swing 通用。

## 11.2 事件驱动:程序在等什么

命令式程序的图景是「main 从头跑到尾」,GUI 程序完全不同:main 设置好界面后就退到后台,主线程进入**事件循环**,干等事件;你点一下按钮,系统生成事件对象,分发给注册过的监听器,监听器跑完,继续等。整个模型三件套:

- **事件源**:按钮、文本框等组件;
- **事件对象**:ActionEvent(点击)、KeyEvent(按键),带着「谁、在哪、发生了什么」;
- **监听器**:你注册的回调,事件来了被调用。

```java
JButton b = new JButton("点我");
b.addActionListener(e -> System.out.println("点了:" + e.getActionCommand()));
```

这行 Lambda(第 14 章正式讲)其实是「实现 ActionListener 接口的匿名内部类」的缩写(第 7 章的匿名内部类在此兑现),机器层面就是回调函数指针(计组课第 11 章):你把一段代码的地址交给框架,框架在合适的时刻替你调用它。**回调思维**是本章最值钱的遗产:注册之后等待,而不是自己轮询。

## 11.3 最小可运行界面

```java
import javax.swing.*;

public class Hello {
    public static void main(String[] args) {
        JFrame f = new JFrame("第一个窗口");
        JButton b = new JButton("点我");
        b.addActionListener(e -> JOptionPane.showMessageDialog(f, "你好!"));
        f.add(b);                                    // 默认布局(BorderLayout)
        f.setSize(300, 200);
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);  // 点叉真正退出
        f.setVisible(true);                          // 最后才显示
    }
}
```

五个动作固定套路:建窗口、造组件、挂监听、装进容器、setVisible。漏了 setDefaultCloseOperation,点叉后程序「看不见了却还在跑」(事件循环没退),任务管理器里一堆 javaw,这是 GUI 作业的头号收尾事故。

## 11.4 UI 卡死:事件线程的纪律

Swing 只有一个事件分发线程(EDT)在跑所有监听器。如果你在监听器里干重活(读大文件、睡 5 秒),整个界面冻结,因为唯一的线程被你占着,连重绘都轮不上。这就是「为什么我的按钮点了没反应、转圈圈」的标准答案。解法是把重活扔给工作线程(`SwingWorker`),完成后回调更新界面。这条「UI 线程只做轻活」的纪律在所有 GUI 框架里通用(Android 主线程、JavaScript 主线程),第 14 章多线程会回到这里把线程细节补齐。

## 11.5 布局与绘图:知道即可

布局管理器决定组件怎么排(FlowLayout 流式、BorderLayout 五区、GridLayout 网格),理念是「声明式布局,不写像素坐标」(这个思想和 Web 前端的 CSS Flexbox 一脉相承,第 12 章后你可以两边对照)。自定义绘图:继承 JPanel 重写 paintComponent(Graphics g),用 g.drawLine/fillRect/drawString 画图,坐标系原点在左上角(y 向下,和数学课相反)。Swing 绘图做一个课程作业(比如画函数曲线)很合适,做产品就算了。

## 常见错误

- **忘了 setDefaultCloseOperation**。窗口关了进程还在,第 11.3 的标准收尾。
- **在监听器里做耗时操作**。UI 冻结,11.4 的主角;重活进 SwingWorker。
- **非 EDT 线程直接改界面**。偶发诡异渲染甚至崩溃;界面更新一律回到 EDT(SwingUtilities.invokeLater)。
- **组件 add 了两次**。Swing 组件同一时刻只能在一个容器,add 第二次等于搬家,不是复制。

## 练习

1. 动手:跑 11.3 的最小界面,再补一个 JTextField 和「确定」按钮,点击后弹出「你好,xxx」(取文本框内容),体验事件三件套。
2. 实现:简易计数器界面:一个 Label 显示数字,+1/-1 两个按钮,每次点击更新(练习「事件里改状态再刷新」)。
3. 动手:在按钮监听器里 `Thread.sleep(5000)`,点按钮观察界面冻结 5 秒;再用 SwingWorker 改造,对比体验。这个实验是 11.4 的身体记忆。
4. 思考:AWT 用原生控件、Swing 自绘控件,两种路线的跨平台一致性与「本地感」如何权衡?对照浏览器(WebKit/Blink 自绘)和 Electron(每个应用打包一个浏览器)的演化,说说「自绘 + 虚拟机」是不是 GUI 的最终答案。
