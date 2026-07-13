/*
 * Seeded randomness. Every simulation on this site is reproducible: the seed
 * comes from the data repo, so the same figure draws the same numbers for every
 * reader, and the data repo can store the expected output and check it
 * (see its docs/simulation-policy.md).
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Box-Muller. Returns one standard normal draw per call. */
export function normalDraw(rand) {
  let u = 0;
  while (u === 0) u = rand(); // log(0) guard
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function normalSample(rand, n, mean = 0, sd = 1) {
  return Array.from({ length: n }, () => mean + sd * normalDraw(rand));
}
