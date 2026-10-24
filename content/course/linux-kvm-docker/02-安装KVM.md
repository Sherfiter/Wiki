---
title: "第 2 章 · 安装 KVM"
---

# 第 2 章 · 安装 KVM

这一章动手:把 KVM 全家桶装起来,验证每一层都就绪,并认识管理工具家族。安装本身不难,难的是**出问题时知道卡在哪一层**(BIOS 没开虚拟化?模块没加载?权限不够?),所以本章按「检查前置 → 安装 → 逐层验证」的顺序走,每一步都给「正常输出长什么样」和「出问题长什么样」。

## 2.1 先理清架构:装的是什么

KVM 方案 = 内核模块(KVM,管 CPU/内存)+ 用户态程序(QEMU,模拟设备、管理 VM)+ 管理层(libvirt,统一接口和守护进程)。装的东西对应三层,理解了层次,报错时就能定位:

```
virt-manager / virsh      ← 管理工具(图形/命令行)
        │
     libvirtd             ← 管理守护进程(统一 API)
        │
      QEMU                ← 设备模拟、VM 进程
        │ ioctl(/dev/kvm)
   kvm.ko + kvm-intel.ko  ← 内核模块(第 1 章)
        │
       硬件 VT-x/AMD-V     ← BIOS 里的开关
```

## 2.2 前置检查:三个门都要开

**第一道门:CPU 硬件支持**。

```bash
grep -cE 'vmx|svm' /proc/cpuinfo
# 16        ← 大于 0 说明支持;vmx 是 Intel,svm 是 AMD
```

如果输出 0,两个可能:CPU 太老(近年机器基本都支持),或 BIOS 里没开。重启进 BIOS,找 Intel Virtualization Technology / SVM Mode,启用。这是新手「装不上 KVM」的第一大原因,报错信息还特别含糊(virt-install 报 internal error),先查这里。

**第二道门:内核模块加载**(发行版一般自动处理,知道怎么查):

```bash
lsmod | grep kvm
# kvm_intel      364544  0
# kvm           1048576  1 kvm_intel
# 什么都没有:sudo modprobe kvm_intel(AMD 用 kvm_amd)
```

**第三道门:用户权限**。普通用户要用 libvirt,把自己加进 libvirt 组,不然以后每条 virsh 命令都要 sudo:

```bash
sudo usermod -aG libvirt $USER
# 重新登录生效
```

## 2.3 安装全家桶

Debian/Ubuntu 系:

```bash
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients \
    bridge-utils virtinst virt-manager
```

RedHat/Fedora 系:

```bash
sudo dnf install -y qemu-kvm libvirt virt-install virt-manager
```

各包的角色对应 2.1 的架构图:qemu-kvm 是 QEMU(libvirtd 实际会调用 qemu-system-x86_64),libvirt 是管理层,bridge-utils 给网桥用(第 5 章),virtinst 提供 virt-install 命令行装 VM,virt-manager 是图形界面(可选,服务器可以不装)。

启动并自启 libvirtd:

```bash
sudo systemctl enable --now libvirtd
systemctl status libvirtd
# Active: active (running)      ← 这行是及格线
```

## 2.4 逐层验证

```bash
ls -l /dev/kvm
# crw-rw---- 1 root kvm ... /dev/kvm     ← 设备在,权限归 kvm 组

virt-host-validate
#   QEMU: Checking for hardware virtualization : PASS
#   QEMU: Checking for device /dev/kvm         : PASS
#   QEMU: Checking for secure guest support    : WARN (可忽略)
# 全 PASS 才算就绪;FAIL 的行就是你要修的问题
```

再来一发实际的:`kvm-ok`(Ubuntu 的 cpu-checker 包提供)直接给结论:

```bash
sudo apt install cpu-checker
kvm-ok
# INFO: /dev/kvm exists
# KVM acceleration can be used        ← 这行出现,可以起飞
```

## 2.5 工具家族速查

| 工具 | 层次 | 什么时候用 |
|---|---|---|
| `virsh` | libvirt 命令行 | 服务器主力,脚本化必备 |
| `virt-manager` | 图形界面 | 桌面环境,直观创建管理 |
| `virt-install` | 命令行创建 | 脚本批量建 VM |
| `virt-viewer` | 控制台查看 | 看 VM 屏幕(装系统时) |
| `qemu-system-x86_64` | QEMU 直接调用 | libvirt 之下,调试/极客用法 |

日常用 virsh(virt-install 创建、virsh 管理),图形界面对照着用一遍建立直觉。libvirt 的「连接」概念也提一句:`virsh --connect qemu:///system` 是系统级(需要权限,VM 全局可见),默认的 qemu:///session 是用户级(资源受限,网络能力差);本课全部用 system 模式。

## 常见错误

- **virt-host-validate 报「Checking for hardware virtualization: FAIL」**。回 2.2 的 BIOS,九成是没开 VT-x。
- **libvirtd 起不来**:`journalctl -u libvirtd -e` 看日志,常见原因是包没装全(libvirt-daemon-system 单独一个包)。
- **virsh 命令报权限错误**。用户没进 libvirt 组(2.2 第三道门),或者忘了 system 连接。
- **嵌套虚拟化关闭**。VM 里再装 KVM 时 `kvm-ok` 失败:宿主机上 `echo "options kvm-intel nested=1" | sudo tee /etc/modprobe.d/kvm-nested.conf` 后重新加载模块,VM 的 CPU 型号再设成 host-passthrough。

## 练习

1. 动手:完整走一遍 2.2~2.4,把每步的真实输出记录下来;故意在 BIOS 关掉 VT-x 再跑 kvm-ok,把报错也记录(这就是你的排错素材库)。
2. 动手:`virsh list --all` 应该是空的;`virsh uri` 看当前连接;`virsh nodeinfo` 看 libvirt 眼中的宿主机(对比 lscpu)。
3. 手算:回顾 2.1 架构图,QEMU 为什么放在用户态而不是全塞进内核?从「设备模拟代码量大、驱动 bug 多」和「内核崩溃 vs 进程崩溃」的后果对比作答。
4. 思考:`/dev/kvm` 是个设备文件,任何能读写它的进程都能创建 VM。这个权限模型的风险和容器/多租户场景下的处理方式(查一下「libvirt 每用户隔离」或 kata containers 的思路),写两段话。
