---
title: "第 9 章 · Docker 容器管理"
---

# 第 9 章 · Docker 容器管理

镜像装好了,开始跑容器。本章围绕 `docker run` 这个使用频率最高的命令展开:它的每个参数在改容器的什么、容器的生命周期怎么管、怎么进容器和看日志。把「-d、-p、-it、--name、--rm」五个参数吃透,你就能覆盖 90% 的日常操作;再加上对「前台/后台、退出即死」这类行为模式的理解,容器管理就算入门了。

## 9.1 容器 = 镜像的运行实例

一张图回顾(第 8 章的分层):`docker run` 把镜像展开,顶上加一个可写层,用 namespace/cgroup(第 7 章)圈起来,启动镜像里定义的进程。同一个镜像可以同时跑 N 个容器,彼此完全隔离(各自的文件系统视图、网络栈、PID 空间)。

```bash
docker run nginx:1.27        # 跑三个这样的,就是三个独立的 nginx
docker run nginx:1.27
docker run nginx:1.27
```

重要心理预期:容器是**进程**,不是机器。容器的生命周期 = 主进程(PID 1)的生命周期,主进程退出容器就停。nginx 这类常驻服务适合后台跑;一次性任务(编译、跑测试)跑完容器即退出,这恰恰是容器的设计意图。

## 9.2 docker run 的核心参数

```bash
docker run -d --name web -p 8080:80 --restart unless-stopped nginx:1.27
```

| 参数 | 作用 | 不写会怎样 |
|---|---|---|
| `-d` | 后台运行(detached) | 前台占住终端,Ctrl+C 直接停容器 |
| `--name web` | 容器名(后续操作的 ID) | Docker 随机起名(jolly_otter 之类) |
| `-p 8080:80` | 端口映射:宿主 8080 → 容器 80 | 外部访问不到容器(隔离网络里) |
| `--restart unless-stopped` | 崩溃/开机自动拉起 | 容器死了就死了 |
| `-e KEY=value` | 环境变量 | 应用拿不到配置 |
| `--rm` | 退出即删容器 | 一堆 Exited 容器堆着 |
| `-v /data:/var/www` | 挂数据卷 | 数据随容器销毁(第 11 章详讲) |

`-p` 的方向容易写反:**宿主端口在前,容器端口在后**(`-p 8080:80` 是「访问宿主机 8080 转到容器 80」)。`--rm` 和 `-d` 配合是「一次性后台任务」的标准姿势(跑完自动清尸),`-it --rm` 则是「进去试试这个镜像」的试验姿势。

交互式容器是理解容器本质的最佳教具:

```bash
docker run -it --rm alpine sh     # -i 交互,-t 分配终端
/ # ps aux                        # 只有 sh 自己,PID 1!
/ # ls /                          # 一个干净的 Alpine 文件系统
/ # exit                          # 退出 = PID 1 结束 = 容器停止
```

## 9.3 生命周期:ps、start、stop、rm

```bash
docker ps                    # 运行中的容器
docker ps -a                 # 全部(含已退出的,看状态 Exited (0) ...)
docker start web             # 启动已有的容器(保留可写层,数据还在)
docker stop web              # 优雅停止(先 SIGTERM,10 秒后 SIGKILL)
docker restart web
docker rm web                # 删容器(先 stop)
docker rm -f web             # 强删(运行中)
docker rm $(docker ps -aq)   # 清光所有容器(慎重)
```

容器停止后不是消失,是「躺尸」:可写层还在,start 一下数据照旧(第 8 章练习验证过);真正销毁数据的是 rm。stop 的优雅性值得注意:Docker 先发 SIGTERM 给主进程等它收尾,默认 10 秒后升级 SIGKILL;应用要正确处理 SIGTERM(Java 课第 14 章说过的「kill -9 是最后手段」在容器里同理),否则每次 stop 都是被硬杀。

## 9.4 进容器、看日志、查详情

```bash
docker exec -it web bash        # 在运行中的容器里开个 shell(调试主力)
docker logs -f web              # 追日志(等同主进程的 stdout/stderr,-f 是 follow)
docker stats                    # 所有容器的实时 CPU/内存(第 7 章 cgroup 的可视化)
docker inspect web              # 容器的完整配置和状态(JSON,查 IP/挂载/环境变量)
docker top web                  # 容器里的进程列表(从宿主视角)
```

`exec -it` 和 `run -it` 的区别:exec 是**往运行中的容器里加一个进程**(主进程还在跑,退出 exec 容器不停),run 是**起一个新容器**。调试思路的固定顺序:logs 看它说了什么 → inspect 查它的配置(IP、挂载对不对)→ exec 进去现场排查(网络 curl 一下、看文件)→ stats 看资源是否被打爆。

一个日志工程细节:容器日志默认存成 json 文件在宿主机(/var/lib/docker/containers/),无限增长;生产要在 daemon.json 里配 log-rotation(max-size/max-file),这是容器跑久了磁盘满的常见原因。

## 常见错误

- **-p 端口写反**。`-p 80:8080` 把宿主 80 映到容器 8080,容器里根本没服务,访问 404 还以为镜像坏了。
- **exit 后以为容器数据丢了**。容器还在(ps -a 可见),数据在可写层;只是没 rm 之前你忘了它。
- **容器秒退(start 后立刻 Exited)**。主进程跑完就退出(比如只写了 echo 的脚本),或者前台服务配置错;`docker logs` 看死因。
- **把容器当 VM 用**:进去手动装了一堆东西,容器一删全没。改动要进镜像(第 12 章)或数据卷(第 11 章),容器保持「可随时重建」的纯净。

## 练习

1. 动手:跑 nginx:`docker run -d --name web -p 8080:80 nginx:1.27`,浏览器/curl 访问 localhost:8080;exec 进去改 /usr/share/nginx/html/index.html,刷新页面看变化;rm 容器重跑,改动消失(可写层实证)。
2. 动手:验证生命周期:`docker run -it --name test alpine sh`,exit 后 ps -a 看状态,start + exec 再进去,确认文件还在;最后 rm。
3. 动手:`docker run --rm -d --name loop alpine sh -c "while true; do :; done"`,用 docker stats 看 CPU 100%;再用 `docker update --cpus 0.5 loop` 限流(第 7 章 cgroup 的命令行入口),观察 stats 变化。
4. 思考:容器的主进程即容器生命,这个设计让「一个容器一个进程」成为最佳实践。对比传统服务器上「一个机器跑一堆服务」和「微服务一个容器一个进程」的故障半径、资源核算、伸缩粒度,理解为什么 Kubernetes 的调度单位是 Pod 而不是机器。
