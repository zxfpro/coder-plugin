# {{ PROJECT_NAME }}

## 项目简介

{{ PROJECT_NAME }} 是一个基于 FastAPI 的现代化 Web 服务项目，提供了完整的 API 开发框架和最佳实践。

## 快速开始

### 环境要求

- Python 3.10+
- uv (Python 包管理器)

### 安装和运行

```bash
# 克隆项目
git clone https://gitee.com/zhaoxuefeng199508/{{ PROJECT_NAME }}.git
cd {{ PROJECT_NAME }}

# 同步依赖
uv sync

# 启动开发服务器
uv run python -m {{ MODULE_NAME }}.server
```

### 访问 API

- 主 API 文档: http://localhost:8000/docs
- 可交互 API 文档: http://localhost:8000/redoc

## 项目结构

```
{{ PROJECT_NAME }}/
├── src/{{ MODULE_NAME }}/         # 源代码目录
│   ├── __init__.py              # 包初始化文件
│   ├── log.py                  # 日志配置
│   └── server/                 # FastAPI 服务器
│       ├── __init__.py
│       └── __main__.py         # 服务器入口
├── tests/                       # 测试目录
├── notebook/                    # 笔记和示例
├── build/                       # 构建输出
├── pyproject.toml             # 项目配置
├── Dockerfile                 # Docker 配置
└── start.sh                   # 启动脚本
```

## 开发流程

### 运行测试

```bash
uv run pytest
```

### 构建和发布

```bash
# 构建包
uv build

# 运行开发服务器
uv run python -m {{ MODULE_NAME }}.server
```

## 技术栈

- **框架**: FastAPI
- **服务器**: Uvicorn
- **依赖管理**: uv
- **日志**: colorlog
- **配置**: python-dotenv
- **测试**: pytest

## 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 PR

## 许可证

MIT License