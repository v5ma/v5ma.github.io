/* Pure contract and input rules. No engine, DOM, network, or save mutation. */
export const BADGES = Object.freeze(['finish', 'clean', 'mail', 'airmail', 'express']);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const finite = (n, fallback = 0) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
export const validID = id => typeof id === 'string' && /^[a-zA-Z0-9_.:-]{1,96}$/.test(id) && !['__proto__','constructor','prototype'].includes(id);
export function sanitizeLedger(value) {
  const out = Object.create(null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const [id, r] of Object.entries(value).slice(0, 128)) {
    if (!validID(id) || !r || typeof r !== 'object') continue;
    const badges = BADGES.filter(k => Array.isArray(r.badges) && r.badges.includes(k));
    const best = finite(r.best, 0);
    out[id] = {badges, finishes: Math.min(1000000, Math.max(0, Math.floor(finite(r.finishes)))), best: best > 0 ? best : null};
  }
  return out;
}
export function objectives(run) {
  const list = [{id:'finish', name:'Route cleared', detail:'Reach the real finish.', met:!!run.finished},
    {id:'clean', name:'Clean wheels', detail:'Finish without a crash or checkpoint retry.', met:run.incidents === 0}];
  if (run.total > 0) list.push(
    {id:'mail', name:'Every doorstep', detail:'Deliver to every mailbox, then finish.', met:run.delivered >= run.total},
    {id:'airmail', name:'Air courier', detail:'Serve a mailbox while airborne, then finish.', met:run.airmail > 0});
  if (run.par > 0) list.push({id:'express', name:'Express delivery', detail:`Finish within ${run.par}s of active simulation time, including retries.`, met:run.frames / 60 <= run.par});
  return list;
}
export function settle(ledger, run) {
  const records = sanitizeLedger(ledger);
  if (!run || !validID(run.id) || !run.finished || run.frames <= 0 || !Number.isFinite(run.frames)) return {records, earned:[], fresh:[]};
  const earned = objectives(run).filter(o => o.met).map(o => o.id);
  const before = own(records, run.id) ? records[run.id] : {badges:[], finishes:0, best:null};
  const fresh = earned.filter(k => !before.badges.includes(k));
  records[run.id] = {badges:BADGES.filter(k => before.badges.includes(k) || earned.includes(k)),
    finishes:Math.min(1000000, before.finishes + 1), best:before.best === null ? run.frames / 60 : Math.min(before.best, run.frames / 60)};
  return {records, earned, fresh};
}
export function samplePad(pad) {
  const buttons = Array.from({length:17}, (_,i) => !!pad?.buttons?.[i]?.pressed || finite(pad?.buttons?.[i]?.value) > .55);
  const x = Math.max(-1, Math.min(1, finite(pad?.axes?.[0]))), y = Math.max(-1, Math.min(1, finite(pad?.axes?.[1])));
  return {buttons, x, y, neutral:buttons.every(v => !v) && Math.abs(x) < .25 && Math.abs(y) < .25};
}
export function repeatDirection(previous, direction, now) {
  if (!direction) return {direction:0, next:0, fire:false};
  if (previous.direction !== direction) return {direction, next:now + 360, fire:true};
  if (now >= previous.next) return {direction, next:now + 140, fire:true};
  return {...previous, fire:false};
}
export function adjustValue(value, min, max, step, direction) {
  return Math.min(max, Math.max(min, finite(value, min) + step * Math.sign(direction)));
}
