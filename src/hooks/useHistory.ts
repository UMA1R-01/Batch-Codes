import { useCallback, useEffect, useState } from 'react';
import { StorageKey, readJson, writeJson } from '@/lib/storage';
import { DEFAULT_CONFIG, GeneratorMode, LIMITS, type GeneratedBatch, type GeneratorConfig } from '@/types';

/**
 * Rebuilds a stored config, filling in anything a future/older schema left out.
 * Returns a complete object so downstream code never has to null-check —
 * the old build asserted `prev.separator!` and would have thrown on any entry
 * saved before the separator feature existed.
 */
function reviveConfig(raw: unknown): GeneratorConfig {
  const input = (raw ?? {}) as Partial<GeneratorConfig>;
  const charset = { ...DEFAULT_CONFIG.charset, ...(input.charset ?? {}) };
  const separator = { ...DEFAULT_CONFIG.separator, ...(input.separator ?? {}) };

  const mode =
    typeof input.mode === 'string' && input.mode in GeneratorMode
      ? (input.mode as GeneratorMode)
      : DEFAULT_CONFIG.mode;

  return {
    mode,
    quantity: Number.isFinite(input.quantity) ? Number(input.quantity) : DEFAULT_CONFIG.quantity,
    length: Number.isFinite(input.length) ? Number(input.length) : DEFAULT_CONFIG.length,
    prefix: typeof input.prefix === 'string' ? input.prefix : '',
    suffix: typeof input.suffix === 'string' ? input.suffix : '',
    charset: {
      uppercase: Boolean(charset.uppercase),
      lowercase: Boolean(charset.lowercase),
      numbers: Boolean(charset.numbers),
      symbols: Boolean(charset.symbols),
      excludeAmbiguous: Boolean(charset.excludeAmbiguous),
      customChars: typeof charset.customChars === 'string' ? charset.customChars : '',
    },
    separator: {
      char: typeof separator.char === 'string' ? separator.char.slice(0, 1) : '',
      every: Number.isFinite(separator.every) ? Number(separator.every) : 0,
    },
    pattern: typeof input.pattern === 'string' ? input.pattern : DEFAULT_CONFIG.pattern,
  };
}

function parseHistory(raw: unknown): GeneratedBatch[] | null {
  if (!Array.isArray(raw)) return null;

  const batches: GeneratedBatch[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Partial<GeneratedBatch>;
    if (typeof item.id !== 'string') continue;
    if (!Array.isArray(item.codes)) continue;

    const codes = item.codes.filter((c): c is string => typeof c === 'string');
    // A batch with no codes is unusable — it is what made the old history
    // panel render the literal text "undefined...".
    if (codes.length === 0) continue;

    batches.push({
      id: item.id,
      lot: Number.isFinite(item.lot) ? Number(item.lot) : 0,
      timestamp: Number.isFinite(item.timestamp) ? Number(item.timestamp) : Date.now(),
      codes,
      config: reviveConfig(item.config),
    });
  }
  return batches.slice(0, LIMITS.historyMax);
}

export function useHistory() {
  const [history, setHistory] = useState<GeneratedBatch[]>(() =>
    readJson(StorageKey.history, parseHistory, []),
  );
  const [persistError, setPersistError] = useState<string | null>(null);

  useEffect(() => {
    try {
      writeJson(StorageKey.history, history);
      setPersistError(null);
    } catch (error) {
      setPersistError(error instanceof Error ? error.message : 'Could not save history.');
    }
  }, [history]);

  const addBatch = useCallback((batch: GeneratedBatch) => {
    setHistory((prev) => [batch, ...prev].slice(0, LIMITS.historyMax));
  }, []);

  const removeBatch = useCallback((id: string) => {
    setHistory((prev) => prev.filter((batch) => batch.id !== id));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { history, addBatch, removeBatch, clearHistory, persistError };
}

/** Monotonic LOT number, so every batch this device produces has a stable label. */
export function nextLotNumber(): number {
  const current = Number(readJson(StorageKey.lotCounter, (raw) => (Number.isFinite(raw) ? Number(raw) : null), 0));
  const next = current + 1;
  try {
    writeJson(StorageKey.lotCounter, next);
  } catch {
    /* a full disk should never block generating codes */
  }
  return next;
}
