/* Visible clues only: directional warnings require a live sightline. A last
 * seen marker describes the player's reported position, not an enemy radar. */
import {coverAt,dist} from './world.mjs';
export function stealthStatus(s){
 const p=s.player,observers=s.enemies.filter(e=>e.hp>0&&e.seen&&e.awareness>.15),searching=s.enemies.some(e=>e.hp>0&&['search','investigate'].includes(e.state));
 const hidden=coverAt(p)&&p.stance!=='stand',noise=p.noise<.15?'STILL':p.noise<1.3?'QUIET':p.noise<3.8?'AUDIBLE':'LOUD';
 const aimed=observers.some(e=>(e.aimTime||0)>.15&&e.state==='chase');
 return {noise,noiseLevel:Math.min(1,p.noise/5.3),cover:hidden?(p.stance==='prone'?'DEEP COVER':'GRASS COVER'):p.stance==='prone'?'LOW PROFILE':p.stance==='crouch'?'CROUCHED':'UPRIGHT',
  message:aimed?'They are lining up a shot. Break sight.':observers.some(e=>e.state==='chase')?'Move to cover, throw smoke, or dodge.':observers.length?'Someone is checking your position.':searching?'Searching the last clue. Change your route.':p.exhausted?'Catch your breath before sprinting.':hidden?'Grass reduces visibility, not close-range detection.':'Move quietly; cover blocks sight.',observers,searching};
}
export function createStealthUI(host){
 const panel=document.createElement('div');panel.id='stealth-readout';panel.innerHTML='<div><span id="cover-label"></span><span id="noise-label"></span></div><div class="noise-track"><i id="noise-fill"></i></div><p id="stealth-advice"></p>';
 const ring=document.createElement('div');ring.id='threat-ring';ring.setAttribute('aria-hidden','true');
 const callout=document.createElement('div');callout.id='guard-callout';callout.setAttribute('role','status');callout.hidden=true;host.append(panel,ring,callout);
 let heardSeq=0,caption='',captionUntil=0,lastState=null;
 function update(s,view,mode){
  if(lastState!==s){heardSeq=0;caption='';captionUntil=0;lastState=s;}
  const info=stealthStatus(s);document.getElementById('cover-label').textContent=info.cover;document.getElementById('noise-label').textContent='FOOTSTEPS / '+info.noise;document.getElementById('noise-fill').style.transform='scaleX('+info.noiseLevel+')';document.getElementById('stealth-advice').textContent=info.message;
  ring.replaceChildren();
  if(mode==='play')for(const e of info.observers){const angle=Math.atan2(e.x-s.player.x,-(e.z-s.player.z))+view.yaw,el=document.createElement('i');el.className='threat-arc'+(e.state==='chase'?' danger':'');el.style.transform=`rotate(${angle}rad) translateY(-54px)`;el.style.opacity=String(.3+e.awareness*.7);ring.append(el);}
  for(const ev of s.events)if(ev.seq>heardSeq){heardSeq=ev.seq;if(ev.type==='callout'&&dist(ev,s.player)<16){caption=ev.text;captionUntil=s.t+2.8;}}
  callout.hidden=s.t>captionUntil||!caption||mode!=='play';callout.textContent='NEARBY LOOKOUT: “'+caption+'”';
 }
 return {update};
}
