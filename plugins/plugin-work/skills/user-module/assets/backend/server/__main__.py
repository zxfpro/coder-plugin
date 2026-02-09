# server
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
from contextlib import asynccontextmanager, AsyncExitStack
from fastapi import FastAPI, Request
from fastapi.routing import APIRoute
import argparse
import uvicorn


from .db import init_db
from .auth import fastapi_users, auth_backend, router as auth_router
from .models import User


default = 8007

dotenv_path = find_dotenv()
load_dotenv(dotenv_path, override=True)


@asynccontextmanager
async def combined_lifespan(app: FastAPI):
    # Run both lifespans
    async with AsyncExitStack() as stack:
        init_db()
        yield

app = FastAPI(
    title="User Module Backend",
    description="Provides user authentication and management API.",
    version="1.0.0",
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

from .auth import UserCreate

app.include_router(
    fastapi_users.get_register_router(User, UserCreate),
    prefix="/auth",
    tags=["auth"],
)


@app.get("/")
async def root():
    """server run"""
    return {"message": "Running"}


@app.get("/api/list-routes/")
async def list_fastapi_routes(request: Request):
    routes_data = []
    for route in request.app.routes:
        if isinstance(route, APIRoute):
            routes_data.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods),
                "endpoint": route.endpoint.__name__ # Get the name of the function
            })
    return {"routes": routes_data}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Start a simple HTTP server similar to http.server."
    )
    parser.add_argument(
        "port",
        metavar="PORT",
        type=int,
        nargs="?",
        default=default,
        help=f"Specify alternate port [default: {default}]",
    )

    group = parser.add_mutually_exclusive_group()

    group.add_argument(
        "--dev",
        action="store_true",
        help="Run in development mode (default).",
    )

    group.add_argument(
        "--prod",
        action="store_true",
        help="Run in production mode.",
    )

    args = parser.parse_args()

    if args.prod:
        env = "prod"
    else:
        env = "dev"

    port = args.port

    if env == "dev":
        port += 100
        reload = True
        app_import_string = (
            f"{__package__}.__main__:app"
        )
    elif env == "prod":
        reload = False
        app_import_string = app
    else:
        reload = False
        app_import_string = app

    uvicorn.run(
        app_import_string, host="0.0.0.0", port=port, reload=reload
    )