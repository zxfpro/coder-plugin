# server
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager, AsyncExitStack
import argparse
import uvicorn

from .db import init_db
from .auth.auth import fastapi_users, auth_backend, router as auth_router
from .auth.models import User
from .auth.auth import UserCreate
from .auth.admin import setup_admin

default = 8007


# Combine both lifespans
@asynccontextmanager
async def combined_lifespan(app: FastAPI):
    # Run both lifespans
    async with AsyncExitStack() as stack:
        init_db()

        yield

app = FastAPI(
    title="PS Plugin Backend",
    description="Provides an OpenAI-compatible API for custom large language models.",
    version="1.0.1",
    # debug=True,
    # docs_url="/api-docs",
    lifespan=combined_lifespan
)

origins = [
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specifies the allowed origins
    allow_credentials=True,  # Allows cookies/authorization headers
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers (Content-Type, Authorization, etc.)
)


# fastapi-users 路由
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["auth"],
)

# 自定义认证 / 忘记密码 路由
app.include_router(auth_router, prefix="/auth", tags=["auth"])



# SQLAdmin 后台
setup_admin(app)
# AI_Amend END


@app.get("/")
async def root():
    """server run"""
    return {"message": "Running"}



if __name__ == "__main__":
 
    parser = argparse.ArgumentParser(
        description="Start a simple HTTP server similar to http.server."
    )
    parser.add_argument(
        "port",
        metavar="PORT",
        type=int,
        nargs="?",  # 端口是可选的
        default=default,
        help=f"Specify alternate port [default: {default}]",
    )
    # 创建一个互斥组用于环境选择
    group = parser.add_mutually_exclusive_group()

    # 添加 --dev 选项
    group.add_argument(
        "--dev",
        action="store_true",  # 当存在 --dev 时，该值为 True
        help="Run in development mode (default).",
    )

    # 添加 --prod 选项
    group.add_argument(
        "--prod",
        action="store_true",  # 当存在 --prod 时，该值为 True
        help="Run in production mode.",
    )
    args = parser.parse_args()

    if args.prod:
        env = "prod"
    else:
        # 如果 --prod 不存在，默认就是 dev
        env = "dev"

    port = args.port

    if env == "dev":
        port += 100
        reload = True
        app_import_string = (
            f"{__package__}.__main__:app"  # <--- 关键修改：传递导入字符串
        )
    elif env == "prod":
        reload = False
        app_import_string = app
    else:
        reload = False
        app_import_string = app

    # 使用 uvicorn.run() 来启动服务器
    # 参数对应于命令行选项
    uvicorn.run(
        app_import_string, host="0.0.0.0", port=port, reload=reload  # 启用热重载
    )
