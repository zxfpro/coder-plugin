#!/bin/bash
# scripts/sync.sh

echo "正在同步积分模块..."

# 检查目标目录
if [ ! -d "$1" ]; then
    echo "错误：目标目录不存在"
    exit 1
fi

DEST_DIR="$1"
MODULE_NAME="points-module"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# 生成唯一模块名
if [ -d "$DEST_DIR/$MODULE_NAME" ]; then
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    MODULE_NAME="points-module-$TIMESTAMP"
    echo "提示：积分模块已存在，使用新名称：$MODULE_NAME"
fi

# 复制文件
mkdir -p "$DEST_DIR/$MODULE_NAME"
cp -r "$SKILL_DIR/assets/frontend/" "$DEST_DIR/$MODULE_NAME/frontend/"
cp -r "$SKILL_DIR/assets/backend/" "$DEST_DIR/$MODULE_NAME/backend/"
cp -r "$SKILL_DIR/scripts/" "$DEST_DIR/$MODULE_NAME/"

# 更新配置
sed -i '' "s/points-module_/${MODULE_NAME}_/g" "$DEST_DIR/$MODULE_NAME/backend/server/models.py"
sed -i '' "s/points-module_/${MODULE_NAME}_/g" "$DEST_DIR/$MODULE_NAME/backend/server/config.py"

# 安装依赖
if [ -f "$DEST_DIR/package.json" ]; then
    cd "$DEST_DIR" && npm install
fi

echo "积分模块同步完成！"
echo "模块位置：$DEST_DIR/$MODULE_NAME"