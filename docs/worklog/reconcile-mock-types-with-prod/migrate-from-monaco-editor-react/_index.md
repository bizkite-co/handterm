# Migration from @monaco-editor/react to Direct Monaco Implementation

## Core Benefits
- Eliminate type translation layer between React wrapper and Monaco core
- Full control over editor lifecycle and configuration
- Align with established type validation patterns

## Implementation Blueprint

[Full Rewrite Checklist](./full-rewrite-checklist.md) - Detailed task breakdown for complete migration

### Phase 1: Core Replacement (50 LOC)
- [x] Remove `@monaco-editor/react` from package.json
- [ ] Base editor component:
```tsx
// components/DirectMonaco.tsx
import { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

export default function DirectMonaco({ value }: { value: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language: 'typescript',
      automaticLayout: true,
      minimap: { enabled: false }
    });

    return () => editorRef.current?.dispose();
  }, []);

  return <div ref={containerRef} style={{ height: '80vh' }} />;
}
```

### Phase 2: Feature Parity (70 LOC)
- [ ] VIM mode integration:
```typescript
const vimMode = initVimMode(editorRef.current);
// Add cleanup: vimMode.dispose()
```
- [ ] Tree view navigation
- [ ] Keyboard shortcuts
- [ ] File sync handlers

### Phase 3: Type Enforcement (20 LOC)
- [ ] Validation utilities:
```typescript
// packages/types/src/monaco.ts
export function validateEditor(
  editor: unknown
): editor is monaco.editor.IStandaloneCodeEditor {
  return !!editor && typeof (editor as any).getModel === 'function';
}
```
- [ ] Window type extension:
```typescript
declare global {
  interface Window {
    monacoEditor?: monaco.editor.IStandaloneCodeEditor;
  }
}
```

## Migration Safety
1. Dual implementations during transition
2. Type checking gate:
```bash
npm run type-check --watch
```
3. Runtime validation layer

## Effort Breakdown
| Task | Lines |
|------|-------|
| Dependency Removal | 5 |
| Core Editor | 75 |
| Type Safety | 25 |
| Test Updates | 45 |
| **Total** | **150** |