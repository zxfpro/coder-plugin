# {{ PROJECT_NAME }} - AI 开发指南

## 项目概述

{{ PROJECT_NAME }} 是一个基于 FastAPI 的 Web 服务项目，专为 AI 辅助开发而设计。

## 核心功能

- 完整的 API 开发框架
- 统一的日志配置
- 现代的项目结构
- Docker 容器化支持
- 自动化测试框架

## 快速上手

### 环境配置

```bash
# 同步依赖
uv sync

# 验证安装
uv run python -c "from {{ MODULE_NAME }} import __version__; print(__version__)"
```

### 启动开发服务器

```bash
uv run python -m {{ MODULE_NAME }}.server
```

## AI 开发提示

### 常见任务

#### 添加新 API 端点

```python
# 在 src/{{ MODULE_NAME }}/server/__main__.py 中添加
@app.get("/new-endpoint")
async def new_endpoint():
    """新 API 端点说明"""
    return {"message": "Hello from new endpoint"}
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

#### 调试模式

```bash
uv run python -m {{ MODULE_NAME }}.server --debug
```

### 项目结构说明

```
{{ PROJECT_NAME }}/
├── src/{{ MODULE_NAME }}/         # 主要代码目录
│   ├── __init__.py              # 包信息和版本号
│   ├── log.py                  # 日志配置
│   └── server/                 # API 服务器
│       ├── __init__.py
│       └── __main__.py         # 服务器和路由定义
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

### 环境变量

支持通过 `.env` 文件配置：

```env
# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=True

# 日志配置
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
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

### 使用 Docker

```bash
# 构建镜像
docker build -t {{ PROJECT_NAME }} .

# 运行容器
docker run -p 8000:8000 {{ PROJECT_NAME }}
```

### Docker Compose

```bash
docker-compose up -d
```

## 测试覆盖

```bash
uv run pytest --cov={{ MODULE_NAME }} --cov-report=html tests/
```

## 常见问题

### 端口被占用

```bash
lsof -ti:8000 | xargs kill -9
```

### 依赖冲突

```bash
uv pip freeze > requirements.txt
uv sync --clean
```

### 性能监控

```bash
uv run python -m {{ MODULE_NAME }}.server --reload --workers 4
```

## 相关资源

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Uvicorn 文档](https://www.uvicorn.org/)
- [pytest 文档](https://docs.pytest.org/)