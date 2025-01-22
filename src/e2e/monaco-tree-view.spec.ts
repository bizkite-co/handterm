import { ActivityType } from 'src/types/Types';
import { test, expect } from '@playwright/test';
import { signal, type Signal } from '@preact/signals-react';
import type * as Monaco from 'monaco-editor';

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize activity signal before navigation
    await page.addInitScript(() => {
      interface ActivityWindow extends Window {
        activitySignal: Signal<ActivityType>;
      }

      (window as unknown as ActivityWindow).activitySignal = signal(ActivityType.TREE);
    });

    await page.goto('http://localhost:5173/?activity=tree');
  });

  test('should load tree view from localStorage', async ({ page }) => {
    // Setup mock tree data
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' }
    ];

    // Initialize activity signal before navigation
    await page.addInitScript((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
      interface ActivityWindow extends Window {
        activitySignal: Signal<ActivityType>;
      }

      (window as unknown as ActivityWindow).activitySignal = signal(ActivityType.TREE);
    }, mockTreeData);

    // Navigate to page with tree activity
    await page.goto('http://localhost:5173/?activity=tree', {
      waitUntil: 'networkidle'
    });

    // Wait for Monaco editor to be fully initialized
    await page.waitForFunction(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;

      if (!monaco?.editor) return false;

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });

        // Check if editor is fully loaded and ready
        const isReady = typeof editor.getValue === 'function' &&
                       typeof editor.focus === 'function' &&
                       typeof editor.getModel === 'function';

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return isReady;
      } catch (error) {
        console.error('Monaco editor initialization error:', error);
        return false;
      }
    }, { timeout: 30000 });

    // Wait for tree activity to be set
    await page.waitForFunction(() => {
      interface ActivityWindow extends Window {
        activitySignal: Signal<ActivityType>;
      }

      const signal = (window as ActivityWindow).activitySignal;
      return signal.value === ActivityType.TREE;
    }, { timeout: 5000 });

    // Wait for Monaco editor initialization and tree view rendering
    await page.waitForSelector('.monaco-tree-row', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.monaco-tree-row');
      return rows.length >= 2 &&
             rows[0]?.textContent?.includes('src/main.ts') &&
             rows[1]?.textContent?.includes('src/components');
    }, { timeout: 10000 });

    // Verify tree view content
    const editorContent = await page.evaluate((): string => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return '';

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const content = editor.getValue();

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return typeof content === 'string' ? content : '';
      } catch (error) {
        console.error('Error getting editor content:', error);
        return '';
      }
    });

    console.log('Editor content:', editorContent);
    expect(editorContent).toContain('src/main.ts');
    expect(editorContent).toContain('src/components');
    expect(editorContent).toMatch(/src\/main\.ts\s+\[file\]/);
    expect(editorContent).toMatch(/src\/components\s+\[directory\]/);
  });

  test('should update tree view when localStorage changes', async ({ page }) => {
    // Initial empty state
    const editorContent = await page.evaluate(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return 'No files available';

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const content = editor.getValue();

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return typeof content === 'string' ? content : 'No files available';
      } catch (error) {
        console.error('Error getting editor content:', error);
        return 'No files available';
      }
    });
    expect(editorContent).toContain('No files available');

    // Update localStorage
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    // Trigger storage event
    await page.evaluate(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'github_tree_items',
        newValue: JSON.stringify([{ path: 'src/main.ts', type: 'blob' }])
      }));
    });

    // Wait for Monaco editor update
    await page.waitForFunction(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return false;

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) return false;

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) return false;

        const content = editor.getValue();
        if (typeof content !== 'string') return false;

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return content.includes('src/main.ts');
      } catch (error) {
        console.error('Error checking editor content:', error);
        return false;
      }
    });

    // Verify updated content
    const updatedContent = await page.evaluate(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return '';

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const content = editor.getValue();

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return typeof content === 'string' ? content : '';
      } catch (error) {
        console.error('Error getting editor content:', error);
        return '';
      }
    });

    console.log('Updated editor content:', updatedContent);
    expect(updatedContent).toContain('src/main.ts');
    expect(updatedContent).toMatch(/src\/main\.ts\s+\[file\]/);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Setup mock tree data with nested structure
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' },
      { path: 'src/components/Header.tsx', type: 'blob' }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data));
    }, mockTreeData);

    await page.reload();
    await page.waitForFunction(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return false;

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const isReady = typeof editor.getValue === 'function' &&
                       typeof editor.focus === 'function' &&
                       typeof editor.getModel === 'function';

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return isReady;
      } catch (error) {
        console.error('Monaco editor initialization error:', error);
        return false;
      }
    }, { timeout: 30000 });

    // Wait for tree view to be fully loaded
    await page.waitForSelector('.monaco-tree-row', { state: 'visible', timeout: 10000 });

    // Focus the editor
    await page.evaluate(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return;

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        editor.focus();

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);
      } catch (error) {
        console.error('Error focusing editor:', error);
      }
    });

    // Test down arrow (j key)
    await page.keyboard.press('j');
    let position = await page.evaluate(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return { lineNumber: 1, column: 1 };

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) return { lineNumber: 1, column: 1 };

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) return { lineNumber: 1, column: 1 };

        const position = editor.getPosition();
        if (!position) return { lineNumber: 1, column: 1 };

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return position;
      } catch (error) {
        console.error('Error getting editor position:', error);
        return null;
      }
    });
    expect(position?.lineNumber).toBe(2);

    // Test up arrow (k key)
    await page.keyboard.press('k');
    position = await page.evaluate(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return { lineNumber: 1, column: 1 };

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) return { lineNumber: 1, column: 1 };

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) return { lineNumber: 1, column: 1 };

        const position = editor.getPosition();
        if (!position) return { lineNumber: 1, column: 1 };

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return position;
      } catch (error) {
        console.error('Error getting editor position:', error);
        return null;
      }
    });
    expect(position?.lineNumber).toBe(1);

    // Test directory navigation
    await page.keyboard.press('j'); // Move to directory
    await page.keyboard.press('Enter'); // Expand directory
    await page.waitForFunction(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return false;

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const content = editor.getValue();

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return typeof content === 'string' && content.includes('Header.tsx');
      } catch (error) {
        console.error('Error checking editor content:', error);
        return false;
      }
    });

    // Test back navigation
    await page.keyboard.press('Control+o');
    await page.waitForFunction(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return false;

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const content = editor.getValue();

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return typeof content === 'string' &&
          content.includes('src/components') &&
          !content.includes('Header.tsx');
      } catch (error) {
        console.error('Error checking editor content:', error);
        return false;
      }
    });

    // Test file selection
    await page.keyboard.press('j'); // Move to file
    await page.keyboard.press('Enter'); // Select file
    const selectedPath = await page.evaluate(() => {
      interface MonacoWindow extends Window {
        monaco: typeof Monaco;
      }

      const monaco = (window as MonacoWindow).monaco;
      if (!monaco?.editor) return '';

      try {
        // Create container and model for editor
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        document.body.appendChild(container);

        const model = monaco.editor.createModel('', 'plaintext');
        if (!model) throw new Error('Failed to create model');

        const editor = monaco.editor.create(container, {
          model,
          value: '',
          language: 'plaintext'
        });
        if (!editor) throw new Error('Failed to create editor');

        const path = (window as typeof window & { selectedFilePath?: string })?.selectedFilePath;

        // Clean up
        editor.dispose();
        model.dispose();
        document.body.removeChild(container);

        return typeof path === 'string' ? path : '';
      } catch (error) {
        console.error('Error getting selected path:', error);
        return '';
      }
    });
    expect(selectedPath).toBe('src/main.ts');
  });
});
