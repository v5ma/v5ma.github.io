/* Resonance: original score inventory and validated, additive player preferences. */
export const AUDIO_VERSION = 2;
export const AUDIO_KEY = 'svgn.leonardos-guild.audio.v1';
export const CONSOLE_KEY = 'svgn.leonardos-guild.console.v1';
export const MUSIC = Object.freeze([
  {id:'vinci', name:'Morning in Vinci', detail:'Lute, flute, bowed strings and a measured hand drum.', file:'vinci.ogg'},
  {id:'market', name:'The Artisans\' Round', detail:'A livelier market dance with dulcimer and answering flutes.', file:'market.ogg'},
  {id:'lamplight', name:'Workshops by Lamplight', detail:'A quiet, spacious arrangement for interiors and night.', file:'lamplight.ogg'},
  {id:'underways', name:'The Water Beneath', detail:'Low strings, glass harmonics and sparse plucked echoes.', file:'underways.ogg'},
  {id:'pursuit', name:'Across the Copper Roofs', detail:'Pulsing strings and frame drums for rival encounters.', file:'pursuit.ogg'},
]);
export const STATIONS = Object.freeze([{id:'auto',name:'Adaptive score',detail:'The arrangement follows the city, the hour and nearby danger.'},...MUSIC,{id:'off',name:'Music off',detail:'Keep the environmental and gameplay sounds.'}]);
export const SOUND_DENSITIES = Object.freeze([
  {id:'quiet',name:'Quiet / essential cues',detail:'Keeps important combat, mission and interaction cues while heavily spacing repeated sounds.'},
  {id:'balanced',name:'Balanced',detail:'Moderate environmental and action detail with repeated cues rate-limited.'},
  {id:'full',name:'Full detail',detail:'Most movement, ambience and action cues are audible.'},
]);
export const TOOLS = Object.freeze([
  {id:'staff',name:'Guild staff',detail:'A close-range, non-lethal staff. LT braces. RT strikes.',variants:['Balanced grip','Heavy grip']},
  {id:'sling',name:'Artisan\'s sling',detail:'LT aims. RT releases a pellet. X fills the ready pouch. No civilian targets.',variants:['Firm pellets','Soft stun pellets']},
  {id:'letters',name:'Sealed letters',detail:'Preserves the original deliveries. RT throws toward the selected side.',variants:['Left-side delivery','Right-side delivery']},
  {id:'lantern',name:'Ingenio lantern',detail:'Uses the existing earned Lantern power and focus. Obtain it through the original story.',variants:['Lantern pulse']},
]);
export const DISCIPLINES = Object.freeze([
  {id:'courier',name:'Courier',detail:'Second Wind: 7 seconds of faster footwork. Costs 40 focus.'},
  {id:'warden',name:'Warden',detail:'Steadfast: 7 seconds of bracing and gradual recovery. Costs 40 focus.'},
  {id:'artificer',name:'Artificer',detail:'Ingenio: reveal mechanisms and reload faster for 7 seconds. Costs 40 focus.'},
]);
export const AUDIO_DEFAULTS = Object.freeze({version:AUDIO_VERSION,enabled:true,master:.62,music:.34,effects:.42,ambience:.30,density:'quiet',mono:false,captions:true,range:'night',station:'auto'});
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
export function audioPreferences(raw){
  const out={...AUDIO_DEFAULTS};if(!raw||typeof raw!=='object')return out;
  const legacy=!Number.isFinite(raw.version)||raw.version<2;
  for(const k of ['enabled','mono','captions'])if(typeof raw[k]==='boolean')out[k]=raw[k];
  for(const k of ['master','music','effects','ambience'])if(Number.isFinite(raw[k]))out[k]=clamp(raw[k],0,1);
  // Keep the historic malformed-input fallback used by the validation suite,
  // but migrate actual finite v0.8 values to a calmer one-time ceiling.
  if(legacy&&!Number.isFinite(raw.music))out.music=.52;
  if(legacy){if(Number.isFinite(raw.music))out.music=Math.min(out.music,.38);out.effects=Math.min(out.effects,.48);out.ambience=Math.min(out.ambience,.36);out.range='night';out.density='quiet';}
  if(['full','balanced','night'].includes(raw.range)&&!legacy)out.range=raw.range;
  if(SOUND_DENSITIES.some(t=>t.id===raw.density))out.density=raw.density;
  if(STATIONS.some(t=>t.id===raw.station))out.station=raw.station;out.version=AUDIO_VERSION;return out;
}
export function consolePreferences(raw){return {profile:raw?.profile==='classic'?'classic':'console',lockOn:typeof raw?.lockOn==='boolean'?raw.lockOn:true,haptics:typeof raw?.haptics==='boolean'?raw.haptics:true,repeatSprint:typeof raw?.repeatSprint==='boolean'?raw.repeatSprint:true};}
export function radialIndex(x,y,count,previous=0){if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<.35||!Number.isInteger(count)||count<1)return previous;return Math.floor(((Math.atan2(x,-y)+Math.PI*2+Math.PI/count)%(Math.PI*2))/(Math.PI*2/count))%count;}
export function spatialMix(listener,source,radius=24,mono=false){
  if(!source||!listener)return {gain:1,pan:0};const dx=source.x-listener.x,dz=source.z-listener.z,d=Math.hypot(dx,dz);
  if(!Number.isFinite(d))return {gain:0,pan:0};return {gain:1/(1+(d/Math.max(1,radius))**2),pan:mono?0:clamp((-dx*Math.cos(listener.yaw)+dz*Math.sin(listener.yaw))/Math.max(2,d),-1,1)};
}
export function scoreFor({level=0,room=null,minute=480,z=0,danger=false}={}){if(danger)return 'pursuit';if(level<0)return 'underways';if(room||minute<360||minute>=1140)return 'lamplight';return z>=130&&z<270?'market':'vinci';}
export function surfaceFor(s,w){const level=s.doors?.level||0;if(level===3||level===1||level===2)return 'wood';if(level<0||s.life?.inside)return 'stone';if(w.rooms.some(h=>Math.abs(s.x-h.x)<h.hx&&Math.abs(s.z-h.z)<h.hz))return 'wood';return w.roads.some(x=>Math.abs(s.x-x)<11)||[...w.crossings,459,520].some(z=>Math.abs(s.z-z)<11)?'stone':'gravel';}
