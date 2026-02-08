#!/bin/bash

echo "正在同步提取的模块..."

# 检查目标目录
if [ ! -d "$1" ]; then
    echo "错误：目标目录不存在"
    exit 1
fi

DEST_DIR="$1"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# 检查模块目录是否存在
if [ ! -d "$SKILL_DIR/temp_"* ]; then
    echo "错误：未找到提取的模块"
    exit 1
fi

# 获取最新的模块目录
MODULE_DIR=$(ls -td "$SKILL_DIR/temp_"* | head -1)
MODULE_NAME=$(basename "$MODULE_DIR")

# 创建目标目录
mkdir -p "$DEST_DIR/$MODULE_NAME"

# 复制文件
cp -r "$MODULE_DIR/"* "$DEST_DIR/$MODULE_NAME/"

# 安装依赖
if [ -f "$DEST_DIR/package.json" ]; then
    cd "$DEST_DIR" && npm install
fi

if [ -f "$DEST_DIR/requirements.txt" ]; then
    cd "$DEST_DIR" && pip install -r requirements.txt
fi

echo "模块同步完成！"
echo "模块位置：$DEST_DIR/$MODULE_NAME"