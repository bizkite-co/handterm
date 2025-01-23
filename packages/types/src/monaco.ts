import type { editor, Position } from 'monaco-editor'

export interface EditorInstance extends editor.IStandaloneCodeEditor {
  getValue(): string
  focus(): void
  dispose(): void
  getModel(): editor.ITextModel
  getPosition(): Position | null
}

export interface MonacoEditor {
  create(container: HTMLElement, options: { value?: string; language?: string; model?: editor.ITextModel }): EditorInstance
  createModel(value: string, language: string): editor.ITextModel
  setModelLanguage(model: editor.ITextModel, language: string): void
  defineTheme(name: string, theme: unknown): void
}

export interface MonacoWindow {
  monaco: {
    editor: MonacoEditor
  }
}

export const isMonacoWindow = (win: Window): win is Window & MonacoWindow => {
  const monaco = (win as unknown as MonacoWindow).monaco
  return typeof monaco?.editor?.createModel === 'function' &&
    typeof monaco?.editor?.create === 'function'
}

export const getMonaco = (): MonacoWindow['monaco'] | undefined => {
  if (!isMonacoWindow(window)) return undefined
  return window.monaco
}

export const getValidMonaco = (): MonacoEditor => {
  const monaco = getMonaco()
  if (!monaco?.editor) throw new Error('Monaco editor not initialized')
  return monaco.editor
}

export const withTempEditor = async <T>(fn: (editor: EditorInstance) => T | Promise<T>): Promise<T> => {
  const monaco = getValidMonaco()
  const container = document.createElement('div')
  container.style.width = '100%'
  container.style.height = '100%'
  document.body.appendChild(container)

  const model = monaco.createModel('', 'plaintext')
  if (!model) throw new Error('Failed to create model')

  const editor = monaco.create(container, {
    model,
    value: '',
    language: 'plaintext'
  })
  if (!editor) throw new Error('Failed to create editor')

  try {
    return await fn(editor)
  } finally {
    editor.dispose()
    model.dispose()
    document.body.removeChild(container)
  }
}