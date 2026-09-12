/* Standard gamepads are timing-only practice, never XR controller substitutes.
 * Pure edge/repeat logic is exported for tests. DOM focus follows visible UI. */
(function(root){'use strict';
 const LANES=[6,4,5,7],NAMES=['LT','LB','RB','RT'];
 function sample(pad,old=[],previousDirection=0){
  if(!pad||pad.connected===false||pad.mapping!=='standard')return null;
  const down=Array.from({length:17},(_,i)=>!!pad.buttons?.[i]?.pressed||Number(pad.buttons?.[i]?.value)>.55);
  const pressed=down.map((v,i)=>v&&!old[i]);const x=Number(pad.axes?.[0])||0,y=Number(pad.axes?.[1])||0;
  const direction=down[12]?-1:down[13]?1:down[14]?-2:down[15]?2:Math.abs(y)>.55?(y>0?1:-1):Math.abs(x)>.55?(x>0?2:-2):0;
  return {down,pressed,direction,directionChanged:direction!==previousDirection,lanes:LANES.map((b,i)=>pressed[b]?i:-1).filter(i=>i>=0)};
 }
 function goals(record){const a=Number(record?.accuracy)||0;return {earned:[50,75,90].filter(v=>a>=v).length,next:[50,75,90].find(v=>a<v)||null};}
 function install(g){const $=id=>document.getElementById(id);let padIndex=null,padId='',old=[],direction=0,nextRepeat=0,seed=true,connected=false,phase='',returnFocus=null;let noticeTime=-Infinity;
  root.PrismRenderReady?.install(g.art,g.el);
  const popup=$('mixer-panel'),help=$('pad-help');
  try{const p=JSON.parse(localStorage.getItem('prism-current.v1.controls')||'{}');if(['slice','keys','gamepad'].includes(p.input))g.input=p.input;g.feedbackText=['all','balanced','minimal','off'].includes(p.text)?p.text:'balanced';}catch{g.feedbackText='balanced';}
  function save(){try{localStorage.setItem('prism-current.v1.controls',JSON.stringify({input:g.input,text:g.feedbackText}));}catch{}}
  function syncAudio(){for(const id of ['volume','mix-music'])$(id).value=Math.round(g.audio.volume*100);$('mix-effects').value=Math.round(g.audio.effectsVolume*100);$('mix-rate').value=g.audio.feedbackRate;$('mix-text').value=g.feedbackText;for(const id of ['mute','mix-mute'])$(id).checked=g.audio.muted;$('music-value').textContent=Math.round(g.audio.volume*100)+'%';$('effects-value').textContent=Math.round(g.audio.effectsVolume*100)+'%';}
  function focus(el){if(!el)return;document.querySelectorAll('.pad-focus').forEach(e=>e.classList.remove('pad-focus'));el.classList.add('pad-focus');el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',behavior:'instant'});}
  function visible(el){if(!el||el.disabled||el.closest('[inert]')||!el.getClientRects().length)return false;const details=el.closest('details');return !details||details.open||el.tagName==='SUMMARY';}
  function items(){const scope=!popup.hidden?popup:g.phase==='paused'?$('pause-panel'):g.phase==='complete'?$('results'):g.phase==='loading'?$('loading-controls'):$('menu');return [...scope.querySelectorAll('button,select,input,summary,a[href]')].filter(visible);}
  function move(step){const list=items();if(!list.length)return;const i=list.indexOf(document.activeElement);focus(list[(i<0?(step>0?0:list.length-1):(i+step+list.length)%list.length)]);}
  function adjust(step){const el=document.activeElement;if(el?.tagName==='SELECT'){el.selectedIndex=Math.max(0,Math.min(el.options.length-1,el.selectedIndex+step));el.dispatchEvent(new Event('change',{bubbles:true}));}
   else if(el?.tagName==='INPUT'&&['range','number'].includes(el.type)){const s=el.type==='range'?5:(Number(el.step)||10),min=Number(el.min)||0,max=el.max===''?100:Number(el.max);el.value=String(Math.max(min,Math.min(max,Number(el.value)+step*s)));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
   else move(step);
  }
  function activate(){const list=items();if(!list.includes(document.activeElement)){focus(list[0]);return;}const e=document.activeElement;if(e.tagName==='SELECT')adjust(1);else if(e.tagName==='INPUT'&&['range','number'].includes(e.type))return;else e.click();}
  function backgroundInert(value){for(const el of [document.querySelector('header'),$('hud'),$('loading-controls'),$('footer'),$('scene-wrap')])if(el)el.inert=value;}
  function closeMixer(){if(popup.hidden)return;popup.hidden=true;backgroundInert(false);$('menu').inert=!['menu','loading'].includes(g.phase);$('pause-panel').inert=g.phase!=='paused';$('results').inert=g.phase!=='complete';focus(visible(returnFocus)?returnFocus:items()[0]);}
  function openMixer(){if(g.immersive||g.phase==='loading')return;returnFocus=document.activeElement;g.pauseRun('Mixer open. The track is paused.');popup.hidden=false;for(const id of ['menu','pause-panel','results'])$(id).inert=true;backgroundInert(true);syncAudio();focus($('mix-music'));}
  function back(){if(!popup.hidden){closeMixer();return;}if(g.phase==='playing'){g.pauseRun('Paused by controller');return;}if(g.phase==='paused'){g.resume();return;}if(g.phase==='complete'||g.phase==='loading'){g.abort();return;}if($('settings').open){$('settings').open=false;focus($('settings').querySelector('summary'));}else focus($('start'));}
  function sync(){syncAudio();save();if(!popup.hidden)for(const id of ['menu','pause-panel','results'])$(id).inert=true;$('pad-lanes').hidden=g.input!=='gamepad'||g.phase!=='playing'||g.immersive;$('pad-status').textContent=connected?'Controller connected. Menu starts; View opens the mixer.':'Xbox practice: connect a standard controller and press a button.';help.hidden=!connected&&g.input!=='gamepad';help.textContent=g.phase==='playing'&&g.input==='gamepad'?'LT / LB / RB / RT: lanes. Menu or B: pause. View: sound.':'D-pad / left stick: focus. Left / right: adjust. A: select. B: back. Menu: play / resume. View: sound.';
   const mode=g.immersive?(g.el.is('ar-mode')?'ar':'vr'):g.input,record=g.records[[g.track,g.difficulty,mode].join('/')],m=goals(record);$('mastery').textContent=`Local-best mastery: ${m.earned}/3 quality targets. `+(m.next?`Next: finish at ${m.next}% quality in this chart and input mode.`:'All three quality targets met by this local-best record.');
   if(phase!==g.phase){phase=g.phase;if(!popup.hidden&&g.phase!=='paused')closeMixer();if(connected&&g.phase!=='playing')focus(g.phase==='paused'?$('resume'):g.phase==='complete'?$('results').querySelector('button'):g.phase==='menu'?$('start'):$('cancel-loading'));}
  }
  $('open-mixer').onclick=openMixer;$('pause-mixer').onclick=openMixer;$('close-mixer').onclick=closeMixer;$('cancel-loading').onclick=()=>g.abort();
  $('mix-music').oninput=e=>{g.audio.level(Number(e.target.value)/100);syncAudio();};$('mix-effects').oninput=e=>{g.audio.effectLevel(Number(e.target.value)/100);syncAudio();};$('mix-rate').onchange=e=>{g.audio.rate(e.target.value);};$('mix-text').onchange=e=>{g.feedbackText=e.target.value;save();};$('mix-mute').onchange=e=>{g.audio.level(g.audio.volume,e.target.checked);syncAudio();};
  $('sound-calm').onclick=()=>{g.audio.level(.55,false);g.audio.effectLevel(.12);g.audio.rate('minimal');g.feedbackText='minimal';syncAudio();save();};$('sound-music').onclick=()=>{g.audio.level(.55,false);g.audio.effectLevel(0);g.audio.rate('off');g.feedbackText='off';syncAudio();save();};
  function reset(){old=[];direction=0;nextRepeat=0;seed=true;}
  function lost(){if(connected&&!g.immersive&&g.phase==='playing'&&g.input==='gamepad')g.pauseRun('Controller disconnected. Reconnect and press Menu to resume.');connected=false;padIndex=null;padId='';reset();sync();}
  function tick(now){if(document.hidden||!document.hasFocus()||g.immersive){reset();return;}let pads;try{pads=Array.from(navigator.getGamepads?.()||[]);}catch{return;}
   let pad=pads.find(p=>p&&p.index===padIndex&&p.id===padId&&p.connected!==false&&p.mapping==='standard');
   if(!pad&&connected){lost();return;}if(!pad)pad=pads.find(p=>p&&p.connected!==false&&p.mapping==='standard');if(!pad)return;
   if(!connected){connected=true;padIndex=pad.index;padId=pad.id;seed=true;sync();}
   const s=sample(pad,old,direction);if(seed){old=s.down;direction=s.direction;seed=false;return;}old=s.down;const repeat=s.direction&&(s.directionChanged||now>=nextRepeat);direction=s.direction;if(repeat)nextRepeat=now+(s.directionChanged?380:160);
   const p=s.pressed;
   if(p[8]){popup.hidden?openMixer():closeMixer();return;}
   if(p[9]){if(!popup.hidden){closeMixer();return;}if(g.phase==='playing')g.pauseRun('Paused by controller');else if(g.phase==='paused')g.resume();else if(g.phase==='menu'||g.phase==='complete'){if(g.input!=='gamepad'){g.input='gamepad';g.syncControls();}g.start();}return;}
   if(p[1]){back();return;}
   if(g.phase==='playing'&&popup.hidden){if(g.input==='gamepad'&&g.state)for(const lane of s.lanes){const el=$('pad-lane-'+lane);el.classList.remove('struck');void el.offsetWidth;el.classList.add('struck');const event=PrismCore.tap(g.state,lane,g.audio.time()+g.runOffset);if(event)g.feedback([event]);}return;}
   if(repeat){if(Math.abs(direction)===1)move(direction);else adjust(direction/2);}if(p[0])activate();
  }
  function textAllowed(){if(g.feedbackText==='off')return false;const t=performance.now(),gap={all:100,balanced:650,minimal:2000,off:Infinity}[g.feedbackText];if(t-noticeTime<gap)return false;noticeTime=t;return true;}
  const key=e=>{if(popup.hidden)return;if(e.code==='Tab'){e.preventDefault();e.stopImmediatePropagation();move(e.shiftKey?-1:1);}else if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeMixer();}else if(e.code==='KeyP'){e.stopImmediatePropagation();}};
  document.addEventListener('keydown',key,true);const blur=()=>reset();window.addEventListener('blur',blur);const disconnect=e=>{if(e.gamepad.index===padIndex)lost();};window.addEventListener('gamepaddisconnected',disconnect);
  sync();return {tick,sync,syncAudio,textAllowed,openMixer,closeMixer,get connected(){return connected},get mixerOpen(){return !popup.hidden},dispose(){document.removeEventListener('keydown',key,true);window.removeEventListener('blur',blur);window.removeEventListener('gamepaddisconnected',disconnect);}};
 }
 const api={sample,goals,install,LANES,NAMES};root.PrismControl=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
