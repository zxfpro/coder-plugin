# Docker 部署流程优化方案

**功能特性：**

✅ **自动化流程**
```bash
./deploy.sh  # 一键完成：构建 → 推送 → 部署 → 健康检查
```

✅ **部署前检查**
- 检查 Git 工作区状态（未提交的更改）
- 检查服务器连接性
- 提供继续/取消选项

✅ **健康检查**
- 自动验证 HTTP 响应（200 OK）
- 最多重试 5 次，每次间隔 10 秒
- 检查失败时自动触发回滚

✅ **回滚机制**
- 自动备份当前运行镜像
- 部署失败时自动恢复到上一个版本
- 支持手动执行回滚

✅ **清理旧镜像**
- 自动清理服务器上的旧镜像
- 保留最近 3 个版本
- 节省磁盘空间

✅ **增强日志**
- 彩色输出（信息/警告/错误）
- 显示部署进度
- 部署后显示应用日志

### 2. 版本策略优化

**当前版本格式：** `YYYYMMDD-提交次数`
- 例如：`20260227-40`

**优势：**
- 唯一且可追溯
- 包含日期信息便于定位
- 递增的提交次数保证顺序

### 3. 持续集成（CI/CD）建议

#### GitHub Actions 示例

```yaml
name: Deploy to Test Environment

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Configure Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Aliyun Registry
        uses: docker/login-action@v2
        with:
          registry: shikongai-registry.cn-beijing.cr.aliyuncs.com
          username: ${{ secrets.ALIYUN_REGISTRY_USERNAME }}
          password: ${{ secrets.ALIYUN_REGISTRY_PASSWORD }}

      - name: Build and Push Image
        run: |
          VERSION=$(date +%Y%m%d)-$(git rev-list --count HEAD)
          docker buildx build --platform linux/amd64 \
            -t shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:${VERSION} \
            -t shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:latest \
            . --push

      - name: Deploy to Server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /root/diglife_docker/test
            docker pull shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:latest
            docker-compose up -d --force-recreate

      - name: Health Check
        run: |
          sleep 10
          curl -f http://39.96.146.47:8007/ || exit 1
```

### 4. 监控和告警

#### 添加 Prometheus 监控

```python
# 在 FastAPI 应用中添加监控端点
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# 启用 Prometheus 监控
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

#### Grafana 仪表板

- 容器 CPU/内存使用率
- 请求响应时间
- 错误率
- Qdrant 连接状态
- Redis 连接状态

### 5. 测试集成

#### 部署前运行测试

```bash
# 添加到 deploy.sh 中
run_tests() {
    log_info "运行测试套件..."
    uv run pytest tests/ --cov=src --cov-report=term-missing

    if [ $? -ne 0 ]; then
        log_error "测试失败，部署已取消"
        exit 1
    fi
    log_info "测试通过!"
}
```

### 6. 环境变量管理

#### 使用 Secrets Manager

```python
# 从环境变量或 Secrets Manager 读取配置
import os
from config import load_config

config = {
    "ARK_API_KEY": os.environ.get("ARK_API_KEY"),
    "database_url": load_from_secrets_manager("digital-life-db-url"),
    # ...
}
```

## 🚀 使用示例

### 基本部署

```bash
./deploy.sh
```

**输出示例：**
```
[INFO] =========================================
[INFO] 开始部署流程
[INFO] 版本: 20260227-41
[INFO] 目标: root@39.96.146.47:/root/diglife_docker/test
[INFO] =========================================

[INFO] 执行部署前检查...
[INFO] 检查服务器连接...
[INFO] 服务器连接正常

[INFO] 开始构建 Docker 镜像...
[INFO] 版本: 20260227-41
#16 pushing manifest for shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:latest
[INFO] 镜像构建和推送完成: shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:20260227-41

[INFO] 开始部署到测试环境...
[INFO] 备份当前运行镜像...
[INFO] 重启容器...
[INFO] 部署完成

[INFO] 执行健康检查...
[INFO] 健康检查通过!

[INFO] =========================================
[INFO] 🎉 部署成功!
[INFO] 版本: 20260227-41
[INFO] 访问地址: http://39.96.146.47:8007
[INFO] =========================================

[INFO] 查看最近的应用日志...
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:80

是否清理旧镜像? (y/n): y
[INFO] 清理旧镜像...
[INFO] 清理完成
```

## 📚 参考资料

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [FastAPI 部署最佳实践](https://fastapi.tiangolo.com/deployment/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Prometheus 监控](https://prometheus.io/docs/)
