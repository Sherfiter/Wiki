---
title: "第 1 章 · HTML 结构与语义"
---

# 第 1 章 · HTML 结构与语义

HTML 是文档标记语言：用标签描述「这是什么」，长什么样交给 CSS（第 2 章）。

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

- `<!DOCTYPE html>` 声明 HTML5，触发浏览器**标准模式**；省略进入**怪异模式**，盒模型表现不同（第 2 章）。
- `<head>` 存元数据，不直接显示；`charset=UTF-8` 必须尽早出现，否则中文乱码。
- `viewport` 是移动端响应式开关，缺了它媒体查询（第 3 章）失效。

## 1.2 块级 vs 行内元素

| 类别 | 默认行为 | 常见元素 |
|---|---|---|
| 块级 block | 独占一行，可设宽高 | `div p h1~h6 ul ol li section header footer` |
| 行内 inline | 不换行，宽高由内容决定 | `span a strong em code img`（替换元素，行内呈现） |
| 行内块 inline-block | 不换行但可设宽高 | `button input select` |

> 对比：`div` 是无语义块容器，`span` 是无语义行内容器；语义化标签本质是「有名字的 div」。

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

> 对比：语义化 vs 通篇 `div`——渲染几乎相同，但语义化对屏幕阅读器（无障碍）、SEO、爬虫更友好；纯布局容器用 `div` 依然合理。

## 1.4 表单与输入校验

表单是前端向服务器提交数据的入口（见第 10 章）：

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
- 原生校验是体验的第一道防线，不能替代后端校验——curl 可绕过前端（第 10 章）。
- 提交时 `form` 把 `name=value` 序列化进请求体，GET 拼进 URL 查询串（第 10 章）。

## 1.5 无障碍与语义的关系

`<label for="id">` 绑定文字与输入框（点文字即聚焦）；图片写 `alt`，表头用 `<th scope="col">`——让内容对屏幕阅读器可读。
