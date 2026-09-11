---
title: "第 3 章 · CSS 布局"
---

# 第 3 章 · CSS 布局

第 2 章讲了盒子怎么「长」，这章讲盒子怎么「摆」：**定位、浮动是上一代的布局手段，flex 与 grid 是现代的一维/二维布局主力，媒体查询让布局随屏幕自适应**。布局改动的代价是回流（第 6 章），所以选对工具也关乎性能。

## 3.1 定位（position）

`position` 决定元素参照**哪个坐标系**摆放：

| 值 | 参照系 | 是否脱离文档流 | 典型用途 |
|---|---|---|---|
| `static` | 默认，按文档流 | 否 | 普通布局 |
| `relative` | 自身原位置偏移 | 否（占位保留） | 微调、给 absolute 当锚点 |
| `absolute` | 最近的已定位祖先 | 是 | 弹窗、角标 |
| `fixed` | 视口（viewport） | 是 | 悬浮导航、返回顶部 |
| `sticky` | 滚动容器，滚过阈值后固定 | 否（占位保留） | 吸顶表头 |

```css
.parent { position: relative; }
.badge {
  position: absolute;
  top: -8px; right: -8px;   /* 相对 .parent 右上角冒出 */
}
.topbar { position: fixed; top: 0; left: 0; right: 0; }
th { position: sticky; top: 0; }   /* 表格表头滚动时吸顶 */
```

- `absolute`/`fixed` 脱离文档流后，原位置被后续元素「补上」，可能造成重叠。
- `relative` 只偏移**视觉位置**，原占位仍在，最常用作 `absolute` 的定位锚点。

## 3.2 浮动（float）

`float` 让元素左/右浮起、文字环绕，**最初为「图文混排」设计**：

```css
img { float: left; margin-right: 12px; }   /* 图片左浮，文字右侧环绕 */
```

- 浮动元素脱离文档流，**父容器会「塌陷」**（高度丢失），需清除浮动：

```css
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

> 对比：定位 vs 浮动——`position` 以**参照系 + 偏移**精确控制位置，适合弹窗、悬浮；`float` 本质是**文本环绕**，勉强当布局用会踩「父容器塌陷」的坑。现代布局优先 flex/grid，`float` 只剩图文混排和兼容旧代码两种场景；`position` 则仍是弹窗、悬浮、吸顶的必需品。

## 3.3 Flexbox：一维布局

flex 让容器沿**一条主轴**排列子项，擅长「一行/一列内如何分配空间」：

```css
.container {
  display: flex;
  flex-direction: row;            /* 主轴方向：row | column */
  justify-content: space-between; /* 主轴对齐 */
  align-items: center;            /* 交叉轴对齐 */
  gap: 16px;                      /* 子项间距 */
}
.item { flex: 1; }                /* 均分剩余空间 */
```

- `justify-content` 管主轴（`flex-direction` 的方向），`align-items` 管交叉轴。
- `flex: 1` 是 `flex-grow:1; flex-shrink:1; flex-basis:0` 的简写，表示「按比例瓜分剩余空间」。
- 经典场景：水平导航、卡片等宽排列、垂直居中（`align-items:center` + `justify-content:center`）。

## 3.4 Grid：二维布局

grid 同时控制**行与列**，擅长「表格状/整页」布局：

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;  /* 三列：固定 + 均分 + 均分 */
  grid-template-rows: auto 1fr auto;     /* 三行：内容 + 撑满 + 内容 */
  gap: 16px;
}
.header { grid-column: 1 / -1; }   /* 横跨整行 */
```

- `1fr` 是「按份分配剩余空间」的单位，`auto` 按内容自适应。
- `grid-column: 1 / -1` 用「网格线」定位，`-1` 表示最后一条线。
- 经典场景：整页「圣杯布局」（header / 侧栏 / 主体 / footer）几行搞定。

> 对比：flex vs grid——flex 是**一维**（沿一条轴），grid 是**二维**（行列同时）；flex 适合「内容驱动、数量不定、线性排列」（导航、按钮组、卡片流），grid 适合「结构固定、网格状」（整页骨架、相册、表单栅格）。两者可嵌套：外层 grid 搭骨架，内层 flex 排细节。

## 3.5 响应式：媒体查询

媒体查询让样式按**设备特征**（宽度、方向、分辨率）切换：

```css
/* 移动优先：先写窄屏基础样式，再逐步增强 */
.card { flex-direction: column; }

@media (min-width: 768px) {
  .card { flex-direction: row; }
}

@media (min-width: 1200px) {
  .container { max-width: 1140px; margin: 0 auto; }
}
```

- `min-width` 移动优先（从小到大叠加），`max-width` 桌面优先（从大到小覆盖）。
- 断点（breakpoint）常取 576 / 768 / 992 / 1200，但更应**按内容需要**设置而非生搬。
- 生效前提是 HTML 里有 `viewport` 声明（第 1 章），否则手机浏览器按桌面宽度缩放，媒体查询失效。

> 承上启下：本章的盒子来自第 2 章的盒模型，`absolute`/`fixed`/`sticky` 的坐标系又与第 6 章的「布局（layout）阶段」直接相关——定位和布局计算都在浏览器里产生回流。下一章转入 JavaScript：数据类型、作用域、闭包、this、原型链，是让页面「动起来」的脚本基础，也是第 5 章操作 DOM 的语言前提。
