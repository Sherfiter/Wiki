---
title: "第 11 章 · Docker 存储管理"
---

# 第 11 章 · Docker 存储管理

「容器一删,数据库的数据全没了」是每个 Docker 新手的成人礼。原因在第 8 章讲过:容器的写入落在可写层,rm 容器连可写层一起删。解药是**挂载**:把容器里要活下来的数据,指到容器外面去。本章讲三种挂载方式(volume、bind mount、tmpfs)各自的脾气,以及数据库容器的标准存储姿势。

## 11.1 容器数据的三种归宿

| 方式 | 位置 | 谁管理 | 适用 |
|---|---|---|---|
| volume | /var/lib/docker/volumes/ 下的目录 | Docker | 数据库等持久数据(首选) |
| bind mount | 宿主机任意目录 | 你自己 | 开发挂源码、配置文件 |
| tmpfs | 内存 | Docker | 敏感临时数据,不落盘 |

容器不挂载时,数据活在可写层里,生命周期 = 容器;挂载后,容器只是「过路的租客」,数据在卷/目录里独立长存,容器删了重建挂回去,数据原地不动。这就是「容器无状态、数据有状态」的分离原则,也是第 9 章说「容器保持可随时重建」能成立的前提:一切有状态的东西都外置了。

## 11.2 volume:Docker 托管的持久化

```bash
docker volume create pgdata
docker run -d --name db \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16

docker volume ls
docker volume inspect pgdata     # 看 Mountpoint:数据实际在宿主机哪里
docker volume rm pgdata          # 删除卷(危险操作,数据真没了)
```

`-v 卷名:容器内路径` 的第一个字段**没有斜杠**就是卷名(有斜杠就是 bind mount,这个区别新手天天翻车)。volume 的优点:Docker 统一管理(备份、迁移有官方工具)、位置不暴露给容器使用者、支持卷驱动(生产上挂 NFS、云盘)。装了 postgres 镜像后不带 -v 直接 run,Docker 甚至会**自动匿名卷**挂到镜像声明的 VOLUME 路径上(这是 Docker 的好意防止数据随容器蒸发),但也造成一堆 `docker volume ls` 里的悬空卷(匿名 hash 卷),`docker volume prune` 定期清。

实战流程体验一遍「数据独立于容器」:上面的 db 容器里建几张表,`docker rm -f db` 删掉,重新 run 同样的 -v pgdata,数据原封不动都在。这个「删容器保数据」的循环,是数据库容器化日常运维的基本操作。

## 11.3 bind mount:开发者的实时挂载

`-v` 第一个字段是**绝对路径**就是绑定挂载:

```bash
docker run -d --name dev-web \
  -v /home/me/myapp:/usr/share/nginx/html \
  -p 8080:80 nginx:1.27
```

宿主机目录和容器目录从此是**同一份文件**(双向实时):你在编辑器里改 index.html,容器里立刻生效,刷新浏览器就能看到。这是本地开发的标准工作流:代码在宿主机(享受 IDE 和 git),运行环境在容器(和线上一致),两者用挂载缝合。

注意几点:必须绝对路径(相对路径会被当成卷名或直接报错);权限问题(容器内进程的 UID 和宿主文件属主对不上时读写受限,常见于非 root 容器);宿主机路径强耦合让这个容器「离开这台机器就不完整」,所以 bind mount 用于开发,**不用**于交付(交付用 volume 或镜像内置)。

挂进单个文件也行(比如挂配置):`-v /opt/my.cnf:/etc/mysql/conf.d/my.cnf`,常用于「镜像通用、配置因环境而异」的场景,配合第 9 章的 -e 环境变量,构成容器配置的两大常规手段。

## 11.4 tmpfs:内存里的临时盘

```bash
docker run -d --tmpfs /app/cache:size=256m myapp
```

挂载点落在内存,容器停止即消失,不写宿主磁盘。适合两类数据:敏感信息(密钥、session,不想留磁盘痕迹)和高频临时读写(缓存,省磁盘 IO)。

## 常见错误

- **`-v` 首字段有无斜杠混淆**。`-v mydata:/data` 是卷,`-v /data:/data` 是 bind mount,行为和归属完全不同;拿不准先 `docker volume ls` 确认。
- **数据库没挂数据卷**。第 9 章「容器一删全没」的标准事故;所有 stateful 服务镜像的 README 都会写推荐卷路径,照做。
- **匿名卷堆积**。每次 run 数据库镜像都生成一个匿名卷,盘被吃满;显式 -v 命名卷,定期 volume prune。
- **bind mount 的 SELinux 拒绝**(RHEL 系):挂载后容器读不了,文件加 `:z`/`:Z` 后缀(`-v /opt/html:/usr/share/nginx/html:z`)让 Docker 打标签。

## 练习

1. 动手:走「删容器保数据」全流程:postgres + 命名卷,建表插数据,rm 容器,重挂卷验证数据还在;然后故意不挂卷重跑一次,验证「数据没了」的对照组。
2. 动手:bind mount 开发流:宿主机建个 index.html 挂进 nginx,宿主机改一次刷新一次浏览器;再在容器里改文件,验证宿主机同步变化(双向)。
3. 动手:`docker volume inspect pgdata` 找到 Mountpoint,直接去宿主机那个目录里 ls,亲眼看「卷就是宿主机的一个目录」;对比 `docker volume create --opt type=tmpfs` 的差异。
4. 思考:数据库容器的数据在卷里、计算在容器里,这个「有状态/无状态分离」直接催生了 Kubernetes 的 StatefulSet/PVC 设计(查一下概念即可)。对比第 4 章 VM 快照的「整机回滚」,两种持久化哲学各自适合什么场景?
