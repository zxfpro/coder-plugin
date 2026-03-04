#!/bin/bash

# MindEcho AI 运维配置文件
# 此文件定义了所有脚本共用的配置变量

# 服务器配置
export SERVER_USER="root"
export SERVER_HOST="39.96.146.47"

# 测试环境配置
export SERVER_DIR="/root/diglife_docker/test"
export TEST_PORT="8007"
export TEST_CONTAINER="test"
export QDRANT_TEST_CONTAINER="qdrant_test"
export QDRANT_TEST_PORT="5333"

# 生产环境配置（仅用于监控）
export PROD_DIR="/root/diglife_docker/product"
export PROD_PORT="8000"
export PROD_BLUE_PORT="8008"

# Docker 镜像配置
export REGISTRY="shikongai-registry.cn-beijing.cr.aliyuncs.com"
export PROJECT="mindecho_ai"
export IMAGE_REPO="${REGISTRY}/${PROJECT}"

# 健康检查配置
export HEALTH_CHECK_MAX_RETRIES=5
export HEALTH_CHECK_WAIT_TIME=10

# 日志配置
export LOG_LINES=100

# 颜色输出
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m'

# 日志函数
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
