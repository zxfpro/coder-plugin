#!/bin/bash

set -e

# 配置
SERVER_USER="root"
SERVER_HOST="39.96.146.47"
SERVER_DIR="/root/diglife_docker/test"
REGISTRY="shikongai-registry.cn-beijing.cr.aliyuncs.com/shikongai/mindecho_ai"
TEST_PORT="8007"
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
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查服务器连接
check_server_connection() {
    log_info "检查服务器连接..."
    if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} exit 2>/dev/null; then
        log_error "无法连接到服务器 ${SERVER_HOST}"
        exit 1
    fi
    log_info "服务器连接正常"
}

# 显示当前运行的版本
show_current() {
    log_info "当前运行的版本:"
    ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --format '{{.Image}}' | grep mindecho || echo '无运行中的容器'"
}

# 显示版本历史
show_history() {
    log_info "可用的镜像版本（按时间倒序）:"
    ssh ${SERVER_USER}@${SERVER_HOST} "docker images ${REGISTRY} --format '{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}' | grep -E '[0-9]{8}' | sort -k2 -r"
}

# 获取所有版本号（按时间倒序）
get_all_versions() {
    ssh ${SERVER_USER}@${SERVER_HOST} "docker images ${REGISTRY} --format '{{.Tag}}' | grep -E '[0-9]{8}' | sort -r"
}

# 获取当前运行的版本号
get_currentversion() {
    ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --format '{{.Image}}' | grep mindecho | sed 's|.*:||'"
}

# 回滚到指定版本
rollback_to_version() {
    local tag=$1

    log_info "回滚到版本: ${tag}"

    # 验证镜像存在
    if ! ssh ${SERVER_USER}@${SERVER_HOST} "docker inspect ${REGISTRY}:${tag} >/dev/null 2>&1"; then
        log_error "镜像 ${REGISTRY}:${tag} 不存在"
        return 1
    fi

    # 停止当前容器
    log_info "停止当前容器..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose down"

    # 使用环境变量启动容器
    log_info "使用 IMAGE_TAG 环境变量启动版本 ${tag}..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && IMAGE_TAG=${REGISTRY}:${tag} docker-compose up -d"

    log_success "回滚完成，已切换到版本: ${tag}"
}

# 快速回滚到上一版本
rollback_to_previous() {
    log_info "执行快速回滚到上一版本..."

    # 获取当前运行的版本
    local current_version=$(get_currentversion)

    # 获取上一版本（排除当前运行的版本）
    local prev_version=$(ssh ${SERVER_USER}@${SERVER_HOST} "docker images ${REGISTRY} --format '{{.Tag}}' | grep -E '[0-9]{8}' | sort -r | grep -v '^${current_version}$' | head -1")

    if [ -z "$prev_version" ]; then
        log_error "没有可回滚的版本"
        return 1
    fi

    log_info "快速回滚到版本: ${prev_version}"
    rollback_to_version "$prev_version"
}

# 健康检查
health_check() {
    local max_retries=5
    local retry_count=0
    local wait_time=10

    log_info "执行健康检查..."

    while [ $retry_count -lt $max_retries ]; do
        if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/" | grep -q '200'; then
            log_success "健康检查通过!"
            return 0
        fi

        retry_count=$((retry_count + 1))
        log_warn "健康检查失败，等待 ${wait_time} 秒后重试 (${retry_count}/${max_retries})..."
        sleep $wait_time
    done

    log_error "健康检查失败，请检查应用日志"
    return 1
}

# 查看应用日志
show_logs() {
    log_info "查看应用日志:"
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs --tail 30 test 2>&1 | grep -v 'WARNING: Invalid HTTP' || true"
}

# 显示当前状态
show_current_status() {
    echo ""
    log_info "当前运行状态:"
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | grep -E 'NAMES|test|qdrant'"
    echo ""
}

# 主菜单
main() {
    log_info "========================================="
    log_info " MindEcho AI 测试环境回滚工具"
    log_info "========================================="
    echo ""
    echo "⚠️  注意：此工具仅用于测试环境回滚"
    echo ""

    check_server_connection
    show_current_status

    # 获取当前运行的版本
    local current_version=$(get_currentversion)
    log_info "当前版本: ${current_version}"
    echo ""

    # 检查是否使用 --prev 参数快速回滚
    if [ "$1" = "--prev" ]; then
        log_info "使用 --prev 参数执行快速回滚..."
        echo ""

        if [ "$SKIP_CONFIRM" = false ]; then
            read -p "确认回滚到上一版本? (y/n): " -n 1 -r
            echo ""

            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "回滚已取消"
                return 0
            fi
        else
            log_warn "跳过确认，继续回滚"
        fi

        if rollback_to_previous; then
            if health_check; then
                echo ""
                log_info "========================================="
                log_success "快速回滚成功完成!"
                log_info "访问地址: http://${SERVER_HOST}:${TEST_PORT}"
                log_info "========================================="
                echo ""
                show_logs
            else
                log_error "回滚后健康检查失败，请手动检查服务状态"
                show_logs
            fi
        else
            log_error "快速回滚失败"
        fi
        return 0
    fi

    # 显示可用版本
    local versions=$(get_all_versions)
    local count=0

    if [ -z "$versions" ]; then
        log_error "没有找到可回滚的历史版本"
        exit 1
    fi

    log_info "可回滚的历史版本："
    echo ""
    echo -e "${BLUE}#${NC}  版本号"
    echo "---------------------------------------------"

    echo "$versions" | while read -r tag; do
        count=$((count + 1))
        if [ "$tag" != "$current_version" ]; then
            echo -e "${BLUE}$count${NC})  $tag"
        else
            echo -e "${GREEN}*${NC})  $tag (当前)"
        fi
    done

    echo ""
    echo "请选择要回滚到的版本（输入编号），或输入 'q' 退出:"
    echo ""

    # 获取用户输入
    read -p "请输入选项: " choice

    # 退出检查
    if [ "$choice" = "q" ] || [ "$choice" = "Q" ]; then
        log_info "退出回滚工具"
        exit 0
    fi

    # 验证输入是否为数字
    if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
        log_error "无效的选项，请输入数字或 'q' 退出"
        exit 1
    fi

    # 获取选择的具体版本
    local selected_version=$(echo "$versions" | sed -n "${choice}p")

    if [ -z "$selected_version" ]; then
        log_error "无效的选项编号: ${choice}"
        exit 1
    fi

    # 检查是否选择的是当前版本
    if [ "$selected_version" = "$current_version" ]; then
        log_warn "选择的版本 ${selected_version} 就是当前运行的版本，无需回滚"
        exit 0
    fi

    echo ""
    log_warn "您即将回滚到版本: ${selected_version}"
    echo ""

    if [ "$SKIP_CONFIRM" = false ]; then
        read -p "确认回滚? (y/n): " -n 1 -r
        echo ""

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "回滚已取消"
            exit 0
        fi
    else
        log_warn "跳过确认，继续回滚"
    fi

    if rollback_to_version "$selected_version"; then
        if health_check; then
            echo ""
            log_info "========================================="
            log_success "回滚成功完成!"
            log_info "新版本: ${selected_version}"
            log_info "访问地址: http://${SERVER_HOST}:${TEST_PORT}"
            log_info "========================================="
            echo ""

            # 显示日志
            show_logs
        else
            log_error "回滚后健康检查失败，请手动检查服务状态"
            show_logs
        fi
    else
        log_error "回滚失败"
    fi
}

# 执行主程序
main "$@"
