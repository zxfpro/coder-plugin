#!/bin/bash

# 后端安装脚本
echo "正在安装后端依赖..."
cd "$(dirname "$0")/../assets/backend"

if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
  echo "后端依赖安装完成！"
elif [ -f "pyproject.toml" ]; then
  pip install uv
  uv pip install
  echo "后端依赖安装完成！"
else
  echo "未找到 requirements.txt 或 pyproject.toml 文件"
  echo "建议使用以下命令安装依赖："
  echo "pip install fastapi fastapi-users sqlmodel uvicorn"
fi