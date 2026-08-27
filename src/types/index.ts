export const GeneratorMode = {
  RANDOM: 'RANDOM',
  PATTERN: 'PATTERN',
} as const;

export type GeneratorMode = (typeof GeneratorMode)[keyof typeof GeneratorMode];

export const MODE_LABEL: Record<GeneratorMode, string> = {
  RANDOM: 'Random',
  PATTERN: 'Pattern',
};

export interface CharsetConfig {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  /** Strip lookalike glyphs (see AMBIGUOUS_CHARS) from the pool. */
  excludeAmbiguous: boolean;
  /** Extra characters folded into the pool. Deduped, ambiguous-filtered. */
  customChars: string;
}

export interface SeparatorConfig {
  /** Empty string disables the separator. */
  char: string;
  /** 0 disables the separator. */
  every: number;
}

export interface GeneratorConfig {
  mode: GeneratorMode;
  quantity: number;
  length: number;
  prefix: string;
  suffix: string;
  charset: CharsetConfig;
  separator: SeparatorConfig;
  /** Pattern mode. Placeholders: # A a * ! — anything else is a literal. */
  pattern: string;
}

export interface GeneratedBatch {
  id: string;
  /** Monotonic per-device counter, shown as the LOT number. */
  lot: number;
  timestamp: number;
  codes: string[];
  config: GeneratorConfig;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  field: string;
  message: string;
}

export const AMBIGUOUS_CHARS = '0O1Il5S8B';

export const LIMITS = {
  quantityMin: 1,
  quantityMax: 1000,
  lengthMin: 4,
  lengthMax: 64,
  separatorEveryMin: 0,
  separatorEveryMax: 64,
  patternMaxLength: 128,
  affixMaxLength: 32,
  historyMax: 50,
} as const;

export const DEFAULT_CONFIG: GeneratorConfig = {
  mode: GeneratorMode.RANDOM,
  quantity: 12,
  length: 12,
  prefix: '',
  suffix: '',
  charset: {
    uppercase: true,
    lowercase: false,
    numbers: true,
    symbols: false,
    excludeAmbiguous: false,
    customChars: '',
  },
  separator: { char: '-', every: 4 },
  pattern: '####-AAAA-####',
};
