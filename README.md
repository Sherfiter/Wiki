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

## 每日速览

顶部导航的「每日速览」（`/daily/`）会在打开页面时拉取当天的热门开源项目和新闻，不用手动改 Markdown。

- 页面：`content/daily/index.md`，只放一个 `<DailyDigest />`
- 组件：`components/DailyDigest.js`（条数用 `projects={12}`）
- 服务端抓取与缓存：`lib/digest.js`，接口 `pages/api/digest.js`
- 项目源：GitHub Trending 当日榜（抓 HTML），挂了退到 `api.github.com` 搜索，再挂退到缓存
- 新闻源：[Solidot](https://www.solidot.org/) 的 12 个分类页 + IT之家 / 少数派 / 开源中国 / InfoQ 中文 / 机核 / 爱范儿 的 RSS，只留一周内、每板块最多 3 条
- 项目中文说明：`lib/project-zh.js`（热榜常客写死词条 + 关键词兜底）+ `lib/translate.js`（MyMemory 免费翻译，结果永久缓存）
- 缓存 30 分钟，落在 `.cache/digest.json`；译文缓存在 `.cache/translate.json`（都在 .gitignore 里）
- 需要跑 Node 服务（`npm start`）才有 `/api/digest`；纯静态托管时组件会退化成浏览器直连 GitHub，只显示项目列表

### 没人访问也会更新

`instrumentation.js` 会在服务进程启动时挂一个定时任务（`lib/warmup.js`），默认 **30 分钟**跑一次：

1. 抓一次新数据（`/api/digest/?force=1`）；
2. 让 `/daily/` 重新生成静态页（`/api/revalidate/?path=/daily/`）。

所以不需要在服务器上配 crontab，也不用等访客触发。启动日志里能看到：

```
[warmup] 已启动，每 30 分钟更新一次
[warmup] 定时：项目 12 个、新闻 15 组，页面已重建（26ms）
```

可调的环境变量（都可选）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `WARMUP_INTERVAL_MS` | `1800000` | 更新间隔（毫秒） |
| `WARMUP_ORIGIN` | `http://127.0.0.1:${PORT \|\| 3000}` | 定时任务请求自己的地址 |
| `REVALIDATE_SECRET` | 无 | 设置后 `/api/revalidate` 要求带 `x-revalidate-secret` |
| `PORT` | `3000` | `next start` 的端口，定时任务跟着用 |

注意：定时任务只在 `npm start`（生产模式）下启用，`next dev` 和 `next build` 阶段不会跑；`revalidate` 接口只有本机定时任务会调，也支持外部 cron 手动触发。

### 缓存清理

不会越攒越多，规则都写在抓取流程里（不依赖外部定时任务）：

- 抓取结果：每次成功抓取整体覆盖；超过一周没成功抓到、或文件大于 1MB 时直接丢弃，不再兜底。
- 译文缓存：90 天没被命中的词条淘汰；上限 5000 条、2MB，超了按最久未使用淘汰。
- 上游全挂时会先用上次的结果兜底并标注「上游暂时不可用」，所以清理只在抓取成功之后发生。

## 致谢

- 原站：[https://jyywiki.cn/](https://jyywiki.cn/)（jyy / 蒋炎岩）
- 字体：[霞鹜文楷 LXGW WenKai](https://github.com/lxgw/LxgwWenKai)
