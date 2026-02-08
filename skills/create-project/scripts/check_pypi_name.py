# Version1.1
import sys
import requests

def is_package_name_available(package_name):
    """
    检查 PyPI 上是否存在给定的包名。

    Args:
        package_name: 要检查的包名字符串。

    Returns:
        True 如果包名不存在 (可用)，False 如果包名已存在。
    """
    # PyPI JSON API 的 URL 结构
    url = f"https://pypi.org/pypi/{package_name}/json"
    try:
        response = requests.get(url, timeout = 20) # 设置一个超时，防止请求卡住
        if response.status_code == 200:
            # 状态码 200 表示包信息被成功检索，说明包已存在
            return False
        elif response.status_code == 404:
            # 状态码 404 表示未找到，说明包名可用
            return True
        else:
            # 其他状态码可能是网络问题或 PyPI 服务器问题
            print(f"警告: 检查包名 '{package_name}' 时收到非预期状态码 {response.status_code}.", file=sys.stderr)
            return None # 返回 None 表示检查状态未知

    except requests.exceptions.RequestException as e:
        print(f"错误: 检查包名 '{package_name}' 时发生网络错误: {e}", file=sys.stderr)
        return None # 返回 None 表示检查失败

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python check_pypi_name.py <package_name>")
        sys.exit(1)

    package_name_to_check = sys.argv[1]
    availability = is_package_name_available(package_name_to_check)

    if availability is True:
        print(f"'{package_name_to_check}' 包名在 PyPI 上可用。")
        sys.exit(0) # 成功，并退出码 0
    elif availability is False:
        print(f"错误: '{package_name_to_check}' 包名在 PyPI 上已被占用。", file=sys.stderr)
        sys.exit(1) # 失败，并退出码非 0
    else: # availability is None
        print(f"错误: 无法确定包名 '{package_name_to_check}' 是否可用。", file=sys.stderr)
        sys.exit(1) # 失败，并退出码非 0
