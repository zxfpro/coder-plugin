---
description: 复述需求、评估风险，并创建分步骤的实现计划。在未获得用户【确认】之前，必须等待，不得修改任何代码。
---

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

---

## 使用示例（Example Usage）

```
用户：/plan 我需要在市场结算时发送实时通知

代理（planner）：
# 实现计划：市场结算实时通知

## 需求复述
- 当用户关注的市场完成结算时，向用户发送通知
- 支持多种通知渠道（站内、邮件、Webhook）
- 确保通知可靠送达
- 通知内容需包含市场结果和用户的持仓结算情况

## 实现阶段

### 阶段 1：数据库结构
- 新增 notifications 表，字段包括：
  id, user_id, market_id, type, status, created_at
- 新增 user_notification_preferences 表，用于存储通知渠道偏好
- 在 user_id 和 market_id 上创建索引以提升性能

### 阶段 2：通知服务
- 在 lib/notifications.ts 中创建通知服务
- 使用 BullMQ / Redis 实现通知队列
- 为失败的通知增加重试逻辑
- 创建通知模板

### 阶段 3：集成点
- 在市场结算逻辑中挂钩（状态变为 "resolved" 时）
- 查询该市场中所有有持仓的用户
- 为每个用户创建并入队通知任务

### 阶段 4：前端组件
- 在头部创建 NotificationBell 组件
- 添加 NotificationList 弹窗
- 通过 Supabase Subscriptions 实现实时更新
- 添加通知偏好设置页面

## 依赖
- Redis（用于队列）
- 邮件服务（SendGrid / Resend）
- Supabase 实时订阅功能

## 风险
- 高：邮件投递率问题（需要配置 SPF / DKIM）
- 中：单个市场有 1000+ 用户时的性能问题
- 中：市场频繁结算可能导致通知轰炸
- 低：实时订阅带来的系统开销

## 复杂度预估：中
- 后端：4–6 小时
- 前端：3–4 小时
- 测试：2–3 小时
- 总计：9–13 小时

**等待确认**：是否按此计划继续？（yes / no / modify）
```

---

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

用户的具体需求如下: $1
