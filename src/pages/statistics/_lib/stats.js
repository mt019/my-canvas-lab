/*
 * The statistics the figures need, written out rather than imported: a t test,
 * the t distribution's tail, exact combinatorics for the tea experiment, and the
 * positive predictive value of a "significant" finding.
 *
 * Everything here is a pure function of its arguments. The browser is allowed to
 * compute distributions; it is not allowed to compute claims. Interpretations,
 * thresholds and history all come from the data repo.
 */

export function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function variance(xs) {
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
}

/* Student's two-sample t test, equal variances assumed — the textbook case, which
   is what the article is about. */
export function tTest(a, b) {
  const na = a.length;
  const nb = b.length;
  const df = na + nb - 2;
  const sp2 = ((na - 1) * variance(a) + (nb - 1) * variance(b)) / df;
  const se = Math.sqrt(sp2 * (1 / na + 1 / nb));
  const t = (mean(a) - mean(b)) / se;
  return { t, df, p: tTwoSidedP(t, df) };
}

/* Two-sided tail probability of |T| >= |t| under the null. */
export function tTwoSidedP(t, df) {
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5);
}

/* Upper-tail probability P(T > t): half the two-sided tail on the right of the
   centre, its complement on the left. One-sided p values for TOST are read off
   this and its mirror below. */
export function tUpperP(t, df) {
  const half = tTwoSidedP(t, df) / 2;
  return t >= 0 ? half : 1 - half;
}

/* Lower-tail probability P(T < t). */
export function tLowerP(t, df) {
  return 1 - tUpperP(t, df);
}

/* The critical value t* for a two-sided confidence level (0.95 -> t_{0.975}),
   found by bisection on the monotone two-sided tail. A 95% interval uses
   conf = 0.95; a 90% interval, the TOST-dual level, uses conf = 0.90. */
export function tCritical(conf, df) {
  const targetTail = 1 - conf;
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    if (tTwoSidedP(mid, df) > targetTail) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* Regularized incomplete beta, by continued fraction (Lentz). Standard recipe;
   accurate to ~1e-10 over the range these figures use. */
export function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const front = Math.exp(lbeta) / a;
  const cf = betaContinuedFraction(x, a, b);
  return x < (a + 1) / (a + b + 2)
    ? front * cf
    : 1 - (Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b)
        + b * Math.log(1 - x) + a * Math.log(x)) / b) * betaContinuedFraction(1 - x, b, a);
}

function betaContinuedFraction(x, a, b) {
  const tiny = 1e-30;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m += 1) {
    const m2 = 2 * m;
    let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + num * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + num / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    num = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + num * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + num / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return h;
}

export function logGamma(z) {
  const g = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const x = z - 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < g.length; i += 1) a += g[i] / (x + i + 1);
  const t = x + g.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/* The tea experiment's null distribution, computed the way Fisher computed it:
   count the arrangements. With n cups, half of them milk-first, a taster who is
   guessing picks any of the C(n, n/2) selections with equal probability, and the
   number of correct picks k occurs in C(n/2, k) * C(n/2, n/2 - k) of them. */
export function teaNullDistribution(cups = 8) {
  const half = cups / 2;
  const total = choose(cups, half);
  const counts = Array.from({ length: half + 1 }, (_, k) => choose(half, k) * choose(half, half - k));
  return {
    total,
    counts,
    /* One-sided p: the chance of doing this well or better while guessing. */
    pAtLeast: (k) => counts.slice(k).reduce((a, b) => a + b, 0) / total,
  };
}

/* Of the findings that come out "significant", how many are true? Prior odds of a
   real effect, the test's power, and alpha are all it takes — and the answer is
   nowhere near 1 - alpha. */
export function positivePredictiveValue({ priorOdds, power, alpha }) {
  const truePositive = priorOdds * power;
  const falsePositive = alpha;
  return truePositive / (truePositive + falsePositive);
}
