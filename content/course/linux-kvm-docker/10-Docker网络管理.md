---
title: "第 10 章 · Docker 网络管理"
---

# 第 10 章 · Docker 网络管理

容器的网络是 Docker 里最像「魔法」的部分:容器里 ifconfig 看到的网卡哪来的、-p 映射怎么实现的、为什么同一网络里的容器能用名字互访。本章把这些魔法全部落地成 Linux 的普通机制(veth、bridge、iptables,和第 5 章 KVM 网络是同一套零件),再把三种网络模式、端口映射、自定义网络的名字解析讲透。

## 10.1 容器网卡的身世:veth + docker0

新建容器时,Docker 干了三件事,每件都能在宿主机上验证:

1. 创建一对 **veth**(虚拟以太网线缆),一端塞进容器的网络 namespace(第 7 章),成为容器里的 eth0;另一端留在宿主机,插到 docker0 网桥上。
2. docker0 网桥(装 Docker 时自动建,`ip link show docker0` 可见)相当于容器世界的交换机,网段默认 172.17.0.1/16。
3. 宿主机上配好 NAT(iptables),容器出网的包做源地址转换。

```
容器 A(eth0)═══ veth ═══┐
容器 B(eth0)═══ veth ═══┼── docker0 ── NAT(iptables)── 外网
                          │
                     172.17.0.1
```

这和第 5 章 KVM 的 virbr0 是**同一套原理**(veth + bridge + NAT),Docker 换了个名字重演。验证:veth 那端在宿主机显示为 `vethxxxxx@if2`(`ip link` 里一堆),`docker exec 容器 ip a` 和宿主机 `ip link` 对照,一根虚拟网线的两端。到这一步,「容器网络」就祛魅了:没有新机制,全是 Linux 网络的老零件组合。

## 10.2 三种网络模式

| 模式 | 实现 | 用途 |
|---|---|---|
| bridge(默认) | veth + docker0(或自定义网桥)+ NAT | 绝大多数场景 |
| host | 容器直接用宿主网络栈(无隔离) | 性能敏感(负载均衡、抓包工具) |
| none | 只有 lo,没有 eth0 | 网络完全自定义(特殊实验) |

```bash
docker network ls                 # bridge/host/none 三个内置 + 你自建的
docker run -d --network host nginx   # 直接监听宿主 80 端口,无需 -p
```

host 模式省掉 NAT 和 veth(性能最好,端口就是宿主端口),代价是零隔离(容器和宿主共享端口空间,冲突照样冲突)。安全敏感环境禁用;日常用 bridge。

## 10.3 端口映射:-p 的完整语义

```bash
docker run -d -p 8080:80 nginx              # 宿主 8080 → 容器 80
docker run -d -p 127.0.0.1:8080:80 nginx    # 只绑本机回环(更安全)
docker run -d -P nginx                      # -P 大写:自动分配宿主端口
```

第 9 章讲过方向别写反,这里补实现原理:`-p 8080:80` 就是宿主机 iptables 里加了一条 DNAT 规则(目的地址转换,计网课第 5 章的 NAT 类型),外部访问宿主:8080 的包被改写目的地后送进容器。验证:`sudo iptables -t nat -nL DOCKER | grep 8080`。所以端口映射的数量、冲突、失效,最终都是 iptables 规则的事,`docker port web` 可查某容器的全部映射。

## 10.4 自定义网络:容器名就是域名

默认 bridge 有个坑:**容器之间只能按 IP 互访,不支持名字解析**,而 IP 重启就变。自定义网络(Docker 自带内置 DNS 服务器)解决:

```bash
docker network create mynet
docker run -d --name web --network mynet nginx
docker run -d --name app --network mynet busybox sleep 3600

docker exec app ping web          # 直接 ping 容器名!内置 DNS 解析
docker exec app wget -qO- http://web   # 直接访问
```

这是微服务本地联调的标准姿势:web、db、redis 各自起容器挂同一网络,配置里写服务名,和写生产配置的逻辑一致(生产由 K8s 的 Service DNS 接管同一思想)。容器断开重连换 IP,名字解析自动跟着变。`docker network inspect mynet` 能看到网络里的全部成员及其 IP。

容器的常用操作小抄:`docker network connect mynet web`(把运行中的容器追加进网络)、`disconnect`、`rm`(先没容器在用)。

## 常见错误

- **默认网络里用容器名互访失败**。内置 DNS 只在自定义网络生效;新建 mynet 才是正解,别在 bridge0 上死磕。
- **-p 只在 bridge 模式有意义**。host 模式下端口天然直通,写 -p 报 warning;none 模式没有网络,先想清楚。
- **容器访问宿主机服务用 127.0.0.1 不通**。容器里的 127.0.0.1 是容器自己!访问宿主用宿主的 docker0 地址 172.17.0.1(Linux),或加 `--add-host=host.docker.internal:host-gateway`(Docker 20.10+,写法跨平台)。
- **端口映射不生效**。绑定了 127.0.0.1 前缀(外部自然进不来)、防火墙(ufw/firewalld 拦宿主端口)、或 -p 写反,三连排查。

## 练习

1. 动手:跑两个容器挂自定义网络,用名字互 ping、wget;然后断开重连其中一方换 IP,验证名字解析自动更新(docker network disconnect/connect)。
2. 动手:零件巡礼(第 5 章的 Docker 版):ip link 看 veth 和 docker0、brctl show 或 ip link 看 master、iptables -t nat 看 DNAT 规则、docker network inspect 看网段,每个零件一条真实输出。
3. 动手:验证「容器里的 localhost 不是宿主机」:容器里 curl 127.0.0.1:80(不通),再用 172.17.0.1 通宿主上的服务;加 --add-host 再用 host.docker.internal 访问。
4. 思考:对比第 5 章 KVM 的 NAT 网络(192.168.122.0/24)和 Docker 默认桥(172.17.0.0/16):两套网段能在同一台宿主机共存吗?互 ping 通吗?画出完整拓扑(VM 的 docker0 也在 VM 里),理解「网络嵌套」的层次。
