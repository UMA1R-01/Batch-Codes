import { AMBIGUOUS_CHARS, type CharsetConfig } from '@/types';

export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBERS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/** Removes duplicate characters while preserving order. */
export function dedupe(source: string): string {
  return [...new Set(source)].join('');
}

export function stripAmbiguous(source: string): string {
  const drop = new Set(AMBIGUOUS_CHARS);
  return [...source].filter((c) => !drop.has(c)).join('');
}

/**
 * Builds the character pool for Random mode.
 * Returns '' when nothing is selected — callers must treat that as an error
 * rather than silently substituting digits, which is what the old build did
 * and which left people staring at all-numeric output with no explanation.
 */
export function buildCharPool(charset: CharsetConfig): string {
  let pool = '';
  if (charset.uppercase) pool += UPPER;
  if (charset.lowercase) pool += LOWER;
  if (charset.numbers) pool += NUMBERS;
  if (charset.symbols) pool += SYMBOLS;
  if (charset.customChars) pool += charset.customChars;

  pool = dedupe(pool);
  if (charset.excludeAmbiguous) pool = stripAmbiguous(pool);
  return pool;
}

/** Pattern placeholders. Anything not listed here is copied through as a literal. */
export const PATTERN_TOKENS: Record<string, string> = {
  '#': NUMBERS,
  A: UPPER,
  a: LOWER,
  '*': UPPER + LOWER + NUMBERS,
  '!': SYMBOLS,
};

/** Escape prefix. `\A` yields a literal A rather than a random uppercase letter. */
export const PATTERN_ESCAPE = '\\';

export const PATTERN_LEGEND = [
  { token: '#', label: 'Number', example: '0–9' },
  { token: 'A', label: 'Uppercase', example: 'A–Z' },
  { token: 'a', label: 'Lowercase', example: 'a–z' },
  { token: '*', label: 'Letter or number', example: 'A–Z a–z 0–9' },
  { token: '!', label: 'Symbol', example: '!@#$' },
  { token: '\\', label: 'Keep next as-is', example: '\\A → A' },
] as const;

export function countPatternPlaceholders(pattern: string): number {
  const chars = [...pattern];
  let count = 0;
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === PATTERN_ESCAPE && i + 1 < chars.length) {
      i++; // the escaped character is a literal, never a placeholder
      continue;
    }
    if (chars[i] in PATTERN_TOKENS) count++;
  }
  return count;
}
