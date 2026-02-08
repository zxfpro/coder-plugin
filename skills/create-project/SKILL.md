---
name: create-project
description: 自动化 Python 项目初始化工具，支持创建 PyPI 包（tools 模式）和 Web 服务（project 模式）。自动完成项目命名、Gitee 仓库创建、环境配置和依赖安装。
---

# 项目创建工具

自动化 Python 项目初始化流程，基于 标准 模板创建标准化项目结构。

## 核心功能

- **智能命名**：PyPI 包名可用性自动检查
- **仓库管理**：自动创建 Gitee 远程仓库并关联本地仓库
- **环境配置**：使用 uv 包管理器创建和管理虚拟环境
- **依赖安装**：自动安装基础开发依赖（pytest、fastapi、uvicorn 等）
- **模板渲染**：根据项目类型复制对应的模板文件
- **配置生成**：自动修改项目配置文件

## 使用场景

**创建 Web 服务项目：**
```bash
scripts/create_project.sh project
```

**创建 PyPI 包项目：**
```bash
scripts/create_project.sh tools
```

## 执行流程

1. **参数验证**：检查项目类型参数（project 或 tools）
2. **项目命名**：交互式输入项目名称，tools 模式会检查 PyPI 可用性
3. **目录创建**：在 ~/GitHub 目录下创建项目文件夹
4. **Git 初始化**：初始化本地仓库并关联 Gitee 远程仓库
5. **环境构建**：使用 uv 初始化项目和安装依赖
6. **结构创建**：创建标准项目目录结构
7. **模板复制**：根据项目类型复制对应的模板文件
8. **配置修改**：自动修改 pyproject.toml、mkdocs.yml、Dockerfile 等配置

## 环境要求

- **GITEE_PAT**：Gitee 个人访问令牌（必须配置）
- **uv**：Python 包管理器（用于虚拟环境和依赖管理）

## 项目结构

创建的项目包含以下结构：

```
project-name/
├── src/project_name/          # 源代码目录
│   ├── __init__.py
│   ├── log.py                # 日志配置
│   └── server/               # FastAPI 服务器
├── tests/                    # 测试目录
├── notebook/                 # 笔记目录
├── build/                    # 构建输出
├── pyproject.toml           # 项目配置
├── Dockerfile               # Docker 配置
└── start.sh                 # 启动脚本
```

## 注意事项

- 项目默认创建在 ~/GitHub 目录下
- Gitee 仓库默认是私有的
- 需要配置 GITEE_PAT 环境变量
