---
title: "第 4 章 · SQL 进阶"
---

# 第 4 章 · SQL 进阶

多表数据怎么拼（连接）、套（子查询）、汇总（聚合分组），外加视图与事务语句。

## 4.1 多表连接（JOIN）

```sql
SELECT s.sname, sc.grade
FROM student s
JOIN sc ON s.sno = sc.sno;
```

| 连接 | 结果 | 说明 |
|---|---|---|
| 内连接 `INNER JOIN` | 只保留**两边都匹配**的行 | 默认 `JOIN` 就是它 |
| 左外连接 `LEFT JOIN` | 保留左表全部，右表无匹配填 `NULL` | 查「没选课的学生」 |
| 右外连接 `RIGHT JOIN` | 保留右表全部 | 左连接的镜像 |
| 全外连接 `FULL JOIN` | 两边都保留 | MySQL 不支持，PG 支持 |
| 交叉连接 `CROSS JOIN` | 笛卡尔积 | 无 `ON`，行数爆炸 |

**自连接**：一张表和自己连，靠别名区分角色：

```sql
-- 找「和'张三'同系」的人
SELECT s2.sname
FROM student s1 JOIN student s2 ON s1.dept = s2.dept
WHERE s1.sname = '张三' AND s2.sname <> '张三';
```

## 4.2 子查询：IN / EXISTS / 相关子查询

**非相关子查询**（独立执行一次）：

```sql
SELECT sname FROM student
WHERE dept IN (SELECT dept FROM student WHERE sname = '张三');
```

**相关子查询**（外层每行都触发内层重算，用外层列）：

```sql
SELECT sname FROM student s
WHERE EXISTS (
    SELECT 1 FROM sc WHERE sc.sno = s.sno AND grade > 90
);
```

- `IN` 判断「值是否在集合里」；`EXISTS` 判断「子查询非空」，找到即停，通常更省。
- `= ANY`、`> ALL` 配合子查询做「比某个/全部」比较。
- 相关子查询逐行执行、效率低，常被优化器改写成连接（见第 9 章）。

## 4.3 聚合与分组：GROUP BY / HAVING

```sql
SELECT dept, COUNT(*) AS cnt, AVG(age) AS avg_age
FROM student
GROUP BY dept
HAVING COUNT(*) > 2
ORDER BY cnt DESC;
```

执行顺序：`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`。

- `GROUP BY` 按列分桶，桶内用聚合函数（`COUNT/SUM/AVG/MAX/MIN`）折叠成一行。
- `WHERE` 在**分组前**过滤行，`HAVING` 在**分组后**过滤桶——故 `HAVING` 才能引用聚合结果。
- `SELECT` 中的非聚合列必须出现在 `GROUP BY`（否则结果无定义，MySQL 旧版静默放水）。

## 4.4 视图（View）

```sql
CREATE VIEW cs_student AS
SELECT sno, sname FROM student WHERE dept = 'CS';
```

视图 = 存查询、不存数据的虚拟表，对应第 1 章外模式。好处：隐藏底层结构、简化查询、控权限；代价：每次查询展开，带聚合/连接的视图一般不可更新。

## 4.5 事务语句

```sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;          -- 或 ROLLBACK 回滚
```

`BEGIN` 开事务、`COMMIT` 提交（持久化）、`ROLLBACK` 撤销。「要么全成、要么全不」是 ACID 的 A；完整四性质与并发见第 7 章，恢复见第 8 章。

> 对比：JOIN vs 子查询——**连接**拼成宽表一次算，优化器重排空间大；**子查询**（尤其相关）语义直观、能表达「存在/不存在」，但逐行嵌套易慢。能等价改写且清晰时优先 JOIN；判存在性用 `EXISTS`；比较聚合结果才用子查询。最终以 `EXPLAIN` 实际计划为准（第 9 章）。
