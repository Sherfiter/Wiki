---
title: "第 7 章 · 现代 JavaScript"
---

# 第 7 章 · 现代 JavaScript

本章上现代语法与异步模型：解构/箭头/模板、Promise/async、模块化、事件循环。

## 7.1 ES6+ 语法糖

```js
// 解构
const { name, age } = user;
const [first, ...rest] = arr;

// 箭头函数（无自己的 this，见第 4 章）
const add = (a, b) => a + b;

// 模板字符串
const msg = `你好 ${name}，今年 ${age} 岁`;

// 展开 / 剩余
const merged = { ...a, ...b };
const [head, ...tail] = [1, 2, 3];   // head=1, tail=[2,3]

// 默认参数 / 可选链 / 空值合并
function f(x = 1) { return x; }
const city = user?.address?.city;     // 任一环为空 → undefined
const v = x ?? "默认";                 // 仅 null/undefined 触发
```

- `...` 在「展开」与「剩余」两种语境含义不同，本质都是「收集/铺开」。
- 可选链 `?.` 和空值合并 `??` 大幅减少 `if (a && a.b)` 的样板。

## 7.2 Promise 与 async/await

异步结果用 Promise 封装，三种状态 `pending → fulfilled / rejected`，一旦落定不可再变：

```js
fetch("/api/user")                       // 返回 Promise
  .then((res) => res.json())             // 链式：返回新 Promise
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

`async/await` 是 Promise 的语法糖，把异步写成同步的样子：

```js
async function loadUser() {
  try {
    const res = await fetch("/api/user");
    const data = await res.json();   // 等待前一个完成再继续
    return data;
  } catch (err) {
    console.error(err);
  }
}
```

- `await` 只能在 `async` 函数内使用；`async` 函数总是返回 Promise。
- `Promise.all` 并发等待多个、`Promise.race` 取最快、`Promise.allSettled` 全等到（含失败）。

> 对比：Promise 用 `.then` 链组织，async/await 是其语法糖、用 try/catch 写起来像同步；需并发时用 `Promise.all`。

## 7.3 模块化：ESM vs CommonJS

JS 长期没有模块，社区先造 CommonJS（Node），ES6 定标准 ESM：

```js
// ESM（浏览器 / 现代 Node）
export const name = "Tom";
export default function () {}
import def, { name } from "./m.js";

// CommonJS（旧 Node）
module.exports = { name };
const { name } = require("./m.js");
```

| | ESM | CommonJS |
|---|---|---|
| 语法 | `import` / `export` | `require` / `module.exports` |
| 加载 | 编译期静态分析，**可 tree-shaking** | 运行时动态，不可摇树 |
| 时序 | 异步加载（浏览器） | 同步加载 |
| 默认导出 | 支持 `export default` | 无（手动 `exports.default`） |

> 对比：ESM 静态、编译期可摇树（第 9 章）；CommonJS 运行时、无法摇树。现代前端一律 ESM。

## 7.4 事件循环（event loop）

JS 单线程，靠事件循环并发处理异步：

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 输出顺序：1 4 3 2
```

调用栈清空后，先清空微任务队列（Promise、`MutationObserver`），再取一个宏任务（`setTimeout`、I/O、事件），每执行完一个宏任务都要先清空微任务：

| | 宏任务 macrotask | 微任务 microtask |
|---|---|---|
| 成员 | `setTimeout`、`setInterval`、I/O、`<script>` | Promise 回调、`queueMicrotask`、`MutationObserver` |
| 时机 | 一次取一个 | 一次清空整个队列 |
| 例子 | 定时器、事件 | `then`、`await` 之后 |

> 对比：每轮循环「一个宏任务 → 清空全部微任务 → 渲染」，所以 `setTimeout(…, 0)` 晚于所有已排队微任务（上面 `3` 在 `2` 前）。
