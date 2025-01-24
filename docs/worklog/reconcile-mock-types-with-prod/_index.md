# Shared Types Package Implementation Plan

## FAQ

Q: So, generally speaking, it is the use of Playwright in the CI/CD that neccessited the publishing of the HandTerm package?

A: Let's analyze this architectural relationship systematically:

1. **Core Issue Identification**:
- The primary driver for package publication is type sharing between:
  a) The main application
  b) Playwright test suites
  c) CI/CD pipelines
- Without a published package, type resolution fails in CI due to:
  ```ts
  // In Playwright tests:
  import type { TerminalEvent } from 'handterm-types'; // Fails without published package
  ```

2. **Key Architectural Drivers**:
- **Type Validation Requirements**: Playwright tests need to verify type compliance of serialized state
- **Decoupled Test Environment**: CI pipelines run tests in isolation without local project references
- **Version Pinning**: Need to ensure test suites validate against exact type versions

3. **Alternative Solutions Considered**:
- Relative imports (`../../packages/types`) - breaks in CI
- Type declaration bundles - doesn't solve runtime validation
- Git submodules - complicates CI caching

4. **Validation Through Code Analysis**:
```ts
// packages/types/src/activity.ts
export interface ActivityState {
  id: string;
  // Used in both app and test assertions
  content: string;
  meta: {
    // Complex structure requiring shared validation
    created: Date;
    version: number;
  };
}
```
Playwright tests must validate these structures during serialization/deserialization tests.

5. **CI Pipeline Dependency**:
```yaml
# Hypothetical CI configuration
- name: Install dependencies
  run: |
    npm install
    npm install handterm-types@latest # Requires published package
```

6. **Secondary Benefits**:
- Enables future microservices architecture
- Facilitates third-party integration
- Simplifies monorepo type management

The original insight is partially correct but incomplete. The CI/CD requirement was a catalyst, but the deeper architectural need is maintaining type integrity across distributed testing environments and deployment targets.

## Analysis

The package publication was necessitated by multiple architectural factors:

1. **Cross-Environment Type Validation**: Playwright tests require strict type validation of serialized state that must match production types exactly

2. **Isolated CI Contexts**: CI pipelines need immutable type versions separate from local development

3. **Runtime Type Safety**: Published package includes Zod validation schemas used in both app and tests:
```ts
// packages/types/src/validation.ts
export const ActivitySchema = z.object({
  id: z.string().uuid(),
  content: z.string().max(5000),
  meta: z.object({
    created: z.date(),
    version: z.number().int().positive()
  })
});
```

4. **Versioned Contracts**: Ensures backward compatibility as types evolve

The CI/CD requirement was a surface manifestation of deeper architectural needs around type integrity and environmental isolation.

* [Test Types Analysis](.analysis.md)

## Task Phases

NOTE: Never remove a checkbox. If you find a checkbox we no longer need, mark it complete and add a comment explaining why.


* [x] Phase 1: [Create Package Structure](.create-package-structure.md)
* [x] Phase 2: [Configure Package](configure-package.md)
* [x] Phase 3: [Define Initial Types](.define-initial-types.md)
* [ ] Phase 4: [Migration Plan](.migration-plan.md)
* [ ] Phase 5: [Module Resolution and Test Environment](.module-resolution-and-test-environment.md)
* [~] Phase 6: Type System Cleanup
  - [ ] [Core Type Unification](type-system-cleanup.md)
  - [~] [Signal Interface Alignment](signal-type-unification.md) (partial - brand symbols added)
  - [~] [Monaco Type Consolidation](monaco-type-consolidation.md) (partial - monaco-tree-view.spec.ts completed)
  - [~] [Migrate from Monaco Editor React](./migrate-from-monaco-editor-react/_index.md)
  - [x] Document 2025-01-22 session progress - Added simplified validation pattern
  - [x] Implemented runtime validation for external libraries
  - [ ] Update remaining signal docs with new pattern
* [ ] Phase 7: [Testing and Documentation](.testing-and-documentation.md)

## Instructions
1. Check each box when the task is completed and verified
2. Add any additional tasks as needed
3. Use this list to track progress