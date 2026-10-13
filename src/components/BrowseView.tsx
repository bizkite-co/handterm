import { useCallback, useEffect, useRef, useState } from 'react';

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
}): JSX.Element {
  return (
    <div className={`browse-col ${props.className}`} role="list">
      {props.entries.length === 0 && (
        <div className="browse-empty">Empty</div>
      )}
      {props.entries.map((entry, index) => (
        <div
          key={entry.path + entry.name}
          role="listitem"
          className={`browse-row${entry.path === props.selectedPath ? ' selected' : ''}${entry.kind === 'message' ? ' message' : ''}`}
          onMouseDown={() => { props.onSelect(index); }}
        >
          <span>{iconFor(entry)}</span>
          <span>{entry.name}</span>
        </div>
      ))}
    </div>
  );
}

export function BrowseView(props: BrowseViewProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState(() => parseLocation().contentKey ?? '');
  const [entries, setEntries] = useState<BrowseEntry[]>([]);
  const [parentEntries, setParentEntries] = useState<BrowseEntry[]>([]);
  const [childEntries, setChildEntries] = useState<BrowseEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const githubUsername = typeof localStorage !== 'undefined'
    ? localStorage.getItem(TokenKeys.GithubUsername)
    : null;

  const deps: BrowseListDeps = {
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
  };

  const load = useCallback(async (nextPath: string, keepIndex = 0) => {
    const current = await listBrowsePath(nextPath, deps);
    setEntries(current.entries);
    setSelectedIndex(Math.min(keepIndex, Math.max(0, current.entries.length - 1)));
    setStatusMessage(current.entries.find((e) => e.kind === 'message')?.message ?? null);

    const parent = parentPath(nextPath);
    if (parent === nextPath) {
      setParentEntries([]);
    } else {
      const parentResult = await listBrowsePath(parent, deps);
      setParentEntries(parentResult.entries);
    }
  }, [deps]);

  useEffect(() => {
    void load(path);
    // Initial load and path changes only; deps is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, props.auth.isLoggedIn]);

  const selected = entries[selectedIndex] ?? null;

  useEffect(() => {
    if (selected === null || (selected.kind !== 'dir' && selected.kind !== 'mount')) {
      setChildEntries([]);
      return;
    }
    let cancelled = false;
    void listBrowsePath(selected.path, deps).then((result) => {
      if (!cancelled) {
        setChildEntries(result.entries);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.path, selected?.kind]);

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
        {path === '' ? '/' : `/${path}`}
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
        />
        <Column
          className="child"
          entries={childEntries}
          selectedPath={null}
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
