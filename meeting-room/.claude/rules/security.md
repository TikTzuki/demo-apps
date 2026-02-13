# Security Guidelines

## Mandatory Security Checks

Before ANY commit:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CORS protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data
- [ ] Audio inputs sanitized before processing

## Secret Management

### Python (Backend)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # NEVER hardcode secrets
    database_url: str
    secret_key: str
    anthropic_api_key: str
    openai_api_key: str | None = None
    elevenlabs_api_key: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Validate required secrets at startup
if not settings.secret_key:
    raise ValueError("SECRET_KEY not configured")
```

### TypeScript (Frontend)

```typescript
// Access via import.meta.env (Vite)
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL not configured');
}
```

## Authentication (JWT)

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")

def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
```

## Input Validation

### Python (Pydantic)

```python
from pydantic import BaseModel, Field, validator
import re

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)

    @validator('content')
    def sanitize_content(cls, v):
        # Remove potentially dangerous characters
        v = v.strip()
        # Prevent script injection
        v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
        return v

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain digit')
        return v
```

### TypeScript (Zod)

```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

const messageSchema = z.object({
  content: z.string()
    .min(1)
    .max(10000)
    .transform(s => DOMPurify.sanitize(s.trim()))
});
```

## Rate Limiting

```python
from fastapi import Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/chat/messages")
@limiter.limit("60/minute")
async def send_message(request: Request, message: MessageCreate):
    # ...
```

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),  # Never use ["*"] in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

## Audio Security

```python
import magic
from fastapi import UploadFile, HTTPException

ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/mpeg",
    "audio/ogg",
    "audio/webm",
}

MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB

async def validate_audio_file(file: UploadFile) -> bytes:
    content = await file.read()

    # Check file size
    if len(content) > MAX_AUDIO_SIZE:
        raise HTTPException(400, "Audio file too large")

    # Check MIME type using magic bytes
    mime_type = magic.from_buffer(content, mime=True)
    if mime_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(400, f"Invalid audio type: {mime_type}")

    return content
```

## Security Response Protocol

If security issue found:

1. STOP immediately
2. Fix CRITICAL issues before continuing
3. Rotate any exposed secrets
4. Review entire codebase for similar issues
5. Update security documentation

## Environment File Template

```bash
# .env.example (commit this, NOT .env)

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname

# Security
SECRET_KEY=generate-a-secure-random-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services (get from respective dashboards)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379
```
