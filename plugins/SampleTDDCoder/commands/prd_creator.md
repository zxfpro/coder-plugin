---
description: 复述需求、评估风险，并创建分步骤的实现计划。目标是构建一个完善的prd文档。
---

# Plan 命令说明

该命令会调用 **prd_writer** Agent，在编写任何代码之前，先创建一份**完整的实现计划**。

---

## 该命令的作用（What This Command Does）

1. **复述需求（Restate Requirements）** —— 澄清需要构建的内容  
2. **创建步骤计划（Create Step Plan）** —— 将实现拆分为多个阶段, 明确细化到要操作的文件详细路径, 具体的实操内容
4. **等待确认（Wait for Confirmation）** —— 在继续之前**必须**获得用户批准  

---

## 何时使用（When to Use）

在以下场景中使用 `/prd_creator`：

- 开始一个新项目  
- 有明确的需求文档,需要细化成可执行的方案

---

## 工作方式（How It Works）

prd_writer 代理将会：

1. **分析需求**，将需求做详细的分析
2. **拆分为多个阶段**，给出具体、可执行的步骤  
3. **识别组件之间的依赖关系**  
4. **输出成果** 将PRD文档输出到 docs/1_PRD.md 中


## 重要说明（Important Notes）

⚠️ **关键要求（CRITICAL）**：  
prd_writer 代理在你**明确回复**以下内容之一之前，**绝不会编写任何代码**：

- “yes”
- “proceed”
- 或其他明确的肯定指令  

如果你希望修改，可以这样回复：

- `modify: [你的修改意见]`
- `different approach: [替代方案]`
- `skip phase 2 and do phase 3 first`

---

## 相关代理（Related Agents）

该命令调用的 `prd_writer` 代理：

```
SampleTDDCoder:prd_writer
```

用户的具体需求如下:  "$ARGUMENTS" 
