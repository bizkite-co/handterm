import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ActivityType, StorageKeys, TokenKeys, type IAuthProps } from '@handterm/types';
import { getFile, listFiles } from '../utils/awsApiClient';
import { getRepoTree, listRecentRepos } from '../utils/apiClient';
import {
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
            <span>{entry.name}</span>
          </div>
        ))
      )}
    </div>
  );
}

export function BrowseView(props: BrowseViewProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState(() => parseLocation().contentKey ?? '');
  const [entries, setEntries] = useState<BrowseEntry[]>(() => getBrowseCache(parseLocation().contentKey ?? 'root') ?? []);
  const [parentEntries, setParentEntries] = useState<BrowseEntry[]>([]);
  const [childEntries, setChildEntries] = useState<BrowseEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChildLoading, setIsChildLoading] = useState(false);

  const spinner = useTerminalSpinner(isLoading || isChildLoading);

  const githubUsername = typeof localStorage !== 'undefined'
    ? localStorage.getItem(TokenKeys.GithubUsername)
    : null;

  const deps: BrowseListDeps = useMemo(() => ({
    isLoggedIn: props.auth.isLoggedIn,
    githubUsername,
    listS3: async () => {
      const response = await listFiles(props.auth);
      return { status: response.status, files: response.data?.files, error: response.error };
    },
    listGithubRepos: async () => {
      const response = await listRecentRepos(props.auth);
      return { status: response.status, repos: response.data, error: response.error };
    },
    listGithubTree: async (repo: string) => {
      const response = await getRepoTree(props.auth, repo);
      return { status: response.status, items: response.data, error: response.error };
    },
    ...props.deps,
  }), [props.auth, githubUsername, props.deps]);

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

  const selected = entries[selectedIndex] ?? null;

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

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const openSelected = useCallback(() => {
    if (selected === null || selected.kind === 'message') {
      return;
    }
    if (selected.kind === 'dir' || selected.kind === 'mount') {
      setPath(selected.path);
      return;
    }
    const { mount } = parseBrowsePath(selected.path);
    if (mount !== 's3') {
      setStatusMessage('Opening GitHub files lands in a later slice. Use Enter on S3 files.');
      return;
    }
    const filename = s3ObjectKey(selected.path);
    void (async () => {
      const response = await getFile(props.auth, filename);
      const content = response.data?.content ?? '';
      localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
      navigate({
        activityKey: ActivityType.EDIT,
        contentKey: filename,
        groupKey: null,
      });
    })();
  }, [props.auth, selected]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (!['h', 'j', 'k', 'l', 'Enter', 'Escape'].includes(key)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (key === 'j') {
      setSelectedIndex((index) => moveSelection(index, entries.length, 1));
      return;
    }
    if (key === 'k') {
      setSelectedIndex((index) => moveSelection(index, entries.length, -1));
      return;
    }
    if (key === 'h') {
      setPath(parentPath(path));
      return;
    }
    if (key === 'l' || key === 'Enter') {
      openSelected();
      return;
    }
    if (key === 'Escape') {
      navigate({
        activityKey: ActivityType.NORMAL,
        contentKey: null,
        groupKey: null,
      });
    }
  }, [entries.length, openSelected, path]);

  return (
    <div
      id="browse-view"
      className="browse-view"
      data-testid="browse-view"
      tabIndex={0}
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      <div className="browse-hint">
        <span className="browse-breadcrumb">{path === '' ? '/' : `/${path}`}</span>
        {(isLoading || isChildLoading) && (
          <span className="browse-spinner-tag"> {spinner} syncing...</span>
        )}
        {' — '}
        h parent, j/k move, l/Enter open, Escape leave
        {statusMessage !== null ? ` — ${statusMessage}` : ''}
      </div>
      <div className="browse-columns">
        <Column
          className="parent"
          entries={parentEntries}
          selectedPath={path === '' ? null : path}
          onSelect={() => { setPath(parentPath(path)); }}
        />
        <Column
          className="current"
          entries={entries}
          selectedPath={selected?.path ?? null}
          onSelect={setSelectedIndex}
          isLoading={isLoading}
          spinnerChar={spinner}
        />
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
                setPath(parentPath(child.path));
              } else {
                setPath(child.path);
              }
            }
          }}
        />
      </div>
    </div>
  );
}
