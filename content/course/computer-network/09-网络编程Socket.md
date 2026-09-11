---
title: "第 9 章 · 网络编程：Socket"
---

# 第 9 章 · 网络编程：Socket

**Socket（套接字）** 是应用层与传输层之间的编程接口（见第 1 章的「接口」）。通过它，应用可以把数据交给内核，由 TCP/UDP 负责送达。这是把前面 3、4 章讲的理论变成代码的入口。

## 9.1 TCP Socket：服务器端

TCP 服务器按固定顺序调用一组系统调用：

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);   // 创建 TCP 套接字
bind(fd, &addr, sizeof(addr));               // 绑定到 IP:端口
listen(fd, backlog);                         // 进入监听，backlog 是等待队列长度
int c = accept(fd, NULL, NULL);              // 阻塞等待连接，返回已连接套接字
recv(c, buf, len, 0);                        // 收数据
send(c, buf, len, 0);                        // 发数据
close(c);                                    // 关闭这条连接
```

- `listen` 之后套接字进入「监听态」，`accept` 返回一个**新的**套接字专门服务这条连接——原始 fd 继续监听（对应 TCP 三次握手建立连接，见第 4 章）。
- `recv`/`send` 操作的是**字节流**，没有消息边界：一次 `recv` 读到的可能不是一条完整消息，要应用层自己分包。

## 9.2 TCP Socket：客户端

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);
connect(fd, &addr, sizeof(addr));   // 主动发起三次握手
send(fd, "GET / HTTP/1.1\r\nHost: x\r\n\r\n", 33, 0);
recv(fd, buf, len, 0);
close(fd);
```

`connect` 背后就是 SYN→SYN+ACK→ACK 三次握手；`close` 触发四次挥手。所以第 4 章的「为什么三次握手」最终体现在 `connect` 调用上。

## 9.3 UDP Socket

```c
int fd = socket(AF_INET, SOCK_DGRAM, 0);   // 数据报套接字
sendto(fd, data, n, 0, &dst, sizeof(dst)); // 直接发，无需 connect
recvfrom(fd, buf, len, 0, &src, &srclen);  // 收，附带上对方地址
```

> 对比（TCP vs UDP socket 编程）：**TCP 要先 `connect`/`accept` 建立连接、有「已连接」概念，收发用 `send`/`recv`，操作字节流；UDP 无连接，用 `sendto`/`recvfrom` 每次带上对方地址，保留报文边界。** TCP 代码更啰嗦（建连、监听、状态），UDP 更简单但对丢包、乱序不负任何责任（见第 3 章对比表）。

| 步骤 | TCP 服务器 | UDP 服务器 |
|---|---|---|
| 创建 | `socket(...SOCK_STREAM)` | `socket(...SOCK_DGRAM)` |
| 绑定 | `bind` | `bind` |
| 等待连接 | `listen` + `accept` | 无 |
| 收发 | `send`/`recv`（字节流） | `sendto`/`recvfrom`（报文） |
| 释放 | `close`（四次挥手） | `close`（直接关） |

## 9.4 阻塞 vs 非阻塞

> 对比：**阻塞（blocking）** 调用会一直卡住，直到能完成——`accept` 等到有连接、`recv` 等到有数据，代码简单但一个线程只能处理一条连接；**非阻塞（non-blocking）** 调用立即返回，没有数据就返回 `EAGAIN`，配合 `select`/`poll`/`epoll` 实现**一个线程同时管理成千上万连接**（I/O 多路复用）。

| 维度 | 阻塞 | 非阻塞 |
|---|---|---|
| 调用返回 | 等到事件发生 | 立即返回（可能 EAGAIN） |
| 并发模型 | 一线程一连接 | 单线程多路复用（epoll） |
| 代码复杂度 | 低 | 高（需事件循环） |
| 适用 | 简单服务、少量连接 | Nginx、Redis 等高并发 |

```c
// 非阻塞 + epoll 的骨架（Linux）
fcntl(fd, F_SETFL, O_NONBLOCK);
int ep = epoll_create1(0);
epoll_ctl(ep, EPOLL_CTL_ADD, fd, &ev);
epoll_wait(ep, events, N, -1);   // 有事件才返回
```

> 承上启下：socket 是第 1 章「接口」概念的具体化，把第 3、4 章的 TCP/UDP 变成可调用的 API。下一章用一次真实的请求，把从 socket 到物理层的每一层都串起来。
