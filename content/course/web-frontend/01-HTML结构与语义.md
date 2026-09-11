---
title: "第 1 章 · HTML 结构与语义"
---

# 第 1 章 · HTML 结构与语义

HTML 不是编程语言，是**文档标记语言**：用标签（tag）给内容加结构，浏览器据此渲染出树（见第 5 章）再画到屏幕上（见第 6 章）。写 HTML 的本质是**描述「这是什么」**，而不是「这长什么样」——长什么样交给 CSS（第 2 章）。

## 1.1 文档骨架：DOCTYPE 与 head/body

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>页面标题</title>
  </head>
  <body>
    <!-- 用户可见的内容都在这里 -->
  </body>
</html>
```

- `<!DOCTYPE html>` 声明「这是 HTML5」，触发浏览器**标准模式**（standards mode）；省略会进入**怪异模式**（quirks mode），CSS 盒模型表现不同（第 2 章）。
- `<head>` 存元数据（编码、视口、标题、外链），**不直接显示**；`charset=UTF-8` 必须尽早出现，否则中文乱码。
- `viewport` 那行是移动端响应式的开关，缺了它媒体查询（第 3 章）在手机上会失效。

## 1.2 块级 vs 行内元素

元素按默认布局分两类，这个分类直接决定 CSS 布局（第 3 章）的起点：

| 类别 | 默认行为 | 常见元素 |
|---|---|---|
| 块级 block | 独占一行，可设宽高 | `div p h1~h6 ul ol li section header footer` |
| 行内 inline | 不换行，宽高由内容决定 | `span a strong em code img`（替换元素，行内呈现） |
| 行内块 inline-block | 不换行但可设宽高 | `button input select` |

> 对比：`div` 是**无语义**的通用块容器，`span` 是**无语义**的行内容器——它们只负责「包一层」，不加任何含义。语义化标签（下节）本质上就是「有名字的 div」，让结构可以被机器理解。

## 1.3 语义化标签：结构即文档

HTML5 用一组标签描述文档结构，替代「通篇 div + class」：

```html
<body>
  <header>页头：logo、导航</header>
  <nav>导航链接</nav>
  <main>
    <article>一篇独立内容（可被单独转载）</article>
    <section>一个主题区块</section>
  </main>
  <aside>侧边栏（次要内容）</aside>
  <footer>页脚：版权、联系</footer>
</body>
```

| 标签 | 含义 | 数量约定 |
|---|---|---|
| `header` | 头部区块 | 可多个 |
| `nav` | 导航区 | 页面级一个为宜 |
| `main` | 页面主体 | **唯一一个** |
| `article` | 可独立分发的内容 | 可多个 |
| `section` | 有标题的主题分区 | 可多个 |
| `footer` | 底部区块 | 可多个 |

> 对比：语义化标签 vs 通篇 `div`——渲染结果几乎相同，但**语义化**对屏幕阅读器（无障碍）、搜索引擎（SEO）、爬虫更友好，代码也更易维护。`div` 无结构信息，机器只能靠 class 名「猜」；`<nav>` 则直接告诉机器「这是导航」。代价是语义化标签更「重」，纯粹做布局容器时用 `div` 依然合理。

## 1.4 表单与输入校验

表单是前端向服务器提交数据的入口（回扣第 10 章的 HTTP 请求）：

```html
<form action="/api/user" method="post">
  <label for="email">邮箱</label>
  <input type="email" id="email" name="email" required placeholder="you@example.com" />

  <label for="age">年龄</label>
  <input type="number" id="age" name="age" min="18" max="60" />

  <label for="bio">简介</label>
  <textarea id="bio" name="bio" maxlength="200"></textarea>

  <button type="submit">提交</button>
</form>
```

| `type` | 效果 |
|---|---|
| `text` / `password` | 文本 / 掩码 |
| `email` / `url` / `tel` | 自带格式校验 |
| `number` / `range` / `date` | 数值 / 滑块 / 日期 |
| `checkbox` / `radio` | 多选 / 单选（靠 `name` 分组） |
| `file` | 文件上传 |

- 原生校验属性：`required`（必填）、`min`/`max`/`maxlength`（范围）、`pattern`（正则）。
- 原生校验是**第一道防线**，但**不能替代后端校验**——任何人可用 curl 绕过前端（第 10 章）。前端校验为体验，后端校验为安全。
- 提交时 `form` 会把 `name=value` 序列化进请求体，GET 则拼进 URL 查询串（第 10 章）。

## 1.5 无障碍与语义的关系

`<label for="id">` 把文字和输入框绑定（点文字即聚焦输入框）；图片写 `alt`，表格用 `<th scope="col">` 标注表头——这些都是语义化的延续，让内容对屏幕阅读器「可读」。

> 承上启下：HTML 只搭骨架、定语义，**它管「结构」不管「长相」**。下一章 CSS 接管表现：选择器怎么选中这些元素、盒模型怎么算尺寸、优先级怎么决定冲突。而本章的标签会在第 5 章被 DOM API 一一取出，在第 6 章被解析成渲染树——结构是这一切的根。
