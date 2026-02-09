---
name: user-module
description: 轻量级用户认证和管理模块，支持邮箱登录、邮箱验证码注册、密码重置。使用 React 前端和 FastAPI 后端，架构清晰，易于同步移植。
---

# 用户模块技能

## 概述

这是一个轻量级用户认证和管理模块，提供核心功能：

- **用户认证**：邮箱/用户名密码登录
- **用户注册**：邮箱验证码注册
- **密码重置**：邮箱验证码重置密码
- **会话管理**：JWT Token 认证和刷新
- **基础用户信息**：查询和更新用户信息

## 项目结构

```
user-module/
├── SKILL.md                 # 技能文档
├── scripts/
│   ├── setup-frontend.sh    # 前端安装脚本
│   └── setup-backend.sh     # 后端安装脚本
└── assets/
    ├── frontend/            # 前端代码模板
    │   ├── auth/
    │   │   └── AuthContext.tsx    # 认证上下文
    │   ├── components/
    │   │   ├── Login.tsx          # 登录组件
    │   │   ├── Register.tsx       # 注册组件
    │   │   └── ForgotPassword.tsx # 忘记密码组件
    │   └── api/
    │       └── client.ts          # API 客户端
    └── backend/             # 后端代码模板
        └── server/
            ├── auth.py            # 认证路由
            ├── models.py          # 数据模型
            └── db.py              # 数据库操作
```

## 使用场景

当需要快速实现用户认证和管理功能时，使用此技能。适用于：

- 新应用的用户系统开发
- 现有应用的用户模块重构

## 快速开始

### 前端安装

```bash
cd /path/to/project
npm install react react-dom
```

### 后端安装

```bash
cd /path/to/project
pip install fastapi fastapi-users sqlmodel uvicorn
```

## 核心组件

### 1. 认证上下文 (AuthContext)

```typescript
// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setAccessToken } from '../api/client';

interface AuthContextValue {
  token: string | null;
  user: any;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'user_module_access_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const isAuthenticated = !!token;

  async function login(email: string, password: string) {
    const body = new URLSearchParams({
      username: email,
      password,
    }).toString();

    const res = await apiFetch<{ access_token: string }>("/auth/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    setToken(res.access_token);
    setAccessToken(res.access_token);
    localStorage.setItem(TOKEN_KEY, res.access_token);

    try {
      const userInfo = await apiFetch('/users/me');
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  function restoreSession() {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      setAccessToken(saved);
      apiFetch('/users/me').then(setUser).catch(() => {
        console.error('Token expired or invalid, clearing session');
        logout();
      });
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
```

### 2. API 客户端 (api/client.ts)

```typescript
// src/api/client.ts
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8007';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  status?: number;
  detail?: any;

  constructor(message: string, status?: number, detail?: any) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    throw new ApiError('UNAUTHORIZED', 401);
  }

  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {}
    throw new ApiError('API_ERROR', res.status, detail);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}
```

### 3. 后端用户模型 (models.py)

```python
# src/backend/server/models.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: Optional[str] = Field(index=True, unique=True)
    phone: Optional[str] = Field(index=True, unique=True, default=None)
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EmailRegisterCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False


class PasswordResetCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False
```

### 4. 后端认证路由 (auth.py)

```python
# src/backend/server/auth.py
import random
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi_users import BaseUserManager, FastAPIUsers
from fastapi_users.password import PasswordHelper
from fastapi_users.authentication import BearerTransport, AuthenticationBackend
from fastapi_users.authentication.strategy import JWTStrategy
from fastapi_users_db_sqlmodel import SQLModelUserDatabase
from fastapi_users.schemas import BaseUserCreate
from pydantic import BaseModel
from sqlmodel import Session, select

from .models import User, PasswordResetCode
from .db import get_session


SECRET = "CHANGE_ME_SECRET"

router = APIRouter()


class LoginRequest(BaseModel):
    identifier_type: str = "email"
    identifier: str
    password: Optional[str] = None


password_helper = PasswordHelper()


class UserManager(BaseUserManager[User, UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    def parse_id(self, user_id: str) -> UUID:
        return UUID(user_id)


class UserCreate(BaseUserCreate):
    code: str


def get_user_db(session: Session = Depends(get_session)):
    yield SQLModelUserDatabase(session, User)


def get_user_manager(user_db=Depends(get_user_db), session: Session = Depends(get_session)):
    manager = UserManager(user_db)
    manager._session = session
    yield manager


bearer_transport = BearerTransport(tokenUrl="/auth/login")


def get_strategy():
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_strategy,
)

fastapi_users = FastAPIUsers[User, UUID](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)


class EmailRegisterWithCode(BaseModel):
    email: str
    password: str
    code: str


@router.post("/register_with_code")
def register_with_code(data: EmailRegisterWithCode, session: Session = Depends(get_session)):
    from .models import EmailRegisterCode

    rec = session.exec(
        select(EmailRegisterCode)
        .where(EmailRegisterCode.email == data.email)
        .where(EmailRegisterCode.code == data.code)
        .where(EmailRegisterCode.used == False)
        .order_by(EmailRegisterCode.id.desc())
    ).first()

    if not rec or rec.expires_at < datetime.utcnow():
        raise HTTPException(400, "invalid or expired email code")

    if session.exec(select(User).where(User.email == data.email)).first():
        raise HTTPException(400, "email already registered")

    user = User(email=data.email, hashed_password=password_helper.hash(data.password))
    session.add(user)

    rec.used = True
    session.add(rec)
    session.commit()

    return {"ok": True}


class EmailRegisterCodeRequest(BaseModel):
    email: str


@router.post("/register/email/code")
def send_register_email_code(data: EmailRegisterCodeRequest, session: Session = Depends(get_session)):
    from .models import EmailRegisterCode

    if session.exec(select(User).where(User.email == data.email)).first():
        raise HTTPException(400, "email already registered")

    code = f"{random.randint(0, 999999):06d}"
    rec = EmailRegisterCode(
        email=data.email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    session.add(rec)
    session.commit()

    return {"ok": True}


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    email: str
    code: str
    new_password: str


@router.post("/password/forgot")
def request_password_reset(
    data: PasswordResetRequest,
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        raise HTTPException(400, "email not registered")

    code = f"{random.randint(0, 999999):06d}"
    reset = PasswordResetCode(
        user_id=user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    session.add(reset)
    session.commit()

    return {"ok": True}


@router.post("/password/reset")
def confirm_password_reset(
    data: PasswordResetConfirm,
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        raise HTTPException(400, "invalid")

    reset = session.exec(
        select(PasswordResetCode)
        .where(PasswordResetCode.user_id == user.id)
        .where(PasswordResetCode.code == data.code)
        .where(PasswordResetCode.used == False)
        .order_by(PasswordResetCode.id.desc())
    ).first()

    if not reset or reset.expires_at < datetime.utcnow():
        raise HTTPException(400, "invalid or expired code")

    user.hashed_password = password_helper.hash(data.new_password)
    reset.used = True
    session.add(user)
    session.add(reset)
    session.commit()

    return {"ok": True}
```

## 同步移植机制

### 防重名策略

#### 1. 文件结构防重名

```typescript
// src/utils/naming.ts
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let counter = 1;
  while (existingNames.includes(`${baseName}${counter}`)) {
    counter++;
  }
  return `${baseName}${counter}`;
}

export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .trim();
}
```

#### 2. 数据库表名前缀

```python
# src/backend/server/config.py
class Config:
    DB_TABLE_PREFIX = "user_module_"
```

```python
# src/backend/server/models.py
from sqlmodel import SQLModel, Field

from .config import Config


class User(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}users"

    id: int = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = True
```

### 同步脚本

```bash
#!/bin/bash
# scripts/sync.sh

echo "正在同步用户模块..."

# 检查目标目录
if [ ! -d "$1" ]; then
    echo "错误：目标目录不存在"
    exit 1
fi

DEST_DIR="$1"
MODULE_NAME="user-module"

# 生成唯一模块名
if [ -d "$DEST_DIR/$MODULE_NAME" ]; then
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    MODULE_NAME="user-module-$TIMESTAMP"
    echo "提示：用户模块已存在，使用新名称：$MODULE_NAME"
fi

# 复制文件
mkdir -p "$DEST_DIR/$MODULE_NAME"
cp -r assets/ "$DEST_DIR/$MODULE_NAME/"
cp -r scripts/ "$DEST_DIR/$MODULE_NAME/"

# 更新配置
sed -i "s/user_module_/${MODULE_NAME}_/g" "$DEST_DIR/$MODULE_NAME/assets/backend/server/models.py"
sed -i "s/user_module_/${MODULE_NAME}_/g" "$DEST_DIR/$MODULE_NAME/assets/backend/server/config.py"

# 安装依赖
if [ -f "$DEST_DIR/package.json" ]; then
    cd "$DEST_DIR" && npm install
fi

echo "用户模块同步完成！"
echo "模块位置：$DEST_DIR/$MODULE_NAME"
```

## API 接口文档

### 基础接口

#### 登录
- **路径**：`POST /auth/login`
- **请求格式**：`application/x-www-form-urlencoded`
- **参数**：
  - `username`：邮箱或用户名
  - `password`：密码
- **响应**：
  ```json
  {
    "access_token": "string",
    "token_type": "bearer"
  }
  ```

#### 注册（发送验证码）
- **路径**：`POST /auth/register/email/code`
- **请求格式**：`application/json`
- **参数**：
  ```json
  {
    "email": "string"
  }
  ```
- **响应**：
  ```json
  {
    "ok": true
  }
  ```

#### 注册（确认）
- **路径**：`POST /auth/register_with_code`
- **请求格式**：`application/json`
- **参数**：
  ```json
  {
    "email": "string",
    "password": "string",
    "code": "string"
  }
  ```
- **响应**：
  ```json
  {
    "ok": true
  }
  ```

#### 获取用户信息
- **路径**：`GET /users/me`
- **请求格式**：`application/json`
- **响应**：
  ```json
  {
    "id": "string",
    "email": "string",
    "phone": "string",
    "is_active": true,
    "is_superuser": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
  ```

## 部署建议

### 开发环境

```bash
# 前端
npm start

# 后端
uvicorn src.backend.server.main:app --reload --host 0.0.0.0 --port 8007
```

### 生产环境

```bash
# 前端构建
npm run build

# 后端部署
uvicorn src.backend.server.main:app --host 0.0.0.0 --port 8007 --workers 4
```

## 总结

这个用户模块技能提供了基础的用户认证和管理功能，并设计了同步移植机制。您可以通过 `/skill user-module` 命令快速集成到项目中，支持防重名和配置隔离。