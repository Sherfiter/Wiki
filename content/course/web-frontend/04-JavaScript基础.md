---
title: "第 4 章 · JavaScript 基础"
---

# 第 4 章 · JavaScript 基础

JavaScript 是前端脚本语言，靠 DOM（第 5 章）操作页面、事件循环（第 7 章）处理异步；本章打地基：类型、作用域、闭包、this、原型。

## 4.1 数据类型：原始 vs 引用

JS 类型分两大类，本质区别在「存值」还是「存地址」：

| 类别 | 类型 | 赋值/传参 | 比较 |
|---|---|---|---|
| 原始值 Primitive | `number string boolean undefined null symbol bigint` | 复制值 | 比值 |
| 引用值 Reference | `object array function` | 复制引用（地址） | 比引用 |

```js
let a = 10;
let b = a;        // 复制值，a/b 互不影响
b = 20;           // a 仍是 10

let o1 = { x: 1 };
let o2 = o1;      // 复制引用，o1/o2 指向同一对象
o2.x = 2;         // o1.x 也变成 2
```

- `typeof null === "object"` 是历史遗留 bug，`null` 其实是原始值。
- 引用类型「共享同一份」是大量 bug 的来源——想独立一份要深拷贝。

## 4.2 var / let / const

ES6 引入 `let`/`const` 取代 `var` 的坑：

| | `var` | `let` | `const` |
|---|---|---|---|
| 作用域 | 函数级 | 块级 | 块级 |
| 重复声明 | 允许 | 报错 | 报错 |
| 变量提升 | 提升且初始化 `undefined` | 提升但不初始化（TDZ） | 同 let |
| 可重新赋值 | 是 | 是 | 否（引用不可改） |

```js
console.log(a);   // undefined（var 提升）
var a = 1;

console.log(b);   // ReferenceError：暂时性死区 TDZ
let b = 2;

const c = { n: 1 };
c.n = 2;          // 对象内部可变
c = {};           // 引用本身不可改
```

> 对比：`var` 函数作用域且提升成 `undefined`；`let`/`const` 块级作用域 + 暂时性死区。默认用 `const`，改绑定才用 `let`。

## 4.3 作用域与闭包

- **作用域**：变量可被访问的范围，分全局、函数、块三级，内层可见外层、外层不可见内层。
- **闭包（closure）**：函数记住定义时的词法作用域，在别处调用仍能访问当时的变量。

```js
function counter() {
  let n = 0;                     // n 是 counter 的局部变量
  return function () { return ++n; };
}
const c = counter();
c();  // 1
c();  // 2   ← c 仍能访问并修改 n，这就是闭包
```

- 闭包让「私有状态」成为可能（`n` 外部无法直接访问），也是模块化（第 7 章）的基石。
- 副作用：闭包持有外层变量引用，阻止垃圾回收，滥用会内存泄漏。

## 4.4 this 指向

`this` 的值取决于调用方式，而非定义位置：

| 调用方式 | `this` |
|---|---|
| 普通函数 `fn()` | 非严格 `window` / 严格 `undefined` |
| 方法 `obj.fn()` | `obj` |
| 构造 `new Fn()` | 新对象 |
| `call/apply/bind` | 显式指定 |
| 箭头函数 | **继承外层作用域的 this（无自己的 this）** |

```js
const obj = {
  name: "Tom",
  greet() { console.log(this.name); },      // 方法调用，this = obj
};
const f = obj.greet;
f();        // 普通调用，this = undefined（严格模式），this.name 报错
```

- 箭头函数没有自己的 `this`，由定义处外层决定——事件回调常用它固定 this（第 5 章）。

## 4.5 原型链

JS 继承靠原型链：每个对象有个 `[[Prototype]]`（`__proto__`）指向其原型，找属性时沿链上溯：

```js
const parent = { greet() { return "hi"; } };
const child = Object.create(parent);   // child 的原型是 parent
child.greet();                          // 上溯到 parent 找到
```

- `child.greet` 先找自身，再沿 `__proto__` 一路到 `Object.prototype`，没有就 `undefined`。
- ES6 的 `class` 是语法糖，底层仍是原型：

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name; }
}
// 等价于 function + prototype 的写法
```

> 对比：原型是对象直接继承对象，`class` 是糖；理解原型链才能理解 `super`/`static`/`instanceof`。

## 4.6 == 与 ===

| | 行为 | 例子 |
|---|---|---|
| `==` | 先类型转换再比较（宽松） | `1 == "1"` → true；`null == undefined` → true |
| `===` | 类型和值都相等才 true（严格） | `1 === "1"` → false |

```js
0 == ""       // true（都被转成 0）
0 === ""      // false
null == undefined   // true
null === undefined  // false
```

> 对比：`==` 隐式转换、规则复杂（`0 == ""`、`[] == false` 为 true）；除非明确要 `null == undefined`，否则一律 `===`。
