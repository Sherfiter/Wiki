---
title: "第 8 章 · Docker 镜像管理"
---

# 第 8 章 · Docker 镜像管理

从本章起正式动手 Docker。镜像是容器的「模板」,理解镜像的关键是**分层**:它不是一整块只读文件,而是一层层的增量叠加。这个设计直接决定了拉取速度、磁盘占用、构建缓存的体验,是整门 Docker 课最重要的一个概念。本章先看 Docker 的架构(那个 docker 命令背后是谁),再拆分层机制,最后过一遍镜像的日常命令。

## 8.1 架构:docker 命令背后是谁

敲 `docker run` 的时候,发生的事比看上去多:

```
docker CLI(你敲的命令)
     │ REST API(默认走 /var/run/docker.sock)
dockerd(Docker 守护进程)
     │
containerd(容器生命周期管理)
     │
runc(真正调 namespace/cgroup 创建容器,第 7 章)
```

docker 只是客户端,真正干活的是 dockerd 守护进程(C/S 架构,REST 通信)。所以「Docker 挂了」通常指 dockerd 挂了(所有容器进程会跟着停,数据卷里的文件不丢);再往下 containerd 管容器生命周期,runc 负责最底层的创建动作(设置 namespace/cgroup 后 exec 你的程序)。这套分层后来被标准化成 OCI 规范,containerd 甚至被 Kubernetes 直接采用(绕过 Docker),知道这个背景,以后看到「Kubernetes 弃用 dockershim」的新闻就不会慌。

## 8.2 分层:镜像的积木结构

一个镜像由多个只读层叠加而成,每层记录一串文件系统的增量:

```
可写层(容器运行时的改动,薄)
─────────────────────
层3  COPY app.jar /app        ← 你的代码,几 MB
层2  RUN apt install openjdk  ← 依赖,几百 MB
层1  FROM ubuntu:24.04        ← 基础系统,几十 MB
```

底层机制是 Linux 的 overlayfs(unionfs 家族):多层目录联合挂载,上层文件遮盖下层同名文件。三个由此而来的重要性质:

**共享**:两台机器都拉 ubuntu:24.04 + openjdk 的镜像,基础层只下一次;你的 100 个 Java 服务镜像,基础层在宿主机上只占一份,密度远超 VM(每台 VM 一个完整内核和根文件系统)。**增量传输**:pull 时本地已有的层不下载,push 同理;层是内容寻址的(层的校验和就是它的 ID),内容不变层就不变。**容器 = 镜像 + 一个可写层**:run 的时候在最上面加一个薄薄的读写层,所有容器里的写操作都落在这层(COW,和第 6 章 qcow2 的 backing file 思想同源),镜像本体永远只读,所以一个镜像可以同时跑 100 个容器互不干扰。

容器里改文件不会影响镜像(下次 run 又是干净的),想留住改动要么写进镜像(Dockerfile,第 12 章),要么挂数据卷(第 11 章)。第 9 章「容器删了数据没了」的事故根源就在这层模型上。

## 8.3 镜像的日常命令

```bash
docker pull nginx:1.27          # 拉取(名字:标签,无标签默认 latest)
docker images                   # 本地镜像清单(看 REPOSITORY/TAG/SIZE)
docker search redis             # 在 Docker Hub 搜索
docker tag nginx:1.27 myreg/nginx:1.27   # 重打标签(改名/改仓库前缀)
docker rmi myreg/nginx:1.27     # 删除镜像
docker push myreg/nginx:1.27    # 推送到仓库
docker history nginx:1.27       # 看分层明细!(每层多大、哪来的)
docker system df                # Docker 占了多少磁盘
docker system prune             # 大扫除(删悬空镜像、停掉的容器)
```

`docker history` 值得单独点名:它把一个镜像拆回每一层的操作和体积,是「诊断镜像为什么这么大」的第一工具(第 12 章优化 Dockerfile 时天天用)。`docker images` 里那串 `<none>:<none>` 的悬空镜像(被新版本顶替的旧层),是磁盘悄悄变满的惯犯,prune 定期清。

镜像名的完整格式是 `registry地址/命名空间/名字:标签`,省略 registry 就是 Docker Hub。国内拉不动 Hub 的时候,配镜像加速器(registry mirror)或者换成 ghcr.io / 阿里云 ACR 等源,这是国内环境的第一课。

## 常见错误

- **latest 不是「最新版」的保证**。它只是个普通标签,作者忘了推 latest 它就不动;生产环境永远写死版本号(nginx:1.27 而非 nginx:latest),可复现性高于一切。
- **pull 报 timeout/403**。网络问题,配镜像加速器或换源;公司环境配私有 registry(Harbor)。
- **`docker rmi` 报 image is being used**。有容器在用(哪怕停着);先删容器(rm)或强制,想清楚再 -f。
- **以为改了容器就是改了镜像**。可写层随容器销毁,要固化成镜像用 commit(临时手段)或正路 Dockerfile。

## 练习

1. 动手:pull 一个 nginx 和一个 alpine,用 `docker history` 分别看分层;再用两个不同 tag 拉同一镜像不同版本,用 `docker system df` 观察共享层的占用。
2. 动手:验证「容器 = 镜像 + 可写层」:`docker run -it alpine sh` 里 `touch /marked.txt`,exit 后再 run 一个新 alpine,ls 验证文件没了;`docker ps -a` 找到旧容器,docker start + exec 进去,文件还在(可写层跟着容器走)。
3. 动手:`docker save -o nginx.tar nginx:1.27` 导出镜像,ls -lh 看大小,换台机器(或删掉后)`docker load -i nginx.tar` 导入,体验离线交付镜像。
4. 思考:overlayfs 的分层和 Git 的提交、qcow2 的 backing file(第 6 章)三者惊人地同构。分别写出三者在「合并历史/回收空间」上的对应操作,以及各自「层数过多」时的性能问题和解法。
