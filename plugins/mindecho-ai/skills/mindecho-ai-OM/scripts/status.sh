#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 检查服务器连接
check_server_connection() {
    log_info "检查服务器连接..."
    if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} exit 2>/dev/null; then
        log_error "无法连接到服务器 ${SERVER_HOST}"
        exit 1
    fi
    log_info "服务器连接正常"
}

# 显示测试环境状态
show_test_status() {
    echo ""
    log_info "========================================="
    log_info "  测试环境状态"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose ps"
    echo ""
}

# 显示容器详细信息
show_container_details() {
    echo ""
    log_info "========================================="
    log_info "  容器详细信息"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}' | grep -E 'NAMES|test|qdrant'"
    echo ""
}

# 显示资源使用情况
show_resource_usage() {
    echo ""
    log_info "========================================="
    log_info "  资源使用情况"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}' | grep -E 'NAME|test|qdrant'"
    echo ""
}

# 显示当前版本
show_current_version() {
    echo ""
    log_info "========================================="
    log_info "  当前运行版本"
    log_info "========================================="
    echo ""
    local current_version=$(ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --format '{{.Image}}' | grep mindecho || echo '未运行'")
    log_info "当前版本: ${current_version}"
    echo ""
}

# 显示所有镜像
show_all_images() {
    echo ""
    log_info "========================================="
    log_info "  可用镜像版本"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker images ${IMAGE_REPO} --format 'tabletable {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}'"
    echo ""
}

# 显示健康状态
show_health_status() {
    echo ""
    log_info "========================================="
    log_info "  健康状态"
    log_info "========================================="
    echo ""

    if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/" | grep -q '200'; then
        log_success "测试环境健康检查通过 ✅"
    else
        log_error "测试环境健康检查失败 ❌"
    fi

    echo ""

    # 检查 Qdrant
    if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${QDRANT_TEST_PORT}/" | grep -q '200'; then
        log_success "Qdrant 服务健康检查通过 ✅"
    else
        log_error "Qdrant 服务健康检查失败 ❌"
    fi
    echo ""
}

# 主菜单
main() {
    log_info "========================================="
    log_info " MindEcho AI 服务状态查看"
    log_info "========================================="
    echo ""

    check_server_connection

    # 显示所有信息
    show_current_version
    show_test_status
    show_container_details
    show_resource_usage
    show_health_status

    log_info "========================================="
    log_success "状态查看完成"
    log_info "========================================="
}

main
