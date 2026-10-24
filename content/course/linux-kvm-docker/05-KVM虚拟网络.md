---
title: "第 5 章 · 管理 KVM 虚拟网络"
---

# 第 5 章 · 管理 KVM 虚拟网络

虚拟机的网络是 KVM 里最容易让人迷糊的部分:virbr0 是什么、NAT 谁在做、桥接和 NAT 差在哪。本章把 libvirt 的三种网络模式(隔离、NAT、桥接)逐个讲透,每种都配上「在宿主机上看什么」的命令,把虚拟网络和计算机网络课的 IP/路由/转发知识(计网课第 5 章)对上号。读完这章,`virsh domifaddr` 查不到 IP 之类的问题你都能自己诊断。

## 5.1 三种模式:一张对照表

| 模式 | VM 互通 | VM → 外网 | 外网 → VM | 典型用途 |
|---|---|---|---|---|
| 隔离(isolated) | 通 | 不通 | 不通 | 内网实验、安全测试 |
| NAT(默认) | 通 | 通 | 不通(端口映射可破) | 日常开发机 |
| 桥接(bridge) | 通 | 通 | 通(同一局域网) | 对外提供服务的 VM |

选型逻辑一句话:看 VM 要不要「被外面看见」。NAT 是默认,因为大多数 VM 是「消费者」(上网、下载、连外网服务);要当「服务者」(对外开端口)就上桥接。

## 5.2 NAT 网络(默认):家里那个路由器

第 2 章装完 libvirt 就存在的 `default` 网络就是 NAT 模式,和家用路由器原理一模一样:

```bash
virsh net-list --all
#  Name      State    Autostart
#  default   active   yes

virsh net-dumpxml default
#   <ip address='192.168.122.1' netmask='255.255.255.0'>
#     <dhcp>
#       <range start='192.168.122.2' end='192.168.122.254'/>
```

拆解一下这套机制的每个零件,全部能在宿主机上亲眼看到:

- **virbr0**:宿主机上的虚拟网桥(交换机),所有 default 网络的 VM 的虚拟网卡都插在它上面。`ip link show virbr0` 可见。
- **dnsmasq**:宿主机上跑的小型 DHCP/DNS 服务(计网课第 2 章),给 VM 分发 192.168.122.x 的地址。`ps aux | grep dnsmasq` 可见。
- **iptables NAT 规则**:VM 出网的包,源地址 192.168.122.x 被改成宿主机 IP(MASQUERADE);回包再改回来。`sudo iptables -t nat -L -n | grep 122` 可见,计算机网络的 NAT 章节在此落地。

所以 VM 能上网的秘密是「宿主机当了它的路由器」,外部主动连不进来,因为外部路由器不知道 192.168.122.x 这个私有网段(要进来就得在宿主机配端口转发,或者换桥接)。

诊断 NAT 网络问题的固定流程:VM 里 `ip a` 看拿到 IP 没(DHCP 挂了?)→ `ping 192.168.122.1`(通网桥了吗)→ `ping 8.8.8.8`(出网了吗,不通查转发)→ `ping baidu.com`(DNS 挂了?)。四步定位到具体环节。

## 5.3 隔离网络:造一个无人知晓的内网

连 NAT 都不要的纯内网(渗透测试、旧软件兼容实验),定义一个只有网桥没有上行转发 rule 的网络:

```bash
cat > iso.xml <<'EOF'
<network>
  <name>iso</name>
</network>
EOF
virsh net-define iso.xml && virsh net-start iso && virsh net-autostart iso
```

VM 的 XML 里 `<interface type='network'><source network='iso'/>` 挂上去即可。VM 之间互通、与世隔绝,宿主机自己也不转发它们出网。这类网络常和「双网卡」搭配:VM 一张卡接 default(管理通道),一张接 iso(实验通道),两个世界互不干扰。

## 5.4 桥接网络:VM 变成局域网正式成员

桥接把 VM 直接插进物理局域网:VM 从路由器拿到和宿主机同网段的 IP,外部可以直连它。代价是宿主机配置要动一下(把物理网卡变成网桥的从属端口):

```bash
# NetworkManager 方式(常见发行版默认)
sudo nmcli connection add type bridge ifname br0
sudo nmcli connection add type ethernet slave-type bridge \
    con-name br0-port ifname enp1s0 master br0
sudo nmcli connection up br0
```

然后 VM 用 `<interface type='bridge'><source bridge='br0'/>`(或 virt-install `--network bridge=br0`)。VM 开机后 DHCP 从物理路由器拿地址,和宿主机平起平坐。

桥接的几个坑,提前踩好:其一,改网卡配置可能在 SSH 里断网(在控制台操作,或先配好桥再切);其二,无线网卡桥接很麻烦(802.11 的 MAC 过滤,多数环境要走 NAt 或 macvtap),桥接基本是有线场景的玩法;其三,公司/校园网可能限制一个端口多个 MAC(VM 的 MAC 会被丢包),那就只能回 NAT。

## 常见错误

- **`virsh domifaddr` 查不到 IP**。VM 还没开机/DHCP 没拿到/network 没挂对;进 console 用 `ip a` 直接看。
- **桥接配完宿主机断网**。nmcli 把物理网卡从原连接移交给 br0 时顺序不对;经典自救:配 br0 前先建好,再 up,实在不行 console 下回滚。
- **NAT 里外部连不进 VM 的服务**。这就是 NAT 的定义;要么端口转发(virsh nwfilter 或手动 iptables),要么桥接。
- **VM 能 ping IP 不能 ping 域名**。DNS 问题,VM 的 /etc/resolv.conf 指向的 dnsmasq 或上游挂了;四步诊断法第二步之后直接查 DNS。

## 练习

1. 动手:在宿主机上完成 NAT 网络的「零件巡礼」:virbr0(ip link)、dnsmasq 进程(ps)、NAT 规则(iptables)、DHCP 租约(`/var/lib/libvirt/dnsmasq/default.leases`),每个零件记录一条真实输出。
2. 动手:建一个隔离网络 iso,起两台 VM 都挂上去,互相 ping 通;再验证它们 ping 不通 192.168.122.1 和外网。
3. 动手:用 `sudo tcpdump -i virbr0 -n icmp` 在宿主机抓包,VM 里 ping 外网,亲眼看 ICMP 包经过网桥;再换 `arp` 关键字看 DHCP 过程(计网课第 2、5 章的报文在自家网络里活捉)。
4. 思考:NAT 模式下 VM 的服务要对外,有「端口转发」和「改桥接」两条路。从「IP 漂移、防火墙、多 VM 同端口」三个角度比较两条路的适用场景,想想云厂商的「安全组 + 弹性 IP」本质上是哪种方案的哪个部分。
