---
title: "第 13 章 · Docker 实战案例"
---

# 第 13 章 · Docker 实战案例

收官章不教新知识,把前十二章的零件组装成三个完整的实战项目:一套本地 Web 服务栈、一个自包含的数据库、一条从 Dockerfile 到发布的完整流水线。每个案例都按「目标 → 命令 → 验证 → 翻车点」展开,这些流程我全部真实跑过,注释里的坑是踩出来的。

## 13.1 案例一:一次性 Linux 环境

「快速要一个干净的 Linux 环境试个东西」,容器是最快的答案(对比第 3 章:开 VM 要分钟级,容器秒级):

```bash
docker run -it --rm ubuntu:24.04 bash      # 用完即删,不留垃圾
apt update && apt install -y curl          # 在里面随便折腾
exit                                       # 退出即销毁
```

`-it --rm` 是「试验场」姿势的标准组合。要保留环境就去掉 --rm,明天 start 再 exec。这个姿势的日常用途:试一个软件包的安装过程、验证某个配置写法、跑别人的脚本前隔离一下。配合第 9 章 `docker save/load`,甚至能把这个环境打包带走。

## 13.2 案例二:静态网站栈(nginx + 卷 + 自定义网络)

组合第 10 章的网络和第 11 章的挂载,搭一个双服务站点:nginx 做入口、第二个容器做 API,同网络内用名字互通:

```bash
docker network create site

# 静态站:挂本地目录,改代码即时生效(第 11 章开发流)
docker run -d --name web --network site \
  -p 8080:80 \
  -v "$PWD/html:/usr/share/nginx/html:ro" \
  nginx:1.27

# API 容器(演示用 python http server)
docker run -d --name api --network site \
  python:3.12-alpine \
  python -m http.server 8000
```

验证名字互通(第 10 章):进 web 容器 curl api:

```bash
docker exec web curl -s http://api:8000/      # 容器名即域名!
```

一个真实的静态站反向代理的写法(挂自定义 nginx 配置进容器,配置里 `proxy_pass http://api:8000;`),是「同网络名字解析」在生产里的最小复刻。翻车点记录:挂配置文件用 bind mount 后 nginx 不热加载,`docker exec web nginx -s reload`;容器里 curl 不了宿主,用第 10 章 host.docker.internal。

## 13.3 案例三:自包含的数据库

数据库是容器化的重灾区,标准姿势(第 11 章的卷 + 第 9 章的环境变量):

```bash
docker volume create mysql-data
docker run -d --name mysql \
  --network site \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=appdb \
  -v mysql-data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.4

# 等半分钟让数据库初始化完(docker logs -f mysql 看到 ready for connections)
docker exec -it mysql mysql -uroot -psecret appdb \
  -e "CREATE TABLE t(id INT); INSERT INTO t VALUES (42); SELECT * FROM t;"
```

然后走第 11 章的「删容器保数据」验证:rm -f 容器重挂卷,表还在。再演示一次反面:不带 -v 跑一次,rm 后数据蒸发(这门课的第一个震撼实验)。

## 13.4 案例四:一条完整交付流水线

把第 12 章的 Dockerfile 接上发布动作,模拟一次真实交付:

```bash
# ① 构建(多段构建,第 12 章)
docker build -t myreg/myapp:1.0 .

# ② 本地测试
docker run -d --name test --rm -p 9999:8080 myreg/myapp:1.0
curl localhost:9999/health && docker stop test

# ③ 打标签并推送(第 8 章)
docker tag myreg/myapp:1.0 myreg/myapp:latest
docker push myreg/myapp:1.0

# ④ 生产侧拉起(服务器上)
docker pull myreg/myapp:1.0
docker run -d --name app --restart unless-stopped \
  -v appdata:/data -p 80:8080 myreg/myapp:1.0
```

「build → test → push → pull → run」五步,就是没有 Kubernetes 时代所有公司的发布流程(今天它仍是单机部署和 CI 的核心骨架)。每一步出错的样子也记一下:build 失败看日志哪层断的、push 被拒是没 docker login 或仓库不存在、run 秒退用 logs 查(第 9 章)。

## 常见错误

- **案例三初始化没等完就连接**。mysql 首次启动要初始化数据目录(几十秒),logs 里没有 ready 就连,报 connection refused,以为容器坏了。
- **案例二挂载目录用相对路径**。`-v html:...` 被当成卷名(第 11 章),nginx 显示的是默认页;绝对路径或 $PWD。
- **发布用 latest 标签**。服务器上永远不知道跑的是哪个版本,回滚无从谈起;版本号进标签(第 8 章铁律的实战版)。
- **容器端口规划混乱**。多服务全挤 -p 手工映射,端口表靠脑子记;本地实验用统一前缀(8081、8082),正经部署交给 compose/K8s(下一步的学习方向)。

## 练习

1. 综合:把 13.2 + 13.3 组合成一个「网站 + API + 数据库」三容器栈,写一份启动命令清单(save 成 shell 脚本),整体 rm 后一条脚本重建,验证「基础设施即代码」的日常体感。
2. 动手:给案例四加一步「版本回滚」:跑 1.0,再 build 一个 1.1 部署,模拟故障后一条命令切回 1.0,体会「不可变部署」的意义。
3. 动手:`docker stats` 观察三个容器的资源占用;给 mysql 限内存(--memory 512m),故意压测看它被 OOM kill 后 --restart 拉起(dmesg 里找 OOM 记录,呼应第 7 章 cgroup)。
4. 思考:回顾全课:KVM 管「硬件虚拟化」(第 1~6 章),Docker 管「进程隔离」(第 7~13 章)。写一篇 300 字的总结,回答「什么时候用 VM、什么时候用容器、什么时候两层都用」,并用这门课学过的三个具体机制(namespace、overlayfs、hypervisor)支撑你的论证。
