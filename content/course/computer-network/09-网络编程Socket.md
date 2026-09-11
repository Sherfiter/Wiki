---
title: "第 9 章 · 网络编程：Socket"
---

# 第 9 章 · 网络编程：Socket

Socket 是应用层与传输层之间的编程接口（见第 1 章），应用通过它把数据交给内核、由 TCP/UDP 送达。

## 9.1 TCP Socket：服务器端

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);   // 创建 TCP 套接字
bind(fd, &addr, sizeof(addr));               // 绑定到 IP:端口
listen(fd, backlog);                         // 进入监听，backlog 是等待队列长度
int c = accept(fd, NULL, NULL);              // 阻塞等待连接，返回已连接套接字
recv(c, buf, len, 0);                        // 收数据
send(c, buf, len, 0);                        // 发数据
close(c);                                    // 关闭这条连接
```

- `listen` 后进入监听态；`accept` 返回一个**新的**套接字服务这条连接，原 fd 继续监听（对应三次握手，见第 4 章）。
- `recv`/`send` 操作字节流、无消息边界：一次 `recv` 读到的未必是完整消息，应用层自己分包。

## 9.2 TCP Socket：客户端

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);
connect(fd, &addr, sizeof(addr));   // 主动发起三次握手
send(fd, "GET / HTTP/1.1\r\nHost: x\r\n\r\n", 33, 0);
recv(fd, buf, len, 0);
close(fd);
```

`connect` 背后是 SYN→SYN+ACK→ACK；`close` 触发四次挥手。

## 9.3 UDP Socket

```c
int fd = socket(AF_INET, SOCK_DGRAM, 0);   // 数据报套接字
sendto(fd, data, n, 0, &dst, sizeof(dst)); // 直接发，无需 connect
recvfrom(fd, buf, len, 0, &src, &srclen);  // 收，附带上对方地址
```

| 步骤 | TCP 服务器 | UDP 服务器 |
|---|---|---|
| 创建 | `socket(...SOCK_STREAM)` | `socket(...SOCK_DGRAM)` |
| 绑定 | `bind` | `bind` |
| 等待连接 | `listen` + `accept` | 无 |
| 收发 | `send`/`recv`（字节流） | `sendto`/`recvfrom`（报文） |
| 释放 | `close`（四次挥手） | `close`（直接关） |

> 对比：TCP 先 `connect`/`accept` 建连、有「已连接」概念，`send`/`recv` 操作字节流；UDP 无连接，`sendto`/`recvfrom` 每次带对方地址、保留报文边界，但对丢包/乱序不负责任。

## 9.4 阻塞 vs 非阻塞

| 维度 | 阻塞 | 非阻塞 |
|---|---|---|
| 调用返回 | 等到事件发生 | 立即返回（可能 EAGAIN） |
| 并发模型 | 一线程一连接 | 单线程多路复用（epoll） |
| 代码复杂度 | 低 | 高（需事件循环） |
| 适用 | 简单服务、少量连接 | Nginx、Redis 等高并发 |

> 对比：阻塞调用一直卡到能完成（`accept` 等连接、`recv` 等数据），代码简单但一线程一连接；非阻塞立即返回，没数据返回 `EAGAIN`，配 `select`/`poll`/`epoll` 实现单线程管成千上万连接（I/O 多路复用）。

```c
// 非阻塞 + epoll 的骨架（Linux）
fcntl(fd, F_SETFL, O_NONBLOCK);
int ep = epoll_create1(0);
epoll_ctl(ep, EPOLL_CTL_ADD, fd, &ev);
epoll_wait(ep, events, N, -1);   // 有事件才返回
```
