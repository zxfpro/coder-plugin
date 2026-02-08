class Config:
    DB_TABLE_PREFIX = "points-module_"


# 初始化积分消费规则
def init_points_cost_rules(session):
    from .models import PointsCostRule
    from sqlmodel import select

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