import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

export function getMonacoLanguageForFile(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'py':
    case 'pyw':
      return 'python';
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'mts':
    case 'cts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'css':
      return 'css';
    case 'html':
    case 'htm':
      return 'html';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sql':
      return 'sql';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc':
      return 'cpp';
    default:
      return 'plaintext';
  }
}

function getPrismGrammar(lang: string): { grammar: Prism.Grammar | undefined; id: string } {
  switch (lang) {
    case 'python':
      return { grammar: Prism.languages.python, id: 'python' };
    case 'javascript':
      return { grammar: Prism.languages.javascript, id: 'javascript' };
    case 'typescript':
      return { grammar: Prism.languages.typescript, id: 'typescript' };
    case 'json':
      return { grammar: Prism.languages.json, id: 'json' };
    case 'shell':
      return { grammar: Prism.languages.bash, id: 'bash' };
    case 'yaml':
      return { grammar: Prism.languages.yaml, id: 'yaml' };
    case 'css':
      return { grammar: Prism.languages.css, id: 'css' };
    case 'html':
    case 'xml':
      return { grammar: Prism.languages.markup, id: 'markup' };
    case 'markdown':
      return { grammar: Prism.languages.markdown, id: 'markdown' };
    default:
      return { grammar: undefined, id: 'plaintext' };
  }
}

export function highlightCode(code: string, filename: string): string {
  const monacoLang = getMonacoLanguageForFile(filename);
  const { grammar, id } = getPrismGrammar(monacoLang);

  if (!grammar) {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return Prism.highlight(code, grammar, id);
}

export function renderHighlightedCode(code: string, filename: string, query?: string): string {
  const html = highlightCode(code, filename);
  const trimmed = query?.trim();
  if (!trimmed) {
    return html;
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?![^<]*>)(${escaped})`, 'gi');
  return html.replace(regex, '<mark class="browse-search-match">$1</mark>');
}
