# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):

1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows

## Test-Driven Development

MANDATORY workflow:

1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## Backend Testing (Python)

### pytest-asyncio Setup

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.fixture
async def db_session():
    async with test_session_maker() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

### Unit Test Example

```python
import pytest
from app.services.chat import ChatService

@pytest.mark.asyncio
async def test_create_message(db_session):
    service = ChatService(db_session)
    message = await service.create_message(
        content="Hello",
        conversation_id=test_conversation_id
    )
    assert message.content == "Hello"
    assert message.role == "user"
```

### Integration Test Example

```python
@pytest.mark.asyncio
async def test_send_message_endpoint(client, auth_headers):
    response = await client.post(
        "/api/v1/chat/messages",
        json={"content": "Hello", "conversation_id": str(conv_id)},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["content"] == "Hello"
```

## Frontend Testing (React)

### Vitest + Testing Library Setup

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### Component Test Example

```typescript
describe('ChatInput', () => {
  it('sends message when form is submitted', async () => {
    const onSend = vi.fn();
    render(<ChatInput onSendMessage={onSend} />);

    const input = screen.getByPlaceholderText(/type a message/i);
    const button = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('disables send button when loading', () => {
    render(<ChatInput onSendMessage={vi.fn()} isLoading />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMessages } from './useMessages';

describe('useMessages', () => {
  it('fetches messages for conversation', async () => {
    const { result } = renderHook(
      () => useMessages('conv-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
  });
});
```

## E2E Testing (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('user can send and receive messages', async ({ page }) => {
    await page.goto('/chat');

    // Type and send message
    await page.fill('[data-testid="chat-input"]', 'Hello');
    await page.click('[data-testid="send-button"]');

    // Verify message appears
    await expect(page.locator('[data-testid="message"]')).toContainText('Hello');

    // Wait for AI response
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible();
  });
});
```

## Test File Organization

```
backend/
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── unit/
│   │   ├── test_services.py
│   │   └── test_utils.py
│   └── integration/
│       └── test_api.py

frontend/
├── src/
│   ├── components/
│   │   ├── ChatInput.tsx
│   │   └── ChatInput.test.tsx  # Co-located tests
│   └── hooks/
│       ├── useChat.ts
│       └── useChat.test.ts
└── e2e/
    └── chat.spec.ts
```

## Running Tests

```bash
# Backend
pytest --cov=app --cov-report=term-missing

# Frontend
npm run test
npm run test:coverage

# E2E
npx playwright test
```
