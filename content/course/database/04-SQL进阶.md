---
title: "第 4 章 · SQL 进阶"
---

# 第 4 章 · SQL 进阶

单表查询会上手之后,真正的 SQL 从一个具体问题开始:「找出没选任何课的学生」。听起来人畜无害,做起来才知道它要动用本章的看家本领:数据分布在两张表里,student 有全体学生,sc 只存选了课的(没选课的学生在 sc 里根本没有行,「缺失」是查不出来的,得换个方向想)。这个问题的优雅解法(LEFT JOIN 加 IS NULL)是我第一次感觉 SQL「会思考」的时刻,本章就从这开始,把连接、子查询、聚合这三套进阶功练完。

## 4.1 JOIN:两张表怎么拼

继续用 school.db 的 student 和 sc。先造点数据:

```sql
-- student: S001 张三, S002 李四, S003 王五(没选课)
-- sc:      S001 选了 C1、C2;S002 选了 C1
```

**内连接**取两边都能配上对的行:

```sql
SELECT s.sname, sc.cno
FROM student s JOIN sc ON s.sno = sc.sno;
-- 张三|C1   张三|C2   李四|C1        (王五没出现:右表没有他的行)
```

**左外连接**保左表全员,右表配不上的补 NULL:

```sql
SELECT s.sname, sc.cno
FROM student s LEFT JOIN sc ON s.sno = sc.sno;
-- 张三|C1   张三|C2   李四|C1   王五|NULL
```

注意张三出现了两行:连接的结果行数不看人,看「配对」。「没选课的学生」就是顺着这个思路筛:

```sql
SELECT s.sname
FROM student s LEFT JOIN sc ON s.sno = sc.sno
WHERE sc.sno IS NULL;              -- 右表全空 = 没有任何配对
-- 王五
```

这个「LEFT JOIN + IS NULL」的招式有个学名(反连接 anti-join),是排查「缺失数据」的标准姿势:哪些用户没有下单、哪些订单没有物流、哪些文章没有作者,全靠它。其余连接类型一览:RIGHT JOIN 是左连接镜像(把表名换个位就等价,实战用得少,读别人的代码要认识),FULL JOIN 两边都保(MySQL 不支持,PG 支持),CROSS JOIN 是笛卡尔积(3 行连 4 行出 12 行,忘了写 ON 就会产出这种东西,十亿行的报表事故常有它)。

**自连接**是最后一个值得单独记的形态:表和自己连,靠别名分饰两角。「找和张三同系的其他人」:

```sql
SELECT s2.sname
FROM student s1 JOIN student s2 ON s1.dept = s2.dept
WHERE s1.sname = '张三' AND s2.sname <> '张三';
```

「比较同一表内的两行」类问题(找同部门的、找上一条的、找工资比自己高的),全靠自连接。

## 4.2 子查询:查询里套查询

子查询分两族,行为和性能都不同。

**非相关子查询**:内层不依赖外层,只算一次。张三的同系同学(先查出张三的系,再拿去筛):

```sql
SELECT sname FROM student
WHERE dept = (SELECT dept FROM student WHERE sname = '张三');
```

**相关子查询**:内层引用外层的列,外层每行都要触发一次内层。「选过成绩 90 以上的学生」:

```sql
SELECT sname FROM student s
WHERE EXISTS (SELECT 1 FROM sc
              WHERE sc.sno = s.sno AND sc.grade > 90);
```

`EXISTS` 判断「子查询有没有结果」,内层找到一行就短路返回,配合索引往往比 `IN` 快;「选过 90 分以上的人」用 EXISTS 语义也最贴切。反过来「没选过任何课的」用 `NOT EXISTS`(比 LEFT JOIN 写法更直白,优化器常能殊途同归)。

子查询里埋着 SQL 全宇宙最阴的一颗雷:**NOT IN 碰上 NULL**。`WHERE sno NOT IN (SELECT sno FROM some_table)` 里,子查询结果只要有一个 NULL,整个 NOT IN 对所有行都返回 UNKNOWN(第 3 章的三值逻辑),查询**静默返回空集**,不报错。防御习惯:写 NOT IN 前先确认子查询列 NOT NULL,或者直接养成用 NOT EXISTS 的习惯,它对 NULL 天然免疫。

## 4.3 聚合与分组:折叠的艺术

GROUP BY 把行分桶,聚合函数把每桶折叠成一行:

```sql
SELECT dept, COUNT(*) AS cnt, AVG(age) AS avg_age
FROM student
GROUP BY dept
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
-- CS|2|19.5      (张三、王五)
```

规则用第 3 章的执行顺序一想就通:WHERE 在分组前筛行,HAVING 在分组后筛桶,所以 HAVING 能用聚合而 WHERE 不能;SELECT 里的非聚合列必须在 GROUP BY 里(否则一行里塞了桶里多个不同值,语义崩坏,MySQL 旧版会静默放水挑一个值,坑过无数人,新版的 only_full_group_by 模式终于按标准报错)。

两个实战细节。其一,`COUNT(*)` 和 `COUNT(列)` 别混(第 3 章说过,后者跳过 NULL)。其二,先 JOIN 再 COUNT 要当心重复计数:student 连 sc 后每个学生出现「选课数」行,`COUNT(*)` 数的是选课记录数;想要「每个学生选了几门课」应该按学生 GROUP BY,想要「有多少学生选过课」要先去重(`COUNT(DISTINCT s.sno)`)。GROUP BY 和 JOIN 叠加时的口径问题,是报表数字对不上账的第一大来源。

## 4.4 视图:把常用查询存成名字

```sql
CREATE VIEW cs_student AS
SELECT sno, sname, age FROM student WHERE dept = 'CS';

SELECT * FROM cs_student WHERE age > 18;   -- 像表一样用
```

视图存的是查询本身,数据仍以原表为准(虚表)。三个用途正好对应第 1 章的外模式:简化(复杂连接封装成一句)、权限(给运营开 cs_student 视图,别的部门数据摸不到)、稳定(底层拆表了,改视图定义,下游应用无感)。限制:带聚合或 DISTINCT 的视图一般不可 UPDATE(数据库无法反推该改基础表哪一行)。

## 4.5 事务语句:先借个预告

```sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;    -- 或 ROLLBACK;
```

两条 UPDATE 必须同生共死(转了一半就断电等于钱凭空消失),BEGIN/COMMIT 把它们捆成一个不可分割的单元。这套机制的全部原理(ACID、隔离级别、MVCC)是第 7 章的主菜,这里只需要会语法:从第 3 章开始,我建议你所有带 WHERE 的 UPDATE/DELETE 都在事务里演练,现在你知道语法了,养成它。

## 常见错误

- **NOT IN 遇 NULL 返回空集**。4.2 的雷,用 NOT EXISTS 防身。
- **JOIN 后直接 COUNT 对不上账**。先想清楚数的是「配对数」还是「实体数」,决定要不要 DISTINCT。
- **忘了连接条件**。`FROM a, b` 不写 WHERE 关联,得到笛卡尔积;行数两表相乘,大表直接把内存吃穿。
- **把过滤条件写错位置**:LEFT JOIN 时,右表的过滤条件写在 WHERE 里会把 NULL 行筛掉、悄悄把外连接变回内连接;右表条件应写在 ON 里。这条值得专门做个练习体会。

## 练习

1. 动手:造好 4.1 的数据(王五不选课),分别写出「没选课的学生」的 LEFT JOIN 版和 NOT EXISTS 版,验证结果一致;再故意往 sc 插一行 sno 为 NULL 的记录,重跑 NOT IN 版本,亲眼看它返回空集。
2. 手算:student 3 行、sc 3 行(张三 2 条、李四 1 条),`SELECT COUNT(*) FROM student JOIN sc` 是几?`COUNT(DISTINCT student.sno)` 是几?各在数什么?
3. 动手:写出「每门课的选课人数、平均分」,再升级成「选课人数超过 1 人的课」(HAVING),最后排「平均分前三」(ORDER BY + LIMIT)。
4. 思考:LEFT JOIN 时把 sc 的条件(比如 grade > 60)写进 WHERE 和写进 ON,结果有何不同?用「ON 是配对规则,WHERE 是配对后的筛选」这句话推一遍,再实操验证。
