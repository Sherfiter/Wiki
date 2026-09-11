---
title: "第 2 章 · CSS 基础"
---

# 第 2 章 · CSS 基础

CSS 负责「长相」：选择器选中元素 → 声明样式 → 层叠/优先级解决冲突。

## 2.1 三种引入方式

| 方式 | 写法 | 适用 | 优先级 |
|---|---|---|---|
| 行内样式 | `<p style="color:red">` | 极少数动态样式 | 最高 |
| 内部样式 | `<style>` 写在 head | 单页 demo | 中 |
| 外部样式 | `<link rel="stylesheet" href="a.css">` | 生产环境 | 与出现顺序有关 |

- **外部样式**是工程首选：可缓存、可复用、HTML 与 CSS 分离。
- 三者同时作用于同一元素时，按优先级（下节）而非书写位置覆盖。

```css
/* style.css */
p { color: #333; line-height: 1.6; }
```

## 2.2 选择器

```css
#app { }                 /* ID 选择器：唯一 */
.box { }                 /* 类选择器：可复用 */
p { }                    /* 元素（标签）选择器 */
input[type="text"] { }   /* 属性选择器 */
a:hover { }              /* 伪类：状态（悬停） */
li:first-child { }       /* 结构伪类 */
p::before { }            /* 伪元素：生成内容 */
.nav a { }               /* 后代选择器（空格） */
.ul > li { }             /* 子代选择器（>） */
```

- 后代 `A B` 匹配**任意深度**后代，子代 `A > B` 只匹配**直接子级**。
- 伪类 `:hover`/`:focus`/`:nth-child(n)` 针对「状态/位置」，伪元素 `::before`/`::after` 针对「虚拟节点」。

## 2.3 盒模型：一切布局的基本单位

```
┌ margin（外边距，透明，向外推开）
│  ┌ border（边框）
│  │  ┌ padding（内边距，内容到边框）
│  │  │  ┌ content（内容，放文字/图片）
```

- `width`/`height` 默认只指 **content** 区。
- 默认 `box-sizing: content-box` 下，实际占宽 = `width + padding + border`，设了 `width: 100px` 再 `padding: 10px` 会变成 120px。

```css
.box {
  box-sizing: border-box;   /* width 含 padding 和 border */
  width: 100px;
  padding: 10px;
  border: 2px solid #000;
  /* 内容区实际 = 100 - 10*2 - 2*2 = 76px */
}
```

> 对比：`content-box` 的 `width` 只含内容，`border-box` 的 `width` 是盒子总宽；现代项目通常全局 `* { box-sizing: border-box }`。

## 2.4 层叠与继承

- **层叠（cascade）**：同一元素可被多条规则命中，冲突时按「来源 → 优先级 → 书写顺序」裁决。
- **继承（inherit）**：`color`、`font-*`、`line-height` 等从父元素自动继承；`margin`、`padding`、`border`、`width` 不继承。

```css
body { color: #222; }        /* 全站文字颜色被后代继承 */
p { color: inherit; }        /* 显式继承父级 */
.box { width: 50%; }         /* width 不继承，百分比相对父级 */
```

- 用 `inherit` / `initial` / `unset` 可显式控制继承行为。

## 2.5 优先级（specificity）

多条规则命中同一元素同一属性时，用权重 `(ID, 类/属性/伪类, 元素/伪元素)` 从左到右比较：

| 选择器 | 权重 (ID, 类, 元素) |
|---|---|
| `p` | (0, 0, 1) |
| `.box` | (0, 1, 0) |
| `#app` | (1, 0, 0) |
| `.nav a:hover` | (0, 2, 1) |
| `#app .box` | (1, 1, 0) |
| 内联 `style` | 1 0 0 0（碾压一切） |

先比 ID 数，再比类数，最后比元素数；同权重比书写顺序，后写赢。`!important` 越过优先级（不越过来源），滥用难维护。

> 对比：`.nav a:hover`（0,2,1）胜过 `a` 和 `.box`，输给 `#app`——所以尽量用类、少用 ID、避免内联。
