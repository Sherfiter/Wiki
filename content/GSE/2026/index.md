---
title: 演示 (2026 秋)
---

# 演示 (2026 秋)

这是示例课程主页，用来演示 `Box`、`Quiz` 等自定义 MDX 组件的渲染效果。

## 课程公告

<Box title="重要通知" logo="⏰">

第一次课的时间与地点已经确定，请大家准时参加。

</Box>

<Box title="注意事项" logo="⚠️">

本课程需要一定的编程基础，请提前准备好开发环境。

</Box>

## 快速自测

<Quiz
  title="第一题"
  question="下面哪个是 `Box` 组件默认（无 logo）的配色？"
  options={["蓝色 (blue-box)", "红色 (red-box)", "黄色 (yellow-box)", "紫色 (purple-box)"]}
  answer={0}
  comment="默认无 logo 时使用 `blue-box`（浅蓝背景）。"
/>

## 代码示例

```c
#include <stdio.h>

int main() {
  printf("Hello, GSE!\n");
  return 0;
}
```

## 公式示例

行内公式 $E = mc^2$，以及独立公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
