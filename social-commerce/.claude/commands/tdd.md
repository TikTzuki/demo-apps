# /tdd - Test-Driven Development

Enforce test-driven development workflow.

## TDD Cycle

```
RED → GREEN → REFACTOR
```

1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code quality

## Workflow

### Step 1: Write Test First

```python
# tests/unit/test_chat_service.py
import pytest
from app.services.chat import ChatService

@pytest.mark.asyncio
async def test_send_message_creates_message(db_session):
    service = ChatService(db_session)

    message = await service.send_message(
        user_id=test_user_id,
        content="Hello, world!",
        conversation_id=test_conversation_id
    )

    assert message.content == "Hello, world!"
    assert message.role == "user"
    assert message.conversation_id == test_conversation_id
```

### Step 2: Run Test - Should FAIL

```bash
pytest tests/unit/test_chat_service.py -v
# Expected: FAILED
```

### Step 3: Write Minimal Implementation

```python
# app/services/chat.py
class ChatService:
    def __init__(self, session):
        self.session = session
        self.message_repo = MessageRepository(session)

    async def send_message(self, user_id, content, conversation_id):
        return await self.message_repo.create(
            content=content,
            role="user",
            conversation_id=conversation_id
        )
```

### Step 4: Run Test - Should PASS

```bash
pytest tests/unit/test_chat_service.py -v
# Expected: PASSED
```

### Step 5: Refactor

- Improve code quality
- Add error handling
- Run tests again to ensure still passing

## Coverage Target

- **Minimum**: 80%
- **Recommended**: 90%+

```bash
pytest --cov=app --cov-report=term-missing
```

## Test Types

### Unit Tests

- Fast, isolated
- Mock external dependencies
- Test single function/method

### Integration Tests

- Test API endpoints
- Use test database
- Test service interactions

### E2E Tests

- Test full user flows
- Use Playwright
- Test critical paths

## Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/unit/test_chat_service.py

# Run tests matching pattern
pytest -k "test_send_message"

# Run with verbose output
pytest -v

# Run frontend tests
npm run test
```

## Important Rules

1. NEVER write implementation before test
2. Write one test at a time
3. Run tests frequently
4. Keep tests independent
5. Use meaningful test names
6. Mock external services
