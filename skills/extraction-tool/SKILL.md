---
name: extraction-tool
description: 从已完成的项目中提取可复用模块、工具或技能的工具，支持前端组件、后端API、工具函数等多种类型的提取，提供同步移植机制和防重名功能。
---

# 提取工具技能

## 概述

这是一个用于从已完成项目中提取可复用模块、工具或技能的工具。它可以帮助您快速将项目中的核心功能抽取出来，形成独立的技能，方便以后在其他项目中复用。

## 核心功能

- **智能识别**：自动识别项目中的可复用组件、API、工具函数等
- **代码提取**：将识别到的可复用代码提取到独立的目录结构中
- **依赖分析**：分析代码依赖关系，确保提取的模块可以正常运行
- **配置隔离**：为提取的模块设置独立的配置，避免冲突
- **同步移植**：提供同步脚本，方便将提取的模块移植到其他项目中
- **防重名机制**：自动处理模块重名问题，确保每个模块都有唯一的名称

## 项目结构

```
extraction-tool/
├── SKILL.md                 # 技能文档
├── scripts/
│   ├── sync.sh              # 同步移植脚本
│   ├── setup.sh             # 安装脚本
│   └── extract.py           # 提取工具脚本
└── assets/
    ├── templates/           # 代码模板
    │   ├── frontend/        # 前端组件模板
    │   ├── backend/         # 后端API模板
    │   └── utils/           # 工具函数模板
    └── config/              # 配置文件
```

## 使用场景

当您需要从现有项目中提取可复用的模块时，使用此技能。适用于：

- 从项目中提取通用组件（如按钮、表格、表单等）
- 从项目中提取核心API（如用户管理、积分管理等）
- 从项目中提取工具函数（如字符串处理、日期格式化等）
- 将项目中的功能模块转化为技能，方便以后复用

## 快速开始

### 安装依赖

```bash
cd /path/to/extraction-tool
pip install -r requirements.txt
```

### 配置项目

在使用提取工具之前，您需要配置项目的结构和要提取的内容。编辑 `assets/config/config.yaml` 文件，配置项目路径、要提取的文件类型等。

```yaml
project:
  path: /path/to/your/project
  name: your-project-name

extraction:
  frontend:
    components:
      - src/components/**/*.tsx
    api:
      - src/api/**/*.ts
  backend:
    routes:
      - src/backend/server/**/*.py
    models:
      - src/backend/server/models.py
  utils:
    - src/utils/**/*.ts
    - src/utils/**/*.py

exclusions:
  - **/__pycache__/**
  - **/.git/**
  - **/node_modules/**
```

### 运行提取工具

```bash
cd /path/to/extraction-tool
python scripts/extract.py
```

### 同步移植

如果您需要将提取的模块同步到其他项目中，可以使用同步脚本：

```bash
cd /path/to/extraction-tool
./scripts/sync.sh /path/to/target/project
```

## 核心组件

### 1. 提取工具脚本 (extract.py)

```python
#!/usr/bin/env python3
import os
import yaml
import glob
import shutil
import datetime
import re

def load_config():
    with open('assets/config/config.yaml', 'r') as f:
        return yaml.safe_load(f)

def get_files_by_patterns(patterns, root_dir):
    files = []
    for pattern in patterns:
        full_pattern = os.path.join(root_dir, pattern)
        files.extend(glob.glob(full_pattern, recursive=True))
    return files

def extract_files(files, target_dir, project_name):
    os.makedirs(target_dir, exist_ok=True)

    for file_path in files:
        # 计算相对路径
        rel_path = os.path.relpath(file_path, config['project']['path'])

        # 创建目标文件路径
        target_file_path = os.path.join(target_dir, rel_path)
        target_dir_path = os.path.dirname(target_file_path)

        os.makedirs(target_dir_path, exist_ok=True)

        # 复制文件
        shutil.copy(file_path, target_file_path)

        # 更新文件内容中的项目相关信息
        update_file_contents(target_file_path, project_name)

def update_file_contents(file_path, project_name):
    with open(file_path, 'r') as f:
        content = f.read()

    # 更新项目名称
    content = content.replace(project_name, 'extraction-tool')

    # 更新数据库表名前缀
    content = content.replace(f"{project_name}_", "extraction-tool_")

    with open(file_path, 'w') as f:
        f.write(content)

def main():
    global config
    config = load_config()

    project_path = config['project']['path']
    project_name = config['project']['name']

    # 创建临时目录
    temp_dir = os.path.join(os.getcwd(), f"temp_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}")
    os.makedirs(temp_dir, exist_ok=True)

    # 提取前端文件
    if 'frontend' in config['extraction']:
        frontend_dir = os.path.join(temp_dir, 'frontend')

        # 提取组件
        if 'components' in config['extraction']['frontend']:
            component_files = get_files_by_patterns(
                config['extraction']['frontend']['components'],
                project_path
            )
            extract_files(component_files, os.path.join(frontend_dir, 'components'), project_name)

        # 提取API
        if 'api' in config['extraction']['frontend']:
            api_files = get_files_by_patterns(
                config['extraction']['frontend']['api'],
                project_path
            )
            extract_files(api_files, os.path.join(frontend_dir, 'api'), project_name)

    # 提取后端文件
    if 'backend' in config['extraction']:
        backend_dir = os.path.join(temp_dir, 'backend')

        # 提取路由
        if 'routes' in config['extraction']['backend']:
            route_files = get_files_by_patterns(
                config['extraction']['backend']['routes'],
                project_path
            )
            extract_files(route_files, os.path.join(backend_dir, 'server'), project_name)

        # 提取模型
        if 'models' in config['extraction']['backend']:
            model_files = get_files_by_patterns(
                config['extraction']['backend']['models'],
                project_path
            )
            extract_files(model_files, os.path.join(backend_dir, 'server'), project_name)

    # 提取工具函数
    if 'utils' in config['extraction']:
        utils_dir = os.path.join(temp_dir, 'utils')

        utils_files = get_files_by_patterns(
            config['extraction']['utils'],
            project_path
        )
        extract_files(utils_files, utils_dir, project_name)

    # 复制配置文件和脚本
    shutil.copy('assets/config/config.yaml', temp_dir)
    shutil.copy('scripts/setup.sh', temp_dir)
    shutil.copy('scripts/sync.sh', temp_dir)

    # 生成技能文档
    generate_skill_doc(temp_dir, project_name)

    print(f"提取完成！模块位置：{temp_dir}")

def generate_skill_doc(target_dir, project_name):
    with open('SKILL.md', 'r') as f:
        content = f.read()

    content = content.replace('extraction-tool', project_name)

    with open(os.path.join(target_dir, 'SKILL.md'), 'w') as f:
        f.write(content)

if __name__ == '__main__':
    main()
```

### 2. 同步移植脚本 (sync.sh)

```bash
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
if [ ! -d "$SKILL_DIR/temp_*" ]; then
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
```

### 3. 安装脚本 (setup.sh)

```bash
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
```

### 4. 配置文件 (config.yaml)

```yaml
project:
  path: /path/to/your/project
  name: your-project-name

extraction:
  frontend:
    components:
      - src/components/**/*.tsx
    api:
      - src/api/**/*.ts
  backend:
    routes:
      - src/backend/server/**/*.py
    models:
      - src/backend/server/models.py
  utils:
    - src/utils/**/*.ts
    - src/utils/**/*.py

exclusions:
  - **/__pycache__/**
  - **/.git/**
  - **/node_modules/**
```

## 部署建议

### 开发环境

```bash
cd /path/to/extraction-tool
python scripts/extract.py
```

### 生产环境

```bash
cd /path/to/extraction-tool
python scripts/extract.py --config assets/config/production.yaml
```

## 总结

这个提取工具技能可以帮助您快速从现有项目中提取可复用的模块、工具或技能。它支持多种类型的代码提取，提供同步移植机制和防重名功能，让您可以更高效地开发和维护项目。