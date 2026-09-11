---
title: "第 5 章 · DOM 与事件"
---

# 第 5 章 · DOM 与事件

浏览器把第 1 章的 HTML 解析成一棵 **DOM 树**，JS（第 4 章）通过 DOM API 读写这棵树，让页面动起来；而「动」的触发靠**事件**。DOM 操作是前端最频繁的活儿，也是性能热点（每次改动都可能触发第 6 章的回流/重绘）。

## 5.1 DOM 树：文档即树

```html
<html>
  <body>
    <ul id="list">
      <li class="item">A</li>
      <li class="item">B</li>
    </ul>
  </body>
</html>
```

```
document
 └─ html
     └─ body
         └─ ul#list
             ├─ li.item (A)
             └─ li.item (B)
```

- 每个标签是**元素节点**，文字是**文本节点**，还有注释节点、属性等。
- 节点间关系：父子（parent/child）、兄弟（sibling）。DOM API 就是围绕这棵树增删改查。

## 5.2 查找 / 创建 / 修改节点

```js
// 查找
const list = document.getElementById("list");
const items = document.querySelectorAll(".item");  // 返回 NodeList（静态）
const first = document.querySelector(".item");     // 首个匹配

// 创建 + 插入
const li = document.createElement("li");
li.textContent = "C";
list.appendChild(li);              // 追加到末尾
list.insertBefore(li, first);      // 插到 first 之前

// 修改
li.classList.add("active");
li.setAttribute("data-id", "3");
li.style.color = "red";            // 只改一个元素的样式
```

| 操作 | 常用 API |
|---|---|
| 查找 | `querySelector(All)`、`getElementById` |
| 创建 | `createElement`、`createTextNode` |
| 插入 | `appendChild`、`insertBefore`、`append` |
| 删除 | `remove()`、`removeChild` |
| 改内容 | `textContent`（纯文本）、`innerHTML`（含标签） |

- `textContent` 与 `innerHTML` 的区别：前者安全只写纯文本，后者会解析 HTML、**有 XSS 风险**（拼接用户输入时）。
- `querySelectorAll` 返回的是**静态 NodeList**，`getElementsByClassName` 返回**动态 HTMLCollection**——前者快照，后者实时反映 DOM 变化。

## 5.3 事件流：捕获 / 目标 / 冒泡

一次点击会沿 DOM 树走**三个阶段**：

```
捕获阶段（外→内）→ 目标阶段 → 冒泡阶段（内→外）
document → html → body → ul → li  →  li → ul → body → html → document
```

```js
list.addEventListener("click", () => console.log("list 冒泡"), false);  // 默认冒泡
list.addEventListener("click", () => console.log("list 捕获"), true);   // 捕获
```

- `addEventListener` 第三个参数 `false`（默认）在冒泡阶段触发，`true` 在捕获阶段触发。
- 事件默认**冒泡**：点 `li` 会依次触发 `li`、`ul`、`body` 上的监听器。

> 对比：事件捕获 vs 冒泡——捕获是**从外到内**（document→目标），冒泡是**从内到外**（目标→document）。历史上 IE 只支持冒泡，现代标准两者皆可，但**冒泡是默认且最常用**的。捕获适合「在外层先拦截」的场景（如拖拽在容器层先接管），冒泡适合「内层触发、外层统一处理」的委托。

## 5.4 事件委托（event delegation）

利用**冒泡**，把子元素的监听器挂到父元素上，用一个监听器处理所有子元素（含动态新增的）：

```js
list.addEventListener("click", (e) => {
  if (e.target.matches("li")) {      // 只处理点击的 li
    console.log(e.target.textContent);
  }
});
```

- `e.target` 是**真正被点的元素**，`e.currentTarget`（或 `this`，非箭头函数）是**绑监听器的元素**。
- 好处：监听器数量从 O(n) 降到 O(1)，且**动态新增的 `li` 无需再绑定**。

> 对比：直接绑定 vs 事件委托——直接给每个 `li` 绑监听器简单直观，但子项一多就监听器爆炸，新增元素还要手动再绑；委托只绑父级一处，靠 `e.target` 区分具体子项，天然覆盖动态内容。代价是要在回调里用 `matches` 判断，逻辑稍绕。**列表类场景一律委托**。

## 5.5 阻止冒泡与默认行为

```js
e.stopPropagation();   // 阻止继续冒泡
e.preventDefault();    // 阻止默认行为（如链接跳转、表单提交）
```

- 两者独立：`stopPropagation` 管传播，`preventDefault` 管浏览器默认动作。
- 委托里要小心 `stopPropagation`——它可能让外层委托收不到事件。

> 承上启下：DOM 是把第 1 章的静态结构变成第 4 章 JS 能操作的对象；事件流和闭包、this（第 4 章）在回调里纠缠，事件循环（第 7 章）决定回调何时执行。下一章跳到底层，看浏览器如何把 HTML/CSS 解析渲染成屏幕像素，以及 DOM 改动为什么触发回流/重绘——这解释了本章「少动 DOM」的性能含义。
