import { useEffect, useState } from 'react';
import { StorageKey, readJson, writeJson } from '@/lib/storage';
import { DEFAULT_CONFIG, type GeneratorConfig } from '@/types';

/** Remembers the last-used config so the app opens where you left off. */
export function usePersistedConfig() {
  const [config, setConfig] = useState<GeneratorConfig>(() =>
    readJson(
      StorageKey.settings,
      (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        return { ...DEFAULT_CONFIG, ...(raw as Partial<GeneratorConfig>) } as GeneratorConfig;
      },
      DEFAULT_CONFIG,
    ),
  );

  useEffect(() => {
    try {
      writeJson(StorageKey.settings, config);
    } catch {
      /* config persistence is a convenience, never block the app on it */
    }
  }, [config]);

  return [config, setConfig] as const;
}
