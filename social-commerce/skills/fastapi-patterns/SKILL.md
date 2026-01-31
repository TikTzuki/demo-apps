# FastAPI Patterns Skill

Production-ready patterns for FastAPI backend development.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # Dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py    # API router
│   │       ├── auth.py
│   │       ├── chat.py
│   │       ├── speech.py
│   │       └── users.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   └── security.py      # Auth utilities
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py
│   └── services/
│       ├── __init__.py
│       ├── auth.py
│       ├── chat.py
│       ├── ai.py
│       ├── tts.py
│       └── stt.py
├── tests/
│   ├── conftest.py
│   ├── unit/
│   └── integration/
├── alembic/
│   ├── env.py
│   └── versions/
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

## Configuration (config.py)

```python
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    app_name: str = "Chat Bot API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 30

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # AI Services
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    elevenlabs_api_key: str | None = None

    # Redis
    redis_url: str = "redis://localhost:6379"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

## Database (database.py)

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncGenerator
from app.core.config import settings

class Database:
    def __init__(self):
        self.engine = create_async_engine(
            settings.database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_pre_ping=True,
            echo=settings.debug
        )
        self.async_session_maker = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.async_session_maker() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    async def close(self):
        await self.engine.dispose()

database = Database()
```

## Base Repository (repositories/base.py)

```python
from typing import Generic, TypeVar, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from uuid import UUID

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model: type[T]):
        self.session = session
        self.model = model

    async def get_by_id(self, id: UUID) -> Optional[T]:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: str = "created_at"
    ) -> List[T]:
        order_column = getattr(self.model, order_by, self.model.created_at)
        result = await self.session.execute(
            select(self.model)
            .order_by(order_column.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> T:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: UUID, **kwargs) -> Optional[T]:
        data = {k: v for k, v in kwargs.items() if v is not None}
        if not data:
            return await self.get_by_id(id)

        await self.session.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**data)
        )
        await self.session.commit()
        return await self.get_by_id(id)

    async def delete(self, id: UUID) -> bool:
        result = await self.session.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def count(self, **filters) -> int:
        query = select(func.count(self.model.id))
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)
        result = await self.session.execute(query)
        return result.scalar() or 0
```

## Dependencies (api/deps.py)

```python
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import database
from app.models.user import User
from app.repositories.user import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")

async def get_db() -> AsyncSession:
    async for session in database.get_session():
        yield session

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

# Type aliases for cleaner endpoints
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
```

## API Endpoint (api/v1/chat.py)

```python
from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import DbSession, CurrentUser
from app.schemas.message import MessageCreate, MessageResponse
from app.services.chat import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    db: DbSession,
    current_user: CurrentUser
):
    chat_service = ChatService(db)
    return await chat_service.send_message(
        user_id=current_user.id,
        content=message.content,
        conversation_id=message.conversation_id
    )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50
):
    chat_service = ChatService(db)
    return await chat_service.get_messages(
        conversation_id=conversation_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
```

## Service Layer (services/chat.py)

```python
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.repositories.message import MessageRepository
from app.repositories.conversation import ConversationRepository
from app.models.message import Message
from app.services.ai import AIService

class ChatService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.message_repo = MessageRepository(session)
        self.conversation_repo = ConversationRepository(session)
        self.ai_service = AIService()

    async def send_message(
        self,
        user_id: UUID,
        content: str,
        conversation_id: UUID | None = None
    ) -> Message:
        # Create conversation if not exists
        if not conversation_id:
            conversation = await self.conversation_repo.create(
                user_id=user_id,
                title=content[:50]
            )
            conversation_id = conversation.id

        # Save user message
        user_message = await self.message_repo.create(
            content=content,
            role="user",
            conversation_id=conversation_id
        )

        # Get AI response
        history = await self.get_messages(conversation_id, user_id, limit=20)
        ai_response = await self.ai_service.generate_response(history)

        # Save AI message
        ai_message = await self.message_repo.create(
            content=ai_response,
            role="assistant",
            conversation_id=conversation_id
        )

        return ai_message

    async def get_messages(
        self,
        conversation_id: UUID,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Message]:
        return await self.message_repo.get_by_conversation(
            conversation_id=conversation_id,
            skip=skip,
            limit=limit
        )
```

## Main Application (main.py)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import database
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await database.close()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## requirements.txt

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
alembic>=1.13.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
httpx>=0.26.0
redis>=5.0.0
anthropic>=0.18.0
openai>=1.10.0
pytest>=7.4.0
pytest-asyncio>=0.23.0
```
