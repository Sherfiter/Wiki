---
title: "第 9 章 · 网络编程:Socket"
---

# 第 9 章 · 网络编程:Socket

前三章讲的协议都在内核里,应用程序碰不到。碰得到的入口只有一个:socket。这一章就从一段能跑的代码开始,把它一次讲透。所有代码和输出都是我在这台 Linux 机器上真编译、真运行的,你在任何 Unix 上照抄都能复现。

## 9.1 二十行写一个 echo 服务器

服务器:收到什么就回什么。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM, 0);      // ① 创建 TCP 套接字
    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);  // 只监听 127.0.0.1
    addr.sin_port = htons(9000);                    // ② 端口必须转网络字节序

    bind(srv, (struct sockaddr *)&addr, sizeof(addr));   // ③ 占住 IP:端口
    listen(srv, 16);                                     // ④ 进入监听
    printf("listening on 127.0.0.1:9000\n");

    for (;;) {
        int conn = accept(srv, NULL, NULL);              // ⑤ 阻塞等连接
        char buf[1024];
        ssize_t n = recv(conn, buf, sizeof(buf) - 1, 0); // ⑥ 读
        if (n > 0) {
            buf[n] = '\0';
            printf("recv %zd bytes: %s\n", n, buf);
            send(conn, buf, n, 0);                       // ⑦ 原样写回
        }
        close(conn);                                     // ⑧ 服务完这一条就关
    }
}
```

客户端几乎是对称的:`socket` 之后不 bind 不 listen,直接 `connect`:

```c
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

int main(void) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(9000);
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);   // 点分十进制 → 二进制

    connect(fd, (struct sockaddr *)&addr, sizeof(addr)); // 主动发起三次握手
    char msg[64];
    printf("say something: ");
    if (!fgets(msg, sizeof(msg), stdin)) return 0;
    msg[strcspn(msg, "\n")] = '\0';
    send(fd, msg, strlen(msg), 0);

    char buf[1024];
    ssize_t n = recv(fd, buf, sizeof(buf) - 1, 0);
    buf[n] = '\0';
    printf("echo back (%zd bytes): %s\n", n, buf);
    close(fd);
    return 0;
}
```

真实运行效果,两个终端:

```
终端 1(服务器)                终端 2(客户端)
$ ./echoserver                 $ ./client
listening on 127.0.0.1:9000    say something: hello socket
recv 12 bytes: hello socket    echo back (12 bytes): hello socket
```

「hello socket」是 12 个字符,没有换行(客户端把 `\n` 剥掉了),所以是 12 字节。再玩一次输入「第二次」,服务器显示 `recv 9 bytes`:中文在 UTF-8 里一个字占 3 字节,`recv` 返回的是字节数,这一点在处理多字节文本时天天坑人。

## 9.2 每个系统调用站在握手的哪一步

把第 4 章的协议行为和这里的调用对上号,socket 就不神秘了:

- 客户端的 `connect` 触发 SYN、SYN+ACK、ACK 三次握手,函数返回时握手已完成。
- 服务器的 `listen` 让端口进入监听态,内核开始替你自动完成握手(注意:握手是内核做的,不等 `accept`)。完成握手的连接排进全连接队列,`accept` 从队列头取一条,返回一个**新的** fd 专门服务这条连接,原来的 fd 继续监听。这就是「监听套接字」和「已连接套接字」的分工。
- `listen` 的第二个参数(backlog)限制的是这个全连接队列的长度; SYN 还没握完的半连接在另一个队列里。`ss -lnt` 里的 `Recv-Q`、`Send-Q` 对 LISTEN 状态的套接字分别就是「当前积压的已完成连接数」和「backlog 上限」,积压长期顶满,说明 accept 不够快。
- `close` 触发 FIN,四次挥手;哪端先 close,哪端就去 60 秒的 TIME_WAIT 排队(第 4 章)。

TIME_WAIT 对写服务器的人有个直接后果:服务器重启,立刻 bind 同一端口,经常报:

```
bind: Address already in use
```

旧连接的 TIME_WAIT 还没走完,端口还占着。标准解法是 bind 之前设 `SO_REUSEADDR`,允许复用处于 TIME_WAIT 的地址,开发期重启服务不再看运气:

```c
int on = 1;
setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on));
```

## 9.3 粘包:亲手撞一次 TCP 的字节流

第 3 章说过 TCP 没有消息边界,现在用实验撞它。客户端连发两条消息,中间不等:

```c
send(fd, "hello", 5, 0);
send(fd, "world", 5, 0);
```

服务器只 `recv` 一次,真实输出:

```
recv() 返回 10 字节: [helloworld]
```

两条消息被合并成了一条,「hello」和「world」粘在一起。这就是粘包:内核把 send 的字节堆进发送缓冲区,攒够了(或 Nagle 算法攒了一会儿)作为一个段发出,接收方从缓冲区里读出多少,取决于缓冲区当时有多少,它根本不知道你 send 过几次。

同一实验换成 UDP,输出就完全不同(同样是两次发送、两次接收):

```
第 1 次 recvfrom 收到 5 字节: [hello]
第 2 次 recvfrom 收到 5 字节: [world]
```

UDP 保留报文边界,sendto 几次,recvfrom 就几次,一个不多一个不少。代价是不保证送达、不保证顺序。

我在第一个聊天室项目里就栽在这里:把 `recv` 当「读一条消息」用,两人同时说话时消息粘成一坨,还以为是并发 bug,查了半天才明白是字节流的性质。修法就是给消息定边界,工程上最常见的是长度前缀:

```c
// 发送方:先发 4 字节长度,再发消息体
uint32_t len = htonl(strlen(msg));
send(fd, &len, 4, 0);
send(fd, msg, strlen(msg), 0);
```

接收方先读满 4 字节、解析出长度 n,再循环读满 n 字节。配套规矩:别假设 `recv`/`send` 一次搞定一切。`send` 可能只写出一部分(返回值是实际写出的字节数,缓冲区满了就少写),`recv` 读到的可能不足一条消息,两者都要按返回值循环处理。

## 9.4 UDP:去掉仪式感

UDP 套接字没有握手,`socket` 之后直接收发,每包自带地址:

```c
int fd = socket(AF_INET, SOCK_DGRAM, 0);
sendto(fd, data, n, 0, (struct sockaddr *)&dst, sizeof(dst));
ssize_t n = recvfrom(fd, buf, sizeof(buf), 0, (struct sockaddr *)&src, &srclen);
```

`recvfrom` 顺便告诉你数据来自谁,所以 UDP 服务器不用 accept,一个 socket 就能同时应付所有客户端,每个请求带源地址回复即可。DNS 服务器就是这么工作的。

## 9.5 一个服务器怎么撑一万个连接

echo 服务器的循环是阻塞式的:`accept` 没连接就卡着,`recv` 没数据就卡着。想同时服务多个客户端,最直接的办法是一个连接开一个线程(进程),代码好写,但一万个连接就是一万个线程,内存和调度先扛不住,这是最朴素的 C10K 问题。

高性能服务器的路线是非阻塞 + I/O 多路复用:把 fd 设成非阻塞,没数据时调用立刻返回错误 `EAGAIN` 而不睡觉;然后由一个系统调用同时盯着成千上万个 fd,「谁就绪了告诉我」。Linux 上的答案是 epoll:

```c
fcntl(fd, F_SETFL, O_NONBLOCK);            // 非阻塞:没数据返回 EAGAIN
int ep = epoll_create1(0);
struct epoll_event ev = { .events = EPOLLIN, .data.fd = srv };
epoll_ctl(ep, EPOLL_CTL_ADD, srv, &ev);    // 登记要监听的 fd 和事件

struct epoll_event events[64];
for (;;) {
    int n = epoll_wait(ep, events, 64, -1);  // 有 fd 就绪才返回
    for (int i = 0; i < n; i++) {
        if (events[i].data.fd == srv) { /* 新连接:accept */ }
        else { /* 旧连接可读:recv */ }
    }
}
```

单线程 + 一个事件循环,就是 Nginx、Redis 这类万级并发服务的骨架。select/poll 是它的前辈(每次都要把整个 fd 集合传进内核,epoll 用 `epoll_ctl` 登记一次就够,量大时差距悬殊);C10K 这个问题名出自 1999 年的一篇著名文章,现在它的答案已经成了常识。

## 9.6 常见错误

按我见过的翻车频率排序:

- `bind: Address already in use`。要么上一个进程没死(`ss -tlnp` 找凶手),要么撞上 TIME_WAIT(上 `SO_REUSEADDR`)。十个初学者九个撞过。
- 忘记 `close`。每条连接占一个 fd,进程的 fd 总量有上限(默认常见 1024),泄漏的连接攒到上限,新的 `accept` 直接失败,报 `Too many open files`。9.5 节的 CLOSE_WAIT 排查法在这里用得上。
- 当 `recv` 返回 0 是出错。返回 0 的含义是「对端正常关闭」,循环读的代码必须把它当终止条件;返回 -1 才是出错(查 `errno`)。
- 忘了字节序。端口 9000 不套 `htons` 直接塞进 `sin_port`,在你自己的小端机器上监听的会是一个莫名其妙的端口号,客户端按 9000 连怎么都连不上。规矩只有一句:凡是放进协议头的多字节数值,一律 `htons`/`htonl`。

## 练习

<Quiz title="随堂小测" question="客户端对同一条 TCP 连接先 send 一个 1 字节的消息,再 send 一个 2 字节的消息,服务端一次 recv(缓冲区足够大)可能读到什么?" options={['要么 1 字节,要么 2 字节,与发送次数对应', '可能一次读到 3 字节,两条消息粘在一起', '必定分两次读到,先 1 字节后 2 字节']} answer={1} comment="TCP 是字节流,不保留消息边界,两次 send 的数据可能被合并成一次 recv 读到(粘包),需要应用层自己定界。" />

1. 改代码:把 9.1 节的 echo 服务器改成「收到 bye 就关闭这条连接,其余消息回显」,只允许改 recv 之后的逻辑。
2. 动手:同时开两个终端各跑一个 client 连同一个 server,观察服务器的输出顺序;再把 `INADDR_LOOPBACK` 改成 `INADDR_ANY`,试试从局域网另一台设备连进来。
3. 动手:服务器跑起来后执行 `ss -lnt | grep 9000`,对照 9.2 节解释 Recv-Q 和 Send-Q 的数字。
4. 思考:HTTP/1.1 用什么界定一条请求的结束?这和 9.3 节的哪种定界方式同类?
