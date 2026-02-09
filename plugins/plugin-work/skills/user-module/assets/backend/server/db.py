# AI_Amend 2026-01-24 数据库初始化
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./test2.db"
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
# AI_Amend END
