/* Room-space floor feedback. No scene camera ownership or gameplay state writes. */
import * as T from './vendor/three.module.js';
import {wrapConsoleText} from './console-hud.mjs';
export const MESSAGE_DURATION_MS=2000;
export const MESSAGE_FADE_MS=400;
export function createMessageFeed(){
 let previous=null,current=null,serial=0;const history=[];
 function post(text,now){
  text=String(text??'').trim();if(!text||!Number.isFinite(now))return false;
  current={text,start:now,expires:now+MESSAGE_DURATION_MS,id:++serial};
  history.unshift({text,id:serial});if(history.length>12)history.length=12;return true;
 }
 return {post,
  observe(sample,now){
   const next={scope:String(sample?.scope||''),text:String(sample?.text||'').trim(),remaining:Number(sample?.remaining)||0,revision:sample?.revision??0};
   const event=next.text&&next.remaining>0&&(!previous||next.scope!==previous.scope||next.text!==previous.text||next.revision!==previous.revision||next.remaining>previous.remaining+.01);
   previous=next;if(event)post(next.text,now);return !!event;
  },
  inspect(now){const age=current?Math.max(0,now-current.start):Infinity;return {text:current?.text||'',id:current?.id||0,age,expiresAt:current?.expires||0,opacity:age>=MESSAGE_DURATION_MS?0:Math.min(1,(MESSAGE_DURATION_MS-age)/MESSAGE_FADE_MS)};},
  history:()=>history.map(e=>({...e})),
  end(){previous=null;current=null;}
 };
}
export function floorFeedbackMatrix(anchor,{x=0,z=-1.5,size=1}={}){
 const pos=new T.Vector3(x,.09,z).applyAxisAngle(new T.Vector3(0,1,0),anchor.yaw);pos.add(new T.Vector3(anchor.x,anchor.y,anchor.z));
 return new T.Matrix4().compose(pos,new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2+.12,anchor.yaw,0,'YXZ')),new T.Vector3(size,size,size));
}
function lines(ctx,text,x,y,width,font,height,count){
 ctx.font=font;const out=wrapConsoleText(text,s=>ctx.measureText(s).width,width,count);
 out.forEach((line,i)=>ctx.fillText(line,x,y+i*height,width));return out;
}
export function drawFloorMap(ctx,data){
 ctx.fillStyle='#112c36';ctx.fillRect(0,0,768,768);ctx.fillStyle='#f9d887';
 lines(ctx,'LIVE MAP / '+(data.title||'NEIGHBORHOOD'),24,42,720,'bold 29px sans-serif',32,1);
 ctx.fillStyle='#ffffff';lines(ctx,data.goal||'Choose a mission',24,82,720,'27px sans-serif',32,3);
 ctx.fillStyle='#bfe8e4';lines(ctx,data.detail||'Your position and current objective update as you move.',24,184,720,'21px sans-serif',25,2);
 const map=data.map;let hasMap=false;
 if(map&&map.width>0&&map.height>0){const fit=Math.min(720/map.width,508/map.height),w=map.width*fit,h=map.height*fit;ctx.drawImage(map,24+(720-w)/2,236+(508-h)/2,w,h);hasMap=true;}
 else lines(ctx,'Map unavailable. Open Missions to choose a destination.',24,310,720,'30px sans-serif',38,3);
 return {hasMap,goal:String(data.goal||'')};
}
export function drawFloorMessage(ctx,text){
 ctx.fillStyle='#132e38';ctx.fillRect(0,0,1280,320);ctx.fillStyle='#f8d584';
 ctx.font='bold 28px sans-serif';ctx.fillText('INTERACTION / Recent messages in Menu',28,40,1224);
 ctx.fillStyle='#ffffff';return lines(ctx,text,28,99,1224,'38px sans-serif',46,4);
}
export function createFloorFeedback(ui,hooks){
 const feed=createMessageFeed();let mapUpdated=-Infinity,mapDraws=0,lastTextId=0,now=0,mapInfo={hasMap:false,goal:''};
 const make=(name,w,h,mw,mh,order)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const context=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(mw,mh),new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide}));mesh.name=name;mesh.renderOrder=order;mesh.matrixAutoUpdate=false;mesh.visible=false;ui.add(mesh);return {mesh,context,texture};};
 const map=make('Persistent live floor map',768,768,.8,.8,10006),notice=make('Two second floor interaction caption',1280,320,1.35,.3375,10007);
 return {
  step({anchor,open,time,prefs}){
   now=time;feed.observe(hooks.feedback?.(),now);const event=feed.inspect(now);
   notice.mesh.visible=!open&&event.opacity>0;notice.mesh.material.opacity=event.opacity;
   notice.mesh.matrix.copy(floorFeedbackMatrix(anchor,{z:-Math.max(1.55,.91+.4*prefs.mapSize)}));notice.mesh.matrixWorldNeedsUpdate=true;
   if(event.id!==lastTextId){drawFloorMessage(notice.context,event.text);notice.texture.needsUpdate=true;lastTextId=event.id;}
   map.mesh.visible=!open&&prefs.floorMap;
   map.mesh.matrix.copy(floorFeedbackMatrix(anchor,{x:-.28-.4*prefs.mapSize,z:-.66,size:prefs.mapSize}));map.mesh.matrixWorldNeedsUpdate=true;
   if(map.mesh.visible&&now-mapUpdated>=200){mapInfo=drawFloorMap(map.context,hooks.hud?.()||{});map.texture.needsUpdate=true;mapUpdated=now;mapDraws++;}
  },
  history:feed.history,
  end(){feed.end();map.mesh.visible=notice.mesh.visible=false;mapUpdated=-Infinity;lastTextId=0;},
  inspect:()=>({mapVisible:map.mesh.visible,mapReady:mapInfo.hasMap,mapGoal:mapInfo.goal,mapDraws,mapMatrix:map.mesh.matrix.toArray(),messageVisible:notice.mesh.visible,messageOpacity:notice.mesh.material.opacity,messageText:feed.inspect(now).text,messageExpiresAt:feed.inspect(now).expiresAt,messageMatrix:notice.mesh.matrix.toArray(),durationMS:MESSAGE_DURATION_MS,headAttached:false})
 };
}
