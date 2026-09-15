/* Authored-world presentation foundation. Not connected to the shipped renderer yet.
 * This module never changes game collision, mission state, saves or XR head poses. */
export const XR_VIEWS = Object.freeze(['first-person-vr', 'diorama-vr', 'diorama-ar']);
export const OPENINGS = Object.freeze(['top', 'front', 'both']);
const finite = (v, fallback, lo, hi) => Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
const record = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};

/** Sanitize a stored preference. Capability detection and user consent are separate. */
export function cleanPresentation(value) {
  const v = record(value);
  return Object.freeze({
    view: XR_VIEWS.includes(v.view) ? v.view : 'first-person-vr',
    opening: OPENINGS.includes(v.opening) ? v.opening : 'both',
    scale: finite(v.scale, .025, .01, .05),
    height: finite(v.height, .85, .35, 1.45),
    distance: finite(v.distance, 1.15, .6, 2.5),
    yaw: finite(v.yaw, 0, -Math.PI, Math.PI)
  });
}

/** A three-state enum cannot represent an entirely closed diorama. */
export function openings(value) {
  const {opening} = cleanPresentation(value);
  return Object.freeze({top: opening !== 'front', front: opening !== 'top'});
}

/** Closing the only opening opens the other face in the SAME state transition. */
export function setOpening(value, surface, open) {
  if (!['top', 'front'].includes(surface) || typeof open !== 'boolean') {
    throw new TypeError('Expected top/front and an explicit boolean.');
  }
  const next = {...openings(value), [surface]: open};
  if (!next.top && !next.front) next[surface === 'top' ? 'front' : 'top'] = true;
  return cleanPresentation({...cleanPresentation(value), opening: next.top ? (next.front ? 'both' : 'top') : 'front'});
}

/** Never silently substitute opaque VR for a requested passthrough AR session. */
export function sessionRequest(value, capabilities = {}) {
  const prefs = cleanPresentation(value), ar = prefs.view === 'diorama-ar';
  const mode = ar ? 'immersive-ar' : 'immersive-vr';
  const supported = record(capabilities)[mode] === true;
  return Object.freeze({view: prefs.view, mode, supported,
    reason: supported ? null : `${mode} is unavailable or has not been checked.`,
    needsUserActivation: true,
    requiredFeatures: Object.freeze(['local-floor']),
    optionalFeatures: Object.freeze(ar ? ['hand-tracking', 'hit-test'] : ['hand-tracking'])
  });
}

/** Only the OUTER display housing is controlled here, never gameplay walls/doors. */
export function shellVisibility(value) {
  const p = cleanPresentation(value), o = openings(p), diorama = p.view !== 'first-person-vr';
  return Object.freeze({housing: diorama, top: diorama && !o.top, front: diorama && !o.front,
    sides: diorama, base: diorama, changeCollision: false});
}

function point(v, name) {
  if (!v || !['x', 'y', 'z'].every(k => Number.isFinite(v[k]))) throw new TypeError(`${name} must be a finite 3D point.`);
  return v;
}
function placement(v) {
  if (!v || !Number.isFinite(v.scale) || v.scale <= 0 || !Number.isFinite(v.yaw)) throw new TypeError('Invalid diorama placement.');
  point(v.origin, 'World origin'); point(v.anchor, 'Physical anchor');
  return v;
}
function unit(v) {
  const length = Math.hypot(v.x, v.y, v.z);
  if (!Number.isFinite(length) || length < 1e-12) return null;
  return {x: v.x / length, y: v.y / length, z: v.z / length};
}

/** World-space metres -> anchored miniature metres, using Three.js Y rotation. */
export function worldToDiorama(world, transform) {
  point(world, 'World point'); const t = placement(transform), c = Math.cos(t.yaw), s = Math.sin(t.yaw);
  const x = (world.x - t.origin.x) * t.scale, y = (world.y - t.origin.y) * t.scale, z = (world.z - t.origin.z) * t.scale;
  return {x: t.anchor.x + c*x + s*z, y: t.anchor.y + y, z: t.anchor.z - s*x + c*z};
}

/** A pointer hit must be transformed back before querying the canonical game. */
export function dioramaToWorld(physical, transform) {
  point(physical, 'Physical point'); const t = placement(transform), c = Math.cos(t.yaw), s = Math.sin(t.yaw);
  const x = physical.x - t.anchor.x, y = physical.y - t.anchor.y, z = physical.z - t.anchor.z;
  return {x: t.origin.x + (c*x - s*z)/t.scale, y: t.origin.y + y/t.scale, z: t.origin.z + (s*x + c*z)/t.scale};
}

export function pointerRayToWorld(ray, transform) {
  const t = placement(transform); point(ray?.origin, 'Ray origin'); point(ray?.direction, 'Ray direction');
  const c = Math.cos(t.yaw), s = Math.sin(t.yaw), d = ray.direction;
  const direction = unit({x: c*d.x - s*d.z, y: d.y, z: s*d.x + c*d.z});
  if (!direction) throw new TypeError('Pointer ray must have a nonzero direction.');
  return {origin: dioramaToWorld(ray.origin, t), direction, worldMetresPerPhysicalMetre: 1/t.scale};
}

/** Tabletop aiming starts at the AVATAR, not at the giant observer's controller.
 * The caller MUST still run the game's muzzle-to-target collision/visibility test. */
export function aimFromAvatar(muzzle, worldTarget) {
  point(muzzle, 'Avatar muzzle'); point(worldTarget, 'World target');
  const direction = unit({x: worldTarget.x-muzzle.x, y: worldTarget.y-muzzle.y, z: worldTarget.z-muzzle.z});
  return direction ? {origin: {...muzzle}, direction} : null;
}
