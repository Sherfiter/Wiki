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

## 镜像站（/downloads/）

为不方便直接下载资源的同学提供一个文件下载站（Docker 镜像 tar 包、ISO、课程资料等）。

- 文件存放在服务器目录 `/var/www/mirror/`（**不进 git 仓库**），用 scp/WinSCP 手动上传。
- 列表页 `/downloads/` 会自动扫描该目录并展示文件与子目录，下载地址为 `/files/...`。
- 实际文件由 nginx 直接服务（见服务器上的 `location /files/` 配置），支持断点续传。
- 目录路径可通过环境变量 `MIRROR_DIR` 覆盖（默认 `/var/www/mirror`）。

## 致谢

- 原站：[https://jyywiki.cn/](https://jyywiki.cn/)（jyy / 蒋炎岩）
- 字体：[霞鹜文楷 LXGW WenKai](https://github.com/lxgw/LxgwWenKai)
