/* Surestep: presentation-only gait/IK and input selection helpers.
 * Independent implementation informed by The Orange Duck's 2026 foot-locking
 * article. No simulation, save, collision or damage state is mutated here. */
(function (root) {
  'use strict';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const finite3 = p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, k) => a.map(v => v * k);
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const len = a => Math.hypot(...a);
  const unit = a => mul(a, 1 / (len(a) || 1));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const smooth = t => t * t * (3 - 2 * t);
  const DAMAGE_TYPES = Object.freeze(['plain', 'cinder', 'frost', 'volley', 'ricochet']);
  function activeDamage(s) {
    return DAMAGE_TYPES.filter(type => type === 'plain' || (
      Number.isFinite(s?.ammo?.[type]) && s.ammo[type] > 0 &&
      (type !== 'volley' || s.volleyUnlocked === true) &&
      (type !== 'ricochet' || s.ricochetUnlocked === true)
    ));
  }
  function nextDamage(s) {
    const types = activeDamage(s);
    return types[(types.indexOf(s?.type) + 1) % types.length];
  }
  // Analytic two-bone IK with a stable pole, finite singular fallbacks, and a
  // small extension margin. The target is clamped, never the bone lengths.
  function twoBone(hip, target, pole = [0, 0, 1], upper = .48, lower = .46) {
    if (![hip, target, pole].every(finite3) || !Number.isFinite(upper) ||
        !Number.isFinite(lower) || upper <= 0 || lower <= 0) return null;
    const delta = sub(target, hip), raw = len(delta);
    const axis = raw > 1e-8 ? mul(delta, 1 / raw) : [0, -1, 0];
    const distance = clamp(raw, Math.abs(upper - lower) + 1e-5, upper + lower - .002);
    const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, upper * upper - along * along));
    let bend = sub(pole, mul(axis, dot(pole, axis)));
    if (len(bend) < 1e-6) {
      const fallback = Math.abs(axis[0]) < .8 ? [1, 0, 0] : [0, 0, 1];
      bend = sub(fallback, mul(axis, dot(fallback, axis)));
    }
    return {knee: add(add(hip, mul(axis, along)), mul(unit(bend), height)),
      ankle: add(hip, mul(axis, distance)), clamped: Math.abs(distance - raw) > 1e-6};
  }
  function menuHit(u, v, count) {
    if (![u, v, count].every(Number.isFinite)) return -1;
    const x = u * 1024, y = (1 - v) * 768, i = Math.floor((y - 195) / 75);
    return x >= 95 && x <= 929 && i >= 0 && i < count && y <= 195 + i * 75 + 61 ? i : -1;
  }
  class Pinch {
    constructor() { this.reset(); }
    reset() { this.armed = false; this.closed = false; }
    update(distance, valid = true) {
      if (!valid || !Number.isFinite(distance) || distance < 0) { this.reset(); return false; }
      if (distance >= .035) { this.closed = false; this.armed = true; return false; }
      if (distance <= .022 && !this.closed) {
        this.closed = true;
        const pressed = this.armed;
        this.armed = false;
        return pressed;
      }
      return false;
    }
  }
  const HIP_Y = -.07, ANKLE_Y = .105;
  class Gait {
    constructor() { this.time = null; this.feet = []; this.speed = 0; this.distance = 0; this.next = 0; }
    update(position, yaw, time, floor, frozen = false) {
      if (!finite3(position) || !Number.isFinite(yaw) || !Number.isFinite(time) || typeof floor !== 'function') return null;
      const c = Math.cos(yaw), sn = Math.sin(yaw), ground = position[1] - 1.05;
      const homes = [-1, 1].map(side => {
        const x = position[0] + side * .16 * c + .035 * sn;
        const z = position[2] - side * .16 * sn + .035 * c;
        const y = floor([x, ground, z]);
        return [x, (Number.isFinite(y) ? y : ground) + ANKLE_Y, z];
      });
      const dt = this.time === null ? 0 : time - this.time;
      const delta = this.position ? sub(position, this.position) : [0, 0, 0];
      const travel = Math.hypot(delta[0], delta[2]);
      const reset = !this.feet.length || dt < 0 || dt > .4 || travel > 1.2 || Math.abs(delta[1]) > .7;
      if (reset) {
        this.feet = homes.map(p => ({p: [...p], from: [...p], to: [...p], t: 1, duration: .22}));
        this.speed = 0; this.distance = 0; this.next = 0;
      } else if (dt > 0 && !frozen) {
        const speed = travel / dt;
        this.speed += (speed - this.speed) * (1 - Math.exp(-dt * 12));
        this.distance += travel;
        const velocity = [delta[0] / dt, 0, delta[2] / dt];
        for (const foot of this.feet) {
          if (foot.t >= 1) continue;
          foot.t = Math.min(1, foot.t + dt / foot.duration);
          foot.p = mix(foot.from, foot.to, smooth(foot.t));
          foot.p[1] += Math.sin(Math.PI * foot.t) * clamp(.065 + this.speed * .012, .065, .16);
          const y = floor([foot.p[0], ground, foot.p[2]]);
          if (Number.isFinite(y)) foot.p[1] = Math.max(foot.p[1], y + ANKLE_Y);
        }
        for (const i of [this.next, 1 - this.next]) {
          const foot = this.feet[i], other = this.feet[1 - i];
          const error = Math.hypot(foot.p[0] - homes[i][0], foot.p[2] - homes[i][2]);
          const heightError = Math.abs(foot.p[1] - homes[i][1]);
          if (foot.t < 1 || error < .18 && heightError < .12) continue;
          if (other.t < .55 && error < .40 && heightError < .25) continue;
          foot.duration = clamp(.25 / Math.sqrt(Math.max(.6, speed)), .085, .28);
          let target = add(homes[i], mul(velocity, foot.duration * .85));
          const y = floor([target[0], ground, target[2]]);
          if (Number.isFinite(y)) target[1] = y + ANKLE_Y;
          else target = [...homes[i]]; // Never plant beyond the authoritative floor.
          foot.from = [...foot.p]; foot.to = target; foot.t = 0;
          this.next = 1 - i;
        }
      }
      this.time = time; this.position = [...position];
      // Bounded pelvis correction prevents a planted foot stretching the knee.
      // It is applied only to visual hip targets, not the gameplay root/head.
      let pelvis = HIP_Y;
      const maxReach = .936;
      for (let i = 0; i < 2; i++) {
        const dx = this.feet[i].p[0] - (position[0] + (i ? .16 : -.16) * c);
        const dz = this.feet[i].p[2] - (position[2] - (i ? .16 : -.16) * sn);
        const drop = this.feet[i].p[1] + Math.sqrt(Math.max(.3, maxReach * maxReach - dx * dx - dz * dz)) - position[1];
        pelvis = Math.min(pelvis, drop);
      }
      pelvis = Math.max(HIP_Y - .16, pelvis);
      const pole = [sn, 0, c];
      return {speed: this.speed, distance: this.distance, reset, pelvis,
        legs: this.feet.map((f, i) => {
          const side = i ? .16 : -.16;
          const hip = [position[0] + side * c, position[1] + pelvis, position[2] - side * sn];
          return {hip, ...twoBone(hip, f.p, pole), locked: f.t >= 1, target: [...f.p], phase: f.t};
        })};
    }
  }
  const api = Object.freeze({activeDamage, nextDamage, twoBone, menuHit, Pinch, Gait, DAMAGE_TYPES});
  root.VesperSurestep = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
