from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class PointsTransaction(SQLModel, table=True):
    __tablename__ = f"points-module_points_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key=f"points-module_users.id", index=True)
    delta: int
    reason: str
    status: str = Field(default="success", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PointsCostRule(SQLModel, table=True):
    __tablename__ = f"points-module_points_cost_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    action: str = Field(index=True)
    size: str = Field(index=True)
    feature: str = Field(index=True)
    cost_points: int
    enabled: bool = True


class RechargePlan(SQLModel, table=True):
    __tablename__ = f"points-module_recharge_plans"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price_cny: float
    points: int
    enabled: bool = True


class PaymentOrder(SQLModel, table=True):
    __tablename__ = f"points-module_payment_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key=f"points-module_users.id", index=True)
    channel: str = Field(index=True)
    plan_id: int = Field(foreign_key=f"points-module_recharge_plans.id")
    amount: float
    status: str = Field(default="pending", index=True)
    external_trade_no: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)