---
title: "第 3 章 · CSS 布局"
---

# 第 3 章 · CSS 布局

CSS 入门到入坑的分水岭就在布局:散着写几个属性谁都会,但「这个元素为什么跑这儿了」一旦发生,不懂布局模型的人只能瞎改。本章按「定位 → 浮动(历史课)→ flex → grid → 响应式」推进,我的学习路径建议是:前两节理解原理即可,**80% 的日常布局交给 flex 和 grid**,它们是为了「不用理解文档流玄学」而生的。

## 3.1 定位:五档坐标系

`position` 决定元素以什么为参照物摆放:

| 值 | 参照 | 脱离文档流 | 典型用途 |
|---|---|---|---|
| static | 默认文档流 | 否 | 不写定位就是它 |
| relative | 自己原来的位置 | 否(占位保留) | 微调、给 absolute 当锚 |
| absolute | 最近的已定位祖先 | 是 | 角标、弹层 |
| fixed | 浏览器视口 | 是 | 悬浮按钮、吸底导航 |
| sticky | 滚动容器 | 否(占位保留) | 吸顶表头 |

最常用的组合是「父 relative + 子 absolute」:父元素设 relative(哪怕 offset 全 0)成为锚点,子元素的 top/right 才有正确的参照:

```css
.card { position: relative; }
.card .badge { position: absolute; top: -8px; right: -8px; }  /* 右上角冒出去 */
```

absolute 脱离文档流后原位置塌掉,后续元素会补上来,重叠就发生在这。fixed 相对视口,滚动时纹丝不动(注意:祖先有 transform 时 fixed 会改相对那个祖先,灵异问题之一)。sticky 是现代宝藏:`position: sticky; top: 0` 的表头滚过就吸顶,一行 CSS 替代过去几十行 JS 监听滚动。

## 3.2 浮动:上一代的遗产

float 的出身是「文字环绕图片」(杂志排版),被上一代开发者硬当布局用,然后踩了几十年「父容器高度塌陷」的坑:子元素全部浮动后脱离文档流,父容器高度归零,后面的内容窜上来。

```css
.clearfix::after { content: ""; display: block; clear: both; }   /* 经典清浮动补丁 */
```

今天还需要它吗?文字环绕(真正本职)用它;布局别用,flex 完胜。认识 float 和 clearfix 的价值在于:接手老项目和看懂「前辈为什么要转行用 flex」。

## 3.3 Flexbox:一维布局的答案

把容器变成 flex 后,子项沿一条主轴排列,几乎覆盖所有「一排/一列」的需求:

```css
.container {
  display: flex;
  flex-direction: row;             /* 主轴:row | column */
  justify-content: space-between;  /* 主轴对齐(两端分散) */
  align-items: center;             /* 交叉轴对齐(垂直居中) */
  gap: 16px;                       /* 子项间距,比 margin 干净 */
}
.item { flex: 1; }                 /* 均分剩余空间 */
```

三件套记忆法:**justify-content 管主轴方向的对齐,align-items 管交叉轴的垂直对齐,flex 子项属性管怎么分地盘**。`flex: 1` 是 `flex-grow:1; flex-shrink:1; flex-basis:0%` 的简写:地盘按份均分,空间不够按比例收缩。那道「CSS 怎么垂直居中」的世纪难题,flex 时代的答案就两行:

```css
.center { display: flex; justify-content: center; align-items: center; }
```

导航条、卡片横排、侧边栏 + 内容的「左固定右自适应」(`.sidebar { flex: 0 0 200px } .main { flex: 1 }`),全是 flex 的舒适区。

## 3.4 Grid:二维骨架

grid 同时管行和列,先画格子再放东西:

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr;   /* 侧栏 + 主区 */
  grid-template-rows: auto 1fr auto;  /* 头 / 主体撑满 / 脚 */
  min-height: 100vh;
}
.page > header { grid-column: 1 / -1; }   /* 头部横跨两列(-1 = 最后一条线) */
.page > footer { grid-column: 1 / -1; }
```

`fr` 是「份」(1fr 和 2fr 按 1:2 分剩余空间),配合 `minmax(200px, 1fr)` 可以表达「最少 200,多余随便」。响应式网格的神级一行:`grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`,容器塞得下几列就几列,卡片墙零媒体查询自适应。选型口径:**整页骨架、需要行列对齐,grid;一排东西的排布,flex**;两者嵌套组合(外 grid 搭骨架,内 flex 排细节)是常态,不是二选一。

## 3.5 响应式:媒体查询与移动优先

```css
/* 移动优先:基础样式按手机写,向上增强 */
.cards { flex-direction: column; }

@media (min-width: 768px) {     /* 平板起,变成横排 */
  .cards { flex-direction: row; }
}
```

`min-width` 写法(移动优先)是现代惯例:从小屏往上叠加,窄屏的简单规则是地基。断点数字(576/768/992/1200)是参考,真正的原则是**内容什么时候挤了,断点就设在哪**。媒体查询生效的前提是第 1 章那个 viewport meta(漏了它手机按桌面宽渲染,一切媒体查询白写)。DevTools 的设备模拟器(Ctrl+Shift+M)是响应式开发的显微镜,写完必过一遍。

## 常见错误

- **absolute 找不到参照**。父元素忘了 relative,absolute 直接相对整个页面定位,元素飞到天边;「先给父设 relative」形成肌肉记忆。
- **flex 子项挤压不收缩**。子项里是长文本/固定宽度内容,加 `min-width: 0`(flex 子项默认不能小于内容宽度,这个默认值反直觉)。
- **grid 卡片高度不齐**。想让行内等高,`align-items: stretch`(默认)被你覆盖了;等高的坑常在 align 系属性。
- **手机上看媒体查询没反应**。viewport meta 缺失,回第 1 章。

## 练习

1. 动手:用 grid 搭「圣杯布局」(顶部导航、左侧栏、主区、底部),主区里用 flex 放一排卡片;窄屏时侧栏收到顶部(媒体查询改 grid-template)。
2. 动手:sticky 实战:一个长列表加吸顶表头和右侧悬浮「回到顶部」按钮(fixed),手机模拟器里滚一遍。
3. 动手:用 `repeat(auto-fill, minmax(240px, 1fr))` 做自适应卡片墙,拖动 DevTools 窗口宽度看列数自动增减,零媒体查询。
4. 思考:float 时代做「侧栏 + 主区」要清浮动、算宽度;flex 时代两行。从「布局意图的表达成本」角度,想想为什么 CSS 工作组要在 flex/grid 上花十几年,再看一眼 Chrome DevTools 里 Flexbox/Grid 的可视化调试面板(勾选 overlay),体会工具演进和规范演进的关系。
