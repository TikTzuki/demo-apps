# /plan - Implementation Planning

Create a detailed implementation plan before writing code.

## When to Use

- New feature implementation
- Complex refactoring
- Architecture changes
- Any task that affects multiple files

## Workflow

1. **Understand the Task**
    - Read the full request
    - Identify requirements and constraints
    - Ask clarifying questions if needed

2. **Analyze Codebase**
    - Read relevant existing code
    - Understand current patterns
    - Identify affected files

3. **Create Plan**
    - List files to create/modify
    - Define implementation steps
    - Consider edge cases
    - Note potential risks

4. **Get Approval**
    - Present plan to user
    - WAIT for user confirmation
    - Adjust based on feedback

5. **Execute**
    - Follow TDD workflow
    - Implement step by step
    - Test as you go

## Plan Template

```markdown
## Task: [Brief description]

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Affected Files
1. `path/to/file1.py` - Create/Modify: [description]
2. `path/to/file2.tsx` - Create/Modify: [description]

### Implementation Steps
1. Step 1
2. Step 2
3. Step 3

### Tests Required
- Unit tests for [...]
- Integration tests for [...]

### Risks
- Risk 1: [mitigation]
- Risk 2: [mitigation]

### Questions
- Question 1?
```

## Important

- ALWAYS wait for user approval before coding
- Never skip the planning phase for non-trivial tasks
- Update plan if requirements change
