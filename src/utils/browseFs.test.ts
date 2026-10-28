import { describe, expect, it } from 'vitest';

import {
  groupKeys,
  listBrowsePath,
  moveSelection,
  parentPath,
  parseBrowsePath,
  ROOT_ENTRIES,
  s3ObjectKey,
  type BrowseListDeps,
} from './browseFs';

describe('browseFs', () => {
  it('parses mounts and parents', () => {
    expect(parseBrowsePath('')).toEqual({ mount: 'root', rest: '' });
    expect(parseBrowsePath('s3/notes/a.md')).toEqual({ mount: 's3', rest: 'notes/a.md' });
    expect(parseBrowsePath('github/acme/app')).toEqual({ mount: 'github', rest: 'acme/app' });
    expect(parentPath('s3/notes/a.md')).toBe('s3/notes');
    expect(parentPath('s3')).toBe('');
    expect(s3ObjectKey('s3/_index.md')).toBe('_index.md');
  });

  it('groups flat S3 keys into one directory level', () => {
    const keys = ['_index.md', 'notes/one.md', 'notes/two.md', 'img/logo.png'];
    const root = groupKeys(keys, '', 's3');
    expect(root.map((e) => `${e.kind}:${e.name}`)).toEqual([
      'dir:img',
      'dir:notes',
      'file:_index.md',
    ]);
    const notes = groupKeys(keys, 'notes', 's3');
    expect(notes.map((e) => e.path)).toEqual(['s3/notes/one.md', 's3/notes/two.md']);
  });

  it('clamps j/k selection', () => {
    expect(moveSelection(0, 3, -1)).toBe(0);
    expect(moveSelection(2, 3, 1)).toBe(2);
    expect(moveSelection(0, 3, 1)).toBe(1);
  });

  it('lists GitHub and S3 at the root', async () => {
    const result = await listBrowsePath('', {} as BrowseListDeps);
    expect(result.entries).toEqual(ROOT_ENTRIES);
  });

  it('shows a login empty state for S3 when logged out', async () => {
    const result = await listBrowsePath('s3', {
      isLoggedIn: false,
      githubUsername: null,
      listS3: async () => ({ status: 401 }),
      listGithubRepos: async () => ({ status: 401 }),
    });
    expect(result.entries[0]?.kind).toBe('message');
    expect(result.entries[0]?.message).toContain('Login');
  });

  it('shows a gh link empty state when GitHub is unlinked', async () => {
    const result = await listBrowsePath('github', {
      isLoggedIn: true,
      githubUsername: null,
      listS3: async () => ({ status: 200, files: [] }),
      listGithubRepos: async () => ({ status: 401, error: 'GitHub account not linked' }),
    });
    expect(result.entries[0]?.kind).toBe('message');
    expect(result.entries[0]?.message?.toLowerCase()).toMatch(/gh link|github/);
  });

  it('lists S3 files and GitHub repos from adapters', async () => {
    const s3 = await listBrowsePath('s3', {
      isLoggedIn: true,
      githubUsername: 'octo',
      listS3: async () => ({ status: 200, files: ['_index.md', 'notes/a.md'] }),
      listGithubRepos: async () => ({ status: 200, repos: [] }),
    });
    expect(s3.entries.map((e) => e.name)).toEqual(['notes', '_index.md']);

    const gh = await listBrowsePath('github', {
      isLoggedIn: true,
      githubUsername: 'octo',
      listS3: async () => ({ status: 200, files: [] }),
      listGithubRepos: async () => ({
        status: 200,
        repos: [{ name: 'handterm', full_name: 'bizkite-co/handterm' }],
      }),
    });
    expect(gh.entries[0]).toMatchObject({
      name: 'handterm',
      path: 'github/bizkite-co/handterm',
      kind: 'dir',
    });
  });

  it('safely handles GitHub repositories without owner without triggering 500 requests', async () => {
    const listTreeMock = vi.fn();
    const result = await listBrowsePath('github/InTEGr8or', {
      isLoggedIn: true,
      githubUsername: null,
      listS3: async () => ({ status: 200, files: [] }),
      listGithubRepos: async () => ({ status: 200, repos: [] }),
      listGithubTree: listTreeMock,
    });

    expect(listTreeMock).not.toHaveBeenCalled();
    expect(result.entries[0]?.kind).toBe('message');
    expect(result.entries[0]?.name).toBe('Owner required');
  });

  it('uses fallback GitHub username when available for single-segment repo', async () => {
    const listTreeMock = vi.fn().mockResolvedValue({
      status: 200,
      items: [{ path: 'README.md', type: 'blob' }],
    });
    const result = await listBrowsePath('github/InTEGr8or', {
      isLoggedIn: true,
      githubUsername: 'InTEGr8or',
      listS3: async () => ({ status: 200, files: [] }),
      listGithubRepos: async () => ({ status: 200, repos: [] }),
      listGithubTree: listTreeMock,
    });

    expect(listTreeMock).toHaveBeenCalledWith('InTEGr8or/InTEGr8or');
    expect(result.entries[0]?.name).toBe('README.md');
  });

  it('gracefully handles 500 error from tree API without throwing', async () => {
    const result = await listBrowsePath('github/owner/broken-repo', {
      isLoggedIn: true,
      githubUsername: 'owner',
      listS3: async () => ({ status: 200, files: [] }),
      listGithubRepos: async () => ({ status: 200, repos: [] }),
      listGithubTree: async () => ({ status: 500, error: 'Internal Server Error' }),
    });

    expect(result.entries[0]?.kind).toBe('message');
    expect(result.entries[0]?.name).toBe('Tree unavailable');
  });
});
