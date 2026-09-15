/* Quest-compatible WebXR comfort theater. The game remains a flat image, not
 * room-scale stereo gameplay. UI, controller poses and hand joints are native XR.
 * No DOM overlay dependency; no hand pose is retained or uploaded.
 */
import * as T from './vendor/three.module.js';
import {xrInput,clearXRInput,pinchPressed,xrAxes,buttonPressed} from './xr-input.mjs';
export function createXRTheater({view,pause,clear,playing}){
 const renderer=view.renderer,world=new T.Scene(),camera=new T.PerspectiveCamera(60,1,.05,30),stage=new T.Group();world.background=new T.Color('#10212b');world.add(stage);
 const target=new T.WebGLRenderTarget(1280,720,{depthBuffer:true}),screen=new T.Mesh(new T.PlaneGeometry(3.84,2.16),new T.MeshBasicMaterial({map:target.texture,toneMapped:true}));screen.position.set(0,.35,-3.2);stage.add(screen);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const context=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.4,1.4),new T.MeshBasicMaterial({map:texture,toneMapped:false}));stage.add(panel);
 const handGeo=new T.SphereGeometry(.009,6,4),handMat=new T.MeshBasicMaterial({color:'#9ee9e2'}),gripGeo=new T.BoxGeometry(.045,.045,.11),gripMat=new T.MeshBasicMaterial({color:'#b7d2de'});
 const lineGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-4)]),lineMat=new T.LineBasicMaterial({color:'#93ddf3'});
 const slots=[0,1].map(()=>{const grip=new T.Mesh(gripGeo,gripMat),ray=new T.Line(lineGeo,lineMat),joints=Array.from({length:25},()=>new T.Mesh(handGeo,handMat));world.add(grip,ray,...joints);return {grip,ray,joints,source:null,previous:[],pinch:false,ready:false};});
 const caster=new T.Raycaster(),matrix=new T.Matrix4(),orientation=new T.Quaternion();
 let session=null,pending=false,aligned=false,oldQuality=null,rootBefore=null,page=0,rows=[],lastPaint=-Infinity,frames=0,selections=0,tracked=0,lossPaused=false,lastSessionError='';
 const $=id=>document.getElementById(id),visible=e=>e&&!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length>0;
 const root=()=>visible($('failure'))?$('failure'):[...document.querySelectorAll('dialog[open]')].at(-1)|| (visible($('welcome'))?$('welcome'):null);
 const emit=name=>window.dispatchEvent(new CustomEvent('nm-action',{detail:{name}}));
 function resetInputs(){clearXRInput();clear();for(const slot of slots){slot.ready=false;slot.previous=[];slot.pinch=false;}}
 function recenter(){aligned=false;resetInputs();}
 function finish(){session=null;pending=false;aligned=false;resetInputs();pause();renderer.xr.enabled=false;renderer.setRenderTarget(null);view.resize();if(oldQuality){view.setQuality(oldQuality);oldQuality=null;}for(const slot of slots){slot.source=null;slot.grip.visible=slot.ray.visible=false;slot.joints.forEach(j=>j.visible=false);}buttons.forEach(b=>b.textContent='Enter Quest XR comfort theater');}
 async function enter(){
  if(session){await session.end();return;}if(pending)return;pending=true;
  try{
   const next=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['hand-tracking','local-floor']});session=next;resetInputs();pause();renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFoveation(1);
   next.addEventListener('end',()=>queueMicrotask(finish),{once:true});next.addEventListener('visibilitychange',()=>{resetInputs();if(next.visibilityState!=='visible')pause();});next.addEventListener('inputsourceschange',()=>{resetInputs();pause();});
   oldQuality=$('quality')?.value||'auto';view.setQuality('low');await renderer.xr.setSession(next);buttons.forEach(b=>b.textContent='Exit Quest XR comfort theater');
  }catch(error){lastSessionError=String(error?.message||error);const active=session;if(active)try{await active.end();}catch{}finish();buttons.forEach(b=>b.textContent='XR unavailable. Select to retry.');}
  finally{pending=false;}
 }
 const buttons=['welcome','pause-dialog'].map(id=>{const b=document.createElement('button');b.id=id==='welcome'?'enter-xr':'pause-xr';b.textContent='Checking XR support...';b.disabled=true;$(id).append(b);b.onclick=enter;return b;});
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Quest comfort theater: tracked rays or pinch select every in-game menu. Left stick moves; right stick looks. Left trigger accelerates, left grip brakes, right trigger interacts, right A hops and B mounts. Hand-only play uses hold-to-move buttons. This is a flat game screen inside XR, not room-scale stereo gameplay.';$('pause-dialog').append(hint);
 if(navigator.xr&&isSecureContext)navigator.xr.isSessionSupported('immersive-vr').then(ok=>buttons.forEach(b=>{b.disabled=!ok;b.textContent=ok?'Enter Quest XR comfort theater':'XR is not supported by this browser';})).catch(()=>buttons.forEach(b=>b.textContent='XR support check failed'));
 else buttons.forEach(b=>b.textContent='Quest XR requires a WebXR browser over HTTPS');
 function add(label,act,x,y,w=936,h=64,hold=null){rows.push({label,act,x,y,w,h,hold});}
 function domAct(el,u){
  el.focus({preventScroll:true});if(el.tagName==='SELECT'){const options=[...el.options].filter(o=>!o.disabled),i=options.indexOf(el.selectedOptions[0]);el.value=options[(i+(u<.33?-1:1)+options.length)%options.length].value;el.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(el.type==='range'){const min=Number(el.min)||0,max=Number(el.max)||100,step=Number(el.step)||1;el.value=String(T.MathUtils.clamp(Number(el.value)+step*(u<.5?-1:1),min,max));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(el.tagName==='TEXTAREA'){el.scrollTop+=el.clientHeight*.6;}
  else el.click();
 }
 function wrap(text,y,maxLines=5){const words=text.split(/\s+/);let line='',count=0;for(const word of words){if(context.measureText(line+' '+word).width>910){context.fillText(line,48,y);y+=32;if(++count>=maxLines)return;line=word;}else line+=(line?' ':'')+word;}context.fillText(line,48,y);}
 function paint(now,r){
  rows=[];context.fillStyle='#122b35';context.fillRect(0,0,1024,1024);context.fillStyle='#f5f0df';context.font='bold 32px sans-serif';
  if(r){
   panel.position.set(0,-.05,-1.8);panel.scale.set(1,1,1);const elements=[...r.querySelectorAll('button,select,input,a[href],textarea')].filter(visible),text=[...r.querySelectorAll('h2,p')].filter(e=>!e.closest('[hidden]')).map(e=>e.textContent.trim()).join(' '),pages=Math.max(1,Math.ceil(elements.length/6),Math.ceil(text.length/460));page=Math.min(page,pages-1);
   context.fillText((r.querySelector('h1,h2')?.textContent||'Neighborhood menu').slice(0,49),48,54);context.font='25px sans-serif';wrap(text.slice(page*460,(page+1)*460),98,5);
   // Live feedback matters in timed repair puzzles; this is not a screenshot of DOM.
   if(r.id==='repair-dialog'){const phase=parseFloat($('signal-indicator').style.left)||0;context.fillStyle='#58a36c';context.fillRect(450,254,124,22);context.fillStyle='#fff2b2';context.fillRect(48+phase*9.28,250,8,30);}
   elements.slice(page*6,page*6+6).forEach((el,i)=>{let label=el.labels?.[0]?.textContent||el.textContent||el.getAttribute('aria-label')||el.id;if(el.tagName==='SELECT')label+=': < '+el.selectedOptions[0]?.textContent+' >';if(el.type==='range')label+=': < '+el.value+' >';if(el.type==='checkbox')label=(el.checked?'[on] ':'[off] ')+label;add(label,(u)=>domAct(el,u),44,300+i*78,936,67);});
   add('Previous page',()=>{page=(page+pages-1)%pages;},44,790,450);add('Next page '+(page+1)+' / '+pages,()=>{page=(page+1)%pages;},530,790,450);
   add('Back / return',()=>{const b=r.querySelector('[data-pad-back],#resume,#map-close,#help-close');if(b)b.click();else if(r.tagName==='DIALOG')r.close();},44,882,450);
   add('Exit XR',()=>session?.end(),530,882,450);
  }else{
   panel.position.set(0,-.96,-2.0);panel.scale.set(.80,.80,.80);context.fillText('NEIGHBORHOOD / DIRECT ACTIONS',48,54);context.font='25px sans-serif';wrap(($('objective-title')?.textContent||'')+' / '+($('context')?.textContent||$('objective-text')?.textContent||''),98,3);
   const actions=[['Interact',()=>emit('interact')],['Hop',()=>emit('hop')],['Mount / dock',()=>emit('ride')],['Throw paper',()=>emit('throw')],['Forward (hold)',null,'forward'],['Brake (hold)',null,'brake'],['Look left (hold)',null,'left'],['Look right (hold)',null,'right'],['City jobs',()=>emit('jobs')],['Menu',()=>emit('pause')],['Center theater',recenter],['Exit XR',()=>session?.end()]];
   actions.forEach(([label,act,hold],i)=>add(label,act,44+(i%2)*486,220+Math.floor(i/2)*119,450,102,hold));
  }
  for(const row of rows){context.fillStyle='#284e5c';context.fillRect(row.x,row.y,row.w,row.h);context.fillStyle='#fff2d5';context.font='26px sans-serif';const label=row.label.trim().replace(/\s+/g,' ');context.fillText(label.slice(0,row.w>500?64:29),row.x+16,row.y+row.h/2+9);}
  texture.needsUpdate=true;lastPaint=now;
 }
 function update(now,frame){
  clearXRInput();if(!session||!frame)return;frames++;const ref=renderer.xr.getReferenceSpace();if(!ref)return;
  const viewer=frame.getViewerPose(ref);if(!viewer||session.visibilityState!=='visible'){resetInputs();pause();return;}
  if(!aligned){stage.position.copy(viewer.transform.position);orientation.copy(viewer.transform.orientation);const look=new T.Vector3(0,0,-1).applyQuaternion(orientation);stage.rotation.set(0,Math.atan2(-look.x,-look.z),0);aligned=true;}
  let r=root();if(r!==rootBefore){rootBefore=r;page=0;resetInputs();lastPaint=-Infinity;}
  if(now-lastPaint>80)paint(now,r);stage.updateMatrixWorld(true);tracked=0;let hands=false,consumed=false;
  for(const [i,slot]of slots.entries()){
   const source=session.inputSources[i];slot.grip.visible=slot.ray.visible=false;slot.joints.forEach(j=>j.visible=false);
   if(source!==slot.source){slot.source=source;slot.previous=[];slot.pinch=false;slot.ready=false;}if(!source)continue;
   const pose=frame.getPose(source.targetRaySpace,ref);if(!pose){slot.ready=false;slot.pinch=false;continue;}tracked++;
   matrix.fromArray(pose.transform.matrix);slot.ray.position.setFromMatrixPosition(matrix);slot.ray.quaternion.setFromRotationMatrix(matrix);slot.ray.visible=true;
   const gp=source.gripSpace&&frame.getPose(source.gripSpace,ref);if(gp){matrix.fromArray(gp.transform.matrix);slot.grip.position.setFromMatrixPosition(matrix);slot.grip.quaternion.setFromRotationMatrix(matrix);slot.grip.visible=!source.hand;}
   let pressed=false,handValid=true;
   if(source.hand){hands=true;let j=0;for(const space of source.hand.values()){const jp=frame.getJointPose(space,ref),mesh=slot.joints[j++];if(mesh&&jp){mesh.position.copy(jp.transform.position);mesh.visible=true;}}
    const thumb=source.hand.get('thumb-tip'),index=source.hand.get('index-finger-tip'),a=thumb&&frame.getJointPose(thumb,ref),b=index&&frame.getJointPose(index,ref);handValid=!!a&&!!b;pressed=handValid&&pinchPressed(new T.Vector3().copy(a.transform.position).distanceTo(b.transform.position),slot.pinch);slot.pinch=pressed;if(!handValid){tracked--;slot.ready=false;continue;}
   }else pressed=buttonPressed(source.gamepad,0);
   const held=Array.from({length:6},(_,j)=>buttonPressed(source.gamepad,j));if(source.hand)held[0]=pressed;
   const axes=xrAxes(source.gamepad),neutral=!held.some(Boolean)&&!pressed&&Math.abs(axes.x)<.15&&Math.abs(axes.y)<.15;
   if(neutral)slot.ready=true;const edge=j=>slot.ready&&held[j]&&!slot.previous[j];
   caster.set(slot.ray.position,new T.Vector3(0,0,-1).applyQuaternion(slot.ray.quaternion));const hit=caster.intersectObject(panel)[0],cx=hit?.uv.x*1024,cy=(1-(hit?.uv.y||0))*1024,row=hit&&rows.find(b=>cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h);
   if(slot.ready&&row&&pressed&&!consumed){if(row.hold&&!r){if(row.hold==='forward')xrInput.y=1;if(row.hold==='brake')xrInput.brake=true;if(row.hold==='left')xrInput.lookX=-.7;if(row.hold==='right')xrInput.lookX=.7;}else if(edge(0)){row.act?.((cx-row.x)/row.w);selections++;lastPaint=-Infinity;consumed=true;}}
   if(slot.ready&&!source.hand&&!r&&!consumed){
    if(source.handedness==='left'){xrInput.x=axes.x;xrInput.y=axes.y;xrInput.boost=held[0]&&!row;xrInput.brake=held[1];if(edge(4)){emit('pause');consumed=true;}else if(edge(5)){emit('jobs');consumed=true;}}
    else{xrInput.lookX=axes.x;xrInput.lookY=-axes.y;if(edge(0)&&!row)emit('interact');else if(edge(1))emit('throw');else if(edge(4))emit('hop');else if(edge(5))emit('ride');}
   }
   slot.previous=held;
  }
  if(hands&&!xrInput.y)xrInput.brake=true;
  if(!tracked){clearXRInput();if(!lossPaused){pause();lossPaused=true;}}else lossPaused=false;
  if(root()!==r||!playing())clearXRInput();
 }
 function flatRender(draw){if(!session)return draw();const enabled=renderer.xr.enabled,previous=renderer.getRenderTarget(),aspect=view.camera.aspect;try{renderer.xr.enabled=false;renderer.setRenderTarget(target);view.camera.aspect=1280/720;view.camera.updateProjectionMatrix();draw();}finally{view.camera.aspect=aspect;view.camera.updateProjectionMatrix();renderer.setRenderTarget(previous);renderer.xr.enabled=enabled;}}
 function present(){if(!session)return;renderer.render(world,camera);}
 window.addEventListener('pagehide',()=>session?.end());
 return {update,flatRender,present,get active(){return !!session;},inspect:()=>({presentation:'comfort-theater',stereoGameWorld:false,active:!!session,frames,selections,trackedSources:tracked,jointPool:50,renderTarget:[1280,720],page,lastSessionError,input:{...xrInput}})};
}
