---
title: "第 12 章 · 使用 Dockerfile 创建镜像"
---

# 第 12 章 · 使用 Dockerfile 创建镜像

手动改容器再 docker commit 是野路子,正路是把「怎么造镜像」写成代码:Dockerfile。它是一份声明式构建脚本,docker build 按它一层层造镜像,结果可复现、可审计、可自动化。本章过一遍核心指令,然后花大篇幅讲两件真正决定功力的事:**层的顺序与缓存**,和**怎么把镜像做小**。第 8 章的分层理论在这里全部变成可操作的手艺。

## 12.1 一个能跑的完整例子

构建一个静态网站镜像,从零到 run:

```dockerfile
FROM nginx:1.27                 # 基础镜像(站在别人的肩膀上)
LABEL maintainer="me@example.com"
COPY index.html /usr/share/nginx/html/     # 把本地文件烤进镜像
EXPOSE 80                       # 声明性文档:这个服务听 80(不会自动开放)
CMD ["nginx", "-g", "daemon off;"]   # 容器启动命令(前台!第 9 章的主进程)
```

```bash
docker build -t myweb:v1 .      # 最后的 . 是构建上下文(把当前目录发给 dockerd)
docker run -d -p 8080:80 myweb:v1
```

四条指令,每条生成一层(第 8 章的分层模型)。几个指令的细节值得说:**COPY vs ADD**:COPY 老实复制,ADD 会自动解压 tar、支持 URL,行为太「聪明」,优先 COPY。**EXPOSE 只是文档**(提示使用者和其他工具),真正开放端口靠 run 的 -p。**CMD 的 exec 形式**(JSON 数组)让 nginx 直接作为 PID 1;写成 `CMD nginx -g "daemon off"`(shell 形式)则实际是 /bin/sh -c 包一层,信号处理(SIGTERM 收尾,第 9 章讲过)会坏,养成 exec 形式的习惯。**daemon off;** 不是笔误:nginx 默认后台自守护,而容器主进程必须前台,否则容器秒退(第 9 章「容器秒退」的 nginx 版解释)。

## 12.2 指令速查

| 指令 | 作用 | 备注 |
|---|---|---|
| `FROM` | 基础镜像 | 多段构建的起点(见 12.4) |
| `RUN` | 构建时执行(装依赖、编译) | 写在镜像里,占层 |
| `COPY` / `ADD` | 拷贝上下文文件进镜像 | 优先 COPY |
| `WORKDIR` | 设置工作目录 | 后续指令和 CMD 的 cwd |
| `ENV` | 环境变量 | 运行时也生效 |
| `ARG` | 构建期变量 | 只在构建时有效 |
| `EXPOSE` | 声明端口 | 文档性质 |
| `ENTRYPOINT` / `CMD` | 启动命令 | 入口 + 默认参数 |
| `USER` | 切换运行用户 | 安全默认非 root |
| `HEALTHCHECK` | 健康检查命令 | 配合编排平台 |

ENTRYPOINT 和 CMD 的关系一句话:**ENTRYPOINT 是固定命令,CMD 是它的默认参数**(`docker run 镜像` 用 CMD,`docker run 镜像 --help` 会把 CMD 整个替换)。写工具镜像时 ENTRYPOINT 定行为、CMD 给默认参数,用户可以无脑传参,是成熟的做法。

## 12.3 顺序与缓存:构建速度的核心手艺

docker build 的每一层都有缓存:指令没变、上下文没变,直接复用旧层,**一条命令没命中缓存,它后面所有层全部重建**。所以层的顺序是手艺:把「不常变的放前面,常变的放后面」。反面教材(新手最常见的烂 Dockerfile):

```dockerfile
COPY . /app            # 任何代码改动都使缓存失效
RUN apt-get update && apt-get install -y openjdk-21-jdk   # 于是每改一行代码都重装 JDK!
```

正确姿势,把依赖安装和代码拷贝拆开:

```dockerfile
COPY pom.xml .
RUN mvn dependency:go-offline        # 依赖层:代码改了也命中缓存
COPY src ./src
RUN mvn package                      # 代码层:只有代码变才重建
```

`.dockerignore` 是缓存的另一半守护(也是安全的):把 .git、node_modules、日志全挡在构建上下文外,不然 COPY . 会把垃圾全烤进镜像,还可能把 .env 秘密文件带上生产。

## 12.4 把镜像做小:多段构建

编译环境浩大(gcc、maven、node_modules),运行环境只想要结果。**多段构建**:第一段用全量镜像编译,第二段只 COPY 产物:

```dockerfile
# 段一:编译(可以肥)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# 段二:运行(极瘦)
FROM eclipse-temurin:21-jre-alpine
COPY --from=build /app/target/app.jar /app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

两个 FROM 是两个独立镜像,最终镜像只含第二段:maven、源码、依赖全被丢下。Java 服务从 800MB 级瘦到 200MB 级,Go/C 更夸张(上千 MB 到 20MB)。其余瘦身常规拳:选 alpine/distroless 基础镜像、RUN 里合并命令并清缓存(`&& rm -rf /var/lib/apt/lists/*`)、不装文档和调试工具。瘦身收益:传输快、攻击面小、拉取密度高,但**别瘦过头**(缺调试工具的镜像出问题时连 curl 都没有,distroless 要有心理准备)。

## 常见错误

- **上下文传错目录**。`docker build .` 的 . 是上下文根,Dockerfile 里的 COPY 全是相对它的;在错误目录构建,COPY 找不到文件。
- **容器秒退**。CMD 写了会自动退出的命令(脚本跑完、nginx 没加 daemon off),第 9 章的主进程规则。
- **缓存错觉**。改了 Dockerfile 第 3 行,第 3 行之后全部重建;把「几乎不变」的指令尽量前置。
- **镜像里带秘密**。.env、密钥被 COPY 进去推上 Hub,等于公开;秘密用运行时环境变量/挂载,和 .dockerignore 配合。

## 练习

1. 动手:从零写 Dockerfile 构建 12.1 的 nginx 静态站,`docker history myweb:v1` 对照四条指令的层;改 index.html 重新 build,观察哪几层重建(用 build 输出的 CACHED 标记)。
2. 动手:用 12.3 的「依赖先行」结构给一个 Java 或 Node 项目写 Dockerfile,故意改一行代码再 build,对比「优化前」(COPY . 在前)的构建时间。
3. 动手:多段构建瘦身:记录你的应用镜像构建前后的 `docker images` 体积差;再用 dive(第三方工具)逐层看体积去向。
4. 思考:Dockerfile 是「基础设施即代码」的最小实现(第 4 章的 XML、第 8 章的分层,到这里闭环)。对比「手搓环境 + 文档」和「Dockerfile」,从新人上手时间、环境漂移、审计三个角度,写一段 200 字的工程论证。
