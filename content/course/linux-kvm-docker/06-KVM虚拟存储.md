---
title: "第 6 章 · 管理 KVM 虚拟存储"
---

# 第 6 章 · 管理 KVM 虚拟存储

VM 的磁盘其实是一个文件(或一个块设备),这个事实一旦接受,虚拟存储的全部玩法就顺了:复制 VM = 复制文件、快照 = 写时复制、精简置备 = 稀疏文件。本章讲 libvirt 的存储两级抽象(池与卷)、qcow2 和 raw 两种镜像格式的账、以及磁盘扩容的实战流程。数据结构课第 12 章的「按需分配」思想、操作系统课第 8 章(文件系统)的知识,在这章都有实体对应物。

## 6.1 两级抽象:池与卷

libvirt 把存储组织成「池(pool)里放卷(volume)」:

- **存储池**:一类存储来源,本地目录(默认的 default 池就是 /var/lib/libvirt/images)、LVM 卷组、NFS 挂载、iSCSI 目标;
- **存储卷**:池里的一个单位,通常就是一个磁盘镜像文件。

```bash
virsh pool-list --all
#  Name      State
#  default   active        ← 默认池:目录 /var/lib/libvirt/images

virsh vol-list default
#  demo.qcow2   /var/lib/libvirt/images/demo.qcow2
```

抽象的价值:VM 的 XML 里只写「卷名 + 池名」,镜像实际在本地盘、NFS 还是分布式存储(生产环境 Ceph),换存储后端不动 VM 定义。这又是第 4 章「面向 libvirt 编程」思想的延伸。

## 6.2 两种镜像格式:qcow2 vs raw 的账

| | qcow2 | raw |
|---|---|---|
| 占用 | 稀疏:分配 20G 实际占几 G(按写多少) | 直接占满(或宿主文件系统支持稀疏) |
| 快照/克隆 | 内置支持(写时复制链) | 无 |
| 性能 | 多一层元数据,略慢 | 最少开销,接近裸盘 |
| 适用 | 通用、测试、模板 | 高 IO 生产、直通场景 |

qcow2 的「按需占用」值得亲手验证(第 3 章练习做过 qemu-img info),这里补格式背后的机制:**写时复制(COW)**。新 VM 基于一个基础镜像(backing file)创建时,只建一个空的 overlay 文件;读走基础镜像,写落到 overlay。于是「一个 2G 的干净模板,秒起 100 台 VM」成为可能,每台的实际增量只有自己的修改量。数据结构课第 7 章 Cache 的写回思想、第 12 章的「按需分配」,在这里换了个领域重现。

```bash
qemu-img create -f qcow2 -b base.qcow2 -F qcow2 vm1.qcow2   # 基于模板创建
qemu-img info vm1.qcow2        # 能看到 backing file 链
```

## 6.3 池与卷的日常操作

建一个自定义池(把 VM 镜像挪到大磁盘):

```bash
sudo mkdir -p /data/vmpool
virsh pool-define-as datapool dir --target /data/vmpool
virsh pool-build datapool && virsh pool-start datapool && virsh pool-autostart datapool
virsh vol-create-as datapool demo2.qcow2 10G --format qcow2
```

之后 `virt-install --disk pool=datapool,size=10` 就会往这个池里放新 VM 的盘。卷的删改:vol-delete、vol-resize,镜像的通用手术台是 qemu-img(convert 转格式、resize 扩容、check 体检)。

## 6.4 磁盘扩容实战:从 20G 到 40G

给跑着的 VM 扩根盘,四步,每步在正确的层上操作:

```bash
# ① 宿主机:把镜像/卷扩到 40G
virsh blockresize demo --path vda --size 40G

# ② VM 里:确认内核看到了新容量
lsblk               # vda 显示 40G 了,但分区还是 20G

# ③ VM 里:分区扩容(growpart 自动改分区表末尾)
sudo growpart /dev/vda 1

# ④ VM 里:文件系统吃满分区(ext4/xfs 各有命令)
sudo resize2fs /dev/vda1      # ext4
# 或 sudo xfs_growfs /        # xfs
```

原理:磁盘、分区、文件系统是三层独立的记账(操作系统课第 8 章),扩容要逐层「告诉」它们新边界。直接重启 VM 是不行的,文件系统不会自己长。

## 常见错误

- **以为分配 200G 就占了 200G**。qcow2 稀疏,实际按写入增长;但宿主磁盘的「总承诺」别超卖过头(所有 VM 同时写满 = 宿主爆盘,和第 1 章练习的内存超售一个道理)。
- **raw 和 qcow2 用错场景**。追求 IO 的生产盘用 raw(或 lvm 直通),折腾模板快照用 qcow2;反过来用,要么性能吃亏要么功能缺失。
- **扩容只做了一半**。blockresize 后忘了 growpart/resize2fs,VM 里 df 还是老容量,以为扩容失败白折腾;四步走全。
- **删 VM 后镜像还在**。第 4 章提过的 undefine --remove-all-storage,池里的卷不跟着注销走。

## 练习

1. 动手:建一个自定义池,创建 10G qcow2 卷,用 qemu-img info 对比 virtual size 和 actual size;往 VM 里写 5G 文件,再 info 一次,亲眼看「按需增长」。
2. 动手:走通 6.4 的四步扩容(先做快照兜底,呼应第 4 章),df 从 20G 到 40G 的每一步输出都记录。
3. 动手:`qemu-img convert -O raw demo.qcow2 demo.raw` 转格式,对比转换前后两个文件的实际大小和 VM 启动速度(粗测即可)。
4. 思考:qcow2 的 backing file 链和 Git 的提交链惊人地像(基础镜像=初始提交,overlay=修改)。推演一下「overlay 链过长」的性能问题,以及 qemu-img commit(合并)和 Git 的 rebase/squash 的对应关系。
