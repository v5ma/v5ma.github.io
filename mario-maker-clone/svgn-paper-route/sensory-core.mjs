/* Quiet Water rules: presentation only. No saves, game state or browser globals. */
export const STORE = 'svgn.skycycle.sensory.v1';
export const DEFAULTS = Object.freeze({notices:'balanced', transients:'soft', ambience:0.35});
export const INTENSITY = Object.freeze({gentle:0.35, soft:0.65, full:1});
export function sanitize(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {notices:['balanced','quiet','essential'].includes(v.notices)?v.notices:DEFAULTS.notices,
    transients:typeof v.transients==='string'&&Object.hasOwn(INTENSITY,v.transients)?v.transients:DEFAULTS.transients,
    ambience:Number.isFinite(v.ambience)?Math.min(1,Math.max(0,v.ambience)):DEFAULTS.ambience};
}
export function createNoticeState() {
  return {last:-Infinity, essentialUntil:0, keys:new Map(), shown:0, suppressed:0};
}
export function admitNotice(state, key, now, settings) {
  const p=sanitize(settings), gap=p.notices==='quiet'?12000:4500;
  key=String(key).slice(0,100);
  if(!Number.isFinite(now)||p.notices==='essential'||now<state.essentialUntil||now-state.last<gap||now-(state.keys.get(key)??-Infinity)<gap*3){state.suppressed++;return false;}
  state.last=now;state.keys.delete(key);state.keys.set(key,now);
  while(state.keys.size>32)state.keys.delete(state.keys.keys().next().value);
  state.shown++;return true;
}
export function transientGain(settings) { return INTENSITY[sanitize(settings).transients]; }
export function waterEvents(previous, current) {
  if(!current?.active)return [];
  if(!previous||previous.epoch!==current.epoch||previous.route!==current.route)
    return current.route==='tideglass-baths'?['arrival']:[];
  if(current.route!=='tideglass-baths')return [];
  const events=[];
  if(!previous.opened&&current.opened)events.push('sluice');
  if(previous.drain<150&&current.drain===150)events.push('waterline');
  return events;
}
export function ambienceGain(sample, settings, mix) {
  if(!sample?.active||sample.route!=='tideglass-baths'||mix?.muted||!Number.isFinite(mix?.effects)||mix.effects<=0||mix?.state!=='running')return 0;
  return sanitize(settings).ambience*0.12;
}
export function waterSamples(rate=12000) {
  if(!Number.isInteger(rate)||rate<8000||rate>48000)throw new RangeError('Unsupported water sample rate');
  const n=rate*4, data=new Float32Array(n);let seed=8721, low=0;
  for(let i=-512;i<n;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    low+=0.09*((seed/2147483648-1)-low);
    if(i>=0){const phase=2*Math.PI*i/n;data[i]=low*(0.42+0.18*Math.sin(phase)+0.08*Math.sin(phase*3));}
  }
  // A cosine edge taper makes the four-second lapping texture loop without a discontinuity.
  const seam=Math.floor(rate*0.02);
  for(let i=0;i<seam;i++){const gain=0.5-0.5*Math.cos(Math.PI*i/(seam-1));data[i]*=gain;data[n-1-i]*=gain;}
  return data;
}
