# AI_Amend 2026-01-24 忘记密码 + 积分系统模型
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


# AI_Amend 2026-01-26 预留手机号登录字段
# 用户表
class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: Optional[str] = Field(index=True, unique=True)
    phone: Optional[str] = Field(index=True, unique=True, default=None)
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    points: int = Field(default=0)

# 订单表
class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    status: str = Field(index=True)
    total_amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PasswordResetCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False


# AI_Amend 2026-01-27 邮箱注册验证码表（独立于忘记密码）
class EmailRegisterCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False


# AI_Amend 2026-01-27 手机验证码登录表
class PhoneLoginCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False

