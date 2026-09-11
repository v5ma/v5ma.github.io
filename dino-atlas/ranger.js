import * as T from './vendor/three.module.js';
import {byId,readProgress,writeProgress,addDiscovery,escapeHTML} from './core.js';
import {ANIMALS,HOME,LAKE,ROADS,STATIONS,MISSIONS,clamp,distance,emptyRanger,readRanger,saveRanger,advance,waypoint,makeAnimalState,stepAnimal} from './ranger-data.js';
import {initPhysics,ParkPhysics,RangerJeep,rotateVector} from './ranger-physics.js';
import {makeJeep,makeParkDinosaur} from './ranger-art.js';
import {buildPark} from './ranger-world.js';
import {RangerAudio} from './ranger-audio.js';
const $=id=>document.getElementById(id);
export async function boot(){
  await initPhysics();
  let storage;try{storage=localStorage;}catch{storage=null;}
  let campaign=readRanger(storage),started=false,health=100,time=0,accumulator=0,last=performance.now(),hornAt=-100,attackAt=-100,saveClock=0,uiClock=0;
  let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,night=false,cameraMode='orbit',yaw=.65,pitch=.72,zoom=32,candidate=null,drag=null;
  let radioTimer,toastTimer,lastPrompt='',lastStage=-1,lastPosition={...HOME},previousSpeed=0,lowFrames=0,qualityChosen=false;
  const held=new Set(),touch=new Set(),padPrevious=[],audio=new RangerAudio(),canvas=$('park');
  const dialogs=[$('info-dialog'),$('map-dialog'),$('menu-dialog')],isPaused=()=>!started||dialogs.some(d=>d.open)||document.hidden;
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(44,1,.1,500),physics=new ParkPhysics(),jeep=new RangerJeep(physics),park=buildPark(scene,physics),model=makeJeep();scene.add(model);
  const animals=ANIMALS.map((d,i)=>{const a=makeAnimalState(d,i);a.model=makeParkDinosaur(d);a.collider=physics.animal(d.radius,d.x,d.z);scene.add(a.model);return a;});
  for(let i=0;i<120;i++){jeep.drive({},1/60);physics.world.step();}
  const size=()=>{const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};window.addEventListener('resize',size);size();
  camera.position.set(32,24,77);camera.lookAt(-3,2,31);park.setPowered(campaign.stage>=3);
  $('motion-toggle').checked=reduced;
  function clearInput(){held.clear();touch.clear();document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));accumulator=0;}
  function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3600);}
  function radio(text){$('radio-text').textContent=text;$('radio').classList.add('show');clearTimeout(radioTimer);radioTimer=setTimeout(()=>$('radio').classList.remove('show'),7000);}
  function save(){if(!saveRanger(storage,campaign))toast('Progress cannot be saved in this browser. Keep this tab open.');}
  function mission(event){if(advance(campaign,event)){save();park.setPowered(campaign.stage>=3);radio(MISSIONS[campaign.stage].radio);audio.tone(660,.14);return true;}return false;}
  function showDialog(id){clearInput();if(!$(id).open)$(id).showModal();}
  function info(kicker,title,html){$('info-kicker').textContent=kicker;$('info-title').textContent=title;$('info-body').innerHTML=html;showDialog('info-dialog');}
  dialogs.forEach(d=>{d.addEventListener('close',()=>{clearInput();if(started)canvas.focus({preventScroll:true});});});
  function recover(){jeep.reset();lastPosition={...HOME};health=100;previousSpeed=0;clearInput();toast('Recovered at the visitor center. Your discoveries and mission are safe.');}
  function interact(){
    if(isPaused()||!candidate)return;
    if(Math.abs(jeep.speed)>3){toast('Slow down before interacting.');return;}
    const c=candidate;
    if(c.kind==='animal'){
      const d=byId(c.id);if(!campaign.observed.includes(d.id))campaign.observed.push(d.id);
      const p=readProgress(storage).progress;addDiscovery(p,'observed',d.id);if(!writeProgress(storage,p))toast('The field journal could not be saved on this device.');
      if(d.diet==='Plant-eater')mission('survey');save();
      info('SPECIES RECORDED / '+d.period.toUpperCase(),d.name,`<p>${escapeHTML(d.detail)}</p><p class="fact"><b>THE EVIDENCE</b>${escapeHTML(d.evidence)}</p><p class="fact"><b>STILL UNKNOWN</b>${escapeHTML(d.unknown)}</p><p><a href="./field-guide.html#journal" target="_blank" rel="noopener">Open your saved field journal</a></p>`);
    }else if(c.kind==='power'){mission('power');toast('Relay restored. The northern research gate is opening.');}
    else if(c.kind==='recorder'){if(mission('recorder'))info('RECOVERY SUCCESSFUL','Now get it home.','<p>The field recorder is secured. Follow the amber marker back to the visitor center and stop in the ranger bay.</p><p>Keep moving while you are inside the northern habitat.</p>');}
    else if(c.kind==='home'){if(mission('home'))info('ALL FIVE OBJECTIVES COMPLETE','Welcome home, Ranger 07.',`<p>You surveyed the reserve, restored the research relay, and brought the recorder back safely.</p><p>Your expedition covered ${Math.round(campaign.meters)} meters. ${campaign.observed.length} of the 6 park species are in your ranger journal.</p><p>Continue exploring, try the equipment-yard ramp, or visit the fossil field. The original fossil lab and journal remain available in the field guide.</p>`);}
    else if(c.kind==='lab')info('FOSSIL FIELD','Read the evidence.','<p>Continue the original Dino Atlas excavation and identification activities in the fossil lab. They share your existing field journal.</p><p><a href="./field-guide.html#dig" target="_blank" rel="noopener">Enter the fossil lab</a></p>');
    else info('VISITOR CENTER','Your field journal.','<p>Every species you record here is added to the original Dino Atlas journal. Your previous excavation, quiz, and note progress is preserved.</p><p><a href="./field-guide.html#journal" target="_blank" rel="noopener">Open the field journal</a></p>');
  }
  function action(key){
    if(!started)return;
    if(key==='map'){if($('map-dialog').open)$('map-dialog').close();else if(!dialogs.some(d=>d.open))showDialog('map-dialog');return;}
    if(key==='menu'){if($('menu-dialog').open)$('menu-dialog').close();else if(!dialogs.some(d=>d.open))showDialog('menu-dialog');return;}
    if(isPaused())return;
    if(key==='interact')interact();
    if(key==='reset')recover();
    if(key==='horn'){hornAt=time;audio.horn();toast('Horn sounded. Nearby animals may react.');}
    if(key==='camera'){cameraMode=cameraMode==='orbit'?'chase':'orbit';$('camera-select').value=cameraMode;toast(cameraMode==='orbit'?'Isometric orbit camera':'Chase camera');}
  }
  const actions={KeyE:'interact',KeyR:'reset',KeyH:'horn',KeyM:'map',KeyC:'camera',Escape:'menu'};
  const drivingCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyJ'];
  window.addEventListener('keydown',e=>{
    if(!started||e.ctrlKey||e.metaKey||e.altKey)return;
    if(dialogs.some(d=>d.open)){if(e.code==='KeyM'&&$('map-dialog').open){e.preventDefault();$('map-dialog').close();}return;}
    if(drivingCodes.includes(e.code)||actions[e.code])e.preventDefault();
    if(!e.repeat&&actions[e.code])action(actions[e.code]);if(drivingCodes.includes(e.code))held.add(e.code);
  });
  window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden&&started&&!dialogs.some(d=>d.open))showDialog('menu-dialog');});
  document.querySelectorAll('[data-drive]').forEach(b=>{
    const end=()=>{touch.delete(b.dataset.drive);b.classList.remove('pressed');};
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(isPaused())return;b.setPointerCapture(e.pointerId);touch.add(b.dataset.drive);b.classList.add('pressed');});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,end);
  });
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointermove',e=>{if(!drag||isPaused())return;yaw-=(e.clientX-drag.x)*.007;pitch=clamp(pitch+(e.clientY-drag.y)*.004,.35,1.1);drag={x:e.clientX,y:e.clientY};cameraMode='orbit';$('camera-select').value='orbit';});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.022,18,48);},{passive:false});
  $('start-button').addEventListener('click',()=>{started=true;$('intro').hidden=true;$('hud').hidden=false;canvas.focus({preventScroll:true});radio(MISSIONS[campaign.stage].radio);last=performance.now();});
  $('interact-button').addEventListener('click',interact);$('touch-horn').addEventListener('click',()=>action('horn'));$('touch-reset').addEventListener('click',()=>action('reset'));
  $('map-button').addEventListener('click',()=>action('map'));$('minimap-button').addEventListener('click',()=>action('map'));$('menu-button').addEventListener('click',()=>action('menu'));
  $('sound-button').addEventListener('click',async()=>{try{const on=await audio.toggle();$('sound-button').textContent=on?'Sound on':'Sound off';$('sound-button').setAttribute('aria-pressed',String(on));}catch{toast('Audio is not available in this browser.');}});
  $('camera-select').addEventListener('change',e=>cameraMode=e.target.value);$('night-toggle').addEventListener('change',e=>night=e.target.checked);$('motion-toggle').addEventListener('change',e=>reduced=e.target.checked);
  function quality(value){renderer.setPixelRatio(value==='low'?1:Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=value!=='low';scene.traverse(o=>{if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;}});$('quality-select').value=value;size();}
  $('quality-select').addEventListener('change',e=>{qualityChosen=true;quality(e.target.value);});
  $('restart-button').addEventListener('click',()=>{campaign=emptyRanger();health=100;lastStage=-1;park.setPowered(false);recover();save();$('menu-dialog').close();radio(MISSIONS[0].radio);});
  let previousPad=[];
  function input(){
    const down=(...keys)=>keys.some(k=>held.has(k)),v={throttle:Number(down('KeyW','ArrowUp')||touch.has('forward'))-Number(down('KeyS','ArrowDown')||touch.has('back')),steer:Number(down('KeyA','ArrowLeft')||touch.has('left'))-Number(down('KeyD','ArrowRight')||touch.has('right')),brake:down('Space')||touch.has('brake'),boost:down('ShiftLeft','ShiftRight')||touch.has('boost'),jump:down('KeyJ')};
    let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);}catch{}
    if(pad){const b=pad.buttons,axis=pad.axes[0]||0;if(Math.abs(axis)>.16)v.steer=clamp(-axis,-1,1);const t=(b[7]?.value||0)-(b[6]?.value||0);if(Math.abs(t)>.08)v.throttle=t;v.brake||=!!b[1]?.pressed;v.boost||=!!b[5]?.pressed;v.jump||=!!b[4]?.pressed;
      for(const [i,a] of [[0,'interact'],[2,'horn'],[3,'reset'],[9,'menu']])if(b[i]?.pressed&&!previousPad[i])action(a);previousPad=b.map(v=>v.pressed);
    }else previousPad=[];
    return v;
  }
  function updateCandidate(){
    const p=jeep.position;candidate=null;
    const key=MISSIONS[campaign.stage].key,station=STATIONS[key];
    if(['power','recorder','home'].includes(key)&&station&&distance(p,station)<7)candidate={kind:key};
    if(!candidate){let nearest=Infinity;for(const a of animals){const gap=distance(p,a);if(gap<a.radius+9&&gap<nearest){nearest=gap;candidate={kind:'animal',id:a.id,mood:a.mood};}}}
    if(!candidate&&distance(p,{x:-48,z:-15})<8)candidate={kind:'lab'};
    if(!candidate&&distance(p,HOME)<7)candidate={kind:'journal'};
    const labels={power:'Restore research relay',recorder:'Recover field recorder',home:'Deliver recorder',lab:'Explore the fossil lab',journal:'Open field notes'};
    const text=candidate?(Math.abs(jeep.speed)>3?'Slow down to investigate':candidate.kind==='animal'?'Observe '+byId(candidate.id).name:labels[candidate.kind]):campaign.stage===5?'Explore the reserve':'Follow the amber marker';
    if(text!==lastPrompt){$('interact-label').textContent=text;lastPrompt=text;}$('interact-button').disabled=!candidate||Math.abs(jeep.speed)>3;
    const rex=animals.find(a=>a.kind==='rex');const threat=campaign.stage>=3&&distance(rex,p)<22&&p.z<-37;
    document.body.classList.toggle('danger',threat);
    $('encounter-label').textContent=threat?(rex.mood==='pursuing'?'TYRANNOSAUR APPROACHING / KEEP MOVING':'NORTHERN HABITAT / STAY ALERT'):candidate?.kind==='animal'?candidate.mood==='startled'?'The animal is startled. Give it space.':'Stop quietly to record a discovery.':'Leave only tire tracks.';
  }
  function drawMap(canvas,full=false){
    const c=canvas.getContext('2d'),s=canvas.width,k=s/180,pos=(x,z)=>[s/2+x*k,s/2+z*k];c.clearRect(0,0,s,s);c.save();
    if(!full){c.beginPath();c.arc(s/2,s/2,s/2-1,0,7);c.clip();}
    c.fillStyle='#244637';c.fillRect(0,0,s,s);c.strokeStyle='#91a37918';c.lineWidth=1;for(let i=0;i<=s;i+=s/9){c.beginPath();c.moveTo(i,0);c.lineTo(i,s);c.moveTo(0,i);c.lineTo(s,i);c.stroke();}
    c.fillStyle='#446044';c.beginPath();c.arc(s/2,s/2,84*k,0,7);c.fill();
    c.fillStyle='#467b72';c.beginPath();c.arc(...pos(LAKE.x,LAKE.z),LAKE.r*k,0,7);c.fill();
    c.fillStyle='#ad795c35';const [rx,rz]=pos(20,-76);c.fillRect(rx,rz,50*k,37*k);
    c.strokeStyle='#c1b484';c.lineWidth=(full?1.6:1.2)*k;c.lineJoin='round';for(const road of ROADS){c.beginPath();road.forEach(([x,z],i)=>i?c.lineTo(...pos(x,z)):c.moveTo(...pos(x,z)));c.stroke();}
    c.fillStyle='#719b6a';for(const a of animals){c.beginPath();c.arc(...pos(a.x,a.z),full?4:2.8,0,7);c.fill();}
    c.font=`600 ${full?13:9}px sans-serif`;c.textAlign='center';
    for(const [id,name] of [['home','BASE'],['power','RELAY'],['recorder','RECORDER']]){const [x,z]=pos(STATIONS[id].x,STATIONS[id].z);c.fillStyle='#c6cdaf';c.fillRect(x-2,z-2,4,4);if(full)c.fillText(name,x,z+18);}
    if(campaign.stage<5){const [x,z]=pos(waypoint(campaign).x,waypoint(campaign).z);c.strokeStyle='#f2c66f';c.lineWidth=2;c.beginPath();c.arc(x,z,full?9:6,0,7);c.stroke();c.fillStyle='#f2c66f';c.beginPath();c.arc(x,z,2.5,0,7);c.fill();}
    const p=jeep.position,[x,z]=pos(p.x,p.z);c.save();c.translate(x,z);c.rotate(Math.PI+jeep.heading);c.fillStyle='#fff5dc';c.beginPath();c.moveTo(0,-7);c.lineTo(4.5,5);c.lineTo(0,3);c.lineTo(-4.5,5);c.closePath();c.fill();c.restore();
    c.fillStyle='#e1d7ad';c.font=`600 ${full?14:10}px sans-serif`;c.fillText('N',s/2,full?21:19);c.restore();
  }
  function ui(){
    if(lastStage!==campaign.stage){const m=MISSIONS[campaign.stage];$('mission-title').textContent=m.title;$('mission-copy').textContent=m.text;$('mission-index').textContent=campaign.stage<5?String(campaign.stage+1).padStart(2,'0')+' / 05':'COMPLETE';$('mission-progress').value=campaign.stage;lastStage=campaign.stage;}
    const p=jeep.position,w=waypoint(campaign);$('waypoint-distance').textContent=campaign.stage<5?Math.round(distance(p,w))+' m':'6 species';
    $('speed').textContent=String(Math.round(Math.abs(jeep.speed)*3.6)).padStart(2,'0');$('gear').textContent=Math.abs(jeep.speed)<.6?'N':jeep.speed<0?'R':'D';
    $('integrity').value=health;$('integrity-label').textContent=health>70?'VEHICLE OK':health>35?'DAMAGE / R TO RECOVER':'RECOVER WITH R';
    $('region-label').textContent=p.z>31?'VISITOR CENTER':p.z< -37&&p.x>19?'NORTHERN HABITAT':p.x< -37?'FOSSIL FIELD':p.x< -12?'GIANT MEADOW':'VALLEY TRAIL';
    updateCandidate();drawMap($('minimap'));if($('map-dialog').open)drawMap($('fullmap'),true);
    park.beacon.visible=campaign.stage<5;if(park.beacon.visible)park.beacon.position.set(w.x,0,w.z);
  }
  function drawVehicle(){
    model.position.copy(jeep.position);model.quaternion.copy(jeep.body.rotation());
    model.userData.tires.forEach(({pivot,roll},i)=>{const c=jeep.connections[i],len=jeep.controller.wheelSuspensionLength(i)??.42;pivot.position.set(c.x,c.y-len,c.z);pivot.rotation.y=i<2?jeep.steer:0;roll.rotation.x=jeep.controller.wheelRotation(i)||0;});
    model.userData.light.intensity=night?95:0;
    for(const a of animals){a.model.position.set(a.x,0,a.z);a.model.rotation.y=a.angle;a.model.userData.legs.forEach((l,i)=>l.rotation.x=reduced?0:Math.sin(time*(a.mood==='pursuing'?7:1.8)+i*Math.PI)*.16);}
  }
  function frame(now){
    requestAnimationFrame(frame);const realDt=Math.min(Math.max((now-last)/1000,0),.1);last=now;const paused=isPaused(),dt=paused?0:realDt;
    if(!paused){
      const controls=input();accumulator+=dt;let steps=0;
      while(accumulator>=1/60&&steps<6&&!isPaused()){
        time+=1/60;
        for(const a of animals){stepAnimal(a,jeep.position,1/60,time,campaign.stage>=3,time-hornAt);a.collider.setNextKinematicTranslation({x:a.x,y:1,z:a.z});}
        jeep.drive(controls,1/60);physics.world.step();accumulator-=1/60;steps++;
        const p=jeep.position;
        if(Math.hypot(p.x,p.z)>86||p.y< -4||![p.x,p.y,p.z].every(Number.isFinite)){recover();break;}
        if(campaign.stage===0&&distance(p,STATIONS.gate)<5)mission('gate');
        const traveled=distance(p,lastPosition);if(traveled<4)campaign.meters+=traveled;lastPosition={x:p.x,z:p.z};
        const rex=animals.find(a=>a.kind==='rex');if(campaign.stage>=3&&p.z< -37&&distance(rex,p)<rex.radius+1.8&&time-attackAt>2){attackAt=time;health=Math.max(0,health-25);audio.tone(105,.22);toast('The tyrannosaur struck the jeep. Move away or press R to recover.');}
        const speed=Math.abs(jeep.speed);if(previousSpeed-speed>5&&previousSpeed>8)health=Math.max(0,health-(previousSpeed-speed)*1.4);previousSpeed=speed;
        if(health<=0){recover();radio('Recovery team has returned you to base. Your recorder and discoveries were saved.');break;}
      }
      saveClock+=dt;if(saveClock>8){saveClock=0;save();}
    }else accumulator=0;
    drawVehicle();park.update(dt,time,jeep,night,reduced);audio.update(jeep.speed,!paused);
    if(started){
      const p=jeep.position,angle=cameraMode==='chase'?jeep.heading+Math.PI:yaw,dist=cameraMode==='chase'?17:zoom,vertical=cameraMode==='chase'?.37:pitch;
      const target=new T.Vector3(p.x+Math.sin(angle)*dist*Math.cos(vertical),Math.max(0,p.y)+dist*Math.sin(vertical),p.z+Math.cos(angle)*dist*Math.cos(vertical));
      camera.position.lerp(target,reduced?1:1-Math.exp(-realDt*4));camera.lookAt(p.x,1.5+Math.max(0,p.y)*.25,p.z);
    }
    uiClock+=realDt;if(uiClock>.09){uiClock=0;ui();}
    renderer.render(scene,camera);
    if(started&&!paused&&!qualityChosen&&$('quality-select').value==='high'){lowFrames=realDt>.046?lowFrames+realDt:Math.max(0,lowFrames-realDt);if(lowFrames>6){quality('low');qualityChosen=true;toast('Battery-saver graphics enabled for smoother driving. Change this in Menu.');}}
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInput();if(started&&!dialogs.some(d=>d.open))showDialog('menu-dialog');toast('Graphics were interrupted. Reload the page, or use the original walking expedition.');});
  window.addEventListener('pagehide',save);
  ui();drawVehicle();park.update(0,time,jeep,night,reduced);renderer.render(scene,camera);
  $('start-button').disabled=false;$('start-button').textContent=campaign.stage?'Continue expedition':'Start your engine';$('load-status').textContent='WASD / arrows to drive. Touch controls on mobile.';
  const debug={get state(){return {ready:true,started,paused:isPaused(),stage:campaign.stage,observed:[...campaign.observed],meters:campaign.meters,position:{...jeep.position},speed:jeep.speed,grounded:jeep.grounded,health,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,cameraMode,night,animals:animals.map(({id,x,z,mood})=>({id,x,z,mood}))};}};
  if(new URLSearchParams(location.search).get('test')==='1')Object.assign(debug,{teleport:(x,z,heading=Math.PI)=>{jeep.reset({x,z},heading);lastPosition={x,z};},render:()=>{ui();renderer.render(scene,camera);},physics,jeep});
  window.__dinoRanger=debug;requestAnimationFrame(frame);
}
