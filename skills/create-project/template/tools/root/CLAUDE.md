# {{ PROJECT_NAME }} - AI 开发指南

## 项目概述

{{ PROJECT_NAME }} 是一个 Python 工具包，提供了通用的工具函数和实用程序，专为 AI 辅助开发而设计。

## 核心功能

- 统一的日志配置
- 通用工具函数
- 现代的项目结构
- 自动化测试框架

## 快速上手

### 环境配置

```bash
# 同步依赖
uv sync

# 验证安装
uv run python -c "from {{ MODULE_NAME }} import __version__; print(__version__)"
```

## AI 开发提示

### 常见任务

#### 添加新工具函数

```python
# 在 src/{{ MODULE_NAME }}/__init__.py 中添加
def new_tool_function(param1, param2):
    """新工具函数说明"""
    return param1 + param2
```

#### 运行测试

```bash
# 运行所有测试
uv run pytest

# 运行特定测试文件
uv run pytest tests/test_main.py -v

# 运行特定测试函数
uv run pytest tests/test_main.py::test_specific_function -v
```

### 项目结构说明

```
{{ PROJECT_NAME }}/
├── src/{{ MODULE_NAME }}/         # 主要代码目录
│   ├── __init__.py              # 包信息和版本号
│   └── log.py                  # 日志配置
├── tests/                       # 测试文件
├── notebook/                    # 开发笔记和示例
└── pyproject.toml             # 项目依赖和配置
```

### 日志系统

项目使用 colorlog 提供美观的彩色日志输出：

```python
from {{ MODULE_NAME }}.log import logger

logger.debug("调试信息")
logger.info("普通信息")
logger.warning("警告信息")
logger.error("错误信息")
logger.critical("严重错误")
```

### 依赖管理

使用 uv 管理依赖：

```bash
# 添加新依赖
uv add package-name

# 更新依赖
uv sync

# 查看已安装的包
uv pip list
```

## 部署说明

### 安装到系统

```bash
uv pip install -e .
```

### 打包分发

```bash
uv build
```

## 测试覆盖

```bash
uv run pytest --cov={{ MODULE_NAME }} --cov-report=html tests/
```

## 常见问题

### 依赖冲突

```bash
uv pip freeze > requirements.txt
uv sync --clean
```

## 相关资源

- [Python 文档](https://docs.python.org/3/)
- [pytest 文档](https://docs.pytest.org/)
- [uv 文档](https://docs.astral.sh/uv/)