#!/bin/bash

echo "正在安装提取工具依赖..."

# 检查Python依赖
if command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    echo "错误：未找到pip命令"
    exit 1
fi

# 检查Node.js依赖
if command -v npm &> /dev/null; then
    npm install
else
    echo "警告：未找到npm命令，前端依赖将不会安装"
fi

echo "依赖安装完成！"