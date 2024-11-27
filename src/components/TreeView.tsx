import React, { useEffect, useCallback } from 'react';
import { isTreeViewVisibleSignal, selectedTreeItemSignal, treeItemsSignal } from '../signals/treeViewSignals';
import { useComputed } from '@preact/signals-react';
import './TreeView.css';

interface TreeViewProps {
  onFileSelect: (path: string) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({ onFileSelect }) => {
  const isVisible = useComputed(() => isTreeViewVisibleSignal.value);
  const selectedItem = useComputed(() => selectedTreeItemSignal.value);
  const items = useComputed(() => treeItemsSignal.value);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible.value) {
      // Toggle tree view with Spacebar + e
      if (e.code === 'Space') {
        const handler = (e2: KeyboardEvent) => {
          if (e2.key === 'e') {
            isTreeViewVisibleSignal.value = true;
            document.removeEventListener('keyup', handler);
          }
        };
        document.addEventListener('keyup', handler);
        return;
      }
    } else {
      // Navigation when tree is visible
      switch (e.key) {
        case 'j':
          e.preventDefault();
          selectedTreeItemSignal.value = Math.min(
            selectedTreeItemSignal.value + 1,
            items.value.length - 1
          );
          break;
        case 'k':
          e.preventDefault();
          selectedTreeItemSignal.value = Math.max(
            selectedTreeItemSignal.value - 1,
            0
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedTreeItemSignal.value >= 0 && items.value[selectedTreeItemSignal.value]) {
            const item = items.value[selectedTreeItemSignal.value];
            if (item.type !== 'tree') {
              onFileSelect(item.path);
              isTreeViewVisibleSignal.value = false;
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          isTreeViewVisibleSignal.value = false;
          break;
      }
    }
  }, [isVisible.value, items.value, onFileSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isVisible.value) return null;

  return (
    <div className="tree-view">
      <div className="tree-view-header">
        Repository Files
        <span className="tree-view-help">
          j/k: navigate • Enter: open file • Esc: close
        </span>
      </div>
      <div className="tree-view-content">
        {items.value.map((item, index) => (
          <div
            key={item.path}
            className={`tree-view-item ${selectedItem.value === index ? 'selected' : ''}`}
          >
            {item.type === 'tree' ? '📁' : '📄'} {item.path}
          </div>
        ))}
      </div>
    </div>
  );
};
