# src/backend/server/models.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field

from .config import Config


class User(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: Optional[str] = Field(index=True, unique=True)
    phone: Optional[str] = Field(index=True, unique=True, default=None)
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EmailRegisterCode(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}email_register_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False


class PasswordResetCode(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}password_reset_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key=f"{Config.DB_TABLE_PREFIX}users.id", index=True)
    code: str = Field(index=True)
    expires_at: datetime
    used: bool = False