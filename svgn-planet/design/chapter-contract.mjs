/* DESIGN CONTRACT ONLY. Not imported by the game. Graph reachability is not
 * walkable geometry, WebXR support, save migration, or a quality certificate. */
export const CHAPTER_ID = 'lantern-ward-01';
export const LAYOUT_VERSION = 1;
export const OPENINGS = Object.freeze(['top', 'front', 'both']);
export const VIEWS = Object.freeze(['desktop-third-person', 'first-person-vr', 'diorama-vr', 'diorama-ar']);
const knownViews = new Set(VIEWS);

export function openingState(value = 'both') {
  return OPENINGS.includes(value) ? value : 'both';
}
export function panelsFor(value) {
  const opening = openingState(value);
  return { topOpen: opening !== 'front', frontOpen: opening !== 'top' };
}
// Atomic: closing the last aperture first opens the other aperture. A renderer
// must preserve this ordering throughout animation, not just at its endpoints.
export function setPanel(value, panel, open) {
  if (!['top', 'front'].includes(panel) || typeof open !== 'boolean') throw new TypeError('Expected a panel and a boolean.');
  const state = panelsFor(value);
  state[panel + 'Open'] = open;
  if (!state.topOpen && !state.frontOpen) state[panel === 'top' ? 'frontOpen' : 'topOpen'] = true;
  return state.topOpen && state.frontOpen ? 'both' : state.topOpen ? 'top' : 'front';
}
export function presentation(view, opening = 'both') {
  if (!knownViews.has(view)) throw new RangeError('Unknown presentation.');
  return Object.freeze({view, opening: openingState(opening), sessionMode: view === 'diorama-ar' ? 'immersive-ar' : view === 'desktop-third-person' ? null : 'immersive-vr'});
}
// Capability checks do not create sessions or silently substitute VR for AR.
export function xrChoice(view, support = {}) {
  const p = presentation(view);
  if (!p.sessionMode) return {allowed: true, requested: p};
  return support[p.sessionMode] === true
    ? {allowed: true, requested: p}
    : {allowed: false, requested: p, alternatives: ['desktop-third-person', ...(support['immersive-vr'] === true ? ['diorama-vr'] : [])], requiresExplicitChoice: true};
}
const node = (id, name, elevation, purpose, enabled = 'always') => Object.freeze({id, name, elevation, purpose, enabled});
export const NODES = Object.freeze([
  node('depot', 'Blue-door depot court', 0, 'Arrival, parcel collection, recovery and return.'),
  node('market', 'Market arch', 0, 'Observe loading traffic and hear the workshop bell.'),
  node('arcade', 'Covered goods arcade', 0, 'Street approach with a cart passing bay.'),
  node('court', 'Workshop receiving court', 0, 'Shared yard and far side of the blue-door shortcut.'),
  node('workshop', 'Lantern workshop', 0, 'Delivery recipient reached from any legitimate approach.'),
  node('printshop', 'Print shop stair hall', 0, 'Public stair access; no invented climbing power.'),
  node('roofwalk', 'Drying-terrace roof walk', 4, 'Observe the bridge, hoist and depot roof.'),
  node('loft', 'Workshop loading loft', 4, 'Upper access and a safe staircase down.'),
  node('near-pier', 'Depot-side public pier', -2, 'Explicit land/boat transfer and boat recovery.'),
  node('far-pier', 'Workshop-side public pier', -2, 'Explicit land/boat transfer and boat recovery.'),
  node('dry-channel', 'Drained maintenance channel', -2, 'Temporary walking route, not a permanent boat lane.', 'low'),
  node('pump', 'Open pump gallery', -2, 'Visible reversible water control and delivery-hoist repair.')
]);
// Lengths are provisional route-cost estimates in game meters, not measured
// collision paths. Stairs include the climb in this estimate.
const edge = (id, from, to, length, modes = ['foot'], condition = 'always') =>
  Object.freeze({id, from, to, length, modes: Object.freeze(modes), condition});
export const EDGES = Object.freeze([
  edge('depot-market', 'depot', 'market', 14, ['foot', 'bicycle']),
  edge('market-arcade', 'market', 'arcade', 20, ['foot', 'bicycle']),
  edge('arcade-court', 'arcade', 'court', 24, ['foot', 'bicycle']),
  edge('court-workshop', 'court', 'workshop', 12),
  edge('depot-printshop', 'depot', 'printshop', 11),
  edge('printshop-roof', 'printshop', 'roofwalk', 20),
  edge('roof-loft', 'roofwalk', 'loft', 18),
  edge('loft-workshop', 'loft', 'workshop', 12),
  edge('arcade-roof-stair', 'arcade', 'roofwalk', 24),
  edge('depot-pier', 'depot', 'near-pier', 20),
  edge('canal-crossing', 'near-pier', 'far-pier', 46, ['boat'], 'high'),
  edge('pier-channel', 'near-pier', 'dry-channel', 23, ['foot'], 'low'),
  edge('channel-pump', 'dry-channel', 'pump', 24, ['foot'], 'low'),
  edge('far-pier-pump', 'far-pier', 'pump', 9),
  edge('pump-court', 'pump', 'court', 23),
  edge('delivery-hoist', 'pump', 'loft', 10, ['foot'], 'liftRepaired'),
  edge('blue-door', 'court', 'depot', 9, ['foot', 'bicycle'], 'gateOpen')
]);
export const APPROACHES = Object.freeze({
  street: Object.freeze(['depot', 'market', 'arcade', 'court', 'workshop']),
  rooftop: Object.freeze(['depot', 'printshop', 'roofwalk', 'loft', 'workshop']),
  canal: Object.freeze(['depot', 'near-pier', 'far-pier', 'pump', 'court', 'workshop']),
  drained: Object.freeze(['depot', 'near-pier', 'dry-channel', 'pump', 'court', 'workshop'])
});
const ids = new Set(NODES.map(n => n.id));
const flags = ['parcel', 'delivered', 'gateOpen', 'liftRepaired', 'rewardRecorded'];
export function initialProgress() {
  return {chapterId: CHAPTER_ID, layoutVersion: LAYOUT_VERSION, water: 'high', parcel: false, delivered: false, gateOpen: false, liftRepaired: false, rewardRecorded: false};
}
export function validateProgress(s) {
  if (!s || s.chapterId !== CHAPTER_ID || s.layoutVersion !== LAYOUT_VERSION || !['high', 'low'].includes(s.water) || flags.some(k => typeof s[k] !== 'boolean')) throw new TypeError('Invalid chapter state. Retain unsupported original data rather than overwrite it.');
  if ((s.delivered && !s.parcel) || (s.rewardRecorded && !complete(s))) throw new TypeError('Contradictory chapter outcome.');
  return s;
}
export function complete(s) { return s.delivered === true && (s.gateOpen === true || s.liftRepaired === true); }
export function nodeAvailable(id, s) {
  validateProgress(s);
  const n = NODES.find(n => n.id === id);
  return !!n && (n.enabled === 'always' || n.enabled === s.water);
}
export function edgeAvailable(e, s, modes = ['foot', 'bicycle', 'boat']) {
  return nodeAvailable(e.from, s) && nodeAvailable(e.to, s) && e.modes.some(m => modes.includes(m)) &&
    (e.condition === 'always' || e.condition === s.water || s[e.condition] === true);
}
export function neighbors(id, s, modes) {
  if (!nodeAvailable(id, s)) return [];
  return EDGES.filter(e => (e.from === id || e.to === id) && edgeAvailable(e, s, modes)).map(e => ({id: e.from === id ? e.to : e.from, length: e.length, edgeId: e.id}));
}
export function reachable(from, s, modes) {
  const seen = new Set();
  if (!nodeAvailable(from, s)) return seen;
  const todo = [from]; seen.add(from);
  while (todo.length) for (const next of neighbors(todo.shift(), s, modes)) if (!seen.has(next.id)) {seen.add(next.id); todo.push(next.id);}
  return seen;
}
export function routeCost(path, s, modes) {
  validateProgress(s);
  if (!Array.isArray(path) || !path.length || path.some(id => !ids.has(id))) return Infinity;
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    const options = neighbors(path[i - 1], s, modes).filter(n => n.id === path[i]);
    if (!options.length) return Infinity;
    cost += Math.min(...options.map(n => n.length));
  }
  return nodeAvailable(path[0], s) ? cost : Infinity;
}
// This is an abstract outcome model. Runtime integration MUST independently
// validate avatar location, reach, collision, water occupancy and checkpoints.
export function act(s, action, at, {waterOccupied = false} = {}) {
  validateProgress(s);
  const next = {...s};
  if (!nodeAvailable(at, s)) return {state: next, changed: false, reason: 'Unavailable location.'};
  if (action === 'collect' && at === 'depot') next.parcel = true;
  else if (action === 'deliver' && at === 'workshop' && s.parcel) next.delivered = true;
  else if (action === 'unlock' && at === 'court') next.gateOpen = true;
  else if (action === 'repair' && at === 'pump') next.liftRepaired = true;
  else if (action === 'water' && at === 'pump') {
    if (waterOccupied) return {state: next, changed: false, reason: 'Clear the channel and dock occupants before changing the water.'};
    next.water = s.water === 'high' ? 'low' : 'high';
  } else if (action === 'claim' && at === 'depot' && complete(s)) next.rewardRecorded = true;
  validateProgress(next);
  return {state: next, changed: JSON.stringify(s) !== JSON.stringify(next)};
}
