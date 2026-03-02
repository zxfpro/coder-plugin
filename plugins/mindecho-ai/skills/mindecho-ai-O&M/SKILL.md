---
name: mindecho-ai-O&M
description: 为数字人生项目进行运维, 当用户需要对该项目进行服务器上的相关操作, 对测试环境进行管理时可用。
---

# MindEcho AI 部署技能

## 触发条件

当用户请求以下操作时自动触发此技能：
- 部署新版本到测试环境
- 回滚到之前的版本
- 查看测试环境状态
- 更新 Docker 镜像

## 技能功能

### 1. 自动化部署 (`deploy.sh`)

**功能特性：**
- ✅ 自动构建并推送 Docker 镜像
- ✅ 部署前检查（代码状态、服务器连接）
- ✅ 自动部署到测试环境
- ✅ 健康检查（自动验证服务）
- ✅ 失败时自动回滚
- ✅ 清理旧镜像
- ✅ 彩色日志输出

**使用方法：**
```bash
./deploy.sh
```

### 2. 环境回滚 (`rollback.sh`)

**功能特性：**
- ✅ 自动获取可用历史版本
- ✅ 交互式选择回滚目标
- ✅ 只操作测试环境（不涉及生产）
- ✅ 健康检查验证
- ✅ 显示部署日志

**使用方法：**
```bash
./rollback.sh
```

### 3. 优化建议 (`DEPLOYMENT_OPTIMIZATION.md`)

包含详细的优化方案和后续改进建议。

## 环境配置

**测试环境：**
- 服务器：39.96.146.47
- 路径：/root/diglife_docker/test
- 端口：8007
- 容器：test, qdrant_test

**镜像仓库：**
- 仓库：shikongai-registry.cn-beijing.cr.aliyuncs.com
- 项目：mindecho_ai

## 版本策略

**版本格式：** `YYYYMMDD-提交次数`
- 例如：`20260227-41`

**标签：**
- `latest` - 最新版本
- `YYYYMMDD-提交次数` - 具体版本号

## 部署流程

### 标准部署流程

1. **代码提交** - 确保所有更改已提交
2. **构建镜像** - `docker buildx build --platform linux/amd64`
3. **推送镜像** - 推送到阿里云仓库
4. **拉取镜像** - 服务器拉取最新镜像
5. **部署容器** - `docker-compose up -d --force-recreate`
6. **健康检查** - 验证 HTTP 200 响应

### 回滚流程

1. **查看历史版本** - 显示可用镜像列表
2. **选择版本** - 交互式选择目标版本
3. **停止容器** - `docker-compose down`
4. **标记镜像** - 将选中镜像标记为 latest
5. **启动容器** - `docker-compose up -d`
6. **健康检查** - 验证服务正常运行

## 优势

| 特性 | 手动部署 | 自动部署 |
|------|----------|----------|
| 步骤数 | 4+ | 1 |
| 健康检查 | 手动 | 自动 |
| 回滚时间 | 5-10分钟 | 1-2分钟 |
| 错误率 | 较高 | 大幅降低 |
| 回滚能力 | 需手动查找 | 自动选择 |

## 注意事项

⚠️ **安全限制：**
- 此技能仅用于测试环境部署
- 不允许操作生产环境（blue/green）
- 所有操作需要 SSH 密钥认证

⚠️ **回滚限制：**
- 只能回滚到服务器上存在的镜像
- 建议在业务验证失败时及时回滚
- 回滚不会删除旧镜像，便于多次回滚

## 后续改进

### 短期
- 集成测试套件到部署流程
- 添加性能监控
- 完善日志聚合

### 中期
- GitHub Actions CI/CD 流水线
- 金丝雀发布策略
- 自动化测试报告

### 长期
- Kubernetes 容器编排
- 多环境管理
- Service Mesh 治理

## 触发条件

当用户请求以下操作时自动触发此技能：
- 查看服务器服务状态
- 管理测试环境部署
- 分析服务日志和异常
- 执行蓝绿部署相关操作
- 检查服务健康状态

## 服务器连接信息

**生产服务器：**
- 地址：39.96.146.47
- 用户：root
- 认证方式：SSH 密钥认证
- 项目目录：/root/diglife_docker

## 架构概览

### 生产环境（蓝绿部署）

```
┌─────────────┐    ┌─────────┐    ┌─────────────┐
│   Nginx     │───▶│  Blue   │    │   Green     │
│   :8000     │    │  :8008  │    │  (内部)     │
└─────────────┘    └────┬────┘    └──────┬──────┘
                        │                │
                        └────────┬───────┘
                                 ▼
                        ┌─────────────────┐
                        │  Qdrant Prod   │
                        │      :4333     │
                        └─────────────────┘
```

### 测试环境

```
┌─────────────┐    ┌─────────────────┐
│    Test     │───▶│  Qdrant Test   │
│   :8007     │    │      :5333     │
└─────────────┘    └─────────────────┘
```

## 权限范围

### ✅ 可管理的环境

**测试环境** (`/root/diglife_docker/test/`)
- 容器：test (:8007), qdrant_test (:5333)
- 配置文件：docker-compose.yml
- 可执行：查看日志、重启服务、更新配置、镜像部署

### ❌ 不可直接管理的环境

**生产环境** (`/root/diglife_docker/product/`)
- 使用通过测试验证的镜像
- 蓝绿部署由其他流程控制
- 此技能仅提供监控和状态查看


## 常用运维命令

### 1. 查看服务状态

```bash
# 所有容器状态
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}'

# 资源使用情况
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}'

# 测试环境详情
cd /root/diglife_docker/test && docker-compose ps
```

### 2. 查看日志

```bash
# 测试容器最近日志
docker logs --tail 100 test

# 查看错误和警告
docker logs test 2>&1 | grep -iE 'error|exception|fail|warn'

# 实时日志
docker logs -f test
```

### 3. 重启测试服务

```bash
cd /root/diglife_docker/test
docker-compose restart test
```

### 4. 查看当前流量路由

```bash
cat /root/diglife_docker/product/nginx/nginx.conf | grep proxy_pass
```

### 5. 健康检查

```bash
# 测试环境
curl -s http://localhost:8007/ | head -20

# 生产环境
curl -s http://localhost:8000/ | head -20
```
