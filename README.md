# Sherfiter's Wiki

一个 MDX 驱动的静态个人 Wiki(用于个人心得分享和动态更新)

> **⚠️ 复刻声明（Copy from jyy）**
>
> 本项目整体**复刻自 [jyy 的个人 Wiki](https://jyywiki.cn/)**（作者：南京大学 蒋炎岩 / jyy）。



## to get me（node npm做前两步 几秒钟就可以看内容）

```bash

npm install

# 开发模式（热更新）
npm run dev

# 生产构建 + 启动
npm run build
npm start
```

默认地址：http://localhost:3000

## 访客统计

页脚会显示全站总访问量、访客数和今日访问量，数据由 `/api/visitors/` 在服务端统计：

- 记录保存在 `.cache/visitors.json`（不会进 Git，删掉即清零）
- 浏览器用 httpOnly cookie 区分独立访客，存的只是 cookie 的 hash
- 这些文件在服务进程所在机器上，所以部署时 `.cache/` 目录需要可写；多实例部署的话各实例各算各的

## 致谢

- 原站：[https://jyywiki.cn/](https://jyywiki.cn/)（jyy / 蒋炎岩）
- 字体：[霞鹜文楷 LXGW WenKai](https://github.com/lxgw/LxgwWenKai)
