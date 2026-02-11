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

---
## 执行步骤


### 1复制资源
1. 复制 `assets/src/frontend/` 到项目的 'src/frontend/‘ 目录下
2. 复制 `assets/src/backend/` 到项目的 'src/{project_name}/‘ 目录下
4. 复制 `assets/tests` 到项目的对应目录下

### 2整合资源
1. 将 index.html , pyproject.toml, .env 中的部分合理的整合到目标项目中的对应文件中
2. 将 __main__.py db.py 中的内容合理的整合到目标项目中的对应文件中


#### 认证接口

- `POST /auth/login` - 邮箱密码登录
- `POST /auth/register_with_code` - 邮箱注册（带验证码）
- `POST /auth/register/email/code` - 发送注册验证码
- `POST /auth/password/forgot` - 发送重置密码验证码
- `POST /auth/password/reset` - 重置密码
- `POST /auth/phone/code` - 发送手机验证码
- `POST /auth/phone/login` - 手机验证码登录

