from fastapi import Request
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from sqlmodel import Session

from .models import Order
from ..db import engine


class AdminAuth(AuthenticationBackend):
    def __init__(self):
        # SQLAdmin 要求必须提供 secret_key（即使用 session 也需要）
        super().__init__(secret_key="ADMIN_SESSION_SECRET")

    # ✅ SQLAdmin 登录处理（Session-based）
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        # ✅ demo：写死后台账号
        if username == "admin" and password == "admin123":
            request.session["admin"] = True
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("admin") is True


class OrderAdmin(ModelView, model=Order):
    column_list = [
        Order.id,
        Order.user_id,
        Order.status,
        Order.total_amount,
        Order.created_at,
    ]
    column_searchable_list = [Order.status]
    column_sortable_list = [Order.created_at]




def setup_admin(app):
    admin = Admin(app, engine, authentication_backend=AdminAuth())
    admin.add_view(OrderAdmin)


