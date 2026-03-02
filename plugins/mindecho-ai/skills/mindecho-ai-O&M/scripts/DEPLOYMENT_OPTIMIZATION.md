# 部署方案优化说明

## 概述

本次优化旨在改进版本标签策略，简化回滚流程，并提高版本可追溯性。

## 主要变更

### 1. 版本标签策略变更

**之前：**
- 构建 `latest` 标签（移动标签）
- 构建版本号标签（如 20260227-42）
- 问题：`latest` 语义不明确，不清楚具体对应哪个版本

**现在：**
- 只构建版本号标签（如 20260227-42）
- 每个版本独立，语义明确
- 避免混淆"最新"和"当前"的概念

### 2. Docker Compose 配置优化

**docker-compose.yml** 现在使用环境变量：
```yaml
services:
  test:
    image: ${IMAGE_TAG:-shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:latest}
```

**使用方式：**
```bash
# 部署新版本
IMAGE_TAG=shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:20260227-43 docker-compose up -d

# 回滚到上一个版本
IMAGE_TAG=shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:20260227-42 docker-compose up -d
```

### 3. 部署脚本（deploy.sh）优化

**关键改进：**
- 移除 `latest` 标签构建，只打版本号标签
- 使用 `IMAGE_TAG` 环境变量部署
- 简化回滚提示，指向独立的 `rollback.sh` 脚本

**部署流程：**
```bash
./deploy.sh
```

脚本自动执行：
1. 构建镜像（只打版本号标签）
2. 推送到镜像仓库
3. 使用 `IMAGE_TAG` 环境变量部署
4. 健康检查
5. 可选清理旧镜像

### 4. 回滚脚本（rollback.sh）优化

**新增功能：**

#### 交互式选择版本
```bash
./rollback.sh
```
显示所有可用版本，用户选择后回滚

#### 快速回滚到上一版本
```bash
./rollback.sh --prev
```
自动回滚到上一个版本（按时间倒序）

**关键改进：**
- 使用 `IMAGE_TAG` 环境变量启动容器
- 清晰显示当前版本和可回滚版本
- 支持版本号回滚（不再依赖 latest 标签）
- 自动排除当前运行的版本

## 使用示例

### 部署新版本

```bash
# 1. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 2. 运行部署脚本
./.claude/skills/mindecho-ai-deployment/scripts/deploy.sh
```

脚本会：
- 自动生成版本号（如 20260227-43）
- 构建并推送镜像
- 使用 `IMAGE_TAG` 部署到服务器
- 执行健康检查

### 回滚到指定版本

```bash
# 交互式选择版本回滚
./.claude/skills/mindecho-ai-deployment/scripts/rollback.sh

# 快速回滚到上一版本
./.claude/skills/mindecho-ai-deployment/scripts/rollback.sh --prev
```

### 手动指定版本部署

```bash
# 在服务器上执行
cd /root/diglife_docker/test
IMAGE_TAG=shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:20260227-42 docker-compose up -d
```

## 服务器端配置

### 更新 docker-compose.yml

确保服务器上的 `docker-compose.yml` 使用环境变量：
```yaml
services:
  test:
    image: ${IMAGE_TAG:-shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:latest}
```

### 创建 .env 文件（可选）

```bash
# 在服务器上创建
cd /root/diglife_docker/test
cat > .env << 'EOF'
IMAGE_TAG=shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai:20260227-42
EOF
```

然后可以直接运行：
```bash
docker-compose --env-file .env up -d
```

## 验证步骤

### 验证部署

```bash
# 1. 检查镜像标签
docker images | grep 20260227-43

# 2. 检查服务健康
curl http://39.96.146.47:8007/

# 3. 查看运行中的容器镜像
ssh root@39.96.146.47 "docker ps --format '{{.Image}}' | grep mindecho"
```

### 验证回滚

```bash
# 1. 回滚到指定版本
./.claude/skills/mindecho-ai-deployment/scripts/rollback.sh

# 2. 验证镜像切换
ssh root@39.96.146.47 "docker ps --format '{{.Image}}' | grep mindecho"

# 3. 验证服务健康
curl http://39.96.146.47:8007/
```

## 优势总结

1. **版本可追溯性**：每个版本独立，清楚知道运行的是哪个版本
2. **回滚简化**：直接指定版本号，无需手动标记镜像
3. **语义明确**：不再有"最新"和"当前"的混淆
4. **灵活部署**：通过环境变量灵活切换版本
5. **自动化程度高**：部署和回滚流程完全自动化

## 注意事项

⚠️ **服务器端需要更新**
- 必须更新 `docker-compose.yml` 以使用 `IMAGE_TAG` 环境变量
- 建议创建 `.env` 文件便于管理

⚠️ **兼容性**
- 老 `latest` 标签镜像仍然存在，但不再使用
- 可以逐步迁移，不需要立即清理

⚠️ **镜像管理**
- 定期清理旧镜像，避免占用过多空间
- 保留最近 3-5 个版本即可

## 文件变更清单

### 修改的文件
- `docker-compose.yml` - 使用 `IMAGE_TAG` 环境变量
- `.claude/skills/mindecho-ai-deployment/scripts/deploy.sh` - 优化部署流程
- `.claude/skills/mindecho-ai-deployment/scripts/rollback.sh` - 重写回滚脚本

### 新增的文件
- `.claude/skills/mindecho-ai-deployment/scripts/.env.template` - 环境变量模板
- `.claude/skills/mindecho-ai-deployment/scripts/DEPLOYMENT_OPTIMIZATION.md` - 本文档

## 后续优化方向

### 短期
- 集成自动化测试到部署流程
- 添加部署前代码检查（lint, test）
- 完善日志聚合和错误报告

### 中期
- GitHub Actions CI/CD 流水线
- 金丝雀发布策略
- 自动化测试报告

### 长期
- Kubernetes 容器编排
- 多环境管理（dev, staging, prod）
- Service Mesh 治理
