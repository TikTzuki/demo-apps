# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

### Python

```python
# WRONG: Mutation
def update_user(user, name):
    user["name"] = name  # MUTATION!
    return user

# CORRECT: Immutability
def update_user(user, name):
    return {**user, "name": name}
```

### TypeScript

```typescript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return { ...user, name }
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

## Error Handling

### Python (FastAPI)

```python
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

async def risky_operation():
    try:
        result = await do_something()
        return result
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Operation failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### TypeScript (React)

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}
```

## Input Validation

### Python (Pydantic)

```python
from pydantic import BaseModel, Field, validator

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)

    @validator('content')
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()
```

### TypeScript (Zod)

```typescript
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content too long')
    .transform(s => s.trim())
})

const validated = messageSchema.parse(input)
```

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements (except development)
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
- [ ] Types are explicit (no `any` in TypeScript)
- [ ] Async operations handled properly
