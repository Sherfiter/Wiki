# Sherfiter's Wiki

一个 MDX 驱动的静态个人 Wiki。

> **⚠️ 复刻声明（Copy from jyy）**
>
> 本项目整体**复刻自 [jyy 的个人 Wiki](https://jyywiki.cn/)**（作者：南京大学 蒋炎岩 / jyy）。

---

## 技术栈

| 层 | 实现 |
| --- | --- |
| 框架 | [Next.js 14](https://nextjs.org/)（Pages Router，SSG 静态生成） |
| 内容 | Markdown / MDX，由 [gray-matter](https://github.com/jonschlinkert/gray-matter) 解析 frontmatter |
| MDX | [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote) + `remark-gfm` / `remark-math` / `rehype-katex` / `rehype-highlight` |
| 样式 | [Tailwind CSS 3.3.3](https://tailwindcss.com/) |
| 字体 | 霞鹜文楷 LXGW WenKai（正文/标题）+ 系统等宽（代码） |
| 数学 / 代码 | KaTeX / highlight.js |

## 特性

- **单一路由**：`pages/[[...index]].js` 捕获所有路径，URL 直接映射到 `content/*.md` 文件
- **构建时预渲染**：所有页面 SSG 成静态 HTML，`__N_SSG: true`
- **自定义 MDX 组件**：`Box`（⚠️⏰⚖️💡 对应红/黄/灰/紫提示框）、`Quiz`（交互答题）、`Slideshow`（iframe 幻灯片）
- **暗色模式**：`darkMode: 'media'`，跟随系统
- **顶栏 token 输入框**：存入 cookie（1 年），提交后刷新

## 快速开始

```bash
npm install

# 开发模式（热更新）
npm run dev

# 生产构建 + 启动
npm run build
npm start
```

默认地址：http://localhost:3000

## 项目结构

```
sherfiters-wiki/
├── content/            # 内容源（Markdown/MDX），URL 与文件路径一一对应
│   ├── index.md        # 首页 → /
│   └── GSE/2026/index.md  # → /GSE/2026/
├── components/
│   ├── Layout.js       # 顶栏 + 页脚 + <head> 字体/KaTeX/highlight 加载
│   └── mdx.js          # 自定义 MDX 组件（Box / Quiz / Slideshow）
├── lib/
│   ├── fs.js           # 扫描 content/ 目录，生成 getStaticPaths
│   └── mdx.js          # 读取 + 编译 MDX（getStaticProps 逻辑）
├── pages/
│   ├── _app.js         # 引入全局样式
│   └── [[...index]].js # 捕获所有路由的页面
├── styles/globals.css  # Tailwind 指令 + 从原站提取的自定义 CSS
└── public/             # 静态资源（图片等）
```

## 如何写内容

在 `content/` 下新建 `.md` 文件即可，路径即 URL：

- `content/foo.md` → `/foo`
- `content/foo/index.md` → `/foo/`
- `content/foo/bar/index.md` → `/foo/bar/`

可选 frontmatter 设置标题：

```md
---
title: 我的页面
---

# 我的页面

正文内容……
```

自定义组件示例：

```mdx
<Box title="重要通知" logo="⏰"> 这是黄色提示框 </Box>

<Box title="警告" logo="⚠️"> 这是红色警告框 </Box>

<Quiz
  title="题目"
  question="1 + 1 = ?"
  options={["1", "2", "3"]}
  answer={1}
  comment="答对啦！"
/>
```

支持 GFM 表格、行内/块级公式（`$...$` / `$$...$$`）、代码高亮。

## 字体说明

- **中文/标题/正文**：霞鹜文楷 LXGW WenKai，经国内可达的 `npm.elemecdn.com` 加载
- **回退栈**：`LXGW WenKai → Kaiti SC → STKaiti → KaiTi → sans-serif`（离线时自动退到系统楷体）
- **代码**：`Fira Mono → monospace`（系统等宽）

## 致谢

- 原站：[https://jyywiki.cn/](https://jyywiki.cn/)（jyy / 蒋炎岩）
- 字体：[霞鹜文楷 LXGW WenKai](https://github.com/lxgw/LxgwWenKai)
