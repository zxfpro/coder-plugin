#!/bin/bash

set -e  # 遇到错误立即退出

# 配置
SERVER_USER="root"
SERVER_HOST="39.96.146.47"
SERVER_DIR="/root/diglife_docker/test"
REGISTRY="shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai"
SKIP_CONFIRM=false

# 解析命令行参数
while getopts ":y" opt; do
  case $opt in
    y) SKIP_CONFIRM=true ;;
    \?) echo "Invalid option: -$OPTARG" >&2; exit 1 ;;
  esac
done
shift $((OPTIND-1))

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取版本信息
get_version() {
    GIT_COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    DATE_VERSION=$(date +%Y%m%d)
    echo "${DATE_VERSION}-${GIT_COMMIT_COUNT}"
}

# 构建镜像
build_image() {
    local version=$1
    log_info "开始构建 Docker 镜像..."
    log_info "版本: ${version}"

    # 只打版本号标签，不再打 latest 标签
    docker buildx build --platform linux/amd64 \
        -t ${REGISTRY}:${version} . --push

    log_info "镜像构建和推送完成: ${REGISTRY}:${version}"
}

# 部署前检查
pre_deploy_check() {
    log_info "执行部署前检查..."

    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warn "存在未提交的更改，建议先提交代码"
        if [ "$SKIP_CONFIRM" = false ]; then
            read -p "是否继续部署? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "部署已取消"
                exit 1
            fi
        else
            log_warn "跳过确认，继续部署"
        fi
    fi

    # 检查服务器连接
    log_info "检查服务器连接..."
    if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} exit 2>/dev/null; then
        log_error "无法连接到服务器 ${SERVER_HOST}"
        exit 1
    fi
    log_info "服务器连接正常"
}

# 部署镜像
deploy_image() {
    local version=$1
    log_info "开始部署到测试环境..."

    # 拉取新版本镜像
    log_info "拉取镜像 ${REGISTRY}:${version}..."
    ssh ${SERVER_USER}@${SERVER_HOST} "docker pull ${REGISTRY}:${version}"

    # 备份当前运行的版本
    log_info "备份当前运行版本..."
    local current_image=$(ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --format '{{.Image}}' | grep mindecho || echo 'none'")
    log_info "当前版本: ${current_image}"

    # 使用环境变量部署新版本
    log_info "使用 IMAGE_TAG 环境变量部署新版本..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && IMAGE_TAG=${REGISTRY}:${version} docker-compose up -d --force-recreate"

    log_info "部署完成，已切换到版本: ${version}"
}

# 健康检查
health_check() {
    local max_retries=5
    local retry_count=0
    local wait_time=10

    log_info "执行健康检查..."

    while [ $retry_count -lt $max_retries ]; do
        if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:8007/ | grep -q '200'"; then
            log_info "健康检查通过!"
            return 0
        fi

        retry_count=$((retry_count + 1))
        log_warn "健康检查失败，等待 ${wait_time} 秒后重试 (${retry_count}/${max_retries})..."
        sleep $wait_time
    done

    log_error "健康检查失败，已达到最大重试次数"
    return 1
}

# 查看部署日志
show_logs() {
    log_info "查看最近的应用日志..."
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs --tail 20 test"
}

# 回滚
rollback() {
    log_error "部署失败，建议使用 rollback.sh 脚本进行回滚"
    log_info "回滚脚本位置: .claude/skills/mindecho-ai-deployment/scripts/rollback.sh"
    log_info "快速回滚命令: .claude/skills/mindecho-ai-deployment/scripts/rollback.sh --prev"
}

# 清理旧镜像
cleanup_old_images() {
    log_info "清理旧镜像..."

    ssh ${SERVER_USER}@${SERVER_HOST} "docker images ${REGISTRY} --format '{{.ID}}' | tail -n +4 | xargs -r docker rmi 2>/dev/null || true"

    log_info "清理完成"
}

# 主流程
main() {
    local version=$(get_version)

    log_info "========================================="
    log_info "开始部署流程"
    log_info "版本: ${version}"
    log_info "目标: ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}"
    log_info "========================================="

    # 1. 部署前检查
    pre_deploy_check

    # 2. 构建镜像
    build_image "$version"

    # 3. 部署镜像
    deploy_image "$version"

    # 4. 健康检查
    if health_check; then
        log_info "========================================="
        log_info "🎉 部署成功!"
        log_info "版本: ${version}"
        log_info "访问地址: http://${SERVER_HOST}:8007"
        log_info "========================================="

        # 显示日志
        show_logs

        # 提示清理
        if [ "$SKIP_CONFIRM" = false ]; then
            read -p "是否清理旧镜像? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cleanup_old_images
            fi
        else
            log_info "跳过清理确认"
        fi
    else
        log_error "部署失败，执行回滚..."
        rollback
        exit 1
    fi
}

# 执行主流程
main
