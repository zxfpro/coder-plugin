---
name: auth-module
description: 轻量级用户认证和管理模块，支持邮箱登录、邮箱验证码注册、密码重置、手机验证码登录。使用 React 前端和 FastAPI 后端，架构清晰，易于同步移植到其他系统。
---

# Auth Module

## 概述

auth-module 是一个轻量级的用户认证和管理模块，提供了完整的用户身份验证功能。它采用 React 前端和 FastAPI 后端的架构，具有以下特点：

- 支持邮箱登录和注册（含验证码验证）
- 支持密码重置功能
- 支持手机验证码登录
- 使用 JWT Bearer Token 进行身份验证
- 前端使用 TypeScript 和 React 18+
- 后端使用 FastAPI 和 SQLModel（SQLAlchemy）
- 支持 SQLite 数据库，可轻松扩展到其他数据库
- 模块化设计，易于集成到其他系统

## 核心功能

### 用户认证

- **邮箱登录**：使用邮箱和密码进行登录，返回 JWT Token
- **邮箱注册**：发送验证码到邮箱，验证成功后创建新用户
- **密码重置**：通过邮箱发送重置密码链接，支持验证码验证
- **手机登录**：支持手机号+验证码登录方式
- **JWT 认证**：使用 Bearer Token 进行 API 身份验证

### 用户管理

- **用户信息存储**：存储用户的邮箱、手机号、密码哈希等信息
- **积分系统**：支持用户积分管理（预留功能）
- **订单管理**：预留订单管理功能

## 架构设计


```
project-name/
├── node_modules
├── src
│   ├── backend
│   │   ├── __init__.py
│   │   └── server
│   │       ├── __init__.py
│   │       ├── __main__.py   # 服务器入口
│   │       ├── auth         # 认证 API 路由
│   │       │   ├── admin.py
│   │       │   ├── auth.py
│   │       │   └── models.py
│   │       └── db.py
│   └── frontend
│       ├── main.tsx             # 应用入口
│       └── user
│           ├── App.css             # 主样式文件
│           ├── App.tsx              # 主应用组件，包含所有页面
│           ├── api
│           │   └── client.ts        # API 客户端，与后端通信
│           ├── assets
│           │   └── react.svg
│           ├── auth
│           │   └── AuthContext.tsx   # 认证上下文，管理用户会话
│           └── index.css
├── tests
│   ├── backend
│   ├── frontend
│   └── resources
├── package.json
├── pyproject.toml          # Python 项目配置
├── tsconfig.json. 
├── uv.lock                   # 依赖锁定文件
└── vite.config.ts
```

#### 认证接口

- `POST /auth/login` - 邮箱密码登录
- `POST /auth/register_with_code` - 邮箱注册（带验证码）
- `POST /auth/register/email/code` - 发送注册验证码
- `POST /auth/password/forgot` - 发送重置密码验证码
- `POST /auth/password/reset` - 重置密码
- `POST /auth/phone/code` - 发送手机验证码
- `POST /auth/phone/login` - 手机验证码登录

---
## 如何作为模块集成到其他系统

### 1复制资源
1. 复制 `assets/src/frontend/` 到项目的 'src/frontend/‘ 目录下
2. 复制 `assets/src/backend/` 到项目的 'src/{project_name}/‘ 目录下
3. 复制 `assets/node_modules` 到项目的 'node_modules/‘ 目录下
4. 复制 `assets/tests` 到项目的对应目录下

### 2整合资源
将 __main__.py 中的内容与项目整合
将 db.py 中的内容与项目整合
调整优化目录结构
