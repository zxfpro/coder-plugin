#!/bin/bash
# Version1.1
set -e # 如果任何命令失败，立即退出脚本


echo "============================================="
echo " 开始执行 Python 包仓库初始化脚本"
echo "==========V2.0.0=========="
echo "============================================="


#!/bin/bash

# 获取脚本所在的绝对路径
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
echo "脚本所在目录: $SCRIPT_DIR"

# 定义允许的参数值
ALLOWED_ARGS=("tools" "project")

# 检查是否传入了参数
if [ -z "$1" ]; then
    echo "错误: 必须提供一个参数。" >&2
    echo "用法: $0 <参数>" >&2
    echo "可用参数: ${ALLOWED_ARGS[*]}" >&2 # 打印所有允许的值
    exit 1
fi

# 获取第一个参数
INPUT_ARG="$1"

# 验证 INPUT_ARG 是否在允许的列表中
IS_VALID_ARG=false
for arg in "${ALLOWED_ARGS[@]}"; do
    if [ "$INPUT_ARG" == "$arg" ]; then
        IS_VALID_ARG=true
        break
    fi
done

if [ "$IS_VALID_ARG" == "false" ]; then
    echo "错误: 无效的参数 '$INPUT_ARG'。" >&2
    echo "可用参数: ${ALLOWED_ARGS[*]}" >&2
    echo "用法: $0 <参数>" >&2
    exit 1
fi

GITEE_USER="zhaoxuefeng199508"


echo "定义基础路径"
BASE_PROJECT_DIR="$HOME/GitHub"
echo "项目将在目录 '$BASE_PROJECT_DIR/' 下创建。"
CHECK_SCRIPT="/usr/local/bin/check_pypi_name.py" # 指定检测pypi name的py路径

# 使用绝对路径引用模板目录
Template_Path="$SCRIPT_DIR/../template"

Tools_Template_Path="$Template_Path/tools"
Project_Template_Path="$Template_Path/project"

# 验证模板目录是否存在
if [ ! -d "$Template_Path" ]; then
    echo "错误: 找不到模板目录 '$Template_Path'"
    exit 1
fi
if [ ! -d "$Tools_Template_Path" ]; then
    echo "错误: 找不到 tools 模板目录 '$Tools_Template_Path'"
    exit 1
fi
if [ ! -d "$Project_Template_Path" ]; then
    echo "错误: 找不到 project 模板目录 '$Project_Template_Path'"
    exit 1
fi
echo "模板目录验证通过"


if [ "$INPUT_ARG" == "tools" ]; then

    # 步骤 0: 起名 查看pypi 是否重名 (自动化检查 + 手动确认)
    echo "步骤 0: 起名并检查 PyPI 是否重名"

    if [ ! -f "$CHECK_SCRIPT" ]; then
        echo "错误: 找不到 PyPI 名称检查脚本 '$CHECK_SCRIPT'。"
        echo "请确保脚本存在或更新 CHECK_SCRIPT 变量指向正确的路径。"
        exit 1
    fi

    while true; do
        read -p "请输入您希望在 PyPI 上注册的包名称同项目名 (例如: my-awesome-package): " PYPI_PACKAGE_NAME
        if [ -z "$PYPI_PACKAGE_NAME" ]; then
            echo "包名称不能为空，请重新输入。"
            continue
        fi
        echo "正在检查包名 '$PYPI_PACKAGE_NAME' 在 PyPI 上是否可用..."
        if ~/miniconda3/bin/python "$CHECK_SCRIPT" "$PYPI_PACKAGE_NAME"; then
            echo "包名 '$PYPI_PACKAGE_NAME' 可用。"
            break 
        else
            echo "包名 '$PYPI_PACKAGE_NAME' 不可用或检查失败，请尝试另一个包名。"
        fi
    done

elif [ "$INPUT_ARG" == "project" ]; then

    while true; do
        read -p "请输入您希望项目名: " PYPI_PACKAGE_NAME
        if [ -z "$PYPI_PACKAGE_NAME" ]; then
            echo "项目名不能为空，请重新输入。"
            continue
        else
            echo "项目名 '$PYPI_PACKAGE_NAME' 可用。"
            break 
        fi
    done

fi


# 派生出 Python 模块名 (通常是将连字符替换为下划线)
MODULE_NAME=$(echo "$PYPI_PACKAGE_NAME" | sed 's/-/_/g')
echo "确认包名 '$PYPI_PACKAGE_NAME' 可用，派生的内部 Python 模块名称为: '$MODULE_NAME'"

# 确定最终的项目目录路径
PROJECT_DIR="$BASE_PROJECT_DIR/$PYPI_PACKAGE_NAME"



echo "开始正式运行 "
read -p "请在完成后按 Enter 继续..."

# Step 2: 创建仓库 (本地目录创建)
echo "步骤 2: 创建项目目录并进入"
# 确保基础目录存在
mkdir -p "$BASE_PROJECT_DIR" || { echo "错误: 无法创建基础目录 '$BASE_PROJECT_DIR'"; exit 1; }

if [ -d "$PROJECT_DIR" ]; then
    echo "警告: 目录 '$PROJECT_DIR' 已存在。将直接进入该目录。"
    cd "$PROJECT_DIR" || { echo "错误: 无法进入目录 '$PROJECT_DIR'"; exit 1; }
else
    mkdir -p "$PROJECT_DIR" || { echo "错误: 无法创建目录 '$PROJECT_DIR'"; exit 1; }
    cd "$PROJECT_DIR" || { echo "错误: 无法进入目录 '$PROJECT_DIR'"; exit 1; }
    echo "已创建目录 '$PROJECT_DIR' 并进入"
fi




# Step 3: 克隆 git
echo "步骤 3: 初始化本地 Git 仓库"
if [ -d .git ]; then
  echo "Git 仓库已存在，跳过 git init 和远程仓库添加。"
else
  git init || { echo "错误: git init 失败"; exit 1; }

  # 使用环境变量获取 GitHub PAT，更加安全
  if [ -z "$GITEE_PAT" ]; then
      echo "错误: 未设置 GITEE_PAT 环境变量。无法自动创建 GITEE_PAT 远程仓库。"
      echo "请手动创建远程仓库并关联，例如: git remote add origin <your_gitee_remote_repo_url>"
      # 如果没有 PAT，不退出，继续后续步骤，但用户需要手动关联远程仓库
  else
      echo "尝试使用 GITEE_PAT 环境变量自动创建 GitHub 远程仓库..."
      # 使用 PYPI_PACKAGE_NAME 作为远程仓库名称
      GITEE_REPO_NAME="$PYPI_PACKAGE_NAME"
      # 获取当前 GitHub 用户名
      # 检查 jq 是否安装
      if ! command -v jq &> /dev/null; then
           echo "警告: 未安装 jq 命令，无法解析 Gitee API 响应。请手动检查远程仓库是否创建成功并关联。"
           echo "请手动提供您的 Gitee 用户名，例如: export GITEE_USER='your_username'"
           # 继续尝试创建，但不解析响应
           curl -s -o /dev/null -w "%{http_code}" -X POST "https://gitee.com/api/v5/user/repos?access_token=$GITEE_PAT&name=$GITEE_REPO_NAME&private=true"
           # 注意：这里无法检查 HTTP 状态码

      else
          if [ -z "$GITEE_USER" ] || [ "$GITEE_USER" == "null" ]; then
              echo "错误: 无法获取 Gitee 用户名，请检查 GITEE_PAT 是否有效或具有读取用户信息的权限。"
              echo "API 响应: $GITEE_USER_INFO"
              echo "请手动创建远程仓库并关联，例如: git remote add origin <your_remote_repo_url>"
          else
              # 创建远程仓库
              echo "正在创建 Gitee 远程仓库 '$GITEE_REPO_NAME' under user '$GITEE_USER' (私有)..."
              # Gitee 创建仓库的 API 是 POST /user/repos
              # 参数：access_token, name, private (boolean)
              # 注意：Gitee API 默认创建私有仓库？或者需要明确设置 private=true
              RESPONSE=$(curl -s -X POST "https://gitee.com/api/v5/user/repos?access_token=$GITEE_PAT&name=$GITEE_REPO_NAME&private=true")
              
              
              HTTP_STATUS=$(echo "$RESPONSE" | jq -r '.message')

              if [ "$ERROR_MESSAGE" != "null" ] && [ ! -z "$ERROR_MESSAGE" ]; then
                  echo "警告: Gitee 远程仓库 '$GITEE_REPO_NAME' 可能已存在或创建失败。错误信息: $ERROR_MESSAGE"
                  git remote add origin "https://gitee.com/$GITEE_USER/$GITEE_REPO_NAME.git" 2>/dev/null || echo "警告: 无法关联远程仓库 https://gitee.com/$GITEE_USER/$GITEE_REPO_NAME.git，可能不存在或已关联。"
                  
              
              elif echo "$RESPONSE" | jq -r '.html_url' | grep -q "gitee.com"; then
                   REMOTE_URL="https://gitee.com/$GITEE_USER/$GITEE_REPO_NAME.git"
                   git remote add origin "$REMOTE_URL" || echo "警告: 无法关联远程仓库 $REMOTE_URL"
                   echo "Gitee 远程仓库 '$GITEE_REPO_NAME' (私有) 创建并关联成功。"
              else
                  echo "警告: Gitee 远程仓库创建未知错误或失败。请手动检查并关联远程仓库。"
                  echo "API 响应: $RESPONSE"
                  # 尝试关联可能的仓库
                  git remote add origin "https://gitee.com/$GITEE_USER/$GITEE_REPO_NAME.git" 2>/dev/null || echo "警告: 无法关联远程仓库 https://gitee.com/$GITEE_USER/$GITEE_REPO_NAME.git，可能不存在或已关联。"
              
              fi
          fi
      fi
  fi
fi


echo "步骤 4: 环境构建 uv"

echo "uv: 初始化 uv 环境 (创建 pyproject.toml)"
if [ -f pyproject.toml ]; then
  echo "pyproject.toml 已存在，跳过 uv init"
else
  # uv init 可以指定包名，但这主要是为了初始化 pyproject.toml 中的 [project] name
  # 最终的包名应该以 pyproject.toml 中的 [project] name 为准
  uv init . --python ~/miniconda3/bin/python --name "$PYPI_PACKAGE_NAME" || { echo "错误: uv init 失败"; exit 1; }
  echo "uv init . 完成，请检查并编辑 pyproject.toml 中的 [project] name 是否为 '$PYPI_PACKAGE_NAME'"
fi

echo "uv: 同步初始依赖 (安装 build backend 等)"
uv sync || { echo "错误: uv sync 失败"; exit 1; }
echo "uv sync 完成"


echo "步骤 5: 创建文件目录接口"
mkdir -p "src/$MODULE_NAME" || { echo "错误: 无法创建目录 src/$MODULE_NAME"; exit 1; }
mkdir -p "tests/resources/" || { echo "错误: 无法创建目录 tests"; exit 1; }
touch "tests/test_main.py" || true
mkdir build
mkdir notebook
mkdir .vscode/


# --- 构建和发布包 ---

echo "步骤 6: 安装基础环境"

ENV_PATH="$PROJECT_DIR/.venv" 
(
  source "$ENV_PATH/bin/activate" # 激活环境 B
  echo "正在为新环境 ('$ENV_PATH') 安装..."
  echo "安装 toml"
  uv add toml
  echo "安装pytest 测试相关需求包"
  uv add pytest anyio pytest-tornasync pytest-asyncio 
  echo "安装fastapi 相关包"
  uv add fastapi uvicorn colorlog dotenv
  echo "安装 对齐本包"
  uv pip install -e .
)
echo "已完成为环境安装。"


if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS 版 sed
    sed -i '' "s/site_name: My New Project/site_name: $PYPI_PACKAGE_NAME/" mkdocs.yml 2>/dev/null || { echo "警告: 自动修改 mkdocs.yml 的 site_name 失败，请手动修改。"; }
else
    # Linux 版 sed
    sed -i "s/site_name: My New Project/site_name: $PYPI_PACKAGE_NAME/" mkdocs.yml 2>/dev/null || { echo "警告: 自动修改 mkdocs.yml 的 site_name 失败，请手动修改。"; }
fi


echo "步骤 7: 写入文件模板, 安装特异文件"

PYPROJECT_TOML_CONFIG_ADD=$(cat <<EOF

[tool.setuptools.package-data]
$MODULE_NAME = [ "config.yaml",]

[tool.pytest.ini_options]
testpaths = [ "tests",]
pythonpath = [ "src",]
EOF
)

START_SH=$(cat <<EOF
uv run python -m $MODULE_NAME.server
EOF
)

START_DOCKER=$(cat <<EOF
CMD ["python", "-m", "$MODULE_NAME.server","80","--prod"]
EOF
)



if [ "$INPUT_ARG" == "error" ]; then
    echo "error"

elif [ "$INPUT_ARG" == "project" ]; then
    echo "正在执行project模式的逻辑..."
    echo "$PYPROJECT_TOML_CONFIG_ADD" >> pyproject.toml
    echo "$START_SH" >> start.sh

    rsync -a $Project_Template_Path/root/ ./

    # 替换模板变量
    if [ -f README.md ]; then
        echo "正在替换 README.md 中的模板变量..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" README.md
            sed -i '' "s/{{ MODULE_NAME }}/$MODULE_NAME/g" README.md
        else
            sed -i "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" README.md
            sed -i "s/{{ MODULE_NAME }}/$MODULE_NAME/g" README.md
        fi
    fi

    if [ -f CLAUDE.md ]; then
        echo "正在替换 CLAUDE.md 中的模板变量..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" CLAUDE.md
            sed -i '' "s/{{ MODULE_NAME }}/$MODULE_NAME/g" CLAUDE.md
        else
            sed -i "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" CLAUDE.md
            sed -i "s/{{ MODULE_NAME }}/$MODULE_NAME/g" CLAUDE.md
        fi
    fi

    rsync -a $Project_Template_Path/src/ src/$MODULE_NAME
    echo "$START_DOCKER" >> Dockerfile

elif [ "$INPUT_ARG" == "tools" ]; then
    echo "正在执行tools模式的逻辑..."

    echo "$PYPROJECT_TOML_CONFIG_ADD" >> pyproject.toml

    rsync -a $Tools_Template_Path/root/ ./
    rsync -a $Tools_Template_Path/src/ src/$MODULE_NAME

    # 替换模板变量
    if [ -f README.md ]; then
        echo "正在替换 README.md 中的模板变量..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" README.md
            sed -i '' "s/{{ MODULE_NAME }}/$MODULE_NAME/g" README.md
        else
            sed -i "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" README.md
            sed -i "s/{{ MODULE_NAME }}/$MODULE_NAME/g" README.md
        fi
    fi

    if [ -f CLAUDE.md ]; then
        echo "正在替换 CLAUDE.md 中的模板变量..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" CLAUDE.md
            sed -i '' "s/{{ MODULE_NAME }}/$MODULE_NAME/g" CLAUDE.md
        else
            sed -i "s/{{ PROJECT_NAME }}/$PYPI_PACKAGE_NAME/g" CLAUDE.md
            sed -i "s/{{ MODULE_NAME }}/$MODULE_NAME/g" CLAUDE.md
        fi
    fi

else
    # 理论上这里的代码不会被执行，因为上面已经做了参数验证
    echo "内部错误: 未知参数类型。" >&2
    exit 1
fi


echo "步骤 9: 构建 Python 包分发文件 (.whl, .tar.gz)"

# z_build "init"

echo "============================================="
echo " Python 包仓库初始化脚本执行完毕"
echo "项目创建在: '$PROJECT_DIR'"
echo "请根据提示完成手动配置和后续步骤 加入GitHub Desktop"
echo "============================================="

