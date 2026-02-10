---
name: points-module
description: 积分管理模块，支持积分查询、消费、充值、交易记录等功能。使用 React 前端和 FastAPI 后端，架构清晰，易于同步移植。
---

# 积分模块技能

## 概述

这是一个轻量级积分管理模块，提供核心功能：

- **积分查询**：查询用户积分余额
- **积分消费**：消费积分（支持多种消费场景）
- **积分充值**：积分充值（支持多种充值方式）
- **积分记录**：积分交易记录查询
- **积分管理**：积分规则配置和管理

## 项目结构

```
points-module/
├── SKILL.md                 # 技能文档
├── scripts/
│   ├── setup-frontend.sh    # 前端安装脚本
│   ├── setup-backend.sh     # 后端安装脚本
│   └── sync.sh              # 同步移植脚本
└── assets/
    ├── frontend/            # 前端代码模板
    │   ├── components/
    │   │   ├── PointsBalance.tsx         # 积分余额组件
    │   │   ├── PointsConsume.tsx        # 积分消费组件
    │   │   ├── PointsRecharge.tsx       # 积分充值组件
    │   │   └── PointsHistory.tsx        # 积分记录组件
    │   └── api/
    │       └── client.ts                # API 客户端
    └── backend/             # 后端代码模板
        └── server/
            ├── points.py                # 积分管理路由
            ├── models.py                # 数据模型
            └── config.py                # 配置文件
```

## 使用场景

当需要快速实现积分管理功能时，使用此技能。适用于：

- 新应用的积分系统开发
- 现有应用的积分模块重构

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

### 1. 积分管理路由 (points.py)

```python
# src/backend/server/points.py
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
```

### 2. 积分管理模型 (models.py)

```python
# src/backend/server/models.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class PointsTransaction(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}points_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key=f"{Config.DB_TABLE_PREFIX}users.id", index=True)
    delta: int
    reason: str
    status: str = Field(default="success", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PointsCostRule(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}points_cost_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    action: str = Field(index=True)
    size: str = Field(index=True)
    feature: str = Field(index=True)
    cost_points: int
    enabled: bool = True


class RechargePlan(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}recharge_plans"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price_cny: float
    points: int
    enabled: bool = True


class PaymentOrder(SQLModel, table=True):
    __tablename__ = f"{Config.DB_TABLE_PREFIX}payment_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key=f"{Config.DB_TABLE_PREFIX}users.id", index=True)
    channel: str = Field(index=True)
    plan_id: int = Field(foreign_key=f"{Config.DB_TABLE_PREFIX}recharge_plans.id")
    amount: float
    status: str = Field(default="pending", index=True)
    external_trade_no: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 3. 积分管理配置 (config.py)

```python
# src/backend/server/config.py
class Config:
    DB_TABLE_PREFIX = "points-module_"


# 初始化积分消费规则
def init_points_cost_rules(session):
    rules = [
        PointsCostRule(action="generate_image", size="512x512", feature="base", cost_points=10),
        PointsCostRule(action="generate_image", size="512x512", feature="hd", cost_points=20),
        PointsCostRule(action="generate_image", size="1024x1024", feature="base", cost_points=20),
        PointsCostRule(action="generate_image", size="1024x1024", feature="hd", cost_points=40),
        PointsCostRule(action="remove_bg", size="any", feature="base", cost_points=5),
    ]

    for rule in rules:
        existing = session.exec(
            select(PointsCostRule)
            .where(PointsCostRule.action == rule.action)
            .where(PointsCostRule.size == rule.size)
            .where(PointsCostRule.feature == rule.feature)
        ).first()
        if not existing:
            session.add(rule)

    session.commit()
```

### 4. 前端积分余额组件 (PointsBalance.tsx)

```typescript
// src/components/PointsBalance.tsx
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

interface PointsBalanceProps {
  onRefresh?: () => void;
}

export default function PointsBalance({ onRefresh }: PointsBalanceProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBalance();
  }, [onRefresh]);

  const fetchBalance = async () => {
    try {
      const res = await apiFetch<{ balance: number }>('/points/balance');
      setBalance(res.balance);
    } catch (error) {
      console.error('Failed to fetch points balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.balance}>{balance}</div>
      <div style={styles.label}>积分余额</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    background: '#f0f8ff',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
  },
  balance: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0066cc',
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
};
```

### 5. 前端积分消费组件 (PointsConsume.tsx)

```typescript
// src/components/PointsConsume.tsx
import React, { useState } from 'react';
import { apiFetch } from '../api/client';

interface PointsConsumeProps {
  onSuccess?: () => void;
}

export default function PointsConsume({ onSuccess }: PointsConsumeProps) {
  const [action, setAction] = useState<string>('generate_image');
  const [size, setSize] = useState<string>('512x512');
  const [feature, setFeature] = useState<string>('base');
  const [loading, setLoading] = useState<boolean>(false);

  const handleConsume = async () => {
    setLoading(true);
    try {
      await apiFetch('/points/consume', {
        method: 'POST',
        body: JSON.stringify({
          action,
          size,
          feature,
        }),
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to consume points:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>积分消费</h3>

      <div style={styles.formGroup}>
        <label style={styles.label}>操作类型:</label>
        <select
          style={styles.select}
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="generate_image">生成图片</option>
          <option value="remove_bg">去除背景</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>尺寸:</label>
        <select
          style={styles.select}
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="512x512">512x512</option>
          <option value="1024x1024">1024x1024</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>功能:</label>
        <select
          style={styles.select}
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
        >
          <option value="base">基础</option>
          <option value="hd">高清</option>
        </select>
      </div>

      <button
        style={styles.button}
        onClick={handleConsume}
        disabled={loading}
      >
        {loading ? '消费中...' : '消费积分'}
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxWidth: '400px',
  },
  title: {
    marginBottom: '16px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    color: '#666',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
```

### 6. 前端积分记录组件 (PointsHistory.tsx)

```typescript
// src/components/PointsHistory.tsx
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

interface Transaction {
  id: string;
  delta: number;
  reason: string;
  status: string;
  created_at: string;
}

export default function PointsHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await apiFetch<{ transactions: Transaction[] }>('/points/transactions');
      setTransactions(res.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>积分记录</h3>

      {transactions.length === 0 ? (
        <div style={styles.emptyState}>暂无积分记录</div>
      ) : (
        <div style={styles.list}>
          {transactions.map((transaction) => (
            <div key={transaction.id} style={styles.item}>
              <div style={styles.itemHeader}>
                <div style={styles.delta}>
                  {transaction.delta > 0 ? '+' : ''}{transaction.delta}
                </div>
                <div style={styles.status}>{transaction.status}</div>
              </div>
              <div style={styles.reason}>{transaction.reason}</div>
              <div style={styles.date}>
                {new Date(transaction.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxWidth: '600px',
  },
  title: {
    marginBottom: '16px',
    color: '#333',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  item: {
    padding: '12px',
    background: '#f8f8f8',
    borderRadius: '4px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  delta: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: (props: { delta: number }) => (props.delta > 0 ? '#00cc66' : '#ff6666'),
  },
  status: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: (props: { status: string }) => {
      if (props.status === 'success') return '#d0f0c0';
      if (props.status === 'pending') return '#fff3cd';
      if (props.status === 'failed') return '#ffcccc';
      return '#e0e0e0';
    },
    color: (props: { status: string }) => {
      if (props.status === 'success') return '#008000';
      if (props.status === 'pending') return '#856404';
      if (props.status === 'failed') return '#721c24';
      return '#333';
    },
  },
  reason: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
};
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
    DB_TABLE_PREFIX = "points-module_"
```

### 同步脚本

```bash
#!/bin/bash
# scripts/sync.sh

echo "正在同步积分模块..."

# 检查目标目录
if [ ! -d "$1" ]; then
    echo "错误：目标目录不存在"
    exit 1
fi

DEST_DIR="$1"
MODULE_NAME="points-module"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# 生成唯一模块名
if [ -d "$DEST_DIR/$MODULE_NAME" ]; then
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    MODULE_NAME="points-module-$TIMESTAMP"
    echo "提示：积分模块已存在，使用新名称：$MODULE_NAME"
fi

# 复制文件
mkdir -p "$DEST_DIR/$MODULE_NAME"
cp -r "$SKILL_DIR/assets/frontend/" "$DEST_DIR/$MODULE_NAME/frontend/"
cp -r "$SKILL_DIR/assets/backend/" "$DEST_DIR/$MODULE_NAME/backend/"
cp -r "$SKILL_DIR/scripts/" "$DEST_DIR/$MODULE_NAME/"

# 更新配置
sed -i '' "s/points-module_/${MODULE_NAME}_/g" "$DEST_DIR/$MODULE_NAME/backend/server/models.py"
sed -i '' "s/points-module_/${MODULE_NAME}_/g" "$DEST_DIR/$MODULE_NAME/backend/server/config.py"

# 安装依赖
if [ -f "$DEST_DIR/package.json" ]; then
    cd "$DEST_DIR" && npm install
fi

echo "积分模块同步完成！"
echo "模块位置：$DEST_DIR/$MODULE_NAME"
```

## API 接口文档

### 基础接口

#### 查询积分余额
- **路径**：`GET /points/balance`
- **描述**：查询当前用户的积分余额
- **响应**：
  ```json
  {
    "balance": 100
  }
  ```

#### 消费积分
- **路径**：`POST /points/consume`
- **请求格式**：`application/json`
- **参数**：
  ```json
  {
    "action": "generate_image",
    "size": "512x512",
    "feature": "base"
  }
  ```
- **响应**：
  ```json
  {
    "ok": true,
    "remaining": 90
  }
  ```

#### 查询积分记录
- **路径**：`GET /points/transactions`
- **响应**：
  ```json
  {
    "transactions": [
      {
        "id": "1",
        "delta": -10,
        "reason": "generate_image_512x512_base",
        "status": "success",
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": "2",
        "delta": 100,
        "reason": "recharge_1",
        "status": "success",
        "created_at": "2024-01-02T00:00:00Z"
      }
    ]
  }
  ```

#### 查询充值套餐
- **路径**：`GET /points/recharge-plans`
- **响应**：
  ```json
  {
    "plans": [
      {
        "id": 1,
        "name": "100积分",
        "price_cny": 10,
        "points": 100
      },
      {
        "id": 2,
        "name": "500积分",
        "price_cny": 45,
        "points": 500
      },
      {
        "id": 3,
        "name": "1000积分",
        "price_cny": 88,
        "points": 1000
      }
    ]
  }
  ```

#### 充值积分
- **路径**：`POST /points/recharge`
- **请求格式**：`application/json`
- **参数**：
  ```json
  {
    "plan_id": 1,
    "payment_method": "wechat"
  }
  ```
- **响应**：
  ```json
  {
    "ok": true,
    "order_id": 123,
    "remaining": 190
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

这个积分模块技能提供了基础的积分管理功能，并设计了同步移植机制。您可以通过 `/skill points-module` 命令快速集成到项目中，支持防重名和配置隔离。