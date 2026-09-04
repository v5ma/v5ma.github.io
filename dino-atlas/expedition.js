import {PERIODS,inPeriod,readProgress,writeProgress,addDiscovery,STORAGE_KEY} from './core.js';
import {dinosaurArt} from './art.js';
import {SPAWN,LIMIT,LAKE,CLUES,move,nearest,animalPose,readClues} from './expedition-core.js';
import {makeDinosaur,makeExplorer} from './dino-models.js';
const $=id=>document.getElementById(id);
let storage;try{storage=localStorage;}catch{storage=null;}
const state={period:'jurassic',mode:'3d',position:{...SPAWN},yaw:.55,time:0,progress:readProgress(storage).progress,clues:readClues(storage),near:null,walking:false};
const canvas=$('field-2d'),ctx=canvas.getContext('2d'),glCanvas=$('field-3d'),map=$('minimap'),mapCtx=map.getContext('2d'),dialog=$('discovery');
let T=null,renderer=null,scene=null,camera=null,explorer=null,models=[],marks=[],ready=false,loading=null,toastTimer,last=performance.now(),w=100,h=100,pixelRatio=1,drag=null,lastNearId='';
const held=new Set(),sprites=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const period=()=>PERIODS.find(p=>p.id===state.period);
const dinos=()=>inPeriod(state.period);
const toast=text=>{const el=$('exp-toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200);};
function save(){if(!writeProgress(storage,state.progress))toast('This browser cannot save the journal. Export it from the field guide before leaving.');try{storage?.setItem('dino-atlas.clues.v1',JSON.stringify([...state.clues]));}catch{}updateProgress();}
function updateProgress(){const count=dinos().filter(d=>state.progress.observed.includes(d.id)).length+CLUES.filter(c=>state.clues.has(state.period+':'+c.id)).length;$('quest-progress').textContent=`${count} of 4 discoveries${count===4?' / Chapter explored!':''}`;$('quest-bar').value=count;$('saved-count').textContent=state.progress.observed.length;}
function buttons(){
  $('period-buttons').innerHTML=PERIODS.map(p=>`<button data-period="${p.id}" aria-pressed="${state.period===p.id}"><strong>${p.name}</strong><small>${p.start}-${p.end} million years ago</small></button>`).join('');
  $('era-location').textContent='LATE '+period().name.toUpperCase();$('era-age').textContent='ABOUT '+period().stop+' MILLION YEARS AGO';
}
function setPeriod(id){if(!PERIODS.some(p=>p.id===id))return;state.period=id;state.position={...SPAWN};held.clear();state.near=null;lastNearId='';buttons();updateProgress();if(ready)buildScene();toast('Your '+period().name+' expedition is ready. Look for the gold evidence markers.');}
function getSprite(d){if(!sprites.has(d.id)){const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(dinosaurArt(d));sprites.set(d.id,img);}return sprites.get(d.id);}
function disposeScene(){if(!scene)return;const geos=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);});geos.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});}
function buildScene(){
  disposeScene();scene=new T.Scene();const warm=state.period==='triassic';scene.background=new T.Color(warm?'#ead2a5':'#c8ded1');scene.fog=new T.Fog(warm?'#ead2a5':'#c8ded1',65,130);
  scene.add(new T.HemisphereLight('#f8eed2','#506650',2.2));const sun=new T.DirectionalLight('#fff0d0',2.8);sun.position.set(-18,38,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-46;sun.shadow.camera.right=46;sun.shadow.camera.top=46;sun.shadow.camera.bottom=-46;sun.shadow.bias=-.0008;scene.add(sun);
  const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.95,flatShading:true});const sand=mat(warm?'#c9ae76':'#9caf7c'),soil=mat('#a58d64'),leaf=mat(warm?'#728b5a':'#527859'),bark=mat('#735c46'),stone=mat('#afb29b');
  function put(geom,material,x,y,z){const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
  put(new T.CylinderGeometry(44,44.7,2,80),soil,0,-1.03,0);const ground=put(new T.CircleGeometry(44,80),sand,0,.01,0);ground.rotation.x=-Math.PI/2;
  const lake=put(new T.CircleGeometry(LAKE.r+1.3,50),mat('#b9c5a1'),LAKE.x,.035,LAKE.z);lake.rotation.x=-Math.PI/2;const water=put(new T.CircleGeometry(LAKE.r,50),new T.MeshStandardMaterial({color:'#73b5b3',roughness:.22,metalness:.2}),LAKE.x,.05,LAKE.z);water.rotation.x=-Math.PI/2;
  for(let i=0;i<50;i++){const a=i*2.39996,r=28+(i*7%13),x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.hypot(x-LAKE.x,z-LAKE.z)<12)continue;const ht=3+(i%6)*.6;put(new T.CylinderGeometry(.18,.3,ht,7),bark,x,ht/2,z);for(let j=0;j<3;j++)put(new T.ConeGeometry(1.7-j*.3,ht*.65,7),leaf,x,ht*.55+j*.8,z);}
  for(let i=0;i<35;i++){const a=i*2.6,r=25+(i*17%14);const rock=put(new T.DodecahedronGeometry(.6+(i%3)*.3),stone,Math.sin(a)*r,.3,Math.cos(a)*r);rock.scale.y=.55;}
  const trail=mat('#c9c19a');for(let i=0;i<36;i++){const z=25-i*1.2,x=Math.sin(i*.21)*4;const disk=put(new T.CircleGeometry(1.7,9),trail,x,.04,z);disk.rotation.x=-Math.PI/2;}
  models=dinos().map(d=>{const animal=makeDinosaur(T,d);scene.add(animal);const cv=document.createElement('canvas');cv.width=512;cv.height=92;const c=cv.getContext('2d');c.fillStyle='#254b3eee';c.beginPath();c.roundRect(0,0,512,92,22);c.fill();c.fillStyle='#fff1ca';c.font='bold 32px system-ui';c.textAlign='center';c.fillText(d.name,256,57);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:false}));label.position.set(0,5.6,0);label.scale.set(6.7,1.2,1);animal.add(label);return animal;});
  marks=CLUES.map(c=>{const group=new T.Group();group.position.set(c.x,0,c.z);const rock=new T.Mesh(new T.DodecahedronGeometry(1.25),stone);rock.position.y=.55;rock.scale.set(1,.5,.8);group.add(rock);const pole=new T.Mesh(new T.CylinderGeometry(.045,.045,2,6),bark);pole.position.set(.8,1,.2);group.add(pole);const flag=new T.Mesh(new T.BoxGeometry(.95,.55,.045),new T.MeshStandardMaterial({color:'#edbe6a',roughness:.8,emissive:'#8b5315',emissiveIntensity:.25}));flag.position.set(1.22,1.85,.2);group.add(flag);const ring=new T.Mesh(new T.RingGeometry(1.6,1.8,36),new T.MeshBasicMaterial({color:'#f3cd76',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;group.add(ring);scene.add(group);return group;});
  explorer=makeExplorer(T);scene.add(explorer);camera=new T.PerspectiveCamera(47,w/h,.1,180);camera.position.set(16,19,41);updateThree(0);
}
async function init3D(){
  if(ready)return true;if(loading)return loading;
  loading=(async()=>{try{T=await import('./vendor/three.module.js');renderer=new T.WebGLRenderer({canvas:glCanvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(w,h,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;ready=true;buildScene();return true;}catch(error){ready=false;renderer?.dispose();renderer=null;console.warn('Dino Atlas 3D unavailable:',error.message);return false;}})();return loading;
}
async function setView(mode){
  state.mode=mode;
  if(mode==='3d'&&!ready){$('mode-3d').textContent='Loading 3D...';if(!await init3D()){state.mode='2d';toast('3D is not supported by this browser. You can explore the same landscape in 2D.');}$('mode-3d').textContent='3D world';}
  const active=state.mode==='3d'&&ready;glCanvas.style.visibility=active?'visible':'hidden';canvas.style.visibility=active?'hidden':'visible';$('mode-2d').setAttribute('aria-pressed',String(!active));$('mode-3d').setAttribute('aria-pressed',String(active));
}
function updateThree(dt){
  if(!ready)return;models.forEach((m,i)=>{const p=animalPose(i,state.time);m.position.set(p.x,0,p.z);m.rotation.y=p.angle;for(let j=0;j<m.userData.legs.length;j++)m.userData.legs[j].rotation.z=reduced?0:Math.sin(state.time*2+j*Math.PI)*.13;});
  explorer.position.set(state.position.x,0,state.position.z);if(state.walking)explorer.rotation.y=state.walkAngle;
  explorer.userData.legs.forEach((m,i)=>m.rotation.x=state.walking?Math.sin(state.time*10+i*Math.PI)*.35:0);
  const target=new T.Vector3(state.position.x+Math.sin(state.yaw)*19,15,state.position.z+Math.cos(state.yaw)*19);camera.position.lerp(target,dt?Math.min(1,dt*6):1);camera.lookAt(state.position.x,1.1,state.position.z);
}
function fit(){const rect=canvas.parentElement.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);pixelRatio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*pixelRatio);canvas.height=Math.round(h*pixelRatio);if(renderer){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}
new ResizeObserver(fit).observe(canvas.parentElement);fit();
function mapPosition(x,z,size){return [size/2+x/(LIMIT*2.5)*size,size/2+z/(LIMIT*2.5)*size];}
function drawMap(){
  mapCtx.clearRect(0,0,180,180);mapCtx.fillStyle='#cad5b5';mapCtx.beginPath();mapCtx.arc(90,90,73,0,7);mapCtx.fill();
  const[lx,lz]=mapPosition(LAKE.x,LAKE.z,180);mapCtx.fillStyle='#72aeb0';mapCtx.beginPath();mapCtx.arc(lx,lz,13,0,7);mapCtx.fill();
  for(const c of CLUES){const[x,z]=mapPosition(c.x,c.z,180);mapCtx.fillStyle=state.clues.has(state.period+':'+c.id)?'#77a476':'#e2ad48';mapCtx.fillRect(x-4,z-4,8,8);}
  dinos().forEach((d,i)=>{const p=animalPose(i,state.time),[x,z]=mapPosition(p.x,p.z,180);mapCtx.fillStyle='#5a8462';mapCtx.beginPath();mapCtx.arc(x,z,5,0,7);mapCtx.fill();});
  const[x,z]=mapPosition(state.position.x,state.position.z,180);mapCtx.fillStyle='#cf7742';mapCtx.strokeStyle='#fff0bd';mapCtx.lineWidth=2;mapCtx.beginPath();mapCtx.arc(x,z,5,0,7);mapCtx.fill();mapCtx.stroke();mapCtx.fillStyle='#385d45';mapCtx.font='bold 10px system-ui';mapCtx.textAlign='center';mapCtx.fillText('N',90,16);
}
function draw2D(){
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.fillStyle=state.period==='triassic'?'#d2c09c':'#b9d3bc';ctx.fillRect(0,0,w,h);
  const s=Math.min(w,h)/98,cx=w*.54,cz=h*.49;const pos=(x,z)=>[cx+x*s,cz+z*s];
  ctx.fillStyle='#76977d';ctx.beginPath();ctx.ellipse(cx,cz+8,44*s,44*s,0,0,7);ctx.fill();ctx.fillStyle=state.period==='triassic'?'#cdb284':'#aabd85';ctx.beginPath();ctx.arc(cx,cz,44*s,0,7);ctx.fill();
  const[lx,lz]=pos(LAKE.x,LAKE.z);ctx.fillStyle='#d6cea2';ctx.beginPath();ctx.arc(lx,lz,(LAKE.r+1)*s,0,7);ctx.fill();ctx.fillStyle='#73b5b3';ctx.beginPath();ctx.arc(lx,lz,LAKE.r*s,0,7);ctx.fill();
  ctx.strokeStyle='#d4c8a3';ctx.lineWidth=s*3.5;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<36;i++){const[x,z]=pos(Math.sin(i*.21)*4,25-i*1.2);if(i===0)ctx.moveTo(x,z);else ctx.lineTo(x,z);}ctx.stroke();
  for(let i=0;i<37;i++){const a=i*2.3999,r=30+(i*7%10),px=Math.sin(a)*r,pz=Math.cos(a)*r;if(Math.hypot(px-LAKE.x,pz-LAKE.z)<11)continue;const[x,y]=pos(px,pz),sz=s*(1.7+i%3*.2);ctx.fillStyle='#55755544';ctx.beginPath();ctx.ellipse(x+4,y+9,sz,sz*.5,0,0,7);ctx.fill();ctx.fillStyle='#756548';ctx.fillRect(x-2,y-2,4,10);for(let j=0;j<3;j++){ctx.fillStyle=j%2?'#527a59':'#6a8c5e';ctx.beginPath();ctx.moveTo(x,y-sz*2+j*sz*.7);ctx.lineTo(x-sz+j*2,y+j*sz*.6);ctx.lineTo(x+sz-j*2,y+j*sz*.6);ctx.fill();}}
  for(const c of CLUES){const[x,z]=pos(c.x,c.z);ctx.fillStyle='#a7ab94';ctx.beginPath();ctx.ellipse(x,z,12,7,-.3,0,7);ctx.fill();ctx.strokeStyle='#ffe2a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,z,18,0,7);ctx.stroke();ctx.fillStyle='#845d3b';ctx.fillRect(x+10,z-25,3,28);ctx.fillStyle=state.clues.has(state.period+':'+c.id)?'#86bd81':'#f3c875';ctx.fillRect(x+13,z-25,19,12);}
  dinos().forEach((d,i)=>{const p=animalPose(i,state.time),[x,z]=pos(p.x,p.z),img=getSprite(d),width=Math.max(88,s*21);if(img.complete&&img.naturalWidth)ctx.drawImage(img,x-width/2,z-width*.36,width,width*.486);ctx.fillStyle='#244c3b';ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.fillText(d.name,x,z+14);});
  const[x,z]=pos(state.position.x,state.position.z);ctx.fillStyle='#43644c55';ctx.beginPath();ctx.ellipse(x+2,z+9,10,4,0,0,7);ctx.fill();ctx.fillStyle='#365f50';ctx.beginPath();ctx.roundRect(x-6,z-4,12,15,4);ctx.fill();ctx.fillStyle='#f0cea0';ctx.beginPath();ctx.arc(x,z-6,6,0,7);ctx.fill();ctx.fillStyle='#d8954e';ctx.beginPath();ctx.ellipse(x,z-11,10,4,0,0,7);ctx.fill();ctx.beginPath();ctx.roundRect(x-6,z-18,12,8,3);ctx.fill();ctx.fillStyle='#655544';ctx.fillRect(x-7,z+8,5,5);ctx.fillRect(x+2,z+8,5,5);
}
function inspect(){
  if(!state.near||dialog.open)return;held.clear();
  const n=state.near;
  if(n.kind==='animal'){
    const d=n.dino;addDiscovery(state.progress,'observed',d.id);save();
    $('discovery-content').innerHTML=`<p class="overline">FIELD OBSERVATION / ${period().name.toUpperCase()}</p>${dinosaurArt(d)}<h2 id="discovery-title">${d.name}</h2><p>${d.detail}</p><div class="evidence-row"><article><strong>Fossil evidence</strong><p>${d.evidence}</p></article><article><strong>Still unknown</strong><p>${d.unknown}</p></article></div><a href="./field-guide.html?specimen=${d.id}#dig">Investigate this creature in the fossil lab</a>`;
  }else{
    state.clues.add(state.period+':'+n.id);save();$('discovery-content').innerHTML=`<p class="overline">EVIDENCE DISCOVERY</p><h2 id="discovery-title">${n.title}</h2><p>${n.text}</p><p>This marker is an invented teaching activity, not a documented fossil find at this location.</p><a href="./field-guide.html#grownups">Read the science and illustration notes</a>`;
  }
  dialog.showModal();
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(!document.hidden&&!dialog.open){
    state.time+=dt;let dx=(held.has('right')?1:0)-(held.has('left')?1:0),dz=(held.has('back')?1:0)-(held.has('forward')?1:0);state.walking=!!(dx||dz);
    if(state.walking){if(state.mode==='3d'){const x=dx*Math.cos(state.yaw)+dz*Math.sin(state.yaw),z=-dx*Math.sin(state.yaw)+dz*Math.cos(state.yaw);dx=x;dz=z;}state.position=move(state.position,dx,dz,dt,held.has('sprint')?10:7);state.walkAngle=Math.atan2(dx,dz)+Math.PI;}
    const targets=dinos().map((d,i)=>({...animalPose(i,state.time),kind:'animal',id:d.id,title:d.name,dino:d})).concat(CLUES.map(c=>({...c,kind:'clue'})));
    state.near=nearest(state.position,targets);
    const id=state.near?.id||'';if(id!==lastNearId){lastNearId=id;$('inspect').disabled=!state.near;$('inspect').textContent=state.near?'Inspect '+state.near.title:'Explore the landscape';$('interaction-hint').textContent=state.near?'Press E or tap to investigate and record this discovery.':'Approach an animal or an amber evidence marker.';}
  }
  if(state.mode==='3d'&&ready){updateThree(dt);renderer.render(scene,camera);}else draw2D();drawMap();requestAnimationFrame(frame);
}
const keys={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'sprint'};
window.addEventListener('keydown',e=>{if(dialog.open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='KeyE'){e.preventDefault();inspect();}if(keys[e.code]){e.preventDefault();held.add(keys[e.code]);}});
window.addEventListener('keyup',e=>{if(keys[e.code])held.delete(keys[e.code]);});window.addEventListener('blur',()=>held.clear());document.addEventListener('visibilitychange',()=>held.clear());
for(const c of[canvas,glCanvas]){c.addEventListener('pointerdown',e=>{drag={x:e.clientX};c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',e=>{if(drag&&state.mode==='3d'){state.yaw-=(e.clientX-drag.x)*.007;drag.x=e.clientX;}});for(const type of['pointerup','pointercancel','lostpointercapture'])c.addEventListener(type,()=>drag=null);}
for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();held.add(b.dataset.move);b.setPointerCapture(e.pointerId);});for(const event of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held.delete(b.dataset.move));}
$('period-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-period]');if(b){setPeriod(b.dataset.period);document.querySelector(`[data-period="${state.period}"]`).focus({preventScroll:true});}});
$('mode-2d').onclick=()=>setView('2d');$('mode-3d').onclick=()=>setView('3d');$('inspect').onclick=inspect;$('reset-camera').onclick=()=>state.yaw=.55;
$('help-toggle').onclick=()=>{const collapsed=document.querySelector('.exp-mission').classList.toggle('collapsed');$('help-toggle').textContent=collapsed?'Show field notes':'Hide field notes';};
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){state.progress=readProgress(storage).progress;updateProgress();}});
glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.mode='2d';ready=false;setView('2d');toast('The 3D view was interrupted. Your expedition continues in 2D. Reload to retry 3D.');});
window.__dinoExpedition={state,setPeriod,setView,inspect,get ready(){return ready},get scene(){return scene},version:'2026.09.04'};
buttons();updateProgress();setView('3d');requestAnimationFrame(frame);
