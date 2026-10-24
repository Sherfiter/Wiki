---
title: "第 3 章 · SQL 基础"
---

# 第 3 章 · SQL 基础

SQL 的第一个震撼是:你敲下的不是「命令」,是「描述」。前两章的关系代数是骨架,SQL 给它穿了件说人话的外衣,而且这层外衣从 1974 年用到今天,基本没换过面料。本章用一套可以亲手敲的 SQLite 会话走完 SQL 的四块积木:定义结构(DDL)、改数据(DML)、查数据(DQL)、约束。每一块都给真实输入和真实输出,你跟着敲一遍,这门语言的骨架就立住了。下一章讲连接和聚合这些进阶招式。

## 3.1 开一个会话

SQLite 免安装、单文件、标准 SQL 的优秀练功房(第 1 章的练习里装过):

```text
$ sqlite3 school.db
sqlite> CREATE TABLE student (
   ...>   sno   TEXT PRIMARY KEY,
   ...>   sname TEXT NOT NULL,
   ...>   dept  TEXT,
   ...>   age   INTEGER CHECK (age BETWEEN 15 AND 60)
   ...> );
sqlite> INSERT INTO student VALUES ('S001', '张三', 'CS', 19);
sqlite> SELECT * FROM student;
S001|张三|CS|19
```

四行命令,DDL(建表)、DML(插行)、DQL(查询)各来了一次。`SELECT *` 的星号是「全部列」,SQLite 的终端输出用竖线分列,MySQL 客户端会给 ASCII 表格,都是皮囊,内核一致。

## 3.2 DDL:结构是先立好的合同

建表就是立合同,列名、类型、约束一次说清。类型系统比想象中简单:整数 `INTEGER`,小数 `REAL`(注意是浮点,存钱用整数分或 NUMERIC,第 1 章讲过 0.1 的教训),定长字符串 `CHAR(n)`,变长 `VARCHAR(n)`,日期各家方言不同(SQLite 干脆用 TEXT 存 ISO 格式)。

改结构的 `ALTER` 和拆家的 `DROP`:

```sql
ALTER TABLE student ADD COLUMN email TEXT;   -- 加列
ALTER TABLE student RENAME TO stu;           -- 改名
DROP TABLE student;                          -- 连人带屋
```

`DROP` 无确认、无后悔药(除非有备份),在职业生涯里你会听说至少一个把它敲进生产库的故事,所以很多团队把 DROP 从客户端权限里没收。DDL 还有个行为要知道:多数数据库的 DDL 隐式提交事务,不能回滚,下手前想三秒。

## 3.3 DML:三件套与一个天坑

```sql
INSERT INTO student(sno, sname, dept) VALUES ('S002', '李四', 'EE'), ('S003', '王五', 'CS');
UPDATE student SET age = 20 WHERE sno = 'S001';
DELETE FROM student WHERE sno = 'S003';
```

INSERT 可以一次多行(括号逗号隔开),也可以 `INSERT INTO ... SELECT` 把查询结果整批导入,数据搬运的常规姿势。

天坑在 UPDATE 和 DELETE:**WHERE 是它们的安全带,忘系就是全表遭殃**。`DELETE FROM student;` 一句就把表清空,不报错、不询问。职业习惯只有一条但必须刻死:先写 WHERE、填好条件,再补 DELETE 或 UPDATE 关键字;更稳的做法是先用同样的 WHERE 跑一遍 SELECT 确认范围,确认无误再改操作动词。我自己的规矩是永远开事务跑(`BEGIN; DELETE ...;` 看一眼行数再 `COMMIT`),错了 ROLLBACK,多花十秒,换来睡安稳觉。

## 3.4 DQL:执行顺序是理解 SQL 的钥匙

单表查询的完整形态:

```sql
SELECT dept, COUNT(*) AS cnt          -- ⑤ 投影 + 聚合
FROM student                          -- ① 定表
WHERE age >= 18                       -- ② 行过滤
GROUP BY dept                         -- ③ 分组
HAVING cnt > 1                        -- ④ 组过滤
ORDER BY cnt DESC                     -- ⑥ 排序
LIMIT 10;                             -- ⑦ 截取
```

**书写顺序**是 SELECT 在前,**逻辑执行顺序**却从 FROM 开始:FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT。这不是背诵口诀,它是排错指南,两个经典坑都出在这里:

- **为什么 WHERE 里不能写聚合函数**(WHERE COUNT(*)>1 报错)?因为 WHERE 跑在分组之前,那时聚合还没发生;分组后的过滤要用 HAVING。
- **为什么 SELECT 的别名 HAVING 能用、WHERE 不能用**?同理,别名是 SELECT 阶段才诞生的。

WHERE 的条件语法与 C 颇有渊源(`=` 判等是单等号,不等于用 `<>` 或 `!=`),但有一个语义陷阱值得单独立牌子:**NULL 的三值逻辑**。`age = NULL` 永远不成立(NULL 和任何值比较,包括和自己比,结果都是 UNKNOWN),判断空必须写 `IS NULL` / `IS NOT NULL`。更隐蔽的是 NOT 也救不了它:`NOT (age = NULL)` 还是 UNKNOWN,行照样被过滤掉。产品需求说「筛出没填年龄的」,写成 `age != 20` 之类,都会把 NULL 行静默吞掉,这个坑每年都要咬人。

## 3.5 约束:把校验下沉到最可靠的一层

第 2 章的三类完整性,落到 SQL 就是四种约束语法,跟着建一张带全套护具的选课表:

```sql
CREATE TABLE sc (
  sno   TEXT,
  cno   TEXT,
  grade REAL CHECK (grade BETWEEN 0 AND 100),
  PRIMARY KEY (sno, cno),                    -- 实体完整性:组合主码
  FOREIGN KEY (sno) REFERENCES student(sno), -- 参照完整性
  FOREIGN KEY (cno) REFERENCES course(cno)
);
```

试一条犯规的插入,看数据库当场拒绝:

```text
sqlite> PRAGMA foreign_keys=ON;   -- SQLite 默认关外键,要用先打开
sqlite> INSERT INTO sc VALUES ('S999', 'C1', 88);
Runtime error: FOREIGN KEY constraint failed
```

`ON DELETE CASCADE` 等级联选项控制「被引用行删除时怎么办」:CASCADE 跟着删,SET NULL 置空,默认(RESTRICT)拒绝删。选哪种取决于业务语义(删学生连带删选课记录?还是先人工结清?),没有标准答案,但「什么都不写」通常最危险,报错总比静默丢数据好。

## 3.6 方言:标准之内的百态

SQL 有 ISO 标准,但各库实现各有偏差,踩过才知道:MySQL 8.0 之前 CHECK 约束 parses 但不执行;分页 `LIMIT n OFFSET m` 是 MySQL/SQLite/PG 方言,标准写法是 `FETCH FIRST n ROWS ONLY`(这句话你大概率一辈子用不上);PostgreSQL 对标准的贴合度最高,还有 `RETURNING` 这类贴心扩展。实践建议:开发时盯着目标库的官方文档,别背「通用 SQL」,小心可移植性的幻觉;真要跨库,老老实实用 ORM 或把方言差异封装到存储层。

## 常见错误

- **忘写 WHERE 的 UPDATE/DELETE**。3.3 的天坑,值一个专用练习。
- **用 = 判 NULL**。三值逻辑的坑,`IS NULL` 是唯一正解。
- **字符串用双引号**。标准 SQL 里单引号是字符串、双引号是标识符(列名),MySQL 纵容了这个坏习惯,PG 会直接报「列不存在」。
- **COUNT(*) 和 COUNT(列) 混用**。前者数行(含 NULL),后者跳过 NULL,统计「填了邮箱的人数」和「总人数」要用不同的那个。

## 练习

1. 动手:跟着 3.1 建库,插入你自己的 5 条数据,练 3.3 的三件套;故意跑一次无 WHERE 的 UPDATE,再用你学的事务方法自救(此库随便造)。
2. 手算:表里 age 有 19、NULL、21 三行,`SELECT COUNT(*) FROM student WHERE age > 18` 和 `WHERE NOT (age <= 18)` 各返回几行?(两问答案不同,写出原因。)
3. 动手:建 sc 表(带 CHECK 和外键),依次插入成绩 101、学号悬空、重复主码三行,收集三种报错原文,体会「数据库守门员」的价值。
4. 思考:执行顺序 FROM → WHERE → ... → LIMIT 意味着 LIMIT 不是「省资源」而是「截结果」。那「大表分页 LIMIT 100000, 10 为什么越翻越慢」?这个问题在学完第 9 章索引后你会彻底明白,先猜一个答案。
