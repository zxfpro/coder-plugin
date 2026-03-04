#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 显示应用日志
show_app_logs() {
    echo ""
    log_info "========================================="
    log_info "  测试环境应用日志"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs --tail ${LOG_LINES} ${TEST_CONTAINER} 2>&1 | grep -v 'WARNING: Invalid HTTP' || true"
}

# 显示错误日志
show_error_logs() {
    echo ""
    log_info "========================================="
    log_info "  错误日志"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs ${TEST_CONTAINER} 2>&1 | grep -iE 'error|exception|fail' | tail ${LOG_LINES} || echo '未发现错误日志'"
}

# 显示 Qdrant 日志
show_qdrant_logs() {
    echo ""
    log_info "========================================="
    log_info "  Qdrant 服务日志"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs --tail ${LOG_LINES} ${QDRANT_TEST_CONTAINER} 2>&1 | tail ${LOG_LINES}" || true
}

# 实时查看日志
follow_logs() {
    echo ""
    log_info "========================================="
    log_info "  实时日志（按 Ctrl+C 退出）"
    log_info "========================================="
    echo ""
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs -f ${TEST_CONTAINER} 2>&1 | grep -v 'WARNING' || true"
}

# 显示帮助信息
show_help() {
    echo ""
    log_info "使用方法:"
    echo ""
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -a, --app      显示应用日志（默认）"
    echo "  -e, --error    只显示错误日志"
    echo "  -q, --qdrant   显示 Qdrant 服务日志"
    echo "  -f, --follow   实时查看日志"
    echo "  -h, --help     显示帮助信息"
    echo ""
}

# 主函数
main() {
    local mode="app"

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--app)
                mode="app"
                shift
                ;;
            -e|--error)
                mode="error"
                shift
                ;;
            -q|--qdrant)
                mode="qdrant"
                shift
                ;;
            -f|--follow)
                mode="follow"
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

    # 执行对应操作
    case $mode in
        app)
            show_app_logs
            ;;
        error)
            show_error_logs
            ;;
        qdrant)
            show_qdrant_logs
            ;;
        follow)
            follow_logs
            ;;
    esac
}

main "$@"
