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
  listGithubTree?: (repo: string) => Promise<{
    status: number;
    items?: Array<{ path: string; type: string }>;
    error?: string;
  }>;
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

export function githubRepoId(browsePath: string): string | null {
  const { mount, rest } = parseBrowsePath(browsePath);
  if (mount !== 'github' || rest === '') {
    return null;
  }
  const parts = rest.split('/');
  if (parts.length < 2) {
    return rest;
  }
  return `${parts[0]}/${parts[1]}`;
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
  return items
    .filter((item) => item.path !== '')
    .map((item) => {
      if (item.type === 'tree' || item.type === 'directory') {
        return item.path.endsWith('/') ? `${item.path}child` : `${item.path}/child`;
      }
      return item.path;
    });
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
    const entries = sortEntries(response.repos.map((repo) => {
      const id = repo.full_name ?? repo.name;
      return {
        name: repo.name,
        path: `github/${id}`,
        kind: 'dir' as const,
      };
    }));
    return { status: 200, entries };
  }

  const repo = githubRepoId(path);
  if (repo === null || deps.listGithubTree === undefined) {
    return { status: 200, entries: [] };
  }

  const tree = await deps.listGithubTree(repo);
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

  const repoPrefix = `github/${repo}`;
  const nested = rest.split('/').slice(2).join('/');
  return {
    status: 200,
    entries: groupKeys(topLevelTreeKeys(tree.items), nested, repoPrefix),
  };
}
