# GitHub Copilot Instructions - Chat Bot Assistant

AI-powered chat bot with text-to-speech (TTS) and speech-to-text (STT) capabilities.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0+, Pydantic v2
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **AI**: Claude API, OpenAI Whisper, ElevenLabs TTS

## Coding Standards

### Python

- Use async/await for all I/O operations
- Type hints required for all functions
- Pydantic models for request/response validation
- Repository pattern for data access
- Follow PEP 8 style guide

### TypeScript

- Strict mode enabled
- No `any` types - use proper interfaces
- React Query for server state
- Zod for runtime validation
- Functional components with hooks only

## Key Patterns

### API Response

```python
class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
```

### Repository

```python
class BaseRepository(Generic[T]):
    async def get_by_id(self, id: UUID) -> Optional[T]: ...
    async def create(self, **kwargs) -> T: ...
```

### Custom Hook

```typescript
export function useChat() {
  const messages = useQuery({ queryKey: ['messages'], queryFn: fetchMessages });
  const sendMessage = useMutation({ mutationFn: postMessage });
  return { messages, sendMessage };
}
```

## Rules

1. **Immutability** - Never mutate, use spread operators
2. **Small Files** - 200-400 lines typical, 800 max
3. **Testing** - Write tests first (TDD), 80% coverage
4. **Security** - No hardcoded secrets, validate all inputs
5. **Error Handling** - Proper try/catch with logging

## Memory System

Refer to `docs/project_notes/` for:

- `bugs.md` - Bug tracking
- `decisions.md` - Architecture decisions
- `key_facts.md` - Project facts
