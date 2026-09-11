---
title: "第 4 章 · SQL 进阶"
---

# 第 4 章 · SQL 进阶

第 3 章是单表查询。真实数据分散在多张表里，本章讲怎么把它们**拼回来**（连接）、**套起来**（子查询）、**汇总**（聚合分组），以及视图和事务语句。

## 4.1 多表连接（JOIN）

```sql
SELECT s.sname, sc.grade
FROM student s
JOIN sc ON s.sno = sc.sno;
```

四种连接：

| 连接 | 结果 | 说明 |
|---|---|---|
| 内连接 `INNER JOIN` | 只保留**两边都匹配**的行 | 默认 `JOIN` 就是它 |
| 左外连接 `LEFT JOIN` | 保留左表全部，右表无匹配填 `NULL` | 查「没选课的学生」 |
| 右外连接 `RIGHT JOIN` | 保留右表全部 | 左连接的镜像 |
| 全外连接 `FULL JOIN` | 两边都保留 | MySQL 不支持，PG 支持 |
| 交叉连接 `CROSS JOIN` | 笛卡尔积 | 无 `ON`，行数爆炸 |

**自连接**是特殊的连接——一张表和自己连，靠别名区分角色：

```sql
-- 找「和'张三'同系」的人
SELECT s2.sname
FROM student s1 JOIN student s2 ON s1.dept = s2.dept
WHERE s1.sname = '张三' AND s2.sname <> '张三';
```

## 4.2 子查询：IN / EXISTS / 相关子查询

子查询是嵌在另一个查询里的查询，分两类：

**非相关子查询**（独立执行一次）：

```sql
SELECT sname FROM student
WHERE dept IN (SELECT dept FROM student WHERE sname = '张三');
```

**相关子查询**（外层每行都触发内层重算，用外层的列）：

```sql
SELECT sname FROM student s
WHERE EXISTS (
    SELECT 1 FROM sc WHERE sc.sno = s.sno AND grade > 90
);
```

- `IN` 判断「值是否在集合里」；`EXISTS` 判断「子查询**是否非空**」，找到即停，通常比 `IN` 更省。
- `= ANY`、`> ALL` 等量词配合子查询做「比某个/全部」的比较。
- 相关子查询逐行执行、效率低，第 9 章讲执行计划时会看到它常被优化器改写成连接。

## 4.3 聚合与分组：GROUP BY / HAVING

```sql
SELECT dept, COUNT(*) AS cnt, AVG(age) AS avg_age
FROM student
GROUP BY dept
HAVING COUNT(*) > 2
ORDER BY cnt DESC;
```

执行顺序（第 3 章顺序的扩展）：`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`。

- `GROUP BY` 把行按某列分桶，桶内用聚合函数（`COUNT/SUM/AVG/MAX/MIN`）折叠成一行。
- `WHERE` 在**分组前**过滤行，`HAVING` 在**分组后**过滤桶——所以 `HAVING` 里才能引用聚合结果。
- `SELECT` 里出现的非聚合列，必须出现在 `GROUP BY` 里（否则结果无定义，MySQL 旧版会静默放水）。

## 4.4 视图（View）

```sql
CREATE VIEW cs_student AS
SELECT sno, sname FROM student WHERE dept = 'CS';
```

视图是**存查询、不存数据**的虚拟表，对应第 1 章的外模式。好处：隐藏底层结构（逻辑独立性）、简化复杂查询、控制权限。代价：每次查询要展开，可更新视图受限（带聚合/连接的一般不可更新）。

## 4.5 事务语句

```sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;          -- 或 ROLLBACK 回滚
```

`BEGIN` 开启事务，`COMMIT` 提交（持久化），`ROLLBACK` 撤销。事务的「要么全成、要么全不」是 ACID 的 A（原子性），完整四性质与并发行为见第 7 章，日志与恢复见第 8 章。

> 对比：JOIN vs 子查询——**连接**把多表拼成一张宽表再一次性算，优化器有更大重排空间，数据量正常时效率高、可读性好；**子查询**（尤其相关子查询）语义更直观、能表达「存在/不存在」这类连接不好写的关系，但逐行嵌套容易拖慢。经验法则：**能等价改写且语义清晰的场景优先用 JOIN；判断「存在性」用 `EXISTS`；比较聚合结果才用子查询。** 最终谁快，以 `EXPLAIN` 的实际计划为准（第 9 章）。

> 承上启下：本章把第 3 章的单表能力扩到多表，核心仍是第 2 章关系代数的连接运算。**连接**的代价与优化是第 9 章的重头戏；**事务语句**在这里只开了个头，第 7 章会揭示它背后的并发与隔离，第 8 章揭示崩溃后怎么恢复；而「多表拆分得合不合理」取决于第 5 章的范式设计——表设计烂，连接和子查询再熟练也是给烂摊子打补丁。
