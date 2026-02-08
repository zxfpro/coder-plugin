# {{ PROJECT_NAME }}

## 项目简介

{{ PROJECT_NAME }} 是一个 Python 工具包，提供了通用的工具函数和实用程序。

## 快速开始

### 环境要求

- Python 3.10+
- uv (Python 包管理器)

### 安装和使用

```bash
# 克隆项目
git clone https://gitee.com/zhaoxuefeng199508/{{ PROJECT_NAME }}.git
cd {{ PROJECT_NAME }}

# 同步依赖
uv sync

# 安装包
uv pip install -e .

# 使用示例
uv run python -c "from {{ MODULE_NAME }} import __version__; print(__version__)"
```

## 项目结构

```
{{ PROJECT_NAME }}/
├── src/{{ MODULE_NAME }}/         # 源代码目录
│   ├── __init__.py              # 包初始化文件
│   └── log.py                  # 日志配置
├── tests/                       # 测试目录
├── notebook/                    # 笔记和示例
├── build/                       # 构建输出
└── pyproject.toml             # 项目配置
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

# 发布到 PyPI (需要配置 PyPI 认证)
uv pip install twine
twine upload dist/*
```

## 技术栈

- **依赖管理**: uv
- **日志**: colorlog
- **测试**: pytest

## 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 PR

## 许可证

MIT License