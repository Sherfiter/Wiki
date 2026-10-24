---
title: "第 3 章 · 创建 KVM 虚拟机"
---

# 第 3 章 · 创建 KVM 虚拟机

万事俱备,造第一台虚拟机。本章用三条路线造同一台 VM:图形向导(virt-manager,建立直觉)、命令行(virt-install,工程主流)、直连控制台看它启动。重点放在 virt-install 的每个参数「到底在改虚拟机的什么」,以后看任何一台 VM 的配置,你都能读出它的门道。

## 3.1 路线一:virt-manager 图形向导

桌面环境里跑 `virt-manager`,新建虚拟机向导五步:选安装方式(本地 ISO 最常用)→ 选 ISO 文件 → 分配内存/CPU(先 2G/2 核)→ 建磁盘(20G,qcow2)→ 命名完成。装系统的过程和装物理机一模一样,因为 VM 对 guest 来说就是一台「完整的电脑」:有硬盘(镜像文件)、有光驱(ISO)、有网卡(虚拟的)。

图形向导适合第一次和临时验证,但它不留下「可复现的记录」:下次要造十台一模一样的,点鼠标点到手抽筋。工程做法在 3.2。

## 3.2 路线二:virt-install(主力)

先准备一个 ISO(Ubuntu Server 或 Alpine 的都行),然后一条命令:

```bash
virt-install \
  --name demo \
  --memory 2048 \
  --vcpus 2 \
  --disk size=20,format=qcow2 \
  --cdrom /var/lib/libvirt/images/ubuntu-24.04-live-server-amd64.iso \
  --os-variant ubuntu24.04 \
  --network network=default \
  --graphics vnc
```

回车后它创建磁盘、启动 VM、弹出控制台窗口,剩下就是正常装系统。每个参数都在「定义一台电脑」,逐个拆:

| 参数 | 在定义什么 | 备选写法 |
|---|---|---|
| `--name demo` | VM 名(libvirt 里的唯一 ID) | 后面 virsh 命令都靠它 |
| `--memory 2048` | 内存 2GB | `--memory 4096` 或 4G |
| `--vcpus 2` | 2 个虚拟 CPU | 可写 `--vcpus 4,maxvcpus=8` 热扩 |
| `--disk size=20` | 20GB 磁盘,qcow2 格式 | `path=/xx/xx.qcow2` 用现成的 |
| `--cdrom xxx.iso` | 光驱挂 ISO(装机用) | 装完可 `--cdrom` 换成空 |
| `--os-variant` | 告诉 QEMU 这是什么系统(优化设备模型) | `osinfo-query os` 查合法值 |
| `--network network=default` | 接到 libvirt 默认 NAT 网络 | 第 5 章细讲 |
| `--graphics vnc` | 图形控制台协议 | 无图形需求用 `--graphics none` |

`--os-variant` 值得一提:它不是装饰,QEMU 按它决定暴露什么硬件(比如新老芯片组、CPU 特性),填错会出现「系统装得上但跑得怪」的灵异问题。拿不准就 `osinfo-query os | grep -i ubuntu` 查。

## 3.3 路线三:纯命令行装系统(--location)

连图形界面都不想碰,`--location` 让安装器走文本/SSH:

```bash
virt-install --name cli-demo --memory 1024 --vcpus 1 \
  --disk size=10 --location http://archive.ubuntu.com/ubuntu/dists/noble/ \
  --extra-args "console=ttyS0" \
  --network network=default --graphics none
```

`--graphics none` + `console=ttyS0` 把控制台转到串口,virt-install 直接在你的终端里流式输出安装过程,装完 VM 的控制台也能用 `virsh console` 进。服务器无人值守场景的标准姿势(配合 kickstart/preseed 自动应答文件,整个装机零交互)。

## 3.4 看着它启动:控制台三连

VM 有了,看它的屏幕有三种方式:

```bash
virt-viewer demo        # 图形控制台(最舒服)
virsh vncdisplay demo   # 查 VNC 端口(:0 = 5900,:1 = 5901),用任意 VNC 客户端连
virsh console demo      # 串口控制台(要求 VM 内核配了 console=ttyS0)
```

第一次按下虚拟机的电源键时,值得盯着 virt-viewer 看完整个启动过程:BIOS 画面 SeaBIOS、GRUB、内核日志滚屏。你会看到的每一个画面,都对应计算机组成课第 9 章讲过的启动链路,只不过硬件全变成了 QEMU 模拟的。

## 常见错误

- **`internal error: Unexpected... KVM is not available`**。回第 2 章的 kvm-ok,还是那道 BIOS 门。
- **装完系统重启又进安装器**。安装 ISO 还挂在光驱上,启动顺序光驱优先。virsh 里 `virsh detach-disk demo sda`(或 virt-manager 里移除光驱)再重启;或者干脆 `virsh change-media demo sda --eject`。
- **磁盘给小了后悔**。qcow2 是稀疏格式,`virsh blockresize demo vda 40G` 在线扩,VM 里再把分区扩了即可;一开始就给 200G 也不占地方(qcow2 按实际用量占宿主空间),但记得宿主磁盘要真够。
- **名字重复**。`--name` 全局唯一,重名报错;`virsh list --all` 先看现有名单。

## 练习

1. 动手:用 virt-install 造一台 1G 内存/1 核/10G 盘的 Alpine Linux VM(ISO 只有几十 MB,全程快),跑通 3.3 的纯命令行安装。
2. 动手:`virsh dumpxml demo | head -50` 看你的 VM 的 XML 定义,对照 3.2 的参数表找 vcpu、memory、disk 对应的 XML 节点(libvirt 的真实存储格式)。
3. 动手:`ls -lh /var/lib/libvirt/images/` 看磁盘镜像文件的实际大小,和分配的 20G 对比,理解 qcow2 的「按需占用」;`qemu-img info demo.qcow2` 看虚拟大小 vs 实际大小。
4. 思考:`--os-variant` 填错了会怎样?从 QEMU 模拟硬件(芯片组、CPU 特性)的角度想想「guest 对硬件的假设」和「hypervisor 暴露的硬件」之间的合同关系(呼应第 1 章 ISA 合同的比喻)。
