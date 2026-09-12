/* Resonant Hunt: original, deterministic score and semantic sound vocabulary.
 * All compositions and synthesis recipes are local code, not streamed tracks.
 * MIDI is used only as a pitch representation; no MIDI device is required. */
(function(root){'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const defaults=Object.freeze({master:.65,music:.42,effects:.8,ambience:.35,dynamic:'headphones'});
 const themes=Object.freeze({
  cloister:{name:'The Bell Remembers',bpm:66,root:50,chords:[[0,3,7],[8,12,15],[5,8,12],[7,10,14],[0,3,7],[10,14,17],[8,12,15],[7,10,14]],melody:[12,null,15,14,12,7,null,10,12,null,19,17,15,null,14,null,12,15,null,19,17,15,12,null,10,12,8,null,7,null,10,11]},
  ivory:{name:'Ivory Procession',bpm:62,root:53,chords:[[0,4,7],[5,9,12],[9,12,16],[7,11,14],[0,4,7],[2,5,9],[5,9,12],[7,11,14]],melody:[12,null,16,19,21,19,16,null,14,12,null,9,12,null,16,null,19,16,null,12,14,17,16,null,14,null,12,9,7,null,11,14]},
  ember:{name:'Cinders Beneath Stone',bpm:72,root:45,chords:[[0,3,7],[1,5,8],[0,3,7],[8,12,15],[5,8,12],[3,7,10],[1,5,8],[7,10,14]],melody:[12,13,null,12,7,null,8,7,12,null,15,13,12,8,null,7,5,8,null,12,15,null,13,12,8,7,5,null,7,null,10,11]},
  garden:{name:'The Last Green Lantern',bpm:64,root:48,chords:[[0,3,7],[5,9,12],[10,14,17],[7,10,14],[0,3,7],[8,12,15],[5,9,12],[7,10,14]],melody:[12,null,15,19,17,null,14,12,10,14,17,null,15,null,12,null,12,15,19,null,21,19,17,15,14,12,null,10,7,null,10,11]},
  sanctuary:{name:'A Circle Kept',bpm:60,root:50,chords:[[0,7,14],[5,12,16],[3,10,15],[7,14,17],[0,7,14],[8,15,19],[5,12,16],[7,14,17]],melody:[12,null,null,19,14,null,12,null,15,null,19,null,17,null,null,14,12,null,7,null,10,12,null,15,14,null,12,null,7,null,10,null]}
 });
 const enemyFamilies=Object.freeze({cantor:'spell',stalker:'charge',warden:'steel',lancer:'steel',duelist:'blade',archer:'archer',hexer:'spell',alchemist:'fire',abbess:'ice',leech:'choir',gaoler:'chain',mirror:'glass',gargoyle:'charge',colossus:'heavy',widow:'veil'});
 const recipes=Object.freeze({
  nock:{freq:390,end:160,duration:.11,level:.18,tone:'triangle',noise:.3,filter:1800},
  bow:{freq:245,end:94,duration:.34,level:.22,tone:'triangle',noise:.5,filter:2600},
  crossbow:{freq:168,end:54,duration:.27,level:.28,tone:'triangle',noise:.8,filter:3500},
  reload:{freq:240,end:125,duration:.48,level:.15,tone:'triangle',noise:.75,filter:1700,repeat:3},
  reloaded:{freq:490,end:175,duration:.16,level:.19,tone:'triangle',noise:.65,filter:2900},
  stone:{freq:1480,end:670,duration:.18,level:.17,tone:'triangle',noise:1,filter:4100},
  hit:{freq:143,end:58,duration:.22,level:.2,tone:'sine',noise:.8,filter:1100},
  precision:{freq:1175,end:784,duration:.48,level:.14,tone:'bell',noise:.06,filter:6000},
  kill:{freq:293.66,end:146.83,duration:.9,level:.14,tone:'bell',noise:.18,filter:2600},
  shield:{freq:620,end:311,duration:.32,level:.23,tone:'bell',noise:.75,filter:3700},
  guardbreak:{freq:166,end:46,duration:.75,level:.22,tone:'triangle',noise:1,filter:1600},
  ward:{freq:350,end:540,duration:.28,level:.1,tone:'sine',noise:.45,filter:2400},
  ricochet:{freq:1540,end:950,duration:.45,level:.14,tone:'bell',noise:.5,filter:4700},
  cinder:{freq:90,end:29,duration:.75,level:.27,tone:'sine',noise:1,filter:650},
  frost:{freq:1190,end:1700,duration:.65,level:.12,tone:'bell',noise:.55,filter:5600},
  blink:{freq:196,end:784,duration:.65,level:.13,tone:'sine',noise:.45,filter:2100,attack:.2},
  shard:{freq:620,end:1240,duration:.22,level:.11,tone:'bell',noise:.5,filter:3400},
  pickup:{freq:523.25,end:1046.5,duration:.6,level:.11,tone:'bell',noise:.04,filter:6000},
  hurt:{freq:78,end:45,duration:.42,level:.2,tone:'sine',noise:.8,filter:620},
  footstep:{freq:130,end:65,duration:.14,level:.11,tone:'sine',noise:1,filter:1000},
  wing:{freq:165,end:65,duration:.35,level:.13,tone:'triangle',noise:1,filter:880},
  whiz:{freq:760,end:340,duration:.17,level:.1,tone:'sine',noise:1,filter:3600},
  bell:{freq:146.83,end:146.83,duration:3.5,level:.13,tone:'bell',noise:.02,filter:3000},
  quiver:{freq:392,end:523.25,duration:.22,level:.08,tone:'bell',noise:.06,filter:3600},
  ui:{freq:440,end:587.33,duration:.11,level:.055,tone:'sine',noise:0,filter:2800},
  denied:{freq:140,end:90,duration:.18,level:.08,tone:'triangle',noise:.1,filter:900},
  'enemy-steel':{freq:270,end:520,duration:.62,level:.13,tone:'triangle',noise:.8,filter:1800,attack:.1},
  'enemy-blade':{freq:810,end:260,duration:.45,level:.13,tone:'triangle',noise:1,filter:2700},
  'enemy-archer':{freq:240,end:530,duration:.7,level:.14,tone:'triangle',noise:.35,filter:2300,attack:.16},
  'enemy-spell':{freq:146.83,end:293.66,duration:.85,level:.12,tone:'choir',noise:.3,filter:1200,attack:.18},
  'enemy-fire':{freq:100,end:290,duration:.7,level:.15,tone:'sine',noise:1,filter:900,attack:.12},
  'enemy-ice':{freq:740,end:1100,duration:.7,level:.12,tone:'bell',noise:.6,filter:4600,attack:.08},
  'enemy-choir':{freq:196,end:261.63,duration:1.1,level:.12,tone:'choir',noise:.05,filter:950,attack:.2},
  'enemy-chain':{freq:910,end:430,duration:.68,level:.14,tone:'bell',noise:.75,filter:3400,repeat:3},
  'enemy-glass':{freq:1046.5,end:659.25,duration:.7,level:.13,tone:'bell',noise:.2,filter:4300},
  'enemy-charge':{freq:150,end:65,duration:.85,level:.14,tone:'triangle',noise:1,filter:1400,attack:.1},
  'enemy-heavy':{freq:73.42,end:42,duration:1.1,level:.2,tone:'sine',noise:.9,filter:600,attack:.1},
  'enemy-veil':{freq:392,end:196,duration:.9,level:.12,tone:'choir',noise:.65,filter:2100,attack:.1}
 });
 function clean(value={}){const p=value&&typeof value==='object'?value:{};return {...Object.fromEntries(['master','music','effects','ambience'].map(k=>[k,Number.isFinite(Number(p[k]))&&p[k]!==null?clamp(Number(p[k]),0,1):defaults[k]])),dynamic:['headphones','quiet','wide'].includes(p.dynamic)?p.dynamic:defaults.dynamic};}
 function themeFor(room={},ar=false){if(ar)return 'sanctuary';const t=(room.label||'').toLowerCase();return /ember|cinder|furnace|infernal/.test(t)?'ember':/ivory|glass|chapel|angel/.test(t)?'ivory':/garden|thorn|lantern/.test(t)?'garden':'cloister';}
 function threat(s){if(!s||s.phase!=='playing')return 0;let n=0;for(const e of s.world.enemies){if(e.dead||!e.aware)continue;const d=Math.hypot(e.p[0]-s.p[0],e.p[2]-s.p[2]);if(d<18)n+=(1-d/22)*(e.wind>0||e.charge?1.5:.5);}return clamp(n/3,0,1);}
 function cue(e){const simple={reload:'reload',reloaded:'reloaded',impact:'stone','enemy-deflect':'shield',block:'shield','guard-broken':'guardbreak',explosion:'cinder',ricochet:'ricochet',blink:'blink',shard:'shard',pickup:'pickup',hurt:'hurt',target:'precision','gate-open':'bell','enemy-heal':'enemy-choir','enemy-rift':'enemy-veil','side-expedition':'pickup','focus-open':'quiver','focus-select':'ui','pickup-pull':'quiver','reload-grab':'reload'};if(e.type==='shot')return e.weapon==='crossbow'?'crossbow':'bow';if(e.type==='hit')return e.head?'precision':'hit';if(e.type==='kill')return 'kill';if(e.type==='enemy-windup')return 'enemy-'+(enemyFamilies[e.kind]||'spell');if(e.type==='enemy-charge')return 'wing';if(e.type==='enemy-shot')return e.kind==='archer'?'bow':'whiz';return simple[e.type]||null;}
 const api={defaults,themes,recipes,enemyFamilies,clean,themeFor,threat,cue,midi:n=>440*Math.pow(2,(n-69)/12)};root.ResonanceScore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
