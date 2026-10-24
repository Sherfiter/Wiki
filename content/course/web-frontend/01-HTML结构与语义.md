---
title: "第 1 章 · HTML 结构与语义"
---

# 第 1 章 · HTML 结构与语义

HTML 最容易被轻视:人人都会写几个标签,于是人人觉得自己会 HTML。我的转折点是第一次用 F12 看本站(这个 wiki 本身就是网页)的 DOM 树,顺着 `<header>`、`<nav>`、`<main>` 读下去,发现整页结构像一份排好版的文档大纲,而不是一堆 div 的乱炖。那一瞬间明白:HTML 的本职是**描述「这是什么」,而不是「长什么样」**,长什么样交给 CSS(第 2 章)。本章按「骨架 → 分类 → 语义 → 表单 → 无障碍」推进。

## 1.1 文档骨架:每个网页都有的那几行

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>页面标题</title>
  </head>
  <body>
    <!-- 用户可见的内容全在这里 -->
  </body>
</html>
```

每个成员都有明确的职责,漏了会出具体的事故:

- `<!DOCTYPE html>`:声明 HTML5。省略它,浏览器进入**怪异模式**,盒模型的计算规则回到 2000 年代,布局莫名错位,而且报错信息不会提示你这个原因,是新手最冤的坑。
- `<meta charset="UTF-8">`:尽早出现,否则中文乱码(整页的「锟斤拷」)。
- `<meta name="viewport">`:移动端响应式的总开关,缺了它手机上字小如蚁、媒体查询(第 3 章)集体失效。
- `lang="zh-CN"`:屏幕阅读器选发音、翻译工具选语言,都看它。

head 里还住着 `<link>`(CSS)、`<script>`(JS,第 4 章)、favicon、SEO 用的 meta 描述,浏览器的标签页标题就是 title。

## 1.2 三种显示分类:块级、行内、行内块

CSS 布局之前(第 3 章),先建立元素的「占位直觉」:

| 类别 | 占位行为 | 代表元素 |
|---|---|---|
| 块级 | 独占一行,可设宽高 | `div p h1~h6 ul li section` |
| 行内 | 不换行,宽高由内容决定(设了也常无效) | `span a strong em code` |
| 行内块 | 不换行,但可设宽高 | `button input img` |

用 DevTools 的 Elements 面板点选元素,右侧 Computed 面板能看到 `display` 的实际值,亲手确认这张表(img 的 display 是 inline 却能设宽高,因为它是替换元素,这类「表里不一」的案例正是亲眼看的价值)。

一个行内的经典陷阱:两个 `<span>` 之间源码里的换行和空格,渲染时会变成一个空格,排版「多了条缝」,和 CSS 无关,是 HTML 白空格折叠规则。知道这回事,排查时就不再怀疑人生。

## 1.3 语义化:给结构起名字

HTML5 提供一组描述文档结构的标签,替代「通篇 div + class」:

```html
<body>
  <header>页头:logo、导航</header>
  <nav>导航链接</nav>
  <main>
    <article>一篇独立内容(本 wiki 的每一章)</article>
    <aside>侧边栏</aside>
  </main>
  <footer>页脚</footer>
</body>
```

语义化的收益不渲染时看不出差异(拿 div 全替掉,页面长得一样),它买的是三样东西:

- **无障碍**:屏幕阅读器靠 `<nav>`「跳到导航」、靠 `<main>` 直达正文,div 全靠用户盲猜。
- **SEO**:搜索引擎的爬虫读语义标签判断页面主次(标题层级 h1→h6 尤其重要,一页一个 h1 是惯例)。
- **可维护性**:半年后回来改代码,`<article>` 比 `<div class="article-box">` 直观得多。

反直觉的一条:`<div>` 和 `<span>` 是「无语义容器」,它们不是坏东西,「纯布局的容器用 div」依然是正解(比如 purely 摆样式的一格),语义标签用在该用的结构上。别走极端到处 semantically 正确却多包八层。

## 1.4 表单:网页和用户对话的入口

```html
<form action="/api/user" method="post">
  <label for="email">邮箱</label>
  <input type="email" id="email" name="email" required placeholder="you@example.com" />

  <label for="age">年龄</label>
  <input type="number" id="age" name="age" min="18" max="60" />

  <textarea id="bio" name="bio" maxlength="200"></textarea>
  <button type="submit">提交</button>
</form>
```

几个撑起日常的功能:input 的 type 自带校验(email/url/tel/number/date,浏览器自动弹「格式不对」的气泡)、required/min/max/maxlength/pattern 是原生约束、label 的 for 绑定让点文字也能聚焦输入框(可点击区域翻倍,移动端必做)。提交时,浏览器把有 name 的字段序列化成 `name=value`,GET 拼进 URL、POST 进请求体(发给谁、怎么发,计网课第 2 章 HTTP 的内容)。

记住一条安全铁律的因果:**原生校验只是体验,不是防线**。curl 一行命令就能绕过所有前端校验直打接口,后端校验(数据库课第 3 章的约束)才是真防线,前端校验的定位是「让好用户少踩坑」。

## 1.5 无障碍:顺手就能做的几件事

语义化本身就是无障碍的大头,再补三件举手之劳:图片必写 alt(图片挂了,alt 文字还在,这是它的第二个用途);表头用 `<th scope="col">` 让读屏软件知道行列关系;别用 div + onclick 冒充按钮(键盘 Tab 到不了、回车按不动),按钮就 `<button>`。做完这三件,你的页面已经超过大半互联网。

## 常见错误

- **忘写 DOCTYPE 或 charset**,布局怪异 / 中文乱码,且没有明确报错。
- **h 标签按字号选**(哪个大用哪个)。h1~h6 是文档大纲层级不是字号,字号交给 CSS。
- **div + onclick 冒充可点元素**。无障碍全灭;交互元素用 button/a。
- **内联元素上设 width/height 不生效就怀疑 CSS**。先看 display 分类,1.2 的表。

## 练习

1. 动手:新建 index.html,用语义标签搭出「课程页」骨架(header/nav/main/article/footer),浏览器打开后按 F12 对照 Elements 面板看结构。
2. 动手:故意删掉 DOCTYPE 和 viewport 各一次,手机模拟(DevTools 的设备模拟)下观察怪异模式与 viewport 缺失的表现,记录现象。
3. 动手:写一个完整注册表单(邮箱、密码、年龄、简介),只用原生属性做校验,提交时用 DevTools 的 Network 面板看请求体里 name=value 的序列化结果(计网课第 2 章的预习)。
4. 思考:这个 wiki 站是 Next.js 写的(服务端渲染)。打开任一章页面「查看网页源代码」,对比 F12 里的 DOM,思考:为什么源代码里就有完整内容(而不是只有空 div 等 JS 来填)?这对 SEO 和首屏速度意味着什么(第 6 章).
