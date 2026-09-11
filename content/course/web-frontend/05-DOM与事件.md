---
title: "第 5 章 · DOM 与事件"
---

# 第 5 章 · DOM 与事件

浏览器把 HTML 解析成 DOM 树，JS 通过 DOM API 读写它；「动」由事件触发。

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

- 每个标签是元素节点，文字是文本节点，还有注释节点、属性等。
- 节点间关系：父子（parent/child）、兄弟（sibling）。

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

- `textContent` 只写纯文本，`innerHTML` 解析 HTML、有 XSS 风险（拼接用户输入时）。
- `querySelectorAll` 返回静态 NodeList，`getElementsByClassName` 返回动态 HTMLCollection。

## 5.3 事件流：捕获 / 目标 / 冒泡

```
捕获阶段（外→内）→ 目标阶段 → 冒泡阶段（内→外）
document → html → body → ul → li  →  li → ul → body → html → document
```

```js
list.addEventListener("click", () => console.log("list 冒泡"), false);  // 默认冒泡
list.addEventListener("click", () => console.log("list 捕获"), true);   // 捕获
```

- `addEventListener` 第三参 `false`（默认）冒泡阶段触发，`true` 捕获阶段触发。
- 事件默认冒泡：点 `li` 会依次触发 `li`、`ul`、`body` 上的监听器。

> 对比：捕获从外到内（document→目标），冒泡从内到外（目标→document）；冒泡是默认且最常用，捕获适合外层先拦截。

## 5.4 事件委托（event delegation）

利用冒泡，把子元素监听器挂到父元素，一个监听器处理所有子元素（含动态新增）：

```js
list.addEventListener("click", (e) => {
  if (e.target.matches("li")) {      // 只处理点击的 li
    console.log(e.target.textContent);
  }
});
```

- `e.target` 是真正被点的元素，`e.currentTarget` 是绑监听器的元素。
- 监听器数量从 O(n) 降到 O(1)，动态新增的 `li` 无需再绑。

> 对比：直接给每个子元素绑监听器简单但监听器爆炸、新增要重绑；委托只绑父级、靠 `e.target` 区分，天然覆盖动态内容。列表类场景一律委托。

## 5.5 阻止冒泡与默认行为

```js
e.stopPropagation();   // 阻止继续冒泡
e.preventDefault();    // 阻止默认行为（如链接跳转、表单提交）
```

- 两者独立：`stopPropagation` 管传播，`preventDefault` 管浏览器默认动作。
- 委托里慎用 `stopPropagation`——它可能让外层委托收不到事件。
