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
- **前端支持**：项目模式包含完整的前端架构
- **测试框架**：自动创建基础测试文件和配置

## 环境要求
- **GITEE_PAT**：Gitee 个人访问令牌（必须配置）
- **uv**：Python 包管理器（用于虚拟环境和依赖管理）

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
3. **符号链接**: 进入项目目录, 运行 uv pip install -e . 将项目打包
4. **调整** : 调整 index.html 中的路径
## 项目使用

### 启动前端开发服务器

```bash
# 安装前端依赖
yarn install

# 启动前端开发服务器
yarn dev
```

### 项目启动模式

项目支持开发和生产两种运行模式：

```bash
# 开发模式（默认）
uv run python -m {{ MODULE_NAME }}.server --dev

# 生产模式
uv run python -m {{ MODULE_NAME }}.server --prod

# 指定端口
uv run python -m {{ MODULE_NAME }}.server 8080
```
注意：开发模式默认端口为 8007，使用 --dev 选项时会自动增加 100 端口（即 8107）。

## 注意事项

- 项目默认创建在 ~/GitHub 目录下
- Gitee 仓库默认是私有的
- 需要配置 GITEE_PAT 环境变量
- 项目包含完整的前端架构，支持前后端分离开发
- 使用 uv 包管理器管理 Python 依赖
- 支持 Docker 容器化部署
