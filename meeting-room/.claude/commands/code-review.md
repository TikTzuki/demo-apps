# /code-review - Code Quality Review

Review code for quality, security, and best practices.

## Review Checklist

### Code Quality

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] No code duplication
- [ ] Proper error handling
- [ ] No TODO comments without tickets

### Security

- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication/authorization checked
- [ ] Error messages don't leak info

### Testing

- [ ] Tests exist for new code
- [ ] Tests are meaningful (not just coverage)
- [ ] Edge cases covered
- [ ] Mocking used appropriately

### Performance

- [ ] No N+1 queries
- [ ] Async operations used correctly
- [ ] No memory leaks
- [ ] Efficient algorithms

### TypeScript/Python

- [ ] Types are explicit (no `any`)
- [ ] Pydantic models used for validation
- [ ] Immutable patterns used
- [ ] No unused imports/variables

## Review Process

1. **Read the Code**
    - Understand the intent
    - Follow the logic flow

2. **Check Patterns**
    - Verify coding standards
    - Check for anti-patterns

3. **Security Scan**
    - Look for vulnerabilities
    - Check input validation

4. **Test Coverage**
    - Verify tests exist
    - Check test quality

5. **Provide Feedback**
    - Be specific and constructive
    - Suggest improvements
    - Praise good practices

## Output Format

```markdown
## Code Review: [File/Feature]

### Summary
[Brief overview of the code]

### Issues Found

#### Critical
- [ ] Issue 1: [description]
  - Location: `file:line`
  - Fix: [suggestion]

#### Warning
- [ ] Issue 2: [description]
  - Location: `file:line`
  - Fix: [suggestion]

#### Suggestion
- [ ] Issue 3: [description]
  - Location: `file:line`
  - Fix: [suggestion]

### Good Practices
- [Something done well]
- [Something done well]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

## Severity Levels

- **Critical**: Must fix before merge (security, bugs)
- **Warning**: Should fix (code quality, maintainability)
- **Suggestion**: Nice to have (style, optimization)
