import {CURRENT,waterAt,coverAt,heightAt,obstruction,dist} from './world.mjs';
import {THEMES,CAPTIONS,threatLevel,smoothThreat,spatialCue} from './audio-design.mjs';
import {createSoundGraph} from './audio-mixer.mjs';
/* One context for the whole tab. The look-ahead score clock is independent of
 * rendering. The game simulation owns every audible action and resource cost. */
import {scoreStep} from './audio-design.mjs';
export function createAudio(settings,getMode){
 let graph=null,context=null,state=null,view={yaw:0},chapter=null,step=0,next=0,timer=null,intensity=0,enabled=false,dead=false,resuming=false,variant=0,foot=0,breathing=0,lastState=null,caption=null,captionEnd=0,uiAt=0;
 const footsteps=new Map();let triggers=0;
 const hidden=()=>typeof document!=='undefined'&&document.hidden;
 function clock(){if(!graph||context.state!=='running'||hidden()||settings.mute)return;const now=context.currentTime;if(next<now-.5)next=now+.04;let budget=0;
  while(next<now+.18&&budget++<3){const seq=scoreStep(chapter||'district',step++);for(const n of seq.notes)graph.play(n.kind,{...n,when:next,bus:n.bus,priority:false,send:.18});next+=seq.seconds;}
 }
 function start(){if(dead)return;if(!context){try{const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Constructor)return;context=new Constructor({latencyHint:'interactive'});graph=createSoundGraph(context,settings);timer=setInterval(clock,40);next=context.currentTime+.08;enabled=true;}catch{return;}}
  const stop=hidden()||settings.mute;
  if(stop){if(context.state==='running')void context.suspend().catch(()=>{});return;}
  graph.configure({menu:!['play','pack'].includes(getMode()),listen:!!state?.player.listen,intensity});
  if(context.state==='suspended'&&!resuming){resuming=true;void context.resume().then(()=>{resuming=false;next=context.currentTime+.08;}).catch(()=>{resuming=false;});}
 }
 const active=()=>graph&&context.state==='running'&&!hidden()&&!settings.mute;
 function spatial(point){if(!state||!point)return {gain:1,pan:0,cutoff:15000};const p=state.player,blocked=!!obstruction({x:p.x,y:heightAt(p.x,p.z)+1,z:p.z},{x:point.x,y:point.y??heightAt(point.x,point.z)+1,z:point.z});return spatialCue({...p,yaw:view.yaw},point,blocked,settings.monoAudio);}
 function cue(kind,point,opts={}){if(!active())return;const space=point?spatial(point):{gain:1,pan:0,cutoff:15000};if(space.gain<.02)return;return graph.play(kind,{duration:.5,...opts,pan:space.pan,cutoff:space.cutoff,gain:(opts.gain??.6)*space.gain,variant:variant++%4});}
 function mark(type,point){if(!CAPTIONS[type]||!state||settings.audioCaptions===false)return;const s=point?spatial(point):null;if(s&&s.distance>28)return;const direction=!s||s.distance<2?'':s.pan<-.3?' / LEFT':s.pan>.3?' / RIGHT':' / AHEAD';caption=CAPTIONS[type]+direction+(s?.cutoff<1000?' / MUFFLED':'');captionEnd=state.t+2.4;}
 function sound(ev){triggers++;const point=ev.from||(Number.isFinite(ev.x)?ev:state?.enemies.find(e=>e.id===ev.id)||null),now=context?.currentTime||0;let type=ev.type;
  if(type==='sound'){if(ev.kind==='bottle')type='bottle';else return;}
  mark(type,point);if(!active())return;
  const at=(kind,delay,opts={})=>cue(kind,point,{when:now+delay,...opts});
  if(type==='shot'||type==='enemy-shot'){at(ev.weapon==='rifle'?'rifle':'gun',0,{duration:.55,gain:.92,priority:true,bus:type==='enemy-shot'?'threat':'effects',send:.23});at('tail',.07,{duration:1.1,gain:.32});at('casing',.16,{duration:.24,gain:.30});if(ev.hit)cue('impact',ev.to,{duration:.18,gain:.36});}
  else if(type==='reload'){at('reload',0,{duration:.16,gain:.4});at('cloth',.14,{duration:.4,gain:.35});}
  else if(type==='reload-stage'){at('metal',0,{duration:.20,gain:.38});}
  else if(type==='reloaded'){at('reload',0,{duration:.20,gain:.44});at('metal',.07,{duration:.14,gain:.25});}
  else if(type==='footstep'){const surface=ev.surface||surfaceAt(state.player);cue('step-'+surface,null,{duration:.33,gain:ev.stance==='prone'?.16:ev.stance==='crouch'?.26:.52,pitch:ev.sprint?1.13:1});}
  else if(type==='melee'||type==='dodge'||type==='vault'||type==='jump'){at('whoosh',0,{duration:.24,gain:type==='melee'?.64:.42});at('cloth',.03,{duration:.28,gain:.35});}
  else if(type==='melee-hit'||type==='enemy-melee'){at('impact',0,{duration:.27,gain:.7,bus:type==='enemy-melee'?'threat':'effects',priority:true});at('cloth',.03,{duration:.3,gain:.35});}
  else if(type==='bottle'){at('glass-break',0,{duration:.9,gain:.76,send:.25,priority:true});}
  else if(type==='throw'||type==='equip'){at('cloth',0,{duration:.3,gain:.45});at('metal',.1,{duration:.2,gain:.2});}
  else if(type==='heal-start'||type==='heal-progress'){at('bandage',0,{duration:.5,gain:.6});}
  else if(type==='craft-start'||type==='craft-progress'){at('craft',0,{duration:.6,gain:.65});at('metal',.13,{duration:.14,gain:.14});}
  else if(type==='heal'||type==='crafted'){at('cloth',0,{duration:.5,gain:.42});at('felt',.07,{duration:.65,midi:69,gain:.24});}
  else if(type==='shriek'){at('shriek',0,{duration:1.5,gain:.65,bus:'threat',priority:true,send:.26});}
  else if(type==='monster-attack'){at('growl',0,{duration:.7,gain:.8,bus:'threat'});at('impact',.12,{duration:.4,gain:.6,bus:'threat'});}
  else if(type==='callout'){at('breath',0,{duration:.65,gain:.45,bus:'threat'});}
  else if(type==='damage'){at('impact',0,{duration:.28,gain:.7,priority:true});at('breath',.08,{duration:.6,gain:.5});}
  else if(type==='smoke'){at('metal',0,{duration:.15,gain:.38});at('smoke',.05,{duration:1.5,gain:.63});}
  else if(type==='wheel'||type==='puzzle-solved'){at('mechanism',0,{duration:type==='wheel'?.65:1.8,gain:.66,send:.20});}
  else if(type==='pickup'||type==='loot'||type==='clue'){at('cloth',0,{duration:.25,gain:.48});at('pluck',.07,{duration:.8,midi:76,gain:.22});}
  else if(type==='checkpoint'||type==='task-complete'||type==='complete'){for(const [i,midi]of [57,64,67,74].entries())at('felt',i*.16,{duration:1.8,midi,gain:.24,send:.25});}
  else if(type==='death'){at('bow',0,{duration:3,midi:38,gain:.50});}
  else if(type==='land'){at('step-'+surfaceAt(state.player),0,{duration:.4,gain:.65});}
  else if(type==='weapon-break'||type==='action-cancel'){at('metal',0,{duration:.22,gain:.38});}
 }
 function surfaceAt(p){if(waterAt(p))return 'water';if(coverAt(p))return 'grass';if(CURRENT.id==='whiteout')return 'snow';if(CURRENT.id==='terminus')return 'metal';if(CURRENT.id==='breakwater'&&p.z>20)return 'wood';return 'stone';}
 function update(s,v,dt){state=s;view=v;if(lastState!==s){lastState=s;chapter=s.level;step=0;intensity=0;breathing=0;footsteps.clear();caption=null;captionEnd=0;if(graph){graph.clear();next=context.currentTime+.08;graph.loop(THEMES[chapter]?.air||'rain');graph.loop('wind',.25);}}
  intensity=smoothThreat(intensity,threatLevel(s),dt);if(graph)graph.configure({intensity,listen:!!s.player.listen,menu:!['play','pack'].includes(getMode())});
  if(hidden()&&context?.state==='running'){void context.suspend().catch(()=>{});return;}
  if(!active()||!['play','pack'].includes(getMode()))return;
  if(!graph.loopCount){graph.loop(THEMES[s.level]?.air||'rain');graph.loop('wind',.25);}
  for(const e of s.enemies){if(e.hp<=0||dist(e,s.player)>22)continue;const before=footsteps.get(e.id)||{at:s.t,x:e.x,z:e.z};const moving=Math.hypot(e.x-before.x,e.z-before.z)>.45;if(moving&&s.t-before.at>.38){cue('step-'+surfaceAt(e),e,{duration:.35,bus:'threat',gain:e.type==='brute'?.95:.54});footsteps.set(e.id,{at:s.t,x:e.x,z:e.z});}else if(!footsteps.has(e.id))footsteps.set(e.id,before);}
  if(s.player.hp<35&&s.t-breathing>1.3){breathing=s.t;cue('heartbeat',null,{duration:.5,gain:.30});}
  clock();
 }
 function ui(action='move'){if(!active()||context.currentTime-uiAt<.06)return;uiAt=context.currentTime;graph.play('tick',{duration:.10,midi:action==='select'?79:action==='back'?57:69,gain:.30,bus:'ui',send:0});}
 const gesture=()=>start();if(typeof window!=='undefined'){window.addEventListener('pointerdown',gesture);window.addEventListener('keydown',gesture);window.addEventListener('pagehide',()=>dispose(),{once:true});document.addEventListener('visibilitychange',gesture);}
 function dispose(){dead=true;clearInterval(timer);graph?.dispose();void context?.close().catch(()=>{});if(typeof window!=='undefined'){window.removeEventListener('pointerdown',gesture);window.removeEventListener('keydown',gesture);document.removeEventListener('visibilitychange',gesture);}}
 return {start,event:sound,update,ui,dispose,test(){start();if(active()){graph.play('pluck',{duration:1,midi:69,pan:-.85,gain:.4,bus:'ui',send:0});graph.play('pluck',{duration:1,midi:76,pan:.85,gain:.4,bus:'ui',when:context.currentTime+.65,send:0});}},snapshot:()=>({enabled,chapter,theme:THEMES[chapter]?.name||THEMES.district.name,intensity,triggers,caption:state&&state.t<captionEnd?caption:null,status:!context?'Sound starts with play':context.state==='suspended'&&!settings.mute?'Sound is waiting for browser activation':context.state,...(graph?.snapshot()||{})})};
}
