---
title: 个人兴趣
---

# 喜欢的
 
- 喜欢福尔摩斯 
  - 海龟汤 [SZ推理之夜](https://space.bilibili.com/3546824214317878?spm_id_from=333.337.0.0) [许木木](https://space.bilibili.com/3546731908171869?spm_id_from=333.337.search-card.all.click)
- 游戏
  - 瓦 lol 黑猴 想买影之刃零（但是我tm的晕3D）
- 书
  - 张居正 [漫天大雪送一人](https://baike.baidu.com/item/%E5%BC%A0%E5%B1%85%E6%AD%A3/279)

## 今日公告

> 2026-10-19 星期一 · 每天挑几个热门开源项目和几条各方新闻，纯手工整理。
> 数据来源：[GitHub Trending](https://github.com/trending) · [Solidot](https://www.solidot.org/)

<Box title="今日开源项目" color="blue">

- **[anomalyco/opencode](https://github.com/anomalyco/opencode)**（TypeScript · ⭐ 21.7w）——开源编码 Agent，一天又涨了 1.4k star。
- **[debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio)**（Python · ⭐ 7.6w）——纯本地跑的 ElevenLabs 替代品：声音克隆、配音、转录、有声书，覆盖 646 种语言，今天 +2.1k。
- **[akitaonrails/ai-memory](https://github.com/akitaonrails/ai-memory)**（Rust · ⭐ 1.1w）——给编码 CLI 做长期记忆，顺手解决换一家 Agent 就失忆的交接问题。
- **[HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything)**（Python · ⭐ 5.5w）——目标是让所有软件都变成 Agent 原生的 CLI。

</Box>

<Box title="技术 & 开源" color="yellow">

- **Linux 7.3 释出**：3,021 名开发者贡献了 18,765 个 commit，其中 807 人是第一次参与，新增 `fchroot()` 系统调用、failfs 文件系统等。
- **SonicBoom 发布**：GPLv3 的 AI 运行时框架，自带 LLVM MLIR 做图编译，不手工调 kernel 就在 RTX 3050 上比 llama.cpp 原始性能高 20%。
- **内核提交补丁不再需要声明是否用了 AI**：布拉格维护者峰会决定去掉 `Assisted-by` 标签。Linus 说禁止 AI 就像禁止文本编辑器——不过他本人那组 Claude Code 写的补丁被查出竞态条件，已转交人类开发者接手。
- **GNOME OS Preview 发布**：基于 GNOME 51.1，面向普通用户，稳定性高于 Nightly。

</Box>

<Box title="AI & 安全" color="red">

- **decomp.dev 宣布关闭**：管理员说 GPT-6-Astra 这类模型让游戏反编译变得太轻松，靠人工协作的模式「已经被结束了」。
- **Meta 新条款 10 月 30 日生效**：允许用爬虫、机器人抓取客户内容训练自家模型，已有媒体联盟公开反对。
- **Meta 发布开放权重模型 Muse Spark Open**：8,160 亿参数、激活 420 亿、100 万 token 上下文，针对 Apple Silicon 优化，两台顶配 Mac Studio 就能跑起来。

</Box>

<Box title="科学 & 杂项" color="purple">

- **第一颗绿色恒星**：326 光年外的白矮星 WD J1330+6435 正在啃食行星伴星，大气中的钠吸收了橙光，只留下幽灵般的绿。
- **兵马俑上的指纹**：79 枚有效指纹里约 45% 来自成年男性、32.7% 来自成年女性，剩下 22.3% 是 15 岁以下的孩子——秦代学徒制实锤。
- **日本 MMX 探测器明晨发射**：目标登陆火卫一取样，计划 2031 年返回地球。
- **手机越卖越贵**：IDC 称三季度中国手机出货量同比跌 15.4%，内存涨价是主因，华为是唯一同比双位数增长的头部品牌。

</Box>

## 灵魂拷问

<Quiz
  title="侦探入门"
  question="福尔摩斯的住处门牌号是多少？"
  options={["贝克街 221B", "国王街 42 号", "对角巷 11 号", "唐宁街 10 号"]}
  answer={0}
  comment="贝克街 221B，侦探迷心中的圣地。"
/>

## 代码示例

```c
#include <stdio.h>

// Quake III 的传奇：用「魔数 + 位运算 + 牛顿法」逼近 1/√x
float inv_sqrt(float x) {
    long i;
    float x2 = x * 0.5f;
    i = *(long *)&x;              // 把浮点的位模式当作整数看
    i = 0x5f3759df - (i >> 1);    // 魔数：一步就非常接近
    x = *(float *)&i;
    x = x * (1.5f - x2 * x * x);  // 牛顿迭代精修一步
    return x;
}

int main(void) {
    printf("1/√2 ≈ %f\n", inv_sqrt(2.0f));
    return 0;
}
```

## 公式示例

心形线，网传是笛卡尔写给公主的：

$$
(x^2 + y^2 - 1)^3 = x^2 y^3
$$

（严格说这是后人附会，笛卡尔真正研究的是极坐标心形线 $r = a(1 - \sin\theta)$。）
