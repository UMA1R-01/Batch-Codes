/**
 * Persistence layer.
 *
 * Everything the app saves goes through here. It is deliberately the only
 * module that touches localStorage, so swapping in Tauri's filesystem or
 * store plugin later means rewriting this file and nothing else.
 *
 * Keys are version-suffixed and every read is shape-checked. The old build
 * did a bare JSON.parse into React state, so one malformed entry poisoned the
 * whole history and the bad value stayed on disk failing forever.
 */

const NAMESPACE = 'batchcodes';
const SCHEMA_VERSION = 1;

export const StorageKey = {
  history: `${NAMESPACE}.history.v${SCHEMA_VERSION}`,
  settings: `${NAMESPACE}.settings.v${SCHEMA_VERSION}`,
  lotCounter: `${NAMESPACE}.lot.v${SCHEMA_VERSION}`,
} as const;

function available(): boolean {
  try {
    const probe = `${NAMESPACE}.probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable = available();

/**
 * Reads and validates. Anything that fails `parse` is discarded and the key is
 * cleared, so a corrupt value cannot fail on every subsequent load.
 */
export function readJson<T>(key: string, parse: (raw: unknown) => T | null, fallback: T): T {
  if (!storageAvailable) return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  try {
    const parsed = parse(JSON.parse(raw));
    if (parsed === null) throw new Error('failed validation');
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export class QuotaError extends Error {
  constructor() {
    super('Out of local storage space. Clear some history and try again.');
    this.name = 'QuotaError';
  }
}

export function writeJson(key: string, value: unknown): void {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    const isQuota =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    if (isQuota) throw new QuotaError();
    throw error;
  }
}

export function readString(key: string): string {
  if (!storageAvailable) return '';
  return localStorage.getItem(key) ?? '';
}

export function writeString(key: string, value: string): void {
  if (!storageAvailable) return;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

export function remove(key: string): void {
  if (!storageAvailable) return;
  localStorage.removeItem(key);
}
