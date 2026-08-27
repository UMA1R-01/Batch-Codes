import { PATTERN_ESCAPE, PATTERN_TOKENS, buildCharPool } from '@/core/charset';
import { rng, sampleDistinctIndices } from '@/core/random';
import type { GeneratorConfig, SeparatorConfig } from '@/types';

/**
 * A code is modelled as an ordered list of slots. A slot is either a fixed
 * literal or a pool to draw one character from. Both Random and Pattern mode
 * compile down to this, so uniqueness, capacity and enumeration are written
 * once instead of twice.
 */
type Slot = { kind: 'literal'; value: string } | { kind: 'pick'; pool: string };

/** Below this, exhaustive shuffling is cheaper and safer than retry-on-collision. */
const ENUMERATION_CEILING = 250_000;
/** Above this fill ratio, rejection sampling degrades badly (coupon collector). */
const DENSE_FILL_RATIO = 0.25;

export class CapacityError extends Error {
  constructor(
    readonly capacity: number,
    readonly requested: number,
  ) {
    super(
      capacity === 1
        ? 'These settings can only ever produce one code. Add a placeholder or widen the character set.'
        : `These settings can only produce ${capacity.toLocaleString()} unique codes, but ${requested.toLocaleString()} were requested.`,
    );
    this.name = 'CapacityError';
  }
}

function compileRandom(config: GeneratorConfig): Slot[] {
  const pool = buildCharPool(config.charset);
  if (!pool) throw new Error('Pick at least one character type.');
  return Array.from({ length: config.length }, () => ({ kind: 'pick', pool }) as Slot);
}

function compilePattern(pattern: string): Slot[] {
  const chars = [...pattern];
  const slots: Slot[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // `\A` means a literal A. Without this there is no way to put the letters
    // A, a or the characters # * ! into a pattern as fixed text — typing
    // "SALE-" quietly produced "SDLE-", "SWLE-" and so on.
    if (char === PATTERN_ESCAPE && i + 1 < chars.length) {
      slots.push({ kind: 'literal', value: chars[++i] });
      continue;
    }

    slots.push(
      char in PATTERN_TOKENS
        ? { kind: 'pick', pool: PATTERN_TOKENS[char] }
        : { kind: 'literal', value: char },
    );
  }
  return slots;
}

/** Total distinct outputs the slot list can produce. May be Infinity. */
export function capacityOf(slots: Slot[]): number {
  let total = 1;
  for (const slot of slots) {
    if (slot.kind === 'pick') {
      total *= slot.pool.length;
      if (!Number.isFinite(total)) return Infinity;
    }
  }
  return total;
}

function drawRandom(slots: Slot[]): string {
  let out = '';
  for (const slot of slots) {
    out += slot.kind === 'literal' ? slot.value : rng.char(slot.pool);
  }
  return out;
}

/** Decodes an index into its corresponding code via mixed-radix positional math. */
function drawByIndex(slots: Slot[], index: number): string {
  let remaining = index;
  let out = '';
  // Least-significant slot last, so walk backwards and prepend.
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i];
    if (slot.kind === 'literal') {
      out = slot.value + out;
      continue;
    }
    const radix = slot.pool.length;
    out = slot.pool[remaining % radix] + out;
    remaining = Math.floor(remaining / radix);
  }
  return out;
}

export function applySeparator(core: string, separator: SeparatorConfig): string {
  const { char, every } = separator;
  if (!char || !Number.isFinite(every) || every <= 0 || every >= core.length) return core;

  const chunks: string[] = [];
  for (let i = 0; i < core.length; i += every) {
    chunks.push(core.slice(i, i + every));
  }
  return chunks.join(char);
}

/**
 * Produces `quantity` guaranteed-distinct codes.
 *
 * Two strategies, chosen by how full the output space is:
 *  - sparse  → draw randomly, reject collisions
 *  - dense   → shuffle the index space and decode, which cannot collide at all
 *
 * The old build had no uniqueness check whatsoever, so a literal-only pattern
 * emitted N identical strings and a small character space quietly emitted
 * duplicates. For coupons and license keys that is a correctness bug, not a
 * cosmetic one.
 */
function generateDistinct(slots: Slot[], quantity: number, decorate: (core: string) => string): string[] {
  const capacity = capacityOf(slots);
  if (quantity > capacity) throw new CapacityError(capacity, quantity);

  const dense = capacity <= ENUMERATION_CEILING && quantity > capacity * DENSE_FILL_RATIO;

  if (dense) {
    const indices = sampleDistinctIndices(capacity, quantity);
    const out: string[] = new Array(quantity);
    for (let i = 0; i < quantity; i++) {
      out[i] = decorate(drawByIndex(slots, indices[i]));
    }
    return out;
  }

  const seen = new Set<string>();
  const out: string[] = [];
  const budget = quantity * 40 + 2000;

  for (let attempts = 0; attempts < budget && out.length < quantity; attempts++) {
    const core = drawRandom(slots);
    if (seen.has(core)) continue;
    seen.add(core);
    out.push(decorate(core));
  }

  if (out.length < quantity) throw new CapacityError(capacity, quantity);
  return out;
}

export function generateRandomCodes(config: GeneratorConfig): string[] {
  const slots = compileRandom(config);
  return generateDistinct(
    slots,
    config.quantity,
    (core) => `${config.prefix}${applySeparator(core, config.separator)}${config.suffix}`,
  );
}

export function generatePatternCodes(config: GeneratorConfig): string[] {
  const slots = compilePattern(config.pattern);
  // Pattern mode owns its own literals, so the separator setting does not apply.
  return generateDistinct(slots, config.quantity, (core) => `${config.prefix}${core}${config.suffix}`);
}

/** How many distinct codes the current settings could produce. For the UI hint. */
export function estimateCapacity(config: GeneratorConfig): number {
  try {
    const slots =
      config.mode === 'PATTERN' ? compilePattern(config.pattern) : compileRandom(config);
    return capacityOf(slots);
  } catch {
    return 0;
  }
}

/** A single representative code, used for the live preview under the controls. */
export function previewCode(config: GeneratorConfig): string | null {
  try {
    if (config.mode === 'PATTERN') {
      const core = drawRandom(compilePattern(config.pattern));
      return `${config.prefix}${core}${config.suffix}`;
    }
    const core = drawRandom(compileRandom(config));
    return `${config.prefix}${applySeparator(core, config.separator)}${config.suffix}`;
  } catch {
    return null;
  }
}
