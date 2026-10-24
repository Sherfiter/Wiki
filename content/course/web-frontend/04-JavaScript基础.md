---
title: "第 4 章 · JavaScript 基础"
---

# 第 4 章 · JavaScript 基础

JS 是三门基础语言里「特性最放飞」的:没有类也能面向对象、函数是值、变量提升、this 飘忽。本章的目标是把这些「放飞」全部收进规则里,重点讲四件影响深远的事:值与引用(几乎所有诡异 bug 的根源)、let/const 取代 var、闭包、this。原型链和 == 的坑放最后收尾。学完本章再回看 Java 课(对象、方法、继承),你会对两门语言的「对象观」差异有具体感受。

## 4.1 值与引用:诡异 bug 的总根源

类型分两族,差别在「变量里装的是什么」:

| 类别 | 成员 | 赋值/传参 |
|---|---|---|
| 原始值 | number、string、boolean、undefined、null、symbol、bigint | 复制值本身 |
| 引用值 | object、array、function | 复制地址 |

```js
let a = 10;
let b = a; b = 20;        // a 还是 10:各存各的值

let o1 = { x: 1 };
let o2 = o1;               // 复制的是门牌号
o2.x = 2;                  // o1.x 也变 2:两把钥匙开同一扇门
```

这和 Java 课第 5 章数组引用语义一模一样(那里的 `int[] b = a` 实验),到哪都逃不掉的真理:**引用共享,除非显式拷贝**。拷贝对象注意「浅 vs 深」:`{...o1}` 展开只拷第一层(嵌套对象还是共享),深拷贝用 `structuredClone(o)`(现代标准答案)或库。顺带两个语言 trivia:`typeof null === "object"` 是 JS 的历史 bug(永远记着);number 是 64 位浮点,所以 `0.1 + 0.2 !== 0.3`(计组课第 2 章的 IEEE 754 在这再次应验),金额计算别用 number。

## 4.2 var 之死:let/const 与 TDZ

| | var | let / const |
|---|---|---|
| 作用域 | 函数级 | 块级(大括号)|
| 重复声明 | 允许 | 报错 |
| 声明前访问 | undefined(变量提升) | ReferenceError(暂时性死区 TDZ) |

```js
console.log(a); var a = 1;    // undefined:声明被"提升"但值没跟上
console.log(b); let b = 2;    // ReferenceError:TDZ 期间碰它就报错
```

var 的问题不是「能运行」,是**报错太晚**:提升 + 函数作用域让「拼错的变量名」安静地变成 undefined,bug 藏到运行深处。let/const 用块级作用域 + TDZ 把错误提前到毫秒级。工程纪律:默认 const(防止误改引用),需要重绑才 let,var 在新代码里视为不存在。const 的含义是「引用不可重绑」,对象内容照样能改(和 Java 的 final 一个脾气)。

## 4.3 闭包:函数带着「出生地」的记忆

函数在 JS 里是一等公民(能存变量、能当参数、能当返回值),由此长出本章最重要的概念:

```js
function makeCounter() {
  let n = 0;                        // 局部变量,按理函数返回后该销毁
  return function () { return ++n; };
}
const c = makeCounter();
c();  // 1
c();  // 2   ← n 还活着!返回的函数"拽着"它出生地的变量不放
```

闭包(closure)= 函数 + 它定义时的词法作用域。返回的内层函数在外被调用,仍能访问并修改 makeCounter 里的 n,外部却摸不到 n:这就是 JS 的「私有状态」。它的日常应用遍布你已见过的代码:第 11 章按钮的 `e => ...` 回调捕获外层变量、React hooks 依赖的「上一次 state」、防抖节流(定时器回调记住外层 timer id)。代价:闭包拽着变量不放,垃圾回收(第 6 章)收不走,滥用大闭包是内存泄漏的常见来源(和 Java 课第 7 章的「长命对象攥着短命对象」同病)。

## 4.4 this:看谁调用,不看谁定义

this 的值由**调用方式**决定,这是 JS 与 Java(this 永远是当前对象)最大的分歧:

| 调用方式 | this 指向 |
|---|---|
| `fn()` 普通调用 | 非严格模式 window / 严格模式 undefined |
| `obj.fn()` 方法调用 | obj |
| `new Fn()` 构造调用 | 新对象 |
| `fn.call(obj)` / bind | 显式指定 |
| 箭头函数 | **没有自己的 this,用外层的** |

```js
const obj = { name: "Tom", greet() { console.log(this.name); } };
const f = obj.greet;
f();                    // undefined:脱离了 obj,普通调用
setTimeout(obj.greet, 100);   // 同样丢 this:定时器只拿走函数体

setTimeout(() => obj.greet(), 100);   // 箭头包一层,方法调用,稳
```

「方法被当回调传出去,this 就丢」是 JS 最经典的坑(第 5 章事件处理天天遇到)。解法按顺序:箭头函数(没有 this,自然用外层的,回调解耦首选)、`bind(obj)`(生成绑死 this 的新函数)、或者干脆写箭头方法字段。记一句口诀:**普通函数 this 看调用者,箭头函数 this 看定义处**。

## 4.5 原型链与 class:继承的另一条路

JS 没有「类实例化」的复制语义,对象继承靠**原型链**:读属性时先找自己,没有就顺着 `__proto__` 往上找,一路到 Object.prototype:

```js
const animal = { speak() { return "..." } };
const dog = Object.create(animal);    // dog 的原型是 animal
dog.speak();                           // 自己没有,沿链找到 animal 的

class Dog {                            // class(ES6)是原型机制的语法糖
  constructor(name) { this.name = name; }
  speak() { return this.name + ": woof"; }
}
const d = new Dog("旺财");
```

写代码用 class(可读、有 constructor、能 extends),理解层面要知道底下是「对象链接对象」而不是「模板复制」,这解释了 Java 里没有的怪事:对象可以运行时加方法(`d.newTrick = ...`,改的是实例)、所有函数天生是对象。计组课第 10 章讲过 JS 引擎(V8)内部把对象做成隐藏类来提速,「动态」与「快」的博弈在那有答案。

## 4.6 == 的深渊

```js
0 == ""       // true(隐式转换)
[] == false   // true(双层转换)
1 === "1"     // false
```

== 的隐式转换规则表能写一页,没有记忆价值。纪律只有一条:**永远用 ===(严格相等)**,唯一例外是 `x == null` 判「null 或 undefined」(这个方便可以留)。ESLint 的 eqeqeq 规则就是这条纪律的自动化,配上。

## 常见错误

- **引用共享导致「改 A 动 B」**。复制对象用 structuredClone 或展开,数组 slice/展开,别裸赋值。
- **回调丢 this**。4.4 的场景;箭头函数或 bind。
- **for 循环里 var + 异步回调全打出最后一个值**(经典面试题)。var 是函数作用域,循环里共享一个 i;let 每轮新绑定,一行修复,这也解释了 var 为什么必须死。
- **0.1 + 0.2 !== 0.3 就觉得 JS 有 bug**。是 IEEE 754(计组第 2 章),金额用整数分或库。

## 练习

1. 动手:验证值/引用:`let a = [1,2]; let b = a; b.push(3)`,打印 a;再用展开复制修复;对象用 structuredClone 验证深拷贝后互不影响。
2. 动手:经典面试题复现:`for (var i=0;i<3;i++) setTimeout(()=>console.log(i))` 打出什么;换 let;再想想 setTimeout 的回调是闭包(捕获了谁)。
3. 实现:用闭包写一个防抖函数 `debounce(fn, delay)`(连续触发只执行最后一次:外层存 timer id,返回的闭包里 clearTimeout 再重设),用在输入框搜索联想上。
4. 思考:this 的「看调用者」设计在回调流行的年代制造了海量 bug,于是箭头函数(lexical this)成了默认推荐。对比 Java(this 永远指向实例)和 JS 的演化,说说「语言为了向后兼容保留历史行为、再用新语法提供正解」这种演化模式的优劣。
