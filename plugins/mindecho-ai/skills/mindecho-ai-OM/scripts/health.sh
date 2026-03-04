#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 检查测试环境健康
check_test_health() {
    log_info "检查测试环境健康状态..."

    if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/" | grep -q '200'; then
        log_success "测试环境健康检查通过 ✅"
        echo ""

        # 显示响应时间
        local response_time=$(ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{time_total}' http://localhost:${TEST_PORT}/")
        log_info "响应时间: ${response_time}s"

        return 0
    else
        log_error "测试环境健康检查失败 ❌"
        return 1
    fi
}

# 检查 Qdrant 健康
check_qdrant_health() {
    log_info "检查 Qdrant 服务健康状态..."

    if ssh ${SERVER_USER}@${SERVER_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${QDRANT_TEST_PORT}/" | grep -q '200'; then
        log_success "Qdrant 服务健康检查通过 ✅"
        return 0
    else
        log_error "Qdrant 服务健康检查失败 ❌"
        return 1
    fi
}

# 检查数据库连接
check_database_health() {
    log_info "检查数据库连接..."

    if ssh ${SERVER_USER}@${SERVER_HOST} "docker exec ${TEST_CONTAINER} python -c 'import aiomysql; print(\"OK\")'" 2>/dev/null; then
        log_success "数据库连接检查通过 ✅"
        return 0
    else
        log_error "数据库连接检查失败 ❌"
        return 1
    fi
}

# 详细健康检查
detailed_health_check() {
    echo ""
    log_info "========================================="
    log_info "  详细健康检查"
    log_info "========================================="
    echo ""

    local all_passed=true

    # 检查测试环境
    if check_test_health; then
        :
    else
        all_passed=false
    fi

    echo ""

    # 检查 Qdrant
    if check_qdrant_health; then
        :
    else
        all_passed=false
    fi

    echo ""

    # 检查数据库
    if check_database_health; then
        :
    else
        all_passed=false
    fi

    echo ""
    log_info "========================================="

    if [ "$all_passed" = true ]; then
        log_success "所有健康检查通过 ✅"
    else
        log_error "部分健康检查失败 ❌"
        return 1
    fi

    log_info "========================================="
}

# 快速健康检查
quick_health_check() {
    if check_test_health; then
        return 0
    else
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
    echo "  -d, --detailed  详细健康检查（默认）"
    echo "  -q, --quick     快速健康检查"
    echo "  -h, --help     显示帮助信息"
    echo ""
}

# 主函数
main() {
    local mode="detailed"

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--detailed)
                mode="detailed"
                shift
                ;;
            -q|--quick)
                mode="quick"
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
    log_info " MindEcho AI 健康检查"
    log_info "========================================="
    echo ""

    # 执行对应操作
    case $mode in
        detailed)
            detailed_health_check
            ;;
        quick)
            quick_health_check
            ;;
    esac
}

main "$@"
