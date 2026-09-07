/* Xbox-standard and XR inputs share actions, not synthetic keyboard events. */
import {InputSampler,clamp} from './input-core.mjs';
import {createXR} from './xr-session.mjs';
export function installControllers(api){
 const sampler=new InputSampler();let lastDevice=null,frameInput=null,navLatch=false,horizontalLatch=false,lastActivity=0,lastMenu=null;
 const badge=document.createElement('span');badge.id='controller-status';badge.textContent='Xbox controller: press a button to connect';document.getElementById('masthead').append(badge);
 const controls=document.createElement('p');controls.className='fine';controls.textContent='Xbox: left stick moves; right stick looks; A jumps/releases; B deploys/folds glider in the air; Y interacts/hooks; X reloads; RT fires; LT aims; D-pad up/down swaps; D-pad right buys nearby; LB pulses; RB reverses; L-stick click boosts; View opens map; Menu pauses. D-pad / A / B navigates menus. VR: left stick moves; right stick snap-turns; right grip interacts; A jumps/releases then deploys/folds in the air; B reloads; right trigger fires; left trigger pulses; left grip reverses; X atlas; Y pauses.';document.getElementById('settings-dialog').insertBefore(controls,document.querySelector('#settings-dialog form'));
 const options=document.createElement('label');options.textContent='Controller look speed';const speed=document.createElement('input');speed.id='controller-look-speed';speed.type='range';speed.min='.5';speed.max='2.5';speed.step='.1';speed.value=api.settings.controllerSpeed??1;options.append(speed);document.querySelector('.settings-grid').append(options);speed.oninput=()=>{api.settings.controllerSpeed=Number(speed.value);api.saveSettings();};
 const invert=document.createElement('label');invert.innerHTML='<input id="controller-invert" type="checkbox"> Invert controller look';document.querySelector('.settings-grid').append(invert);invert.firstElementChild.checked=!!api.settings.invertY;invert.firstElementChild.onchange=()=>{api.settings.invertY=invert.firstElementChild.checked;api.saveSettings();};
 function currentMenu(){
  const modal=[...document.querySelectorAll('dialog[open]')].at(-1),root=modal||(!api.playing()?document.getElementById('menu'):null);if(!root)return null;
  const nodes=[...root.querySelectorAll('button,input,select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&e.getClientRects().length&&e.id!=='enter-vr');
  const items=nodes.map(e=>({element:e,label:(e.closest('label')?.textContent||e.getAttribute('aria-label')||e.textContent||'Control').trim()+(e.type==='checkbox'?' ['+(e.checked?'on':'off')+']':e.type==='range'?' '+e.value:''),focused:document.activeElement===e}));
  return {root,title:root.querySelector('h1,h2')?.textContent||'Menu',description:root.querySelector('p:not(.eyebrow)')?.textContent||'',items};
 }
 const xr=createXR(api.view,{state:api.state,start:api.start,clear:reset,pause:api.pause,menu:()=>{
  const m=currentMenu();if(m){const at=Math.max(0,m.items.findIndex(i=>i.focused)),start=Math.floor(at/5)*5; m.items=m.items.slice(start,start+5);m.items.push({element:document.getElementById('exit-vr'),label:'Exit VR',focused:document.activeElement?.id==='exit-vr'});}return m;
 },focus:e=>e.focus({preventScroll:true}),hint:api.hint});
 function reset(){sampler.reset();navLatch=false;horizontalLatch=false;frameInput=null;}
 function back(menu){if(menu?.root.id==='complete-dialog')document.getElementById('explore-more').click();else if(menu?.root.tagName==='DIALOG')menu.root.close();}
 function menuInput(m,data,pad){
  const items=xr.active?[...m.items,{element:document.getElementById('exit-vr')}]:m.items;if(!items.length)return;
  let index=items.findIndex(e=>e.element===document.activeElement);if(index<0){index=0;items[0].element.focus({preventScroll:true});}
  const axis=data.menuAxis||data.move,up=pad?.buttons?.[12]?.pressed,down=pad?.buttons?.[13]?.pressed,dy=down?1:up?-1:axis[1];
  if(Math.abs(dy)<.3)navLatch=false;
  if(Math.abs(dy)>.65&&!navLatch){navLatch=true;index=(index+(dy>0?1:-1)+items.length)%items.length;items[index].element.focus({preventScroll:true});}
  const element=items[index].element,dx=pad?.buttons?.[15]?.pressed?1:pad?.buttons?.[14]?.pressed?-1:axis[0];
  if(Math.abs(dx)<.3)horizontalLatch=false;
  if(element.type==='range'&&Math.abs(dx)>.65&&!horizontalLatch){horizontalLatch=true;element.value=String(clamp(Number(element.value)+Math.sign(dx)*Number(element.step||1),Number(element.min),Number(element.max)));element.dispatchEvent(new Event('input',{bubbles:true}));}
  if(data.edges.confirm||data.edges.jump)element.click();
  if(data.edges.back)back(m);else if(data.edges.pause&&m.root.id==='pause-dialog')back(m);
 }
 function frame(dt,xrFrame){
  const menuRoot=currentMenu()?.root||null;if(menuRoot!==lastMenu){sampler.reset();xr.reset();lastMenu=menuRoot;frameInput=null;}
  const now=performance.now();let data=null,pad=null;
  if(xr.active){data=xr.frame(xrFrame,dt);badge.textContent='WebXR preview · headset QA pending';}
  else{
   const pads=(()=>{try{return [...navigator.getGamepads?.()||[]];}catch{return [];}})();pad=pads.find(p=>p?.connected&&p.mapping==='standard')||null;
   if(!pad){if(lastDevice!==null){lastDevice=null;reset();if(api.playing())api.pause();}badge.textContent='Xbox controller: press a button to connect';frameInput=null;return;}
   const identity=pad.index+':'+pad.id;if(identity!==lastDevice){reset();lastDevice=identity;}
   data=sampler.read(pad,identity);badge.textContent='Xbox / standard controller connected';
  }
  if(!data){frameInput=null;return;}
  const m=currentMenu();if(m){menuInput(m,data,pad);frameInput=null;return;}
  if(!api.playing()||api.paused()||document.hidden){frameInput=null;return;}
  if(data.edges.pause){api.pause();frameInput=null;return;}if(data.edges.map){api.map();frameInput=null;return;}
  if(!xr.active&&data.edges.back)api.action('glide');
  if(!xr.active){api.state().p.yaw+=data.look[0]*dt*2.2*(api.settings.controllerSpeed||1)*(api.state().p.scoped?.35:1);api.state().p.pitch=clamp(api.state().p.pitch-data.look[1]*dt*1.6*(api.settings.controllerSpeed||1)*(api.settings.invertY?-1:1)*(api.state().p.scoped?.35:1),-1.35,1.35);}
  for(const name of ['jump','interact','reload','pulse','reverse','next','previous','shop'])if(data.edges[name])api.action(name);
  frameInput=data;if(data.move.some(x=>x)||data.look?.some(x=>x)||Object.values(data.held).some(Boolean))lastActivity=now;
 }
 function merge(base){if(!frameInput)return xr.active?{...base,railCamera:false}:base;const [x,y]=frameInput.move;return {...base,moveX:clamp((base.right?1:0)-(base.left?1:0)+x,-1,1),moveZ:clamp((base.forward?1:0)-(base.back?1:0)-y,-1,1),back:base.back||y>.25,boost:base.boost||frameInput.held.boost,railCamera:xr.active?false:base.railCamera};}
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
 const link=document.createElement('a');link.href='./roadmap.html';link.textContent='Development roadmap ↗';link.className='roadmap-link';document.querySelector('.start-actions').append(link);
 return {frame,merge,xr,reset,get aimHeld(){return !!frameInput?.held.aim},get firing(){return !!frameInput?.held.fire&&(!xr.active||!!xr.aim)},get aim(){return xr.active?xr.aim:null},snapshot:()=>({gamepad:!!lastDevice,xr:xr.active,lastActivity,move:frameInput?.move||[0,0],xrPhysicalQA:false})};
}
