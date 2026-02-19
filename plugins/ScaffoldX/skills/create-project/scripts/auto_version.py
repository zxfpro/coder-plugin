# Version1.1
# increment_version.py

import os
import re
import toml # 导入 toml 库

# pyproject.toml 文件路径，假设脚本在项目根目录
# PYPROJECT_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pyproject.toml')
PYPROJECT_FILE_PATH = 'pyproject.toml'
def increment_patch_version_in_pyproject():
    """
    读取 pyproject.toml，增加 [project].version 的补丁版本号，并写回文件。
    """
    try:
        # 读取 pyproject.toml 文件
        with open(PYPROJECT_FILE_PATH, 'r') as f:
            pyproject_data = toml.load(f)

        # 确保存在 [project] 和 version 字段
        if 'project' not in pyproject_data or 'version' not in pyproject_data['project']:
            print(f"Error: Could not find [project] or version in {PYPROJECT_FILE_PATH}")
            return False, "[project] or version not found in pyproject.toml"

        current_version = pyproject_data['project']['version']

        # 解析版本号字符串 (假设格式是 X.Y.Z)
        version_parts = current_version.split('.')
        if len(version_parts) != 3:
            print(f"Warning: Version format '{current_version}' is not X.Y.Z. Attempting simple increment.")
            # 如果不是标准三段式，尝试简单地作为字符串处理（可能不准确）
            try:
                # 尝试将最后一部分转换为数字并增加
                last_part = int(version_parts[-1])
                version_parts[-1] = str(last_part + 1)
                new_version = ".".join(version_parts)
            except ValueError:
                 print(f"Error: Could not parse or increment version part in '{current_version}'")
                 return False, f"Could not parse or increment version part in '{current_version}'"
        else:
            # 标准 X.Y.Z 格式，增加补丁版本 (Z)
            try:
                major = int(version_parts[0])
                minor = int(version_parts[1])
                patch = int(version_parts[2])
                new_patch = patch + 1
                new_version = f"{major}.{minor}.{new_patch}"
            except ValueError:
                 print(f"Error: Could not parse version parts as integers in '{current_version}'")
                 return False, f"Could not parse version parts as integers in '{current_version}'"


        # print(f"Current version: {current_version}")
        # print(f"New version: {new_version}")

        # 更新数据结构中的版本号
        pyproject_data['project']['version'] = new_version

        # 将更新后的数据写回 pyproject.toml 文件
        # 使用 toml.dump 确保格式正确
        with open(PYPROJECT_FILE_PATH, 'w') as f:
            toml.dump(pyproject_data, f)

        # print(f"Successfully updated version to {new_version} in {PYPROJECT_FILE_PATH}")
        return True, new_version

    except FileNotFoundError:
        print(f"Error: pyproject.toml file not found at {PYPROJECT_FILE_PATH}")
        return False, "pyproject.toml file not found"
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False, str(e)

if __name__ == "__main__":
    success, message = increment_patch_version_in_pyproject()
    if not success:
        print(f"Failed to increment version: {message}")
        exit(1)
    else:
        # 如果成功，message 是新版本号或成功提示
        print(f"New version:{message}")
        exit(0)