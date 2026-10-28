export type BrowseKind = 'dir' | 'file' | 'mount' | 'message';

export interface BrowseEntry {
  name: string;
  path: string;
  kind: BrowseKind;
  message?: string;
}

export interface BrowseListResult {
  entries: BrowseEntry[];
  status?: number;
}

export interface BrowseListDeps {
  isLoggedIn: boolean;
  githubUsername: string | null;
  listS3: () => Promise<{ status: number; files?: string[]; error?: string }>;
  listGithubRepos: () => Promise<{
    status: number;
    repos?: Array<{ name: string; full_name?: string }>;
    error?: string;
  }>;
  listGithubTree?: (repo: string, path?: string) => Promise<{
    status: number;
    items?: Array<{ path: string; type: string }>;
    error?: string;
  }>;
  getS3Content?: (key: string) => Promise<{ status: number; content?: string; error?: string }>;
  getGithubContent?: (repo: string, path: string) => Promise<{ status: number; content?: string; error?: string }>;
  createS3Resource?: (key: string, content?: string) => Promise<{ status: number; error?: string }>;
}

export const ROOT_ENTRIES: BrowseEntry[] = [
  { name: 'GitHub', path: 'github', kind: 'mount' },
  { name: 'S3', path: 's3', kind: 'mount' },
];

export function parentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

export function parseBrowsePath(path: string): {
  mount: 'root' | 's3' | 'github';
  rest: string;
} {
  const parts = (path ?? '').split('/').filter(Boolean);
  if (parts.length === 0) {
    return { mount: 'root', rest: '' };
  }
  if (parts[0] === 's3') {
    return { mount: 's3', rest: parts.slice(1).join('/') };
  }
  if (parts[0] === 'github') {
    return { mount: 'github', rest: parts.slice(1).join('/') };
  }
  return { mount: 'root', rest: path };
}

export function s3ObjectKey(browsePath: string): string {
  return browsePath.replace(/^s3\/?/, '');
}

export function githubRepoId(browsePath: string, fallbackOwner?: string | null): string | null {
  const { mount, rest } = parseBrowsePath(browsePath);
  if (mount !== 'github' || rest === '') {
    return null;
  }
  const parts = rest.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  if (parts.length === 1 && fallbackOwner) {
    return `${fallbackOwner}/${parts[0]}`;
  }
  return null;
}

export function githubFileDetails(browsePath: string, fallbackOwner?: string | null): { repo: string; path: string } | null {
  const { mount, rest } = parseBrowsePath(browsePath);
  if (mount !== 'github') {
    return null;
  }
  const parts = rest.split('/').filter(Boolean);
  if (parts.length >= 3) {
    const repo = `${parts[0]}/${parts[1]}`;
    const path = parts.slice(2).join('/');
    return { repo, path };
  }
  if (parts.length >= 2 && fallbackOwner) {
    const repo = `${fallbackOwner}/${parts[0]}`;
    const path = parts.slice(1).join('/');
    return { repo, path };
  }
  return null;
}

function sortEntries(entries: BrowseEntry[]): BrowseEntry[] {
  return [...entries].sort((a, b) => {
    const rank = (kind: BrowseKind): number => {
      if (kind === 'mount' || kind === 'dir') return 0;
      if (kind === 'file') return 1;
      return 2;
    };
    const byKind = rank(a.kind) - rank(b.kind);
    if (byKind !== 0) {
      return byKind;
    }
    return a.name.localeCompare(b.name);
  });
}

/** Group flat object keys into one directory level under prefix. */
export function groupKeys(
  keys: string[],
  prefix: string,
  pathPrefix: string,
): BrowseEntry[] {
  const prefixParts = prefix === '' ? [] : prefix.split('/').filter(Boolean);
  const seen = new Map<string, BrowseEntry>();

  for (const key of keys) {
    const parts = key.split('/').filter(Boolean);
    if (prefixParts.length > 0) {
      if (parts.length <= prefixParts.length) {
        continue;
      }
      if (prefixParts.some((part, index) => parts[index] !== part)) {
        continue;
      }
    }
    const rest = parts.slice(prefixParts.length);
    const name = rest[0];
    if (name === undefined) {
      continue;
    }
    const isDir = rest.length > 1;
    const childPath = [pathPrefix, ...prefixParts, name].filter(Boolean).join('/');
    const existing = seen.get(name);
    if (existing === undefined) {
      seen.set(name, { name, path: childPath, kind: isDir ? 'dir' : 'file' });
    } else if (isDir) {
      existing.kind = 'dir';
    }
  }

  return sortEntries([...seen.values()]);
}

export function moveSelection(index: number, count: number, delta: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(count - 1, index + delta));
}

export function topLevelTreeKeys(items: Array<{ path: string; type: string }>): string[] {
  return items.filter((item) => item.path !== '').map((item) => item.path);
}

export function parseGithubTreeEntries(
  items: Array<{ path: string; type: string }>,
  nested: string,
  repoPrefix: string,
): BrowseEntry[] {
  const nestedParts = nested === '' ? [] : nested.split('/').filter(Boolean);
  const seen = new Map<string, BrowseEntry>();

  const hasAnyPrefix = nestedParts.length > 0 && items.some((item) => {
    const p = item.path.split('/').filter(Boolean);
    return p.length > nestedParts.length && nestedParts.every((np, idx) => p[idx] === np);
  });

  for (const item of items) {
    if (!item.path) continue;
    const parts = item.path.split('/').filter(Boolean);

    // Skip the directory itself if present in results
    if (nestedParts.length > 0 && parts.length === nestedParts.length && nestedParts.every((p, i) => parts[i] === p)) {
      continue;
    }

    let relParts: string[];
    if (hasAnyPrefix) {
      const matchesNested = parts.length > nestedParts.length &&
        nestedParts.every((np, idx) => parts[idx] === np);
      if (!matchesNested) {
        continue;
      }
      relParts = parts.slice(nestedParts.length);
    } else {
      relParts = parts;
    }

    const name = relParts[0];
    if (!name || name === 'child') {
      continue;
    }

    const isExplicitDir = item.type === 'tree' || item.type === 'dir' || item.type === 'directory';
    const isImplicitDir = relParts.length > 1;
    const isDir = isExplicitDir || isImplicitDir;

    const childPath = [repoPrefix, ...nestedParts, name].filter(Boolean).join('/');
    const existing = seen.get(name);
    if (!existing) {
      seen.set(name, {
        name,
        path: childPath,
        kind: isDir ? 'dir' : 'file',
      });
    } else if (isDir) {
      existing.kind = 'dir';
    }
  }

  return sortEntries([...seen.values()]);
}

export async function listBrowsePath(
  path: string,
  deps: BrowseListDeps,
): Promise<BrowseListResult> {
  const { mount, rest } = parseBrowsePath(path);

  if (mount === 'root') {
    return { entries: ROOT_ENTRIES, status: 200 };
  }

  if (mount === 's3') {
    if (!deps.isLoggedIn) {
      return {
        status: 401,
        entries: [{
          name: 'Sign in required',
          path: 's3',
          kind: 'message',
          message: 'Login to browse S3 files.',
        }],
      };
    }
    const response = await deps.listS3();
    if (response.status !== 200 || response.files === undefined) {
      return {
        status: response.status,
        entries: [{
          name: 'S3 unavailable',
          path: 's3',
          kind: 'message',
          message: response.error ?? 'Login to browse S3 files.',
        }],
      };
    }
    return {
      status: 200,
      entries: groupKeys(response.files, rest, 's3'),
    };
  }

  if (rest === '') {
    const response = await deps.listGithubRepos();
    if (response.status !== 200 || response.repos === undefined) {
      return {
        status: response.status,
        entries: [{
          name: 'GitHub unavailable',
          path: 'github',
          kind: 'message',
          message: response.error ?? 'Run gh link to connect GitHub.',
        }],
      };
    }
    const entries = sortEntries(response.repos.map((repo: any) => {
      const owner = repo.owner?.login ?? (typeof repo.owner === 'string' ? repo.owner : deps.githubUsername);
      const fullName = repo.full_name ?? (owner ? `${owner}/${repo.name}` : null);
      const id = fullName ?? repo.name;
      return {
        name: repo.name,
        path: `github/${id}`,
        kind: 'dir' as const,
      };
    }));
    return { status: 200, entries };
  }

  const repo = githubRepoId(path, deps.githubUsername);
  if (repo === null || deps.listGithubTree === undefined) {
    const { rest: repoRest } = parseBrowsePath(path);
    if (repoRest !== '' && !repoRest.includes('/')) {
      return {
        status: 200,
        entries: [{
          name: 'Owner required',
          path,
          kind: 'message',
          message: `Repository "${repoRest}" requires an owner (e.g. owner/${repoRest}). Please link GitHub or configure username.`,
        }],
      };
    }
    return { status: 200, entries: [] };
  }

  const repoPrefix = `github/${repo}`;
  const nested = rest.split('/').slice(2).join('/');
  const tree = nested
    ? await deps.listGithubTree(repo, nested)
    : await deps.listGithubTree(repo);

  if (tree.status !== 200 || tree.items === undefined) {
    return {
      status: tree.status,
      entries: [{
        name: 'Tree unavailable',
        path,
        kind: 'message',
        message: tree.error ?? 'Could not load repository tree.',
      }],
    };
  }

  return {
    status: 200,
    entries: parseGithubTreeEntries(tree.items, nested, repoPrefix),
  };
}
