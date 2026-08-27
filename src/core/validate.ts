import { buildCharPool, countPatternPlaceholders } from '@/core/charset';
import { estimateCapacity } from '@/core/codegen';
import { GeneratorMode, LIMITS, type GeneratorConfig, type ValidationIssue } from '@/types';

/** Clamps a value into range, falling back to `fallback` for junk input. */
export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(num)));
}

/**
 * Collects everything wrong with a config before generation runs.
 *
 * The old build only guarded against falsy quantity/length via `|| 12`, which
 * let negative numbers through untouched — a negative quantity silently
 * produced an empty batch and a negative length silently produced N copies of
 * the same prefix+suffix string. Every bound is checked explicitly here.
 */
export function validateConfig(config: GeneratorConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isInteger(config.quantity) || config.quantity < LIMITS.quantityMin) {
    issues.push({
      level: 'error',
      field: 'quantity',
      message: `Quantity must be a whole number of at least ${LIMITS.quantityMin}.`,
    });
  } else if (config.quantity > LIMITS.quantityMax) {
    issues.push({
      level: 'error',
      field: 'quantity',
      message: `Quantity tops out at ${LIMITS.quantityMax.toLocaleString()} per batch.`,
    });
  }

  if (config.mode === GeneratorMode.RANDOM) {
    if (!Number.isInteger(config.length) || config.length < LIMITS.lengthMin) {
      issues.push({
        level: 'error',
        field: 'length',
        message: `Length must be a whole number of at least ${LIMITS.lengthMin}.`,
      });
    } else if (config.length > LIMITS.lengthMax) {
      issues.push({
        level: 'error',
        field: 'length',
        message: `Length tops out at ${LIMITS.lengthMax} characters.`,
      });
    }

    if (!buildCharPool(config.charset)) {
      issues.push({
        level: 'error',
        field: 'charset',
        message: 'Pick at least one character type, or add your own characters.',
      });
    }

    if (config.separator.char && config.separator.every > 0 && config.separator.every >= config.length) {
      issues.push({
        level: 'warning',
        field: 'separator',
        message: 'Separator spacing is wider than the code, so no separator will appear.',
      });
    }
  }

  if (config.mode === GeneratorMode.PATTERN) {
    if (!config.pattern.trim()) {
      issues.push({ level: 'error', field: 'pattern', message: 'Enter a pattern.' });
    } else if (config.pattern.length > LIMITS.patternMaxLength) {
      issues.push({
        level: 'error',
        field: 'pattern',
        message: `Pattern tops out at ${LIMITS.patternMaxLength} characters.`,
      });
    } else if (countPatternPlaceholders(config.pattern) === 0 && config.quantity > 1) {
      issues.push({
        level: 'error',
        field: 'pattern',
        message: 'This pattern has no placeholders, so every code would be identical.',
      });
    }
  }

  // Capacity check — only meaningful once the inputs above are sane.
  if (!issues.some((i) => i.level === 'error')) {
    const capacity = estimateCapacity(config);
    if (capacity < config.quantity) {
      issues.push({
        level: 'error',
        field: 'capacity',
        message: `These settings allow only ${capacity.toLocaleString()} unique codes. Lower the quantity, or widen the character set.`,
      });
    } else if (capacity < config.quantity * 10) {
      issues.push({
        level: 'warning',
        field: 'capacity',
        message: 'The available code space is close to the batch size. Consider a longer code.',
      });
    }
  }

  return issues;
}

export const hasErrors = (issues: ValidationIssue[]): boolean =>
  issues.some((issue) => issue.level === 'error');

export const issueFor = (issues: ValidationIssue[], field: string): ValidationIssue | undefined =>
  issues.find((issue) => issue.field === field);
