---
title: 个人兴趣
---

# 喜欢的
 
- 喜欢福尔摩斯 
  - 海龟汤 [SZ推理之夜](https://space.bilibili.com/3546824214317878?spm_id_from=333.337.0.0) [许木木](https://space.bilibili.com/3546731908171869?spm_id_from=333.337.search-card.all.click)
    
- 游戏
  - 瓦 lol 黑猴 想买影之刃零（但是我tm的晕3D）

## 今日公告

<Box title="作息警告" color="yellow">

怎么样作息才能好

</Box>

<Box title="晕 3D 预警" color="red">

影之刃零想玩，但我 tm 晕 3D，玩半小时得缓一小时。

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
