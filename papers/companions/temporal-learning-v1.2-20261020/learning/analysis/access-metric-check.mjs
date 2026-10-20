// Elementary constructions, not fitted neural data, causal identification or an application.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const eps = 1e-12;
const u = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
const delta = Math.PI / 3;
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const circular = angles => Math.hypot(mean(angles.map(Math.cos)), mean(angles.map(Math.sin)));
const relative = (a, b) => circular(a.map((v, i) => v - b[i]));
const close = (a, b) => Math.abs(a - b) < eps;
const checks = [];
function check(name, values, expected) {
  const pass = values.length === expected.length && values.every((v, i) => close(v, expected[i]));
  checks.push({ name, values, expected, pass });
  if (!pass) throw new Error('Construction check failed: ' + name);
}

const b = u.map(v => v + delta);
const reversed = u.map(v => -v + delta);
check('Stable relative phase without event-phase consistency',
  [circular(u), circular(b), relative(u, b)], [0, 0, 1]);
check('Same individual marginals with zero relative consistency',
  [circular(u), circular(reversed), relative(u, reversed)], [0, 0, 0]);
check('Marginal phase sets coincide under an explicit modulo-cycle permutation',
  reversed.map((v, i) => {
    const corresponding = b[(u.length - i) % u.length];
    return Math.hypot(Math.cos(v) - Math.cos(corresponding), Math.sin(v) - Math.sin(corresponding));
  }),
  [0, 0, 0, 0]);
const aRotated = u.map(v => v - v);
const bRotated = b.map((v, i) => v - u[i]);
check('Shared trial rotations preserve relative consistency, change event locking',
  [circular(aRotated), circular(bRotated), relative(aRotated, bRotated)], [1, 1, 1]);
check('Coefficient gain is a different quantity from either phase statistic',
  [mean([1, 1, 1, 1].map(v => v * v)), mean([3, 3, 3, 3].map(v => v * v)), relative(u, b)],
  [1, 9, 1]);

const ySharedObserved = u.map(v => Math.cos(v + delta));
const yDirectedObserved = u.map(a => Math.cos(a + delta));
check('Shared-drive and directed models are observationally identical',
  ySharedObserved.map((v, i) => v - yDirectedObserved[i]), [0, 0, 0, 0]);
const sharedDo0 = u.map(v => Math.cos(v + delta));
const sharedDoPi = u.map(v => Math.cos(v + delta));
const directedDo0 = u.map(() => Math.cos(delta));
const directedDoPi = u.map(() => Math.cos(Math.PI + delta));
check('Different ideal controlled effects despite identical observations',
  [mean(sharedDo0) - mean(sharedDoPi), mean(directedDo0) - mean(directedDoPi)], [0, 1]);
check('Different awareness mixtures have the same block mean',
  [0.25 * 4 + 0.75 * 0, 0.5 * 2 + 0.5 * 0], [1, 1]);
check('One versus two labelled events both allow an ever-noticed block response',
  [[1, 0, 0, 0].some(Boolean) ? 1 : 0, [1, 1, 0, 0].some(Boolean) ? 1 : 0], [1, 1]);

console.log(JSON.stringify({
  scope: 'Deterministic algebraic fixtures only; no fitting, biological data, measurement calibration, power estimate or independent review.',
  sourceSha256: createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').toUpperCase(),
  tolerance: eps, trialCount: u.length, delta, checks, pass: checks.every(v => v.pass),
  scientificNoveltyEstablished: false, biologicalValidation: false, newApplication: false
}, null, 2));
