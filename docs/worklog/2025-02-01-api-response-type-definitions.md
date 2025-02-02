---
date: 2025-02-01
title: API Response Type Definitions Analysis
---

# Context

Analyzing the use of `interface` vs `type` for API response definitions, specifically regarding the ESLint rule `@typescript-eslint/consistent-type-definitions`.

# Current Implementation

```typescript
type MyResponse<T> = {
    status: 200 | 400 | 401 | 403 | 404 | 500;
    data?: T | undefined;
    message: string | undefined;
    error: string[];
}
```

# Analysis

## Project-Specific Considerations

1. API Contract Context
   - This project uses AWS API Gateway/Lambda backend
   - Response types represent contracts between frontend and backend
   - Types are shared across the codebase

2. Current TypeScript Configuration
   - Using recommended TypeScript ESLint rules
   - More strict configurations are commented out but planned
   - Strong emphasis on type safety and explicit checks

## Interface Advantages for API Types

1. Contract Definition
   - Interfaces better represent API contracts
   - More idiomatic for object-type definitions
   - Clearer intention that this is a public API shape

2. Extensibility
   - API responses often need variations
   - Interfaces support declaration merging
   - Easier to extend with additional response types

3. Error Clarity
   - Better error messages when extending
   - Clearer type checking errors
   - More helpful IDE suggestions

# Recommendation

1. Keep the `@typescript-eslint/consistent-type-definitions` rule enabled

2. Convert API response types to interfaces:

```typescript
interface MyResponse<T> {
    status: 200 | 400 | 401 | 403 | 404 | 500;
    data?: T | undefined;
    message: string | undefined;
    error: string[];
}
```

3. Consider creating a hierarchy of response interfaces:

```typescript
interface BaseResponse {
    status: 200 | 400 | 401 | 403 | 404 | 500;
    message: string | undefined;
    error: string[];
}

interface DataResponse<T> extends BaseResponse {
    data?: T;
}

interface ErrorResponse extends BaseResponse {
    status: 400 | 401 | 403 | 404 | 500;
    data?: never;
}
```

# Implementation Checklist

- [ ] Keep `@typescript-eslint/consistent-type-definitions` rule enabled
- [ ] Convert existing response types to interfaces
- [ ] Consider implementing response type hierarchy
- [ ] Update any type guards or utility types that work with response types
- [ ] Document decision in code comments with link to this analysis

# Rationale for Rule Enforcement

The rule should be enforced because:
1. It promotes consistency in API type definitions
2. It aligns with the project's emphasis on explicit contracts
3. It provides better tooling support for API types
4. It makes the codebase more maintainable

However, exceptions for using `type` should be allowed for:
- Union types
- Utility types
- Function types
- Complex mapped types

This maintains a balance between consistency and practical TypeScript usage.