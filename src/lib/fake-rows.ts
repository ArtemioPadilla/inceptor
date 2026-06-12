/** Deterministic data generator for demos. No external deps. */

const FIRST = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Avery', 'Quinn', 'Drew', 'Hayden', 'Skyler', 'Reese'];
const LAST = ['Patel', 'Garcia', 'Smith', 'Kim', 'Chen', 'Singh', 'Nguyen', 'Brown', 'Davis', 'Lopez', 'Wilson', 'Cohen'];
const ROLES = ['engineer', 'designer', 'pm', 'data', 'ops', 'sales', 'marketing', 'support'] as const;
const STATUSES = ['active', 'invited', 'paused', 'archived'] as const;

export interface FakeRow {
  id: number;
  name: string;
  email: string;
  role: (typeof ROLES)[number];
  status: (typeof STATUSES)[number];
  score: number;
  joined: string; // ISO yyyy-mm-dd
}

// Mulberry32 — small, fast, deterministic PRNG. Good statistical quality for
// demo data; not cryptographically secure (and doesn't need to be).
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  // Math.floor(rng() * arr.length) is always in [0, arr.length-1], so the
  // non-null assertion is safe. arr is always a non-empty const array here.
  return arr[Math.floor(rng() * arr.length)]!;
}

/**
 * Generate N rows seeded by `seed`. Output is identical across runs for the
 * same (n, seed) pair — useful for reproducible perf benchmarks.
 */
export function generateRows(n: number, seed = 1): FakeRow[] {
  const rng = mulberry32(seed);
  const rows: FakeRow[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    rows[i] = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      role: pick(rng, ROLES),
      status: pick(rng, STATUSES),
      score: Math.floor(rng() * 10000) / 100, // 0.00 - 100.00
      joined: new Date(2020 + Math.floor(rng() * 6), Math.floor(rng() * 12), Math.floor(rng() * 28) + 1)
        .toISOString()
        .slice(0, 10),
    };
  }
  return rows;
}
