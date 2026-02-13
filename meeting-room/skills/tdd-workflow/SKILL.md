# TDD Workflow Skill

Test-Driven Development workflow for Python (pytest) and TypeScript (Vitest).

## TDD Cycle

```
RED → GREEN → REFACTOR → REPEAT
```

## Python Testing (pytest-asyncio)

### Test Configuration (conftest.py)

```python
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.core.database import Base
from app.api.deps import get_db

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionMaker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionMaker() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(test_user):
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}
```

### Unit Test Example

```python
import pytest
from uuid import uuid4
from app.services.chat import ChatService
from app.models.message import Message

@pytest.mark.asyncio
class TestChatService:

    async def test_send_message_creates_user_message(self, db_session, test_conversation):
        # Arrange
        service = ChatService(db_session)
        content = "Hello, world!"

        # Act
        message = await service.send_message(
            user_id=test_conversation.user_id,
            content=content,
            conversation_id=test_conversation.id
        )

        # Assert
        assert message is not None
        assert message.content == content
        assert message.role == "user"
        assert message.conversation_id == test_conversation.id

    async def test_send_message_fails_with_empty_content(self, db_session, test_conversation):
        # Arrange
        service = ChatService(db_session)

        # Act & Assert
        with pytest.raises(ValueError, match="Content cannot be empty"):
            await service.send_message(
                user_id=test_conversation.user_id,
                content="",
                conversation_id=test_conversation.id
            )

    async def test_get_messages_returns_conversation_messages(self, db_session, test_conversation, test_messages):
        # Arrange
        service = ChatService(db_session)

        # Act
        messages = await service.get_messages(
            conversation_id=test_conversation.id,
            user_id=test_conversation.user_id,
            limit=10
        )

        # Assert
        assert len(messages) == len(test_messages)
        assert all(m.conversation_id == test_conversation.id for m in messages)
```

### Integration Test Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestChatEndpoints:

    async def test_send_message_returns_201(self, client: AsyncClient, auth_headers, test_conversation):
        # Arrange
        payload = {
            "content": "Hello, AI!",
            "conversation_id": str(test_conversation.id)
        }

        # Act
        response = await client.post(
            "/api/v1/chat/messages",
            json=payload,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["content"] == "Hello, AI!"

    async def test_send_message_without_auth_returns_401(self, client: AsyncClient):
        # Arrange
        payload = {"content": "Hello"}

        # Act
        response = await client.post("/api/v1/chat/messages", json=payload)

        # Assert
        assert response.status_code == 401

    async def test_get_messages_returns_paginated_results(self, client: AsyncClient, auth_headers, test_conversation):
        # Act
        response = await client.get(
            f"/api/v1/chat/conversations/{test_conversation.id}/messages?limit=5",
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) <= 5
```

## TypeScript Testing (Vitest)

### Test Setup (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup (src/test/setup.ts)

```typescript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### Test Utilities (src/test/utils.tsx)

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Component Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ChatInput } from '@/components/chat/ChatInput';

describe('ChatInput', () => {
  it('renders input and send button', () => {
    render(<ChatInput onSendMessage={vi.fn()} />);

    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onSendMessage with trimmed content when form is submitted', async () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    const button = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: '  Hello, world!  ' } });
    fireEvent.click(button);

    expect(onSendMessage).toHaveBeenCalledWith('Hello, world!');
    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  it('clears input after sending message', async () => {
    render(<ChatInput onSendMessage={vi.fn()} />);

    const input = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(input.value).toBe('');
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput onSendMessage={vi.fn()} />);

    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('disables input and button when loading', () => {
    render(<ChatInput onSendMessage={vi.fn()} isLoading />);

    expect(screen.getByPlaceholderText(/type a message/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessages } from '@/hooks/useChat';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      { id: '1', content: 'Hello', role: 'user' },
      { id: '2', content: 'Hi there!', role: 'assistant' },
    ]),
  },
}));

describe('useMessages', () => {
  it('fetches messages for conversation', async () => {
    const { result } = renderHook(() => useMessages('conv-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].content).toBe('Hello');
  });

  it('does not fetch when conversationId is null', () => {
    const { result } = renderHook(() => useMessages(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
```

## Running Tests

```bash
# Python
pytest                              # Run all tests
pytest -v                           # Verbose output
pytest --cov=app                    # With coverage
pytest -k "test_send_message"       # Filter by name
pytest tests/unit/                  # Run specific directory

# TypeScript
npm run test                        # Run all tests
npm run test:watch                  # Watch mode
npm run test:coverage               # With coverage
npm run test -- ChatInput           # Filter by name
```

## Coverage Targets

| Type        | Minimum | Recommended |
|-------------|---------|-------------|
| Unit        | 80%     | 90%         |
| Integration | 70%     | 80%         |
| Overall     | 80%     | 85%         |
