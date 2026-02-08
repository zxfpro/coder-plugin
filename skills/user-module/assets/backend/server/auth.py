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
from .config import Config


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