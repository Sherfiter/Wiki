---
title: "第 3 章 · SQL 基础"
---

# 第 3 章 · SQL 基础

SQL 是关系代数（第 2 章）的「英语」。它分四类子语言：**DDL**（定义结构）、**DML**（改数据）、**DQL**（查数据）、**DCL**（控权限）。本章覆盖前三类的基础，外加约束。

## 3.1 DDL：定义与修改结构

```sql
CREATE TABLE student (
    sno   CHAR(9)      PRIMARY KEY,
    sname VARCHAR(20)  NOT NULL,
    dept  VARCHAR(20),
    age   SMALLINT,
    UNIQUE (sname)
);
ALTER TABLE student ADD COLUMN email VARCHAR(50);
DROP TABLE student;
```

- `CREATE` 建对象，`ALTER` 改对象，`DROP` 删对象——三者对称。
- 类型宽度写死（`CHAR(9)` 定长、`VARCHAR(20)` 变长），这是「模式固定」的体现，与第 10 章的 MongoDB 动态模式形成对照。

## 3.2 DML：插入、更新、删除

```sql
INSERT INTO student(sno, sname, dept) VALUES ('S001', '张三', 'CS');
UPDATE student SET age = 20 WHERE sno = 'S001';
DELETE FROM student WHERE sno = 'S001';
```

要点：

- `INSERT` 可一次多行，也可 `INSERT ... SELECT` 从查询结果导入。
- `UPDATE`/`DELETE` 的 `WHERE` **省略则作用全表**，是最常见的翻车点。
- 这些是**数据操作**，不是事务提交——单条 DML 是否自动提交取决于隔离级别和事务设置（见第 4、7 章）。

## 3.3 DQL：单表查询

```sql
SELECT sname, age
FROM student
WHERE dept = 'CS' AND age >= 18
ORDER BY age DESC
LIMIT 10;
```

子句的**书写顺序固定**，但**逻辑执行顺序**完全不同：

```
书写顺序: SELECT → FROM → WHERE → ORDER BY → LIMIT
执行顺序: FROM → WHERE → SELECT → ORDER BY → LIMIT
```

- `SELECT` 决定投影哪些列（第 2 章的 π），可用 `DISTINCT` 去重、用别名 `AS`。
- `WHERE` 是行过滤（第 2 章的 σ），支持 `=, <>, >, <, BETWEEN, IN, LIKE, IS NULL`。
- `ORDER BY` 排序，`LIMIT n`/`OFFSET m` 截取——**SQL 无「取第 k 大」的原子操作，只能排序后截取**。

## 3.4 约束：把完整性写进结构

第 2 章的三类完整性在这里落地为四种约束：

| 约束 | SQL | 对应的完整性 |
|---|---|---|
| 主键 | `PRIMARY KEY` | 实体完整性（非空且唯一） |
| 外键 | `FOREIGN KEY ... REFERENCES` | 参照完整性 |
| 唯一 | `UNIQUE` | 用户定义（候选码） |
| 检查 | `CHECK (age >= 0)` | 用户定义（取值范围） |

```sql
CREATE TABLE sc (
    sno   CHAR(9),
    cno   CHAR(4),
    grade SMALLINT CHECK (grade BETWEEN 0 AND 100),
    PRIMARY KEY (sno, cno),
    FOREIGN KEY (sno) REFERENCES student(sno)
);
```

外键默认「拒绝违反」；可选 `ON DELETE CASCADE` 级联删除。**约束写得越全，DBMS 帮你挡的错误越多，数据越不可能进入非法状态。**

> 对比：SQL 标准 vs MySQL / PostgreSQL 方言——标准由 ISO/IEC 维护，但各库实现有偏差：MySQL 的 `CHECK` 长期被忽略（8.0 前不真正强制）、`AUTO_INCREMENT` 非标准（PG 用 `SERIAL`/`GENERATED`）、字符串默认大小写不敏感；PostgreSQL 更贴近标准，`CHECK` 强制、支持 `GENERATED`、布尔类型 `BOOLEAN` 是原生；MySQL 的 `LIMIT` 在标准里是 `FETCH FIRST n ROWS ONLY`（PG 两者都认）。结论：**写「能跑」的 SQL 要盯目标方言，写「可移植」的 SQL 要避开库特有语法。** 具体选型见第 10 章。

> 承上启下：本章把第 2 章的抽象运算翻译成了可执行语句——`SELECT` 是投影、`WHERE` 是选择、`PRIMARY/FOREIGN KEY` 是三类约束。但单表只是热身，现实查询几乎都跨多张表，那正是第 4 章的主场（连接、子查询、聚合）。约束的「强制」与「延迟」在事务语境下会更有味道（第 7 章）。
