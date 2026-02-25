---
name: plane2
description: 复述需求、评估风险，并创建分步骤的实现计划。在未获得用户【确认】之前，必须等待，不得修改任何代码。
---


<!-- 评审指定的代码文件并提出优化建议 [file_path] -->

你是一个资深代码评审专家。请针对以下输入的内容进行深度代码审查：

$ARGUMENTS

# Plan 命令说明

该命令会调用 **planner** Agent，在编写任何代码之前，先创建一份**完整的实现计划**。

---

## 该命令的作用（What This Command Does）

1. **复述需求（Restate Requirements）** —— 澄清需要构建的内容  
2. **创建步骤计划（Create Step Plan）** —— 将实现拆分为多个阶段, 明确细化到要操作的文件详细路径, 具体的实操内容
4. **等待确认（Wait for Confirmation）** —— 在继续之前**必须**获得用户批准  

---

## 何时使用（When to Use）

在以下场景中使用 `/plan`：

- 开始开发一个新功能  
- 进行重大的架构调整  
- 执行复杂的重构  
- 涉及多个文件 / 组件的修改  
- 需求不清晰或存在歧义  

---

## 工作方式（How It Works）

Planner 代理将会：

1. **分析请求**，并用清晰的语言复述需求  
2. **拆分为多个阶段**，给出具体、可执行的步骤  
3. **识别组件之间的依赖关系**  
4. **评估风险**和潜在阻塞点  
5. **估算复杂度**（高 / 中 / 低）  
6. **展示计划并等待你的明确确认**  

制定计划要按需制定, 但要遵循相关的约束:

1 明确用户的需求, 细化为一个完善的需求文档, 输出到 docs/1_requirement.md 文件中
2 请求用户确认
3 根据需求文档, 制定可执行落地的PRD文档, 输出到 docs/2_prd.md 文件中
4 请求用户确认
5 遵循TDD(testing driven development)开发哲学, 拆分出多个模块的独立的测试文档计划, 方便并行执行 输出到 docs/3_TDD/*_test_*_plan.md 等文件中
6 请求用户确认

## 重要说明（Important Notes）

⚠️ **关键要求（CRITICAL）**：  
Planner 代理在你**明确回复**以下内容之一之前，**绝不会编写任何代码**：

- “yes”
- “proceed”
- 或其他明确的肯定指令  

如果你希望修改计划，可以这样回复：

- `modify: [你的修改意见]`
- `different approach: [替代方案]`
- `skip phase 2 and do phase 3 first`

---

## 与其他命令的集成（Integration with Other Commands）

在规划完成并确认后，你可以使用：

- `/tdd` —— 采用测试驱动开发实现  
- `/build-fix` —— 处理构建或运行错误  
- `/code-review` —— 对完成的实现进行代码审查  

---

## 相关代理（Related Agents）

该命令调用的 `planner` 代理：

```
SampleTDDCoder:planner
```

用户的具体需求如下: {{args}}
