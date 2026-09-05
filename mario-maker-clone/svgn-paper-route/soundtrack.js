/* Original arranged instrumental soundtrack, rendered in a worker so graphics
 * stalls cannot stutter the notes. Music and effects have separate saved gains.
 * Keeps the game's one AudioContext and master-mute contract. No Suno yet. */
(function(){'use strict';
 const KEY='svgn.soundmix.v2',aliases={gearwork:'morning',sundown:'morning',parade:'morning',skyline:'canal',drift:'canal',cavern:'canal',midnight:'canal',danger:'garden',velocity:'garden',furnace:'garden'};
 const prefs={music:.48,effects:.36};try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k of Object.keys(prefs))if(Number.isFinite(p[k]))prefs[k]=Math.min(1,Math.max(0,p[k]));}catch{}
 let graph=null,worker=null,source=null,desired=null,sequence=0,lastError='',stats={},destroyed=false;
 const buffers=new Map();
 function graphFor(){const a=ac();if(graph)return graph;const music=a.createGain(),effects=a.createGain(),master=a.createGain(),limiter=a.createDynamicsCompressor();music.gain.value=prefs.music;effects.gain.value=prefs.effects;master.gain.value=muted?0:1;limiter.threshold.value=-8;limiter.knee.value=12;limiter.ratio.value=4;limiter.attack.value=.006;limiter.release.value=.16;music.connect(limiter);effects.connect(limiter);limiter.connect(master);master.connect(a.destination);return graph={a,music,effects,master,limiter};}
 function setGains(){if(graph){const t=graph.a.currentTime;graph.music.gain.setTargetAtTime(prefs.music,t,.06);graph.effects.gain.setTargetAtTime(prefs.effects,t,.025);graph.master.gain.setTargetAtTime(muted?0:1,t,.025);}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}setGains();}
 function clearSource(){if(source){try{source.stop();source.disconnect();}catch{}source=null;}}
 function status(){const el=document.getElementById('score-status');if(el)el.textContent=lastError||(!desired?'Music is stopped.':buffers.has(desired)?'Now playing: '+AdventureScore.SONGS[desired].title:'Preparing '+AdventureScore.SONGS[desired].title+'...');}
 function playReady(id){if(destroyed||desired!==id||muted||mode!=='play')return;const {a,music}=graphFor();const b=buffers.get(id);if(!b)return;clearSource();source=a.createBufferSource();source.buffer=b;source.loop=true;source.connect(music);source.start(a.currentTime+.03);setGains();status();}
 stopMusic();
 window.stopMusic=function(){desired=null;sequence++;clearSource();if(music.timer){clearInterval(music.timer);music.timer=null;}status();};
 window.startMusic=function(){
  const id=aliases[musicName]||musicName;
  if(muted||musicName==='off'||!AdventureScore.SONGS[id]){stopMusic();return;}
  if(desired===id&&source)return;desired=id;clearSource();lastError='';const token=++sequence;graphFor();
  if(buffers.has(id)){playReady(id);return;}
  if(!worker){try{worker=new Worker('./score-worker.js');worker.onmessage=e=>{const v=e.data;if(v.error){lastError='Music could not load. The game remains playable.';status();return;}const a=graphFor().a,b=a.createBuffer(2,v.left.length,v.sampleRate);b.copyToChannel(v.left,0);b.copyToChannel(v.right,1);buffers.set(v.id,b);stats[v.id]=v.stats;while(buffers.size>2){const first=buffers.keys().next().value;if(first===desired)break;buffers.delete(first);}if(v.token===sequence)playReady(v.id);};worker.onerror=()=>{lastError='Music renderer unavailable. Effects and gameplay still work.';status();};}catch{lastError='Music renderer unavailable in this browser.';status();return;}}
  worker.postMessage({id,token,rate:32000});status();
 };
 for(const [id,s]of Object.entries(AdventureScore.SONGS))SONGS[id]={label:s.title};
 window.setMusic=function(n){musicName=n==='off'?n:AdventureScore.SONGS[n]?n:aliases[n]||'morning';const sel=document.getElementById('musicSel');if(sel)sel.value=musicName;if(mode==='play')startMusic();};
 setMusic(musicName);
 const sel=document.getElementById('musicSel');if(sel){sel.replaceChildren();for(const [id,s]of Object.entries(AdventureScore.SONGS)){const o=document.createElement('option');o.value=id;o.textContent=s.title;sel.append(o);}const off=document.createElement('option');off.value='off';off.textContent='No music';sel.append(off);sel.value=musicName;}
 // Soft envelope/harmonic effects; remove the raw square/sawtooth attack.
 window.beep=function(f,dur,type='sine',vol=.1,slide=0){if(muted||destroyed||document.hidden||prefs.effects===0)return;try{const {a,effects}=graphFor(),t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type==='triangle'?'triangle':'sine';o.frequency.setValueAtTime(Math.max(45,Math.min(f,1800)),t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(45,Math.min(f+slide,2100)),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(Math.min(.15,vol),t+.007);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.02,dur));o.connect(g);g.connect(effects);o.start(t);o.stop(t+dur+.025);o.onended=()=>{o.disconnect();g.disconnect();};}catch{}};
 function gesture(){if(!muted){const a=graphFor().a;if(a.state==='suspended'&&!document.hidden&&!window.__delivery?.paused)a.resume().catch(()=>{});}}
 document.addEventListener('pointerdown',gesture,{capture:true});document.addEventListener('keydown',gesture,{capture:true});
 document.addEventListener('visibilitychange',()=>{if(graph&&document.hidden)graph.a.suspend().catch(()=>{});});
 function boot(){
  if(!document.querySelector('#delivery-header .actions')){setTimeout(boot,25);return;}
  const b=document.createElement('button');b.id='score-settings';b.className='delivery-btn';b.textContent='Audio mix';b.setAttribute('aria-haspopup','dialog');document.querySelector('#delivery-header .actions').append(b);
  const d=document.createElement('dialog');d.id='score-dialog';d.setAttribute('aria-labelledby','score-title');d.innerHTML='<h2 id="score-title">Sound & music</h2><p>Original instrumental arrangements. No external music service.</p><label>Music <input id="score-music" type="range" min="0" max="100" step="1"></label><label>Effects <input id="score-effects" type="range" min="0" max="100" step="1"></label><label><input id="score-mute" type="checkbox"> Mute all sound</label><p id="score-status" role="status"></p><form method="dialog"><button>Done</button></form>';document.body.append(d);let resume=false;
  b.onclick=()=>{resume=mode==='play'&&!__delivery.paused&&!won&&!__delivery.state.menu;if(resume)__delivery.act('pause');d.showModal();status();};
  for(const key of ['music','effects']){const input=document.getElementById('score-'+key);input.value=Math.round(prefs[key]*100);input.oninput=()=>{prefs[key]=Number(input.value)/100;save();};}
  const mute=document.getElementById('score-mute');mute.checked=muted;mute.onchange=()=>{if(muted!==mute.checked)document.getElementById('btnMute').click();setGains();};
  d.addEventListener('close',()=>{if(resume&&mode==='play'&&!won)__delivery.act('resume');resume=false;cv.focus({preventScroll:true});});
  const old=document.getElementById('btnMute').onclick;document.getElementById('btnMute').onclick=()=>{old();mute.checked=muted;setGains();};
  window.__score={prefs,stats,get desired(){return desired},get source(){return source},get context(){return graph?.a},get error(){return lastError},version:'instrumental-2'};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.addEventListener('pagehide',()=>{stopMusic();worker?.terminate();worker=null;destroyed=true;});
 window.addEventListener('pageshow',e=>{if(e.persisted){destroyed=false;if(mode==='play'&&!muted)startMusic();}});
})();
