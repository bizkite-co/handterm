# Monaco Editor Full Rewrite Checklist

## Implementation Phases

### Phase 1: Core Editor Foundation
- [x] Create `MonacoCore.tsx` component shell
- [x] Implement base editor initialization/cleanup
- [x] Add value synchronization with props
- [x] Configure essential editor options:
  ```tsx
  const editorOptions = {
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    readOnly: false
  };
  ```

### Phase 2: Type Safety
- [ ] Strict monaco namespace imports
- [ ] Runtime type validation:
  ```tsx
  export const isValidEditor = (
    instance: unknown
  ): instance is monaco.editor.IStandaloneCodeEditor => {
    return !!instance && typeof (instance as any).getModel === 'function';
  };
  ```
- [ ] Window interface extension
- [ ] TODO: Move all Monaco-related types to @handterm/types:
  - [ ] IStandaloneCodeEditor
  - [ ] ITextModel
  - [ ] IActionDescriptor
  - [ ] KeyCode/KeyMod
  - [ ] Editor options interface
  - [ ] VIM mode types
- [ ] TODO: Add runtime type validation utilities:
  - [ ] Editor instance validation
  - [ ] Model validation
  - [ ] Action validation
  - [ ] Configuration validation
- [ ] TODO: Add type guards for Playwright compatibility:
  - [ ] Editor state validation
  - [ ] Content validation
  - [ ] Selection state validation
  - [ ] Configuration state validation
- [ ] TODO: Update imports to use @handterm/types:
  - [ ] Update DirectMonaco.tsx
  - [ ] Update test files
  - [ ] Update any components using Monaco types

### Phase 3: Feature Parity
- [ ] VIM mode integration with proper disposal
- [ ] Keyboard navigation (J/K keys)
- [ ] File tree view integration
- [ ] Editor action system (save/format)

### Phase 4: Testing & Validation
- [ ] Update Playwright tests for new DOM structure
- [ ] Verify type sharing with test suites
- [ ] Final linting pass

## Progress Tracking
- Total Tasks: 15
- Completed: 4
- Estimated Implementation Time: 13 hours (4 phases)

### Implementation Timeline
| Phase | Description | Hours | Key Challenges |
|-------|-------------|-------|----------------|
| 1 | Core Editor Foundation | 3.5 | Lifecycle management, Layout synchronization |
| 2 | Feature Parity | 4 | VIM mode integration, Keyboard handling |
| 3 | Type Safety | 2.5 | Type conflicts, Namespace management |
| 4 | Testing & Validation | 3 | Playwright updates, Type sharing verification |

### Time Breakdown by Phase
| Phase | Tasks | Hours | Complexity |
|-------|-------|-------|------------|
| 1. Core Foundation | 5 | 3-4 | Medium |
| 2. Feature Parity | 4 | 4-5 | High |
| 3. Type Safety | 3 | 2-3 | Medium |
| 4. Testing | 3 | 3-4 | High |

### Recommended Workflow
1. Core implementation (3 hours):
   ```bash
   npm run dev -- --force  # Bypass type checks during initial implementation
   # Temporary test type suppression:
   # Add @ts-nocheck to test files interacting with Monaco
   # Update .eslintrc.cjs overrides for test directories
   git checkout -b monaco-phase1  # Work in isolation
   ```
2. Type safety refinement (2 hours)
3. Feature integration (4 hours)
4. Final testing/validation (3 hours)

This can be executed over 4 focused work sessions.

### Type Migration Strategy
1. Move all Monaco-related types to @handterm/types:
   ```typescript
   // packages/types/src/monaco.ts
   import type * as monaco from 'monaco-editor';

   export interface EditorOptions extends monaco.editor.IEditorOptions {
     // Add any custom options
   }

   export interface EditorState {
     value: string;
     selection?: monaco.Selection;
     scrollPosition?: monaco.editor.IScrollPosition;
   }

   // Add type guards for Playwright
   export function isValidEditorState(state: unknown): state is EditorState {
     // Implementation
   }
   ```

2. Update imports in components:
   ```typescript
   // Before
   import type * as monaco from 'monaco-editor';

   // After
   import type { EditorOptions, EditorState } from '@handterm/types';
   ```

3. Add runtime validation:
   ```typescript
   // packages/types/src/monaco.ts
   export function validateEditor(editor: unknown): editor is IStandaloneCodeEditor {
     return (
       !!editor &&
       typeof (editor as any).getModel === 'function' &&
       typeof (editor as any).dispose === 'function'
     );
   }
   ```

4. Update test utilities:
   ```typescript
   // test-utils/monaco.ts
   import type { EditorState } from '@handterm/types';

   export function createMockEditor(): EditorState {
     // Implementation
   }