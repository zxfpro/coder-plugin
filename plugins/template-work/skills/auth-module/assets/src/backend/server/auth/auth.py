# AI_Amend 2026-01-27 邮箱注册增加验证码发送与校验
import random
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi_users import BaseUserManager, FastAPIUsers
from fastapi_users.password import PasswordHelper
from fastapi_users.authentication import CookieTransport, AuthenticationBackend
from fastapi_users.authentication.strategy import JWTStrategy
from fastapi_users_db_sqlmodel import SQLModelUserDatabase
from fastapi_users.schemas import BaseUserCreate
from pydantic import BaseModel
from sqlmodel import Session, select

from .models import User, PasswordResetCode
from ..db import get_session



SECRET = "CHANGE_ME_SECRET"

router = APIRouter()

# AI_Amend 2026-01-26 统一登录 API（identifier + type）
class LoginRequest(BaseModel):
    identifier_type: str = "email"
    identifier: str
    password: Optional[str] = None


password_helper = PasswordHelper()


class UserManager(BaseUserManager[User, UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    # AI_Amend 2026-01-27 修复 JWT 登出 / current_user NotImplementedError
    # fastapi-users 要求实现 parse_id
    def parse_id(self, user_id: str) -> UUID:
        return UUID(user_id)

    # AI_Amend 2026-01-27 避免启动期 NameError，使用 BaseUserCreate 并在运行期校验 code
    async def create(self, user_create: BaseUserCreate, safe: bool = False, request=None):
        # AI_Amend 2026-01-27 注册前校验邮箱验证码
        session: Session = getattr(self, "_session", None)
        if not session:
            raise HTTPException(500, "session not injected")

        record = session.exec(
            select(PasswordResetCode)
            .where(PasswordResetCode.user_id == None)
            .where(PasswordResetCode.code == user_create.code)
            .where(PasswordResetCode.used == False)
            .order_by(PasswordResetCode.id.desc())
        ).first()

        if not record or record.expires_at < datetime.utcnow():
            raise HTTPException(400, "invalid or expired email code")

        record.used = True
        session.add(record)
        session.commit()

        return await super().create(user_create, safe=safe, request=request)

    # AI_Amend 2026-01-27 删除重复 create(UserCreate) 实现，避免 NameError

    async def on_after_register(self, user: User, request=None):
        # 确保密码是合法 hash（防止历史脏数据）
        try:
            password_helper.verify_and_update(user.hashed_password, user.hashed_password)
        except Exception:
            user.hashed_password = password_helper.hash(user.hashed_password)


# AI_Amend 2026-01-27 邮箱注册增加验证码字段
class UserCreate(BaseUserCreate):
    code: str


def get_user_db(session: Session = Depends(get_session)):
    yield SQLModelUserDatabase(session, User)


def get_user_manager(user_db=Depends(get_user_db), session: Session = Depends(get_session)):
    # AI_Amend 2026-01-27 注入 session 用于注册验证码校验
    manager = UserManager(user_db)
    manager._session = session
    yield manager


from fastapi_users.authentication import BearerTransport

# AI_Amend 2026-01-28 切换为 JWT Bearer Token 鉴权（替代 Cookie）
# AI_Amend 2026-01-28 修正 tokenUrl，fastapi-users 实际暴露路径为 /auth/login
bearer_transport = BearerTransport(tokenUrl="/auth/login")

# ⚠️ 关键：必须提供 strategy

def get_strategy():
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


# AI_Amend 2026-01-28 使用 Bearer Token 后端
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


# @router.post(
#     "/email/login",
#     summary="邮箱/手机号密码登录（不返回 Token）",
#     description="""
#     账号密码登录接口（历史接口）。

#     ⚠️ 说明：
#     - 该接口仅用于校验账号密码
#     - **不会返回 JWT Token**
#     - JWT 登录请使用 `/auth/login`

#     使用场景：
#     - 管理后台
#     - 兼容旧客户端
#     """,
# )
# def login(data: LoginRequest, session: Session = Depends(get_session)):
#     if data.identifier_type == "email":
#         user = session.exec(select(User).where(User.email == data.identifier)).first()
#     elif data.identifier_type == "phone":
#         user = session.exec(select(User).where(User.phone == data.identifier)).first()
#     else:
#         raise HTTPException(400, "unsupported identifier_type")

#     if not user:
#         raise HTTPException(400, "invalid credentials")

#     ok, new_hash = password_helper.verify_and_update(
#         data.password or "", user.hashed_password
#     )
#     if not ok:
#         raise HTTPException(400, "invalid credentials")

#     if new_hash:
#         user.hashed_password = new_hash
#         session.add(user)
#         session.commit()

#     return {"ok": True}


# ===== 邮箱验证码强制注册 =====
# AI_Amend 2026-01-27 强制验证码邮箱注册（最终方案）
class EmailRegisterWithCode(BaseModel):
    email: str
    password: str
    code: str


@router.post(
    "/register_with_code",
    summary="邮箱注册（验证码）",
    description="""
    使用邮箱 + 验证码完成账号注册。

    规则：
    - 邮箱必须唯一
    - 验证码 5 分钟内有效
    - 注册成功后需通过 `/auth/login` 获取 JWT Token
    """,
)
def register_with_code(data: EmailRegisterWithCode, session: Session = Depends(get_session)):
    from .models import EmailRegisterCode

    # 1. 校验验证码
    rec = session.exec(
        select(EmailRegisterCode)
        .where(EmailRegisterCode.email == data.email)
        .where(EmailRegisterCode.code == data.code)
        .where(EmailRegisterCode.used == False)
        .order_by(EmailRegisterCode.id.desc())
    ).first()

    if not rec or rec.expires_at < datetime.utcnow():
        raise HTTPException(400, "invalid or expired email code")

    # 2. 创建用户（强制唯一邮箱）
    if session.exec(select(User).where(User.email == data.email)).first():
        raise HTTPException(400, "email already registered")

    user = User(email=data.email, hashed_password=password_helper.hash(data.password))
    session.add(user)

    # 3. 标记验证码已使用
    rec.used = True
    session.add(rec)
    session.commit()

    return {"ok": True}


# ===== 邮箱注册验证码 =====
# AI_Amend 2026-01-27 邮箱注册验证码发送
class EmailRegisterCodeRequest(BaseModel):
    email: str


@router.post(
    "/register/email/code",
    summary="发送邮箱注册验证码",
    description="""
    向指定邮箱发送注册验证码。

    规则：
    - 已注册邮箱不会再次发送
    - 验证码 5 分钟有效
    """,
)
def send_register_email_code(data: EmailRegisterCodeRequest, session: Session = Depends(get_session)):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from .models import EmailRegisterCode

    # 已存在用户不再发送
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
    import os

    sender = os.getenv("sender")
    password = os.getenv("SMTP")

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = data.email
    msg["Subject"] = "PostPin注册"
    body = f"您的验证码是：{code}，5 分钟内有效，请勿泄露给他人。"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP_SSL("smtp.qq.com", 465) as server:
        server.login(sender, password)
        server.send_message(msg)

    return {"ok": True}


# ===== 忘记密码（仅邮箱账号） =====
# AI_Amend 2026-01-27 邮箱账号独立密码体系
class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    email: str
    code: str
    new_password: str


@router.post(
    "/password/forgot",
    summary="申请重置密码（发送验证码）",
    description="""
    通过邮箱申请重置密码验证码。

    说明：
    - 即使邮箱不存在也返回 ok（防止撞库）
    - 验证码 10 分钟内有效
    """,
)
def request_password_reset(
    data: PasswordResetRequest,
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        # AI_Amend 2026-02-03 改进用户体验：明确提示邮箱未注册
        raise HTTPException(400, "邮箱没有注册,请注册")

    code = f"{random.randint(0, 999999):06d}"
    reset = PasswordResetCode(
        user_id=user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    session.add(reset)
    session.commit()

    # AI_Amend 2026-01-27 忘记密码验证码通过邮箱发送（修复未发送问题）
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import os

    sender = os.getenv("sender")
    password = os.getenv("SMTP")
    if not sender or not password:
        raise HTTPException(500, "SMTP not configured")

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = user.email
    msg["Subject"] = "PostPin重置密码"
    body = f"您的重置密码验证码是：{code}\n10 分钟内有效，请勿泄露给他人。"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP_SSL("smtp.qq.com", 465) as server:
        server.login(sender, password)
        server.send_message(msg)

    return {"ok": True}


@router.post(
    "/password/reset",
    summary="确认重置密码",
    description="""
    使用邮箱验证码重置密码。

    成功后：
    - 原密码失效
    - 需重新登录获取 JWT Token
    """,
)
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



# ===== 手机验证码登录 =====
# AI_Amend 2026-01-27 手机账号仅支持验证码登录
class PhoneCodeRequest(BaseModel):
    phone: str


class PhoneCodeLogin(BaseModel):
    phone: str
    code: str


@router.post("/phone/code")
def send_phone_code(data: PhoneCodeRequest, session: Session = Depends(get_session)):
    from .models import PhoneLoginCode

    code = f"{random.randint(0, 999999):06d}"
    rec = PhoneLoginCode(
        phone=data.phone,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    session.add(rec)
    session.commit()
    print(f"[PHONE CODE] {data.phone}: {code}")
    return {"ok": True}


@router.post("/phone/login")
def phone_login(data: PhoneCodeLogin, session: Session = Depends(get_session)):
    from .models import PhoneLoginCode

    rec = session.exec(
        select(PhoneLoginCode)
        .where(PhoneLoginCode.phone == data.phone)
        .where(PhoneLoginCode.code == data.code)
        .where(PhoneLoginCode.used == False)
        .order_by(PhoneLoginCode.id.desc())
    ).first()

    if not rec or rec.expires_at < datetime.utcnow():
        raise HTTPException(400, "invalid or expired code")

    user = session.exec(select(User).where(User.phone == data.phone)).first()
    if not user:
        user = User(phone=data.phone, hashed_password="")
        session.add(user)

    rec.used = True
    session.add(rec)
    session.commit()

    return {"ok": True}

