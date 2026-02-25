


第三阶段：实施（使用测试驱动开发指南智能体）→ 代码变更
第四阶段：审查（使用代码审查智能体）→ review-comments.md



**关键规则：**

1. 每个智能体获得一个清晰的输入并产生一个清晰的输出
2. 输出成为下一阶段的输入
3. 永远不要跳过阶段
4. 在智能体之间使用 `/clear`
5. 将中间输出存储在文件中



## 基础工作

**双实例启动模式：**

对于我自己的工作流管理，我喜欢从一个空仓库开始，打开 2 个 Claude 实例。

**实例 1：脚手架代理**

* 搭建脚手架和基础工作
* 创建项目结构
* 设置配置（CLAUDE.md、规则、代理）

**实例 2：深度研究代理**

* 连接到你的所有服务，进行网络搜索
* 创建详细的 PRD
* 创建架构 Mermaid 图
* 编译包含实际文档片段的参考资料


**我偏好的模式：**

主聊天用于代码更改，分叉用于询问有关代码库及其当前状态的问题，或研究外部服务。

**高级：动态系统提示注入**

我学到的一个模式是：与其将所有内容都放在 CLAUDE.md（用户作用域）或 `.claude/rules/`（项目作用域）中，让它们每次会话都加载，不如使用 CLI 标志动态注入上下文。

```bash
# Daily development
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR review mode
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# Research/exploration mode
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```


**高级：记忆持久化钩子**

有一些大多数人不知道的钩子，有助于记忆管理：

* **PreCompact 钩子**：在上下文压缩发生之前，将重要状态保存到文件
* **Stop 钩子（会话结束）**：在会话结束时，将学习成果持久化到文件
* **SessionStart 钩子**：在新会话开始时，自动加载之前的上下文




**智能体编排：**

* https://github.com/ruvnet/claude-flow - 拥有 54+ 个专业智能体的企业级编排平台

**系统提示词参考：**

* https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools - 系统提示词集合 (110k stars)
