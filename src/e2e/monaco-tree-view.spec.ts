import { ActivityType, type ActivityTypeValues } from '@handterm/types'
import { test, expect, type Page } from '@playwright/test'
import { signal, type Signal } from '@preact/signals-react'
import { withTempEditor, isMonacoWindow } from '../../packages/types/src/monaco'

test.describe('Monaco Editor Tree View', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize activity signal before navigation
    await page.addInitScript(() => {
      interface ActivityWindow extends Window {
        activitySignal: Signal<ActivityTypeValues>
      }
      (window as unknown as ActivityWindow).activitySignal = signal(ActivityType.TREE)
    })

    await page.goto('http://localhost:5173/?activity=tree')
  })

  const waitForMonacoInit = async (page: Page): Promise<void> => {
    await page.waitForFunction(() => {
      if (!isMonacoWindow(window)) return false
      return withTempEditor(() => true).catch(() => false)
    }, { timeout: 30000 })
  }

  const getEditorContent = async (page: Page): Promise<string> => {
    const content = await page.evaluate(async () => {
      if (!isMonacoWindow(window)) return ''
      try {
        const editor = await withTempEditor(editor => {
          const value = editor.getValue()
          return typeof value === 'string' ? value : ''
        })
        return editor
      } catch {
        return ''
      }
    }).catch(() => '')
    return content
  }

  test('should load tree view from localStorage', async ({ page }) => {
    // Setup mock tree data
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' }
    ]

    // Initialize localStorage
    await page.addInitScript((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data))
    }, mockTreeData)

    // Wait for Monaco initialization
    await waitForMonacoInit(page)

    // Wait for tree view rendering
    await page.waitForSelector('.monaco-tree-row', { state: 'visible', timeout: 10000 })
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.monaco-tree-row')
      return rows.length >= 2 &&
        rows[0]?.textContent?.includes('src/main.ts') &&
        rows[1]?.textContent?.includes('src/components')
    }, { timeout: 10000 })

    // Verify tree view content
    const editorContent = await getEditorContent(page)
    expect(editorContent).toContain('src/main.ts')
    expect(editorContent).toContain('src/components')
    expect(editorContent).toMatch(/src\/main\.ts\s+\[file\]/)
    expect(editorContent).toMatch(/src\/components\s+\[directory\]/)
  })

  test('should update tree view when localStorage changes', async ({ page }) => {
    // Initial empty state
    await waitForMonacoInit(page)
    const initialContent = await getEditorContent(page)
    expect(initialContent).toBe('')

    // Update localStorage
    const mockTreeData = [{ path: 'src/main.ts', type: 'blob' }]
    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data))
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'github_tree_items',
        newValue: JSON.stringify(data)
      }))
    }, mockTreeData)

    // Wait for tree view update
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.monaco-tree-row')
      return rows.length === 1 && rows[0]?.textContent?.includes('src/main.ts')
    }, { timeout: 10000 })

    // Verify updated content
    const updatedContent = await getEditorContent(page)
    expect(updatedContent).toContain('src/main.ts')
    expect(updatedContent).toMatch(/src\/main\.ts\s+\[file\]/)
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Setup mock tree data
    const mockTreeData = [
      { path: 'src/main.ts', type: 'blob' },
      { path: 'src/components', type: 'tree' },
      { path: 'src/components/Header.tsx', type: 'blob' }
    ]

    await page.evaluate((data) => {
      localStorage.setItem('github_tree_items', JSON.stringify(data))
    }, mockTreeData)

    await waitForMonacoInit(page)

    // Wait for tree view to be fully loaded
    await page.waitForSelector('.monaco-tree-row', { state: 'visible', timeout: 10000 })

    // Test keyboard navigation
    await page.keyboard.press('j') // Move down
    await page.keyboard.press('Enter') // Expand directory
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.monaco-tree-row')
      return rows.length === 3 && rows[2]?.textContent?.includes('Header.tsx')
    }, { timeout: 10000 })

    await page.keyboard.press('Control+o') // Navigate back
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.monaco-tree-row')
      return rows.length === 2 && !rows[1]?.textContent?.includes('Header.tsx')
    }, { timeout: 10000 })

    // Verify final state
    const content = await getEditorContent(page)
    expect(content).toContain('src/main.ts')
    expect(content).toContain('src/components')
    expect(content).not.toContain('Header.tsx')
  })
})
