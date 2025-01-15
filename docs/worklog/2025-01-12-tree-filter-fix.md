# 2025-01-12 Tree Filter Fix

## Task
Fix the tree item filtering in HandTermWrapper.tsx that is incorrectly filtering GitHub tree items. The filter should be replaced with a map operation to transform items while maintaining all entries.

## Problem Understanding
The current implementation uses a filter with `isTreeItem` type guard which is incorrectly removing valid items from the GitHub tree. GitHub tree items are either 'tree' or 'blob' types, and we need to transform these into our internal 'file' | 'directory' types while preserving all items.

## Plan
1. Replace the filter operation with a map operation
2. Transform GitHub tree items into our internal TreeItem type
3. Add proper type checking and validation
4. Ensure file icons are properly applied using the fileIcons utility

## Next Steps
1. Modify the tree item loading logic in HandTermWrapper.tsx
2. Verify the changes work with GitHub tree items
3. Ensure file icons are properly displayed
