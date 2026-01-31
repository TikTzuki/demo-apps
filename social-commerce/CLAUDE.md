# AI Chat Bot Assistant

Full-stack chat bot application with AI-powered text-to-speech (TTS) and speech-to-text (STT) capabilities.

## Tech Stack

### Backend (Python)

- **Framework**: FastAPI with async/await patterns
- **ORM**: SQLAlchemy 2.0+ with async support
- **Database**: PostgreSQL
- **Migration**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT tokens with OAuth2

### Frontend (React)

- **Framework**: React 19 with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod

### AI Integration

- **STT**: Web Speech API / Whisper API
- **TTS**: Web Speech API / ElevenLabs / Google TTS
- **LLM**: Claude API / OpenAI API

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── v1/
│   │   │   │   ├── chat.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── speech.py
│   │   │   │   └── users.py
│   │   │   └── deps.py       # Dependencies
│   │   ├── core/             # Core config
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   │   ├── chat.py
│   │   │   ├── ai.py
│   │   │   ├── tts.py
│   │   │   └── stt.py
│   │   └── repositories/     # Data access layer
│   ├── tests/
│   ├── alembic/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── chat/         # Chat components
│   │   │   └── audio/        # Audio components
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
└── docker-compose.yml
```

## Critical Rules

### 1. Code Organization

- Many small files over few large files
- High cohesion, low coupling
- 200-400 lines typical, 800 max per file
- Organize by feature/domain, not by type

### 2. Code Style

- Immutability always - never mutate objects or arrays
- No console.log in production code
- Proper error handling with try/catch
- Input validation with Pydantic (backend) / Zod (frontend)

### 3. Testing

- TDD: Write tests first
- 80% minimum coverage
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical chat flows

### 4. Security

- No hardcoded secrets - use environment variables
- Validate all user inputs
- Parameterized queries only (SQLAlchemy handles this)
- CORS protection enabled
- Rate limiting on all endpoints
- Sanitize audio inputs before processing

## Key Patterns

### API Response Format (Backend)

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    message: Optional[str] = None
```

### API Response Format (Frontend)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Error Handling (Backend)

```python
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

async def operation():
    try:
        result = await risky_operation()
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Operation failed: {e}")
        raise HTTPException(status_code=500, detail="User-friendly message")
```

### Repository Pattern (Backend)

```python
class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model: type[T]):
        self.session = session
        self.model = model

    async def get_by_id(self, id: UUID) -> Optional[T]:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
```

### Custom Hook Pattern (Frontend)

```typescript
export function useChat() {
  const queryClient = useQueryClient();

  const messages = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
  });

  const sendMessage = useMutation({
    mutationFn: postMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  return { messages, sendMessage };
}
```

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/chatbot

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Redis (for caching/sessions)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## Available Commands

- `/plan` - Create implementation plan before coding
- `/tdd` - Test-driven development workflow
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Never commit to main directly
- PRs require review
- All tests must pass before merge

## Audio Handling Notes

### Speech-to-Text (STT)

- Use Web Speech API for browser-based real-time STT
- Use Whisper API for more accurate transcription
- Handle audio stream chunks for real-time processing
- Implement noise cancellation and VAD (Voice Activity Detection)

### Text-to-Speech (TTS)

- Use Web Speech API for basic browser TTS
- Use ElevenLabs for high-quality voice synthesis
- Stream audio responses for better UX
- Cache common phrases to reduce API calls

### WebSocket for Real-time

- Use WebSocket for streaming chat responses
- Implement heartbeat/ping-pong for connection health
- Handle reconnection gracefully
- Buffer audio chunks for smooth playback

## Memory System

Refer to `docs/project_notes/` for:

- `bugs.md` - Bug tracking with solutions
- `decisions.md` - Architectural decisions (ADRs)
- `key_facts.md` - Project knowledge base
- `issues.md` - Current issues and blockers

## Development Workflow

1. Read CLAUDE.md first
2. Use `/plan` for new features
3. Follow TDD - write tests first
4. Run tests before committing
5. Create PR with description
