/**
 * Cryptographically secure random source.
 *
 * The previous version of this app used Math.random(), which is seeded
 * predictably and must never back gift codes, license keys or coupons —
 * given a few observed outputs an attacker can reconstruct the stream and
 * predict every code you issue next. This draws from crypto.getRandomValues
 * instead, and uses rejection sampling so the values stay uniform rather than
 * being skewed by modulo bias.
 */

const POOL_SIZE = 1024;

class SecureRandom {
  private buffer = new Uint32Array(POOL_SIZE);
  private cursor = POOL_SIZE;

  private nextUint32(): number {
    if (this.cursor >= this.buffer.length) {
      crypto.getRandomValues(this.buffer);
      this.cursor = 0;
    }
    return this.buffer[this.cursor++];
  }

  /** Uniform integer in [0, max). */
  int(max: number): number {
    if (!Number.isInteger(max) || max <= 0) {
      throw new Error(`SecureRandom.int expects a positive integer, got ${max}`);
    }
    if (max === 1) return 0;

    // Discard the tail that would wrap unevenly across `max` buckets.
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    let value: number;
    do {
      value = this.nextUint32();
    } while (value >= limit);
    return value % max;
  }

  /** Uniform character from a non-empty string. */
  char(pool: string): string {
    return pool[this.int(pool.length)];
  }
}

export const rng = new SecureRandom();

/**
 * Selects `count` distinct indices from [0, size) without replacement.
 * Partial Fisher-Yates: O(size) memory, O(count) swaps, uniform.
 */
export function sampleDistinctIndices(size: number, count: number): Uint32Array {
  if (count > size) {
    throw new Error(`Cannot draw ${count} distinct values from ${size}`);
  }
  const pool = new Uint32Array(size);
  for (let i = 0; i < size; i++) pool[i] = i;

  for (let i = 0; i < count; i++) {
    const j = i + rng.int(size - i);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.subarray(0, count);
}
