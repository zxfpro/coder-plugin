#!/bin/bash

# 前端安装脚本
echo "正在安装前端依赖..."
cd "$(dirname "$0")/../assets/frontend"

if [ -f "package.json" ]; then
  npm install
  echo "前端依赖安装完成！"
else
  echo "未找到 package.json 文件"
  echo "建议使用以下命令初始化项目："
  echo "npm init -y"
  echo "npm install react react-dom"
fi