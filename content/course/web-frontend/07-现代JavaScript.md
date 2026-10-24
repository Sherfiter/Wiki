---
title: "第 7 章 · 现代 JavaScript"
---

# 第 7 章 · 现代 JavaScript

第 4 章的语言基础加本章的现代能力,才凑齐「写今天的 JS」所需的全部装备:一套顺手的语法糖(解构、可选链)、一套异步模型(Promise/async,前端的心脏)、模块化(ESM),以及理解所有异步行为底层的事件循环。事件循环是全章最有价值的概念,它同时解释了 setTimeout 的排序、异步的并发模型、和「页面为什么卡」,值得读到能给别人讲出来。

## 7.1 语法糖速成:解构、展开、可选链

```js
const { name, age } = user;           // 解构:一行拆对象(React 组件天天用)
const [first, ...rest] = [1, 2, 3];   // 数组解构 + 剩余

const msg = `你好 ${name},共 ${a + b} 元`;   // 模板字符串:告别加号拼接
const merged = { ...defaults, ...options };  // 展开:浅合并对象

const city = user?.address?.city;     // 可选链:中间断掉返回 undefined,不炸
const port = config.port ?? 3000;     // 空值合并:仅 null/undefined 用默认值
```

可选链和空值合并值得强调差别:`x ?? d` 只在 null/undefined 时取默认,**0 和 "" 是合法值**(取配置项 0 时不被误杀;对比 `x || d` 会把 0 也吞掉,这是经典 bug)。函数参数默认值、链式 API(`sb.append().append()` 那种)都是本章的常识底座。语法糖没有理解成本,只有「用过就回不去」的体验差。

## 7.2 异步的心脏:Promise 与 async/await

JS 单线程,不能阻塞等待网络(等的话页面全冻结),所以一切耗时操作都是异步的。Promise 是异步结果的容器,三状态一次性落定(pending → fulfilled/rejected):

```js
// 链式风格
fetch("/api/user")
  .then(res => res.json())        // then 里返回新 Promise,链自然接续
  .then(data => console.log(data))
  .catch(err => console.error(err));   // 链上任何一环出错都汇到这里

// async/await:同样的流程,同步的写法
async function loadUser() {
  try {
    const res = await fetch("/api/user");
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}
```

async/await 是 Promise 的语法糖(async 函数必然返回 Promise,await 暂停当前函数但**不阻塞线程**,控制权交回事件循环)。两套都要会:日常写 await,工具函数与组合器用 Promise 系列:

```js
const [user, posts] = await Promise.all([getUser(), getPosts()]);  // 并发!
await Promise.allSettled(tasks);   // 全部落定(含失败),批处理
```

一个高频坑:**并发丢失**。`await a(); await b();` 是串行(总耗时相加),需要并发时先发起再分别 await,或直接 Promise.all。这在「串行加载两个接口,页面慢一倍」的性能问题里天天出现。

## 7.3 模块化:ESM 一统江湖

JS 官生来没有模块,社区先造了 CommonJS(Node 的 require),ES6 定了标准 ESM:

```js
// ESM(现代标准)
export const name = "Tom";
export default function main() {}
import main, { name } from "./m.js";

// CommonJS(旧 Node,历史)
module.exports = { name };
const { name } = require("./m.js");
```

本质差异:**ESM 的 import/export 是编译期静态结构**(引擎解析阶段就知道依赖图),因此构建工具能做 tree-shaking(摇掉没用到的导出,第 9 章的体积优化基础);CommonJS 的 require 是运行时函数调用,依赖图要到运行时才知道,摇不了树。现代前端一律 ESM,Node 也已全面支持,新项目别再写 CommonJS。

## 7.4 事件循环:单线程的并发幻觉

JS 只有**一个**主线程(改 DOM 的前提,不然两个线程同时改 DOM 得打架),靠事件循环调度异步:

```js
console.log("1");
setTimeout(() => console.log("2"), 0);          // 宏任务
Promise.resolve().then(() => console.log("3")); // 微任务
console.log("4");
// 输出:1 4 3 2    ← 每次都是,可以背
```

规则:同步代码跑完(调用栈清空)→ **清空整个微任务队列**(Promise.then、await 后续)→ 取**一个**宏任务(setTimeout、I/O、事件回调)→ 执行它时产生的微任务又立刻清空 → 循环。所以 setTimeout(…, 0) 排在所有已排队微任务之后(输出 3 在 2 前),「0 毫秒」的意思是「下一个宏任务轮次」而非「立即」。

这套模型解释三件事:为什么 JS 里没有真正的并行计算(Web Worker 才是多线程,靠消息通信不共享内存,操作系统课的线程模型在浏览器里的折中);为什么长时间同步代码会卡死页面(主线程被占,事件循环转不动,渲染也被挤掉,第 6 章长任务);为什么「先渲染再执行回调」要用 requestAnimationFrame/宏任务拆分。F12 Performance 面板里那段 Main 线程的火焰图,就是事件循环的现场直播。

## 常见错误

- **await 串行化本该并发的请求**。7.2 的坑,Network 面板瀑布图一眼看穿(两段请求首尾相接)。
- **循环里 await 变串行**。`for + await` 是逐个执行;要并发先 map 成 Promise 数组再 Promise.all。
- **忘记 catch**。Promise 链没 catch,错误无声吞掉;async 函数里没有 try/catch,异常变 unhandled rejection。
- **以为 await 会阻塞别的用户操作**。await 挂起的是当前函数,主线程该干嘛干嘛;阻塞页面的是同步长代码,两回事。

## 练习

1. 动手:事件循环四连测:把 7.4 的代码抄跑;再加一个 setTimeout 嵌套 Promise(宏任务里产生微任务),预测输出再验证,画出每轮「宏任务 → 微任务清空」的时序。
2. 动手:串行 vs 并发:用两个 sleep 函数(返回 setTimeout 包的 Promise)分别测「await a(); await b()」和「Promise.all」的总耗时,记录差值。
3. 实现:把第 5 章 TodoList 的「保存到 localStorage」改成「保存到模拟 API」(setTimeout 800ms 包 Promise),加加载状态与错误重试,体验异步 UI 状态机。
4. 思考:对比 Node.js 和浏览器的宿主环境差异:两者的微任务机制相同,宏任务集合不同(Node 有 setImmediate、文件 IO),事件循环轮次结构也不同(Node 分阶段)。为什么「JS 是单线程」这句话在两个环境里含义并不完全一样?
