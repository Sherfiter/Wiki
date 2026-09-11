---
title: "第 3 章 · CSS 布局"
---

# 第 3 章 · CSS 布局

这章讲盒子怎么「摆」：定位/浮动是上一代手段，flex/grid 是现代一维/二维主力，媒体查询做响应式。

## 3.1 定位（position）

`position` 决定元素参照哪个坐标系摆放：

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

- `absolute`/`fixed` 脱离文档流后，原位置被后续元素补上，可能重叠。
- `relative` 只偏移视觉位置，占位仍在，最常用作 `absolute` 的锚点。

## 3.2 浮动（float）

```css
img { float: left; margin-right: 12px; }   /* 图片左浮，文字右侧环绕 */
```

- 浮动元素脱离文档流，父容器会「塌陷」（高度丢失），需清除浮动：

```css
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

> 对比：`position` 用参照系+偏移精确定位（弹窗/悬浮/吸顶），`float` 本质是文字环绕、当布局用会踩「父容器塌陷」的坑。

## 3.3 Flexbox：一维布局

flex 沿一条主轴排列子项：

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

- `justify-content` 管主轴，`align-items` 管交叉轴。
- `flex: 1` 是 `flex-grow:1; flex-shrink:1; flex-basis:0` 的简写，表示按比例瓜分剩余空间。
- 经典场景：水平导航、卡片等宽排列、垂直居中。

## 3.4 Grid：二维布局

grid 同时控制行与列：

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;  /* 三列：固定 + 均分 + 均分 */
  grid-template-rows: auto 1fr auto;     /* 三行：内容 + 撑满 + 内容 */
  gap: 16px;
}
.header { grid-column: 1 / -1; }   /* 横跨整行 */
```

- `1fr` 按份分配剩余空间，`auto` 按内容自适应。
- `grid-column: 1 / -1` 用网格线定位，`-1` 表示最后一条线。
- 经典场景：整页「圣杯布局」（header / 侧栏 / 主体 / footer）几行搞定。

> 对比：flex 一维（单轴），grid 二维（行列同时）；flex 适合线性排列，grid 适合网格骨架。可嵌套：外层 grid 搭骨架，内层 flex 排细节。

## 3.5 响应式：媒体查询

媒体查询按设备特征（宽度、方向、分辨率）切换样式：

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
- 断点常取 576 / 768 / 992 / 1200，更应按内容需要设置。
- 生效前提是 HTML 有 `viewport` 声明（第 1 章），否则手机按桌面宽度缩放，媒体查询失效。
