import random
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from .models import PointsTransaction, PointsCostRule, RechargePlan, PaymentOrder
from .db import get_session
from .auth import current_active_user
from .config import Config


router = APIRouter()


class PointsConsumeRequest(BaseModel):
    action: str
    size: str
    feature: str


class PointsRechargeRequest(BaseModel):
    plan_id: int
    payment_method: str = "wechat"


@router.get("/points/balance")
async def get_points_balance(user: current_active_user):
    return {"balance": user.points}


@router.post("/points/consume")
async def consume_points(data: PointsConsumeRequest, user: current_active_user, session: Session = Depends(get_session)):
    # 查询消费规则
    rule = session.exec(
        select(PointsCostRule)
        .where(PointsCostRule.action == data.action)
        .where(PointsCostRule.size == data.size)
        .where(PointsCostRule.feature == data.feature)
        .where(PointsCostRule.enabled == True)
    ).first()

    if not rule:
        raise HTTPException(400, "不支持的消费场景")

    # 检查积分余额
    if user.points < rule.cost_points:
        raise HTTPException(400, "积分余额不足")

    # 扣减积分
    user.points -= rule.cost_points
    session.add(user)

    # 记录交易
    transaction = PointsTransaction(
        user_id=user.id,
        delta=-rule.cost_points,
        reason=f"{data.action}_{data.size}_{data.feature}",
        status="success"
    )
    session.add(transaction)
    session.commit()

    return {"ok": True, "remaining": user.points}


@router.get("/points/transactions")
async def get_points_transactions(user: current_active_user, session: Session = Depends(get_session), limit: int = 50):
    transactions = session.exec(
        select(PointsTransaction)
        .where(PointsTransaction.user_id == user.id)
        .order_by(PointsTransaction.created_at.desc())
        .limit(limit)
    ).all()

    return {"transactions": [
        {
            "id": str(t.id),
            "delta": t.delta,
            "reason": t.reason,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in transactions
    ]}


@router.get("/points/recharge-plans")
async def get_recharge_plans(session: Session = Depends(get_session)):
    plans = session.exec(
        select(RechargePlan)
        .where(RechargePlan.enabled == True)
    ).all()

    return {"plans": [
        {
            "id": p.id,
            "name": p.name,
            "price_cny": p.price_cny,
            "points": p.points
        } for p in plans
    ]}


@router.post("/points/recharge")
async def recharge_points(data: PointsRechargeRequest, user: current_active_user, session: Session = Depends(get_session)):
    plan = session.exec(select(RechargePlan).where(RechargePlan.id == data.plan_id)).first()
    if not plan:
        raise HTTPException(400, "无效的充值套餐")

    # 创建支付订单
    order = PaymentOrder(
        user_id=user.id,
        channel=data.payment_method,
        plan_id=plan.id,
        amount=plan.price_cny,
        status="pending"
    )
    session.add(order)
    session.commit()

    # 模拟支付成功（实际应调用支付平台API）
    order.status = "success"
    user.points += plan.points
    session.add(order)
    session.add(user)

    # 记录交易
    transaction = PointsTransaction(
        user_id=user.id,
        delta=plan.points,
        reason=f"recharge_{plan.id}",
        status="success"
    )
    session.add(transaction)
    session.commit()

    return {"ok": True, "order_id": order.id, "remaining": user.points}