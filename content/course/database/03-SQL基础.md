---
title: "第 3 章 · SQL 基础"
---

# 第 3 章 · SQL 基础

SQL 是关系代数（第 2 章）的「英语」，分四类：**DDL**（定义结构）、**DML**（改数据）、**DQL**（查数据）、**DCL**（控权限）。

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

- `CREATE` 建、`ALTER` 改、`DROP` 删。
- 类型宽度写死（`CHAR(9)` 定长、`VARCHAR(20)` 变长）=「模式固定」，对照第 10 章 MongoDB 动态模式。

## 3.2 DML：插入、更新、删除

```sql
INSERT INTO student(sno, sname, dept) VALUES ('S001', '张三', 'CS');
UPDATE student SET age = 20 WHERE sno = 'S001';
DELETE FROM student WHERE sno = 'S001';
```

- `INSERT` 可一次多行，也可 `INSERT ... SELECT` 从查询结果导入。
- `UPDATE`/`DELETE` 省略 `WHERE` 则作用全表，最常见的翻车点。
- 单条 DML 是否自动提交取决于隔离级别与事务设置（见第 4、7 章）。

## 3.3 DQL：单表查询

```sql
SELECT sname, age
FROM student
WHERE dept = 'CS' AND age >= 18
ORDER BY age DESC
LIMIT 10;
```

书写顺序固定，逻辑执行顺序不同：

```
书写顺序: SELECT → FROM → WHERE → ORDER BY → LIMIT
执行顺序: FROM → WHERE → SELECT → ORDER BY → LIMIT
```

- `SELECT` 决定投影列（第 2 章 π），可 `DISTINCT` 去重、`AS` 别名。
- `WHERE` 行过滤（第 2 章 σ），支持 `=, <>, >, <, BETWEEN, IN, LIKE, IS NULL`。
- `ORDER BY` 排序，`LIMIT n`/`OFFSET m` 截取——**SQL 无「取第 k 大」原子操作，只能排序后截取**。

## 3.4 约束：把完整性写进结构

第 2 章三类完整性落地为四种约束：

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

外键默认拒绝违反，可选 `ON DELETE CASCADE` 级联删除。约束写得越全，DBMS 帮你挡的错误越多。

> 对比：SQL 标准 vs MySQL / PostgreSQL 方言——标准由 ISO/IEC 维护，各库有偏差：MySQL 的 `CHECK` 8.0 前不强制、`AUTO_INCREMENT` 非标准（PG 用 `SERIAL`/`GENERATED`）、字符串默认大小写不敏感；PG 更贴标准，`CHECK` 强制、`BOOLEAN` 原生；MySQL 的 `LIMIT` 标准写法是 `FETCH FIRST n ROWS ONLY`。写「能跑」的 SQL 盯目标方言，写「可移植」的避开库特有语法。选型见第 10 章。
