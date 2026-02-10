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