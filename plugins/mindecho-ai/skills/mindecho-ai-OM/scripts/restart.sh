#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 重启测试服务
restart_test_service() {
    log_info "重启测试环境服务..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose restart ${TEST_CONTAINER}"
    log_success "服务重启完成"
}

# 重启 Qdrant 服务
restart_qdrant_service() {
    log_info "重启 Qdrant 服务..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose restart ${QDRANT_TEST_CONTAINER}"
    log_success "Qdrant 服务重启完成"
}

# 重启所有服务
restart_all_services() {
    log_info "重启所有服务..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose restart"
    log_success "所有服务重启完成"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose down"
    log_success "服务已停止"
}

# 启动服务
start_services() {
    log_info "启动所有服务..."
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && docker-compose up -d"
    log_success "服务已启动"
}

# 执行健康检查
do_health_check() {
    log_info "执行健康检查..."

    if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/" | grep -q '200'; then
        log_success "健康检查通过!"
        return 0
    else
        log_error "健康检查失败"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo ""
    log_info "使用方法:"
    echo ""
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -a, --all      重启所有服务（默认）"
    echo "  -t, --test     只重启测试服务"
    echo "  -q, --qdrant   只重启 Qdrant 服务"
    echo "  -s, --stop     停止所有服务"
    echo "  -S, --start    启动所有服务"
    echo "  -h, --help     显示帮助信息"
    echo ""
}

# 主函数
main() {
    local action="restart_all"

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                action="restart_all"
                shift
                ;;
            -t|--test)
                action="restart_test"
                shift
                ;;
            -q|--qdrant)
                action="restart_qdrant"
                shift
                ;;
            -s|--stop)
                action="stop"
                shift
                ;;
            -S|--start)
                action="start"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    log_info "========================================="
    log_info " MindEcho AI 服务重启"
    log_info "========================================="
    echo ""

    # 执行对应操作
    case $action in
        restart_all)
            restart_all_services
            do_health_check
            ;;
        restart_test)
            restart_test_service
            do_health_check
            ;;
        restart_qdrant)
            restart_qdrant_service
            ;;
        stop)
            stop_services
            ;;
        start)
            start_services
            do_health_check
            ;;
    esac

    echo ""
    log_info "========================================="
    log_success "操作完成"
    log_info "========================================="
}

main "$@"
