// Standard Xbox-layout Gamepad API input. Button edges are polled independently
// from rendering so A/B/X/Y and menus remain responsive when graphics frames are slow.
export const BUTTON={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,VIEW:8,MENU:9,LS:10,RS:11,UP:12,DOWN:13,LEFT:14,RIGHT:15};
export const deadzone=(n=0,d=.18)=>Number.isFinite(n)&&Math.abs(n)>d?Math.sign(n)*(Math.min(1,Math.abs(n))-d)/(1-d):0;
export const value=(p,i)=>Math.max(0,Math.min(1,Number(p?.buttons?.[i]?.value??(p?.buttons?.[i]?.pressed?1:0))||0));
export function padMotion(p,mode='jeep'){
 const x=deadzone(p?.axes?.[0]),z=-deadzone(p?.axes?.[1]),aim=value(p,4)>.4||(mode==='foot'&&value(p,6)>.3),rt=value(p,7),lt=value(p,6);
 return {x,z,steer:-x,throttle:aim||mode==='foot'||mode==='helicopter'?0:rt-lt,climb:mode==='helicopter'&&!aim?rt-lt:0,aim,fire:(mode==='foot'||aim)&&rt>.12,brake:value(p,1)>.3,boost:value(p,10)>.3,jump:value(p,12)>.3,lookX:deadzone(p?.axes?.[2],.14),lookY:deadzone(p?.axes?.[3],.14)};
}
const zero=()=>({x:0,z:0,steer:0,throttle:0,climb:0,aim:false,fire:false,brake:false,boost:false,jump:false,lookX:0,lookY:0});
export function focusable(root){return root?[...root.querySelectorAll('button,a[href],input,select,[tabindex="0"]')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'):[];}
export class RangerInput{
 constructor({action,modal,mode,onDevice,onDisconnect}){
  Object.assign(this,{action,modal,mode,onDevice,onDisconnect});this.keys=new Set();this.touch=new Set();this.previous=[];this.pad=null;this.device='keyboard';this.context=modal();this.neutral=false;this.repeatDirection=0;this.repeatClock=0;this.mouseAim=false;this.mouseFire=false;this.sensitivity=1;this.fireLatch=false;this.jumpLatch=false;this.lastPoll=performance.now();this.disconnected=false;
  const keyboardActions={KeyE:'interact',KeyF:'board',KeyR:'reload',KeyQ:'nextTool',Digit1:'water',Digit2:'zapper',KeyH:'horn',KeyG:'recover',KeyM:'map',KeyC:'camera',KeyO:'operations',KeyI:'journal',Escape:'menu',KeyL:'lights'};
  this.keydown=e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const root=this.modal();if(root){
    if(e.code==='Escape'){e.preventDefault();if(!e.repeat)this.action('back');return;}
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Space'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='ArrowUp')this.navigate(-1);else if(e.code==='ArrowDown')this.navigate(1);else if(e.code==='ArrowLeft')this.adjust(-1);else if(e.code==='ArrowRight')this.adjust(1);else this.activate();}return;}
    if(keyboardActions[e.code]){e.preventDefault();if(!e.repeat)this.action(keyboardActions[e.code]);}
    if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyJ','KeyZ','KeyX','ControlLeft'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}this.setDevice('keyboard');};
  window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clear());
  // Gamepad API has no button event; a short interval is the most reliable way to
  // preserve quick controller taps when a heavy WebGL frame takes longer to draw.
  this.pollTimer=window.setInterval(()=>this.pollGamepad(),32);window.addEventListener('gamepadconnected',()=>this.pollGamepad());window.addEventListener('gamepaddisconnected',()=>this.pollGamepad());
 }
 setDevice(d){if(this.device!==d){this.device=d;this.onDevice?.(d);}}
 clear(){this.keys.clear();this.touch.clear();this.mouseAim=false;this.mouseFire=false;this.fireLatch=false;this.jumpLatch=false;this.neutral=true;}
 readPad(){let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[]).filter(p=>p?.connected!==false&&p);}catch{}return pads.find(p=>p.index===this.pad?.index)||pads[0]||null;}
 navigate(dir){const root=this.modal(),els=focusable(root);if(!els.length)return;let i=els.indexOf(document.activeElement);i=i<0?(dir>0?0:els.length-1):(i+dir+els.length)%els.length;els[i].focus({preventScroll:true});els[i].scrollIntoView({block:'nearest',inline:'nearest'});}
 adjust(dir){const e=document.activeElement;if(!this.modal()?.contains(e))return this.navigate(dir);if(e.tagName==='SELECT'){e.selectedIndex=(e.selectedIndex+dir+e.options.length)%e.options.length;e.dispatchEvent(new Event('change',{bubbles:true}));}else if(e.type==='range'){dir>0?e.stepUp():e.stepDown();e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}else if(e.type==='checkbox'){e.checked=dir>0;e.dispatchEvent(new Event('change',{bubbles:true}));}else this.navigate(dir);}
 activate(){const root=this.modal(),els=focusable(root);let e=document.activeElement;if(!els.includes(e)){e=els[0];if(!e)return;e.focus({preventScroll:true});}if(e.tagName==='SELECT')this.adjust(1);else if(e.type==='range')this.adjust(1);else e.click();}
 pulse(strength=.3,duration=110){if(!this.vibration)return;try{const a=this.pad?.vibrationActuator;const promise=a?.playEffect?.('dual-rumble',{startDelay:0,duration,strongMagnitude:strength,weakMagnitude:strength*.5});promise?.catch?.(()=>{});}catch{}}
 pollGamepad(){
  const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-this.lastPoll)/1000));this.lastPoll=now;const p=this.readPad();
  if(!p&&this.pad){this.previous=[];this.pad=null;this.clear();if(this.device==='gamepad'&&!this.disconnected){this.disconnected=true;this.onDisconnect?.();}return;}if(!p)return;this.pad=p;this.disconnected=false;
  const root=this.modal(),buttons=Array.from({length:17},(_,i)=>value(p,i)>.35),active=buttons.some(Boolean)||Math.abs(deadzone(p.axes?.[0]))>.1||Math.abs(deadzone(p.axes?.[1]))>.1||Math.abs(deadzone(p.axes?.[2]))>.1||Math.abs(deadzone(p.axes?.[3]))>.1;
  if(root!==this.context){this.context=root;this.keys.clear();this.touch.clear();this.mouseFire=false;this.mouseAim=false;this.fireLatch=false;this.jumpLatch=false;this.neutral=!!active;this.repeatDirection=0;this.repeatClock=0;if(root){const els=focusable(root);if(!root.contains(document.activeElement))els[0]?.focus({preventScroll:true});}}
  const edges=buttons.map((v,i)=>v&&!this.previous[i]);this.previous=buttons;
  if(this.neutral){if(!active)this.neutral=false;return;}if(active)this.setDevice('gamepad');
  if(root){
   if(edges[BUTTON.B]||edges[BUTTON.MENU])this.action('back');else if(edges[BUTTON.VIEW])this.action('map');else if(edges[BUTTON.A])this.activate();else if(edges[BUTTON.LB])this.action('tabPrev');else if(edges[BUTTON.RB])this.action('tabNext');
   // D-pad is intentionally edge-triggered: one press equals one focus/value step.
   // The analog left stick keeps held-repeat for fast navigation through long menus.
   if(edges[BUTTON.UP])this.navigate(-1);else if(edges[BUTTON.DOWN])this.navigate(1);else if(edges[BUTTON.LEFT])this.adjust(-1);else if(edges[BUTTON.RIGHT])this.adjust(1);
   const y=deadzone(p.axes?.[1]),x=deadzone(p.axes?.[0]),dir=y<-.55?-1:y>.55?1:0,side=x<-.65?-1:x>.65?1:0,token=dir||side*2;
   if(token){this.repeatClock-=dt;if(token!==this.repeatDirection||this.repeatClock<=0){if(dir)this.navigate(dir);else this.adjust(side);this.repeatClock=token!==this.repeatDirection?.32:.12;}}else this.repeatClock=0;this.repeatDirection=token;
   const scroll=deadzone(p.axes?.[3]);if(Math.abs(scroll)>.1)root.scrollTop+=scroll*dt*500;return;
  }
  const actions=[[BUTTON.A,'interact'],[BUTTON.X,'reload'],[BUTTON.Y,'board'],[BUTTON.RB,'nextTool'],[BUTTON.VIEW,'map'],[BUTTON.MENU,'menu'],[BUTTON.RS,'camera'],[BUTTON.DOWN,'horn'],[BUTTON.LEFT,'prevTool'],[BUTTON.RIGHT,'nextTool']];
  for(const [i,a] of actions)if(edges[i]){this.action(a);if(this.modal())return;}
  if(edges[BUTTON.UP])this.jumpLatch=true;const mode=this.mode(),aim=value(p,BUTTON.LB)>.35||(mode==='foot'&&value(p,BUTTON.LT)>.3);if(edges[BUTTON.RT]&&(mode==='foot'||aim))this.fireLatch=true;
 }
 sample(dt){
  // Continuous axes/triggers are read at simulation cadence; button edges and
  // modal navigation have already been captured by the independent poll loop.
  const live=this.readPad();if(live)this.pad=live;const p=live||this.pad,mode=this.mode(),v=p?padMotion(p,mode):zero(),has=(...codes)=>codes.some(k=>this.keys.has(k)),t=this.touch;
  const x=Number(has('KeyD','ArrowRight')||t.has('right'))-Number(has('KeyA','ArrowLeft')||t.has('left')),z=Number(has('KeyW','ArrowUp')||t.has('forward'))-Number(has('KeyS','ArrowDown')||t.has('back'));
  if(x)v.x=x;if(z)v.z=z;if(x)v.steer=-x;if(z&&mode!=='foot'&&mode!=='helicopter')v.throttle=z;
  v.climb=mode==='helicopter'?(Number(has('KeyZ','Space')||t.has('rise'))-Number(has('KeyX')||t.has('lower'))||v.climb):0;v.aim||=this.mouseAim||has('ControlLeft')||t.has('aim');v.fire||=this.mouseFire||t.has('fire')||this.fireLatch;v.brake||=(mode!=='helicopter'&&has('Space'))||t.has('brake');v.boost||=has('ShiftLeft','ShiftRight')||t.has('boost');v.jump||=has('KeyJ')||(mode==='foot'&&has('Space'))||t.has('jump')||this.jumpLatch;if(v.aim){v.throttle=0;v.climb=0;}this.fireLatch=false;this.jumpLatch=false;return v;
 }
}
