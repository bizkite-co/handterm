import { describe, expect, it } from 'vitest';
import {
  getMonacoLanguageForFile,
  highlightCode,
  renderHighlightedCode,
} from '../syntaxHighlight';

describe('syntaxHighlight', () => {
  it('detects correct Monaco and Prism languages for file extensions', () => {
    expect(getMonacoLanguageForFile('main.py')).toBe('python');
    expect(getMonacoLanguageForFile('script.pyw')).toBe('python');
    expect(getMonacoLanguageForFile('app.ts')).toBe('typescript');
    expect(getMonacoLanguageForFile('component.tsx')).toBe('typescript');
    expect(getMonacoLanguageForFile('index.js')).toBe('javascript');
    expect(getMonacoLanguageForFile('data.json')).toBe('json');
    expect(getMonacoLanguageForFile('run.sh')).toBe('shell');
    expect(getMonacoLanguageForFile('config.yaml')).toBe('yaml');
    expect(getMonacoLanguageForFile('styles.css')).toBe('css');
    expect(getMonacoLanguageForFile('index.html')).toBe('html');
    expect(getMonacoLanguageForFile('README.md')).toBe('markdown');
    expect(getMonacoLanguageForFile('unknown.xyz')).toBe('plaintext');
  });

  it('highlights Python code with Prism tokens', () => {
    const pyCode = 'def add(a, b):\n    return a + b';
    const highlighted = highlightCode(pyCode, 'test.py');
    expect(highlighted).toContain('class="token keyword">def</span>');
    expect(highlighted).toContain('class="token keyword">return</span>');
    expect(highlighted).toContain('class="token function">add</span>');
  });

  it('highlights search query inside code without breaking HTML tags', () => {
    const pyCode = 'def add(a, b):\n    return a + b';
    const rendered = renderHighlightedCode(pyCode, 'test.py', 'add');
    expect(rendered).toContain('<mark class="browse-search-match">add</mark>');
    expect(rendered).toContain('class="token function">');
  });

  it('escapes plaintext code safely', () => {
    const raw = '<script>alert("xss")</script>';
    const highlighted = highlightCode(raw, 'file.txt');
    expect(highlighted).not.toContain('<script>');
    expect(highlighted).toContain('&lt;script&gt;');
  });
});
