---
title: "第 5 章 · DOM 与事件"
---

# 第 5 章 · DOM 与事件

前四章的材料(HTML 结构、CSS 样式、JS 语言)在这章合体:DOM 是浏览器把 HTML 解析成的可编程对象树,JS 通过它读写页面;事件是页面对用户动作的反应机制。学完这章,你就能写「会动」的页面了。本章的重头戏是**事件流与事件委托**,委托模式不只是省代码,它是理解 React 事件系统(第 8 章)的铺垫。

## 5.1 DOM:文档即树

浏览器解析 HTML 后生成 DOM(Document Object Model)树,F12 的 Elements 面板就是它的可视化:

```
document
 └─ html
     └─ body
         └─ ul#list
             ├─ li.item "A"
             └─ li.item "B"
```

节点间是父子、兄弟关系;标签是元素节点,文字是文本节点。一切页面操作的本质,都是对这棵树的查询和改写。

## 5.2 增删改查:DOM API 四件套

```js
// 查:querySelector 全家桶(现代首选)
const list = document.querySelector("#list");
const items = document.querySelectorAll(".item");   // 全部匹配

// 建 + 挂
const li = document.createElement("li");
li.textContent = "C";
list.append(li);

// 改
li.classList.add("active");          // class 操作(比 className 赋值精细)
li.dataset.id = "3";                 // data-* 属性,dataset 自动映射
li.style.color = "red";              // 内联样式(个别动态样式才用)

// 删
li.remove();
```

选择风格统一用 querySelector(All),它们吃 CSS 选择器语法(第 2 章白学了,直接复用)。一个易混点:querySelectorAll 返回**静态**快照(查完之后新增的元素不在里面),getElementsByClassName 返回**动态**集合(实时跟着 DOM 变);写现代代码统一 querySelectorAll,按需重查即可。

改内容的老大难:`textContent`(纯文本,安全)vs `innerHTML`(解析 HTML,方便但危险)。**危险在哪**:innerHTML 拼接用户输入等于让用户在你的页面里注入标签,`<img src=x onerror="偷数据()">` 这类 XSS 攻击(跨站脚本,计网课第 8 章安全部分)就是这么进的门。纪律:用户输入一律 textContent 或先转义,innerHTML 只用于可信内容。

## 5.3 事件流:一次点击的旅行

点击一个 li,事件不是「只发生在这里」,它走完整条路线:

```
捕获阶段(外→内):document → body → ul → li   ↓
目标阶段:            li(事件真正的主人)
冒泡阶段(内→外):li → ul → body → document   ↑
```

addEventListener 默认在**冒泡阶段**监听(第三参 false),传 true 则捕获阶段监听:

```js
list.addEventListener("click", e => console.log("冒泡:我是 ul"));
document.body.addEventListener("click", () => console.log("冒泡:我是 body"));
// 点击 li:先 "冒泡:我是 ul" 再 "冒泡:我是 body"(从内向外)
```

为什么默认冒泡?因为**委托**(下一节)靠它成立。冒泡让「点击 li」同时成为「点击了 ul 里」的事件,外层才有机会代为处理。

## 5.4 事件委托:一个监听器管全树

需求:给列表的每一项加点击行为。笨办法给每个 li 各绑一个监听器(100 项 100 个,动态新增还要补绑);委托的办法是**只给父元素绑一个**,靠冒泡统一接单:

```js
list.addEventListener("click", (e) => {
  const item = e.target.closest("li");       // e.target 是真正被点的元素
  if (item) console.log(item.textContent);
});
```

两个对象必须分清:`e.target` 是「被点的那个元素」,`e.currentTarget` 是「绑了监听器的元素」(委托里通常是父级)。委托的收益:监听器从 O(n) 降到 O(1)、动态新增的子项天然被覆盖(监听器在父级,新增子项不用管)、销毁方便(只解绑一个)。React 的合成事件系统整个建立在委托思想上(它把事件统一委托到根节点,第 8 章),所以委托不是奇技淫巧,是主流框架的地基。

## 5.5 打断:stopPropagation 与 preventDefault

```js
link.addEventListener("click", (e) => {
  e.preventDefault();      // 拦下浏览器默认动作(不跳转/不提交)
  e.stopPropagation();     // 拦下继续冒泡(外层监听器收不到)
});
```

两者独立:preventDefault 管「浏览器默认行为」(链接跳转、表单提交、右键菜单),stopPropagation 管「事件传播」。表单的典型组合:submit 监听里 preventDefault 后自己用 JS 校验提交(无刷新提交)。委托场景里慎用 stopPropagation:它可能让更外层的委托收不到事件,拆他人大脑。

## 常见错误

- **innerHTML 拼用户输入**。XSS 通道,5.2 的红线。
- **委托时拿 currentController 当 target**。委托逻辑必须基于 e.target;打印两个对象对比一下就懂。
- **动态新增的元素没监听器**。这就是该用委托的信号;每新增就补绑 = 设计错了。
- **忘记解绑**。单页应用里组件销毁时不 removeEventListener,监听器拽着闭包(第 4 章)造成内存泄漏;现代框架帮你管,原生代码要自己管。

## 练习

1. 动手:做一个 TodoList:输入框 + 添加按钮 + 列表(委托处理点击删除、点击文字划线完成),全程一个监听器管列表。
2. 动手:事件流实验:嵌套三层 div 各绑冒泡和捕获监听器,打印触发顺序,亲手画出 5.3 的路线图。
3. 动手:XSS 演示(本地):innerHTML 插入 `<img src=x onerror="alert(1)">` 看弹窗,再换 textContent 验证被当纯文本;理解「注入」的形状。
4. 思考:React 的合成事件为什么统一委托到根节点?(提示:跨浏览器一致性、内存、以及和 DOM 事件委托的对比。)写 100 字推理,第 8 章学完回来对答案。
