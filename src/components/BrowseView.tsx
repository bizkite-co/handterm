import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ActivityType, StorageKeys, TokenKeys, type IAuthProps } from '@handterm/types';
import { getFile, listFiles, putFile } from '../utils/awsApiClient';
import { getRepoContent, getRepoTree, listRecentRepos } from '../utils/apiClient';
import {
  githubFileDetails,
  listBrowsePath,
  moveSelection,
  parentPath,
  parseBrowsePath,
  s3ObjectKey,
  type BrowseEntry,
  type BrowseListDeps,
} from '../utils/browseFs';
import { getFileIcon, getFolderIcon } from '../utils/fileIcons';
import { navigate, parseLocation } from '../utils/navigationUtils';
import './BrowseView.css';

export interface BrowseViewProps {
  auth: IAuthProps;
  deps?: Partial<BrowseListDeps>;
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function useTerminalSpinner(isActive: boolean): string {
  const [frameIndex, setFrameIndex] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [isActive]);
  return SPINNER_FRAMES[frameIndex] ?? '⠋';
}

const CACHE_PREFIX = 'browse_cache:';
function getBrowseCache(key: string): BrowseEntry[] | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_PREFIX + key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setBrowseCache(key: string, entries: BrowseEntry[]): void {
  try {
    if (typeof localStorage !== 'undefined' && entries.length > 0 && !entries.some((e) => e.kind === 'message')) {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entries));
    }
  } catch {
    // Ignore quota or private-browsing errors
  }
}

const PREVIEW_CACHE_PREFIX = 'browse_preview:';
function getPreviewCache(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(PREVIEW_CACHE_PREFIX + key) : null;
  } catch {
    return null;
  }
}

function setPreviewCache(key: string, content: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREVIEW_CACHE_PREFIX + key, content);
    }
  } catch {
    // Ignore quota errors
  }
}

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) {
    return text;
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? <mark key={index}>{part}</mark> : part
  );
}

function iconFor(entry: BrowseEntry): string {
  if (entry.kind === 'message') {
    return '!';
  }
  if (entry.kind === 'mount' || entry.kind === 'dir') {
    return getFolderIcon(false);
  }
  return getFileIcon(entry.name);
}

function Column(props: {
  className: string;
  entries: BrowseEntry[];
  selectedPath: string | null;
  onSelect: (index: number) => void;
  isLoading?: boolean;
  spinnerChar?: string;
  searchQuery?: string;
}): JSX.Element {
  return (
    <div className={`browse-col ${props.className}`} role="list">
      {props.isLoading && props.entries.length === 0 ? (
        <div className="browse-empty browse-loading">
          <span className="browse-spinner">{props.spinnerChar ?? '⠋'}</span> loading...
        </div>
      ) : props.entries.length === 0 ? (
        <div className="browse-empty">Empty</div>
      ) : (
        props.entries.map((entry, index) => (
          <div
            key={entry.path + entry.name}
            role="listitem"
            className={`browse-row${entry.path === props.selectedPath ? ' selected' : ''}${entry.kind === 'message' ? ' message' : ''}`}
            onMouseDown={() => { props.onSelect(index); }}
          >
            <span>{iconFor(entry)}</span>
            <span>
              {props.searchQuery
                ? renderHighlightedText(entry.name, props.searchQuery)
                : entry.name}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export function BrowseView(props: BrowseViewProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const [path, setPath] = useState(() => parseLocation().contentKey ?? '');
  const [entries, setEntries] = useState<BrowseEntry[]>(() => getBrowseCache(parseLocation().contentKey ?? 'root') ?? []);
  const [parentEntries, setParentEntries] = useState<BrowseEntry[]>([]);
  const [childEntries, setChildEntries] = useState<BrowseEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChildLoading, setIsChildLoading] = useState(false);

  // Preview state
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Prompt / Search state
  const [promptMode, setPromptMode] = useState<'none' | 'create' | 'search'>('none');
  const [promptValue, setPromptValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const spinner = useTerminalSpinner(isLoading || isChildLoading || isPreviewLoading);

  const authRef = useRef(props.auth);
  authRef.current = props.auth;
  const customDepsRef = useRef(props.deps);
  customDepsRef.current = props.deps;

  const githubUsername = typeof localStorage !== 'undefined'
    ? (localStorage.getItem(TokenKeys.GithubUsername) ?? localStorage.getItem('github_username'))
    : null;

  const deps: BrowseListDeps = useMemo(() => ({
    isLoggedIn: props.auth.isLoggedIn,
    githubUsername,
    listS3: async () => {
      const custom = customDepsRef.current?.listS3;
      if (custom) return custom();
      const response = await listFiles(authRef.current);
      return { status: response.status, files: response.data?.files, error: response.error };
    },
    listGithubRepos: async () => {
      const custom = customDepsRef.current?.listGithubRepos;
      if (custom) return custom();
      const response = await listRecentRepos(authRef.current);
      return { status: response.status, repos: response.data, error: response.error };
    },
    listGithubTree: async (repo: string) => {
      const custom = customDepsRef.current?.listGithubTree;
      if (custom) return custom(repo);
      const response = await getRepoTree(authRef.current, repo);
      return { status: response.status, items: response.data, error: response.error };
    },
    getS3Content: async (key: string) => {
      const custom = customDepsRef.current?.getS3Content;
      if (custom) return custom(key);
      const response = await getFile(authRef.current, key);
      return { status: response.status, content: response.data?.content, error: response.error };
    },
    getGithubContent: async (repo: string, filePath: string) => {
      const custom = customDepsRef.current?.getGithubContent;
      if (custom) return custom(repo, filePath);
      const response = await getRepoContent(authRef.current, repo, filePath);
      return { status: response.status, content: response.data?.content, error: response.error };
    },
    createS3Resource: async (key: string, content = '') => {
      const custom = customDepsRef.current?.createS3Resource;
      if (custom) return custom(key, content);
      const response = await putFile(authRef.current, key, content);
      return { status: response.status, error: response.error };
    },
  }), [props.auth.isLoggedIn, githubUsername]);

  const displayEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }
    const q = searchQuery.toLowerCase();
    const filtered = entries.filter((e) => e.name.toLowerCase().includes(q));
    return filtered.length > 0 ? filtered : entries;
  }, [entries, searchQuery]);

  const selected = displayEntries[selectedIndex] ?? entries[selectedIndex] ?? null;

  // Navigate to a new path and sync with the URL querystring for GitHub Pages / reloads
  const navigateToPath = useCallback((nextPath: string) => {
    setPath(nextPath);
    setSearchQuery('');
    void navigate({
      activityKey: ActivityType.BROWSE,
      contentKey: nextPath === '' ? null : nextPath,
      groupKey: null,
    });
  }, []);

  // Listen to external location changes (e.g. browser back/forward buttons or direct navigations)
  useEffect(() => {
    const handleUrlChange = () => {
      const parsed = parseLocation();
      if (parsed.activityKey === ActivityType.BROWSE) {
        const urlPath = parsed.contentKey ?? '';
        setPath((curr) => (curr !== urlPath ? urlPath : curr));
      }
    };
    window.addEventListener('locationchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('locationchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const load = useCallback(async (nextPath: string, keepIndex = 0) => {
    const cacheKey = nextPath === '' ? 'root' : nextPath;
    const cached = getBrowseCache(cacheKey);
    if (cached && cached.length > 0) {
      setEntries(cached);
      setSelectedIndex(Math.min(keepIndex, Math.max(0, cached.length - 1)));
    }

    setIsLoading(true);
    try {
      const current = await listBrowsePath(nextPath, deps);
      setEntries(current.entries);
      setBrowseCache(cacheKey, current.entries);
      setSelectedIndex(Math.min(keepIndex, Math.max(0, current.entries.length - 1)));
      setStatusMessage(current.entries.find((e) => e.kind === 'message')?.message ?? null);

      const parent = parentPath(nextPath);
      if (parent === nextPath) {
        setParentEntries([]);
      } else {
        const parentCacheKey = parent === '' ? 'root' : parent;
        const cachedParent = getBrowseCache(parentCacheKey);
        if (cachedParent && cachedParent.length > 0) {
          setParentEntries(cachedParent);
        }
        const parentResult = await listBrowsePath(parent, deps);
        setParentEntries(parentResult.entries);
        setBrowseCache(parentCacheKey, parentResult.entries);
      }
    } finally {
      setIsLoading(false);
    }
  }, [deps]);

  useEffect(() => {
    void load(path);
  }, [path, load, props.auth.isLoggedIn]);

  // Child directory entries effect
  useEffect(() => {
    if (selected === null || (selected.kind !== 'dir' && selected.kind !== 'mount')) {
      setChildEntries([]);
      return;
    }

    const cachedChild = getBrowseCache(selected.path);
    if (cachedChild && cachedChild.length > 0) {
      setChildEntries(cachedChild);
    }

    setIsChildLoading(true);
    let cancelled = false;
    void listBrowsePath(selected.path, deps).then((result) => {
      if (!cancelled) {
        setChildEntries(result.entries);
        setBrowseCache(selected.path, result.entries);
        setIsChildLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setIsChildLoading(false);
      }
    });

    return () => {
      cancelled = true;
      setIsChildLoading(false);
    };
  }, [selected?.path, selected?.kind, deps]);

  // File preview effect
  useEffect(() => {
    if (selected === null || selected.kind !== 'file') {
      setPreviewContent(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    const cached = getPreviewCache(selected.path);
    if (cached !== null) {
      setPreviewContent(cached);
    } else {
      setPreviewContent(null);
    }

    let cancelled = false;
    setIsPreviewLoading(true);
    setPreviewError(null);

    const fetchPreview = async () => {
      const { mount } = parseBrowsePath(selected.path);
      try {
        if (mount === 's3') {
          const key = s3ObjectKey(selected.path);
          const res = deps.getS3Content
            ? await deps.getS3Content(key)
            : await getFile(props.auth, key).then((r) => ({
                status: r.status,
                content: r.data?.content,
                error: r.error,
              }));
          if (!cancelled) {
            if (res.status === 200 && res.content !== undefined) {
              setPreviewContent(res.content);
              setPreviewCache(selected.path, res.content);
            } else {
              setPreviewError(res.error ?? 'Could not load S3 preview.');
            }
          }
        } else if (mount === 'github') {
          const details = githubFileDetails(selected.path, githubUsername);
          if (details) {
            const res = deps.getGithubContent
              ? await deps.getGithubContent(details.repo, details.path)
              : await getRepoContent(props.auth, details.repo, details.path).then((r) => ({
                  status: r.status,
                  content: r.data?.content,
                  error: r.error,
                }));
            if (!cancelled) {
              if (res.status === 200 && res.content !== undefined) {
                setPreviewContent(res.content);
                setPreviewCache(selected.path, res.content);
              } else {
                setPreviewError(res.error ?? 'Could not load GitHub preview.');
              }
            }
          } else {
            if (!cancelled) setPreviewError('Invalid GitHub path.');
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(err?.message ?? 'Failed to load preview.');
        }
      } finally {
        if (!cancelled) {
          setIsPreviewLoading(false);
        }
      }
    };

    void fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [selected?.path, selected?.kind, deps, props.auth]);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    if (promptMode !== 'none') {
      promptInputRef.current?.focus();
    }
  }, [promptMode]);

  const openSelected = useCallback(async () => {
    if (selected === null || selected.kind === 'message') {
      return;
    }
    if (selected.kind === 'dir' || selected.kind === 'mount') {
      navigateToPath(selected.path);
      return;
    }
    if (selected.kind === 'file') {
      const { mount } = parseBrowsePath(selected.path);
      if (mount === 's3') {
        const filename = s3ObjectKey(selected.path);
        let content = previewContent;
        if (content === null) {
          const res = deps.getS3Content
            ? await deps.getS3Content(filename)
            : await getFile(props.auth, filename).then((r) => ({
                status: r.status,
                content: r.data?.content,
              }));
          content = res.content ?? '';
        }
        localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
        void navigate({
          activityKey: ActivityType.EDIT,
          contentKey: filename,
          groupKey: null,
        });
      } else if (mount === 'github') {
        const details = githubFileDetails(selected.path, githubUsername);
        if (!details) {
          setStatusMessage('Could not parse GitHub file path.');
          return;
        }
        let content = previewContent;
        if (content === null) {
          const res = deps.getGithubContent
            ? await deps.getGithubContent(details.repo, details.path)
            : await getRepoContent(props.auth, details.repo, details.path).then((r) => ({
                status: r.status,
                content: r.data?.content,
              }));
          content = res.content ?? '';
        }
        localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
        void navigate({
          activityKey: ActivityType.EDIT,
          contentKey: `${details.repo}/${details.path}`,
          groupKey: null,
        });
      }
    }
  }, [deps, navigateToPath, previewContent, props.auth, selected]);

  const handleCreateResource = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setPromptMode('none');
      rootRef.current?.focus();
      return;
    }
    const prefix = s3ObjectKey(path);
    const cleanPrefix = prefix.replace(/\/+$/, '');
    const fullKey = cleanPrefix ? `${cleanPrefix}/${trimmed}` : trimmed;

    setIsLoading(true);
    try {
      if (deps.createS3Resource) {
        const result = await deps.createS3Resource(fullKey, '');
        if (result.status === 200 || result.status === 201) {
          setStatusMessage(`Created ${fullKey}`);
        } else {
          setStatusMessage(result.error ?? `Failed to create ${fullKey}`);
        }
      } else {
        const result = await putFile(props.auth, fullKey, '');
        if (result.status === 200 || result.status === 201) {
          setStatusMessage(`Created ${fullKey}`);
        } else {
          setStatusMessage(result.error ?? `Failed to create ${fullKey}`);
        }
      }
      try {
        localStorage.removeItem(CACHE_PREFIX + (path === '' ? 'root' : path));
      } catch {
        // Ignore storage errors
      }
      await load(path);
    } catch (err: any) {
      setStatusMessage(err?.message ?? 'Creation failed');
    } finally {
      setIsLoading(false);
      setPromptMode('none');
      setPromptValue('');
      rootRef.current?.focus();
    }
  }, [path, deps, props.auth, load]);

  // Window-level keydown handler ensures h/j/k/l work even if container div does not currently have focus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow input elements (search / resource creation) to receive native keystrokes
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (promptMode !== 'none') {
        return;
      }

      const key = event.key;
      if (
        !['h', 'j', 'k', 'l', 'Enter', 'Escape', 'q', '/', 'a', 's', 'f', 'J', 'K'].includes(key)
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (key === 'Escape' || key === 'q') {
        void navigate({
          activityKey: ActivityType.NORMAL,
          contentKey: null,
          groupKey: null,
        });
        return;
      }
      if (key === 'j') {
        setSelectedIndex((index) => moveSelection(index, displayEntries.length, 1));
        return;
      }
      if (key === 'k') {
        setSelectedIndex((index) => moveSelection(index, displayEntries.length, -1));
        return;
      }
      if (key === 'h') {
        navigateToPath(parentPath(path));
        return;
      }
      if (key === 'l' || key === 'Enter') {
        void openSelected();
        return;
      }
      if (key === '/') {
        navigateToPath('');
        return;
      }
      if (key === 's' || key === 'f') {
        setPromptMode('search');
        setPromptValue(searchQuery);
        return;
      }
      if (key === 'a') {
        const { mount } = parseBrowsePath(path);
        if (mount !== 's3') {
          setStatusMessage('Resource creation is supported in S3 directories.');
          return;
        }
        setPromptMode('create');
        setPromptValue('');
        return;
      }
      if (key === 'J') {
        previewRef.current?.scrollBy({ top: 80, behavior: 'smooth' });
        return;
      }
      if (key === 'K') {
        previewRef.current?.scrollBy({ top: -80, behavior: 'smooth' });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [promptMode, displayEntries.length, path, searchQuery, openSelected, navigateToPath]);

  return (
    <div
      id="browse-view"
      className="browse-view"
      data-testid="browse-view"
      tabIndex={0}
      ref={rootRef}
    >
      <div className="browse-hint">
        {(isLoading || isChildLoading || isPreviewLoading) && (
          <span className="browse-spinner-tag">{spinner} syncing... — </span>
        )}
        h parent, j/k move, l/Enter open, / root, a new, s search, J/K scroll, q/Esc leave
        {statusMessage !== null ? ` — ${statusMessage}` : ''}
      </div>

      <div className="browse-blank-line" />

      <div className="browse-columns">
        <div className="browse-column-wrapper parent">
          <div className="browse-col-path">
            {parentPath(path) === '' ? (path === '' ? '' : '/') : `/${parentPath(path)}`}
          </div>
          <Column
            className="parent"
            entries={parentEntries}
            selectedPath={path === '' ? null : path}
            onSelect={() => { navigateToPath(parentPath(path)); }}
          />
        </div>

        <div className="browse-column-wrapper current">
          <div className="browse-col-path browse-breadcrumb" data-testid="top-col-path">
            {path === '' ? '/' : `/${path}`}
          </div>
          <Column
            className="current"
            entries={displayEntries}
            selectedPath={selected?.path ?? null}
            onSelect={setSelectedIndex}
            isLoading={isLoading}
            spinnerChar={spinner}
            searchQuery={searchQuery}
          />
        </div>

        <div className="browse-column-wrapper child">
          <div className="browse-col-path" data-testid="bottom-col-path">
            {selected ? (selected.path === '' ? '/' : `/${selected.path}`) : ''}
          </div>
          {selected?.kind === 'file' ? (
            <div
              className="browse-col child browse-preview-col"
              ref={previewRef}
              tabIndex={-1}
              data-testid="browse-preview"
            >
              {isPreviewLoading && previewContent === null ? (
                <div className="browse-empty browse-loading">
                  <span className="browse-spinner">{spinner}</span> loading preview...
                </div>
              ) : previewError ? (
                <div className="browse-empty">{previewError}</div>
              ) : previewContent !== null ? (
                <pre className="browse-preview-content">
                  {renderHighlightedText(previewContent, searchQuery)}
                </pre>
              ) : (
                <div className="browse-preview-empty">Empty file</div>
              )}
            </div>
          ) : (
            <Column
              className="child"
              entries={childEntries}
              selectedPath={null}
              isLoading={isChildLoading}
              spinnerChar={spinner}
              onSelect={(index) => {
                const child = childEntries[index];
                if (child !== undefined && (child.kind === 'dir' || child.kind === 'mount' || child.kind === 'file')) {
                  setSelectedIndex(entries.findIndex((e) => e.path === selected?.path));
                  if (child.kind === 'file') {
                    navigateToPath(parentPath(child.path));
                  } else {
                    navigateToPath(child.path);
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      {promptMode !== 'none' && (
        <div className="browse-prompt-bar">
          <span className="browse-prompt-label">
            {promptMode === 'create' ? 'New S3 item (trailing / for folder):' : 'Search:'}
          </span>
          <input
            ref={promptInputRef}
            className="browse-prompt-input"
            type="text"
            value={promptValue}
            onChange={(e) => {
              setPromptValue(e.target.value);
              if (promptMode === 'search') {
                setSearchQuery(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                e.preventDefault();
                if (promptMode === 'search') {
                  setSearchQuery('');
                }
                setPromptMode('none');
                setPromptValue('');
                rootRef.current?.focus();
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (promptMode === 'create') {
                  void handleCreateResource(promptValue);
                } else {
                  setPromptMode('none');
                  rootRef.current?.focus();
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
