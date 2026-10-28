import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearLegacyBrowseLocalStorage,
  clearMemoryBrowseCache,
  getCachedEntries,
  getCachedEntriesSync,
  getCachedPreview,
  getCachedPreviewSync,
  setCachedEntries,
  setCachedPreview,
} from '../browseStorage';
import { type BrowseEntry } from '../browseFs';

describe('browseStorage', () => {
  beforeEach(() => {
    clearMemoryBrowseCache();
  });

  it('stores and retrieves directory entries via memory cache synchronously and asynchronously', async () => {
    const mockEntries: BrowseEntry[] = [
      { name: 'src', path: 'github/owner/repo/src', kind: 'dir' },
      { name: 'README.md', path: 'github/owner/repo/README.md', kind: 'file' },
    ];

    expect(getCachedEntriesSync('github/owner/repo')).toBeNull();
    await setCachedEntries('github/owner/repo', mockEntries);

    expect(getCachedEntriesSync('github/owner/repo')).toEqual(mockEntries);
    const asyncEntries = await getCachedEntries('github/owner/repo');
    expect(asyncEntries).toEqual(mockEntries);
  });

  it('filters out invalid child or message entries before storing', async () => {
    const badEntries: BrowseEntry[] = [
      { name: 'child', path: 'github/owner/repo/src/child', kind: 'file' },
    ];
    await setCachedEntries('bad-path', badEntries);
    expect(getCachedEntriesSync('bad-path')).toBeNull();

    const messageEntries: BrowseEntry[] = [
      { name: 'Error', path: 'bad-path', kind: 'message', message: 'Something went wrong' },
    ];
    await setCachedEntries('message-path', messageEntries);
    expect(getCachedEntriesSync('message-path')).toBeNull();
  });

  it('stores and retrieves file previews', async () => {
    expect(getCachedPreviewSync('github/owner/repo/README.md')).toBeNull();
    await setCachedPreview('github/owner/repo/README.md', '# Hello World');

    expect(getCachedPreviewSync('github/owner/repo/README.md')).toBe('# Hello World');
    const asyncPreview = await getCachedPreview('github/owner/repo/README.md');
    expect(asyncPreview).toBe('# Hello World');
  });

  it('clears legacy localStorage browse keys without affecting other items', () => {
    localStorage.setItem('browse_cache:foo', '[]');
    localStorage.setItem('browse_preview:bar', 'content');
    localStorage.setItem('AccessToken', 'secret');

    clearLegacyBrowseLocalStorage();

    expect(localStorage.getItem('browse_cache:foo')).toBeNull();
    expect(localStorage.getItem('browse_preview:bar')).toBeNull();
    expect(localStorage.getItem('AccessToken')).toBe('secret');
  });
});
