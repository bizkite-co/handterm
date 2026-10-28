import { type BrowseEntry } from './browseFs';

const DB_NAME = 'HandTermBrowseCache';
const DB_VERSION = 1;
const STORE_ENTRIES = 'entries';
const STORE_PREVIEWS = 'previews';

interface CacheRecord<T> {
  key: string;
  value: T;
  updatedAt: number;
}

// In-memory L1 cache for instant synchronous retrieval
const memoryEntries = new Map<string, BrowseEntry[]>();
const memoryPreviews = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
          db.createObjectStore(STORE_ENTRIES, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_PREVIEWS)) {
          db.createObjectStore(STORE_PREVIEWS, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export function getCachedEntriesSync(key: string): BrowseEntry[] | null {
  return memoryEntries.get(key) ?? null;
}

export async function getCachedEntries(key: string): Promise<BrowseEntry[] | null> {
  const mem = memoryEntries.get(key);
  if (mem) return mem;

  try {
    const db = await getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_ENTRIES, 'readonly');
        const store = tx.objectStore(STORE_ENTRIES);
        const req = store.get(key);
        req.onsuccess = () => {
          const item = req.result as CacheRecord<BrowseEntry[]> | undefined;
          if (item?.value) {
            memoryEntries.set(key, item.value);
            resolve(item.value);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function setCachedEntries(key: string, entries: BrowseEntry[]): Promise<void> {
  if (!entries || entries.length === 0 || entries.some((e) => e.kind === 'message' || e.name === 'child')) {
    return;
  }
  memoryEntries.set(key, entries);

  try {
    const db = await getDb();
    if (!db) return;
    const tx = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);
    store.put({ key, value: entries, updatedAt: Date.now() });
  } catch {
    // Ignore IDB write failures (e.g. quota, private browsing)
  }
}

export function getCachedPreviewSync(key: string): string | null {
  return memoryPreviews.get(key) ?? null;
}

export async function getCachedPreview(key: string): Promise<string | null> {
  const mem = memoryPreviews.get(key);
  if (mem !== undefined) return mem;

  try {
    const db = await getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PREVIEWS, 'readonly');
        const store = tx.objectStore(STORE_PREVIEWS);
        const req = store.get(key);
        req.onsuccess = () => {
          const item = req.result as CacheRecord<string> | undefined;
          if (item?.value !== undefined) {
            memoryPreviews.set(key, item.value);
            resolve(item.value);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function setCachedPreview(key: string, content: string): Promise<void> {
  memoryPreviews.set(key, content);

  try {
    const db = await getDb();
    if (!db) return;
    const tx = db.transaction(STORE_PREVIEWS, 'readwrite');
    const store = tx.objectStore(STORE_PREVIEWS);
    store.put({ key, value: content, updatedAt: Date.now() });
  } catch {
    // Ignore IDB write failures
  }
}

/** Clear legacy localStorage browse cache items that may contain stale or invalid data. */
export function clearLegacyBrowseLocalStorage(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('browse_cache:') || key.startsWith('browse_preview:'))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore errors
  }
}

export function clearMemoryBrowseCache(): void {
  memoryEntries.clear();
  memoryPreviews.clear();
}
