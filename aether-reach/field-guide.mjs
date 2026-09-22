/* Live floor map and interaction feedback in the same XR canvas. The floor
 * stage is never camera-parented, never world-scrolled, never a hit blocker.
 * Simulation is read-only; real game events provide the notices and history. */
import * as T from './vendor/three.module.js';
import {DISTRICTS,BRIDGES,RAILS,presentationSolids} from './model.mjs';
import {fieldGuidance,localMapPoint,noticeAlpha,readingPages,createNoticePresentation} from './field-guide-core.mjs';
export function drawLiveMap(c,s,goal){
 const x=26,y=50,w=432,h=420,cx=x+w/2,cy=y+h/2,range=45,k=w/(2*range);
 const X=n=>cx+(n-s.p.x)*k,Z=n=>cy+(n-s.p.z)*k;
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#102e39';c.fillRect(x,y,w,h);
 for(const d of DISTRICTS){c.fillStyle='#385f61';c.fillRect(X(d.x-d.w/2),Z(d.z-d.d/2),d.w*k,d.d*k);}
 c.strokeStyle='#efdfb6';c.lineWidth=6;
 for(const b of BRIDGES){c.beginPath();c.moveTo(X(b.a[0]),Z(b.a[2]));c.lineTo(X(b.b[0]),Z(b.b[2]));c.stroke();}
 c.fillStyle='#172f35';
 for(const b of presentationSolids(s)){if(![b.x1,b.x2,b.z1,b.z2,b.y1,b.y2].every(Number.isFinite)||b.y2<s.p.y+.2||b.y1>s.p.y+1.5)continue;c.fillRect(X(b.x1),Z(b.z1),(b.x2-b.x1)*k,(b.z2-b.z1)*k);}
 c.strokeStyle='#71bdbb';c.lineWidth=2;c.setLineDash([5,5]);for(const r of RAILS){c.beginPath();r.pts.forEach((p,i)=>i?c.lineTo(X(p.x),Z(p.z)):c.moveTo(X(p.x),Z(p.z)));c.stroke();}c.setLineDash([]);
 let marker=null;if(goal){marker=localMapPoint(s.p,goal);const gx=cx+marker.x*w/2,gz=cy+marker.z*h/2;c.strokeStyle='#ffe29b';c.lineWidth=3;c.setLineDash([6,7]);c.beginPath();c.moveTo(cx,cy);c.lineTo(gx,gz);c.stroke();c.setLineDash([]);c.save();c.translate(gx,gz);c.rotate(Math.PI/4);c.fillStyle='#ffdf84';c.fillRect(-9,-9,18,18);c.restore();}
 c.save();c.translate(cx,cy);c.rotate(s.p.yaw);c.fillStyle='#ff9475';c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();c.moveTo(0,-16);c.lineTo(10,12);c.lineTo(0,7);c.lineTo(-10,12);c.closePath();c.fill();c.stroke();c.restore();c.restore();
 c.strokeStyle='#aac8ba';c.lineWidth=2;c.strokeRect(x,y,w,h);c.textAlign='left';c.fillStyle='#edf7dc';c.font='bold 24px sans-serif';c.fillText('N',x+12,y+29);c.font='19px sans-serif';c.fillText('YOU = arrow / GOAL = gold',x,y+h+27);return marker;
}
function lines(c,text,x,y,width,max=6,line=32){
 const words=String(text||'').split(/\s+/);let row='',n=0;
 for(let i=0;i<words.length;i++){const word=words[i];if(row&&c.measureText(row+' '+word).width>width){c.fillText(row,x,y);y+=line;if(++n>=max-1){let tail=words.slice(i).join(' ');while(c.measureText(tail).width>width&&tail.length)tail=tail.slice(0,-1);c.fillText(tail+(i<words.length-1?'...':''),x,y);return;}row='';}row+=(row?' ':'')+word;}if(row)c.fillText(row,x,y);
}
export function createFieldGuide({rig,api}){
 const root=new T.Group();root.name='Live floor guide / physical room';root.userData.xrUI=true;root.visible=false;rig.add(root);
 function surface(name,width,height){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=height;const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearFilter;tex.generateMipmaps=false;const mesh=new T.Mesh(new T.PlaneGeometry(width,width*height/1024),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false}));mesh.rotation.x=-Math.PI/2;mesh.name=name;mesh.userData.xrUI=true;mesh.renderOrder=1003;root.add(mesh);return {mesh,canvas,tex,c:canvas.getContext('2d')};}
 const map=surface('Live floor map and next action',1.28,560),notice=surface('Two-second floor message',1.28,192);notice.mesh.position.z=.5;
 const noticeView=createNoticePresentation();
 let anchor=null,lastHead=null,lastPaint=-Infinity,lastNotice=-1,mapPaints=0,info=null,marker=null,alpha=0,noticeAge=null,source=null;
 function recall(head=lastHead){if(!head)return;const yaw=Math.atan2(head.forward?.x||0,-(head.forward?.z??-1));anchor={x:head.x+Math.sin(yaw)*.82,z:head.z-Math.cos(yaw)*.82,yaw:-yaw};root.position.set(anchor.x,.06,anchor.z);root.rotation.set(0,anchor.yaw,0);lastPaint=-Infinity;}
 const dialog=document.createElement('dialog');dialog.id='field-guide-dialog';dialog.setAttribute('aria-labelledby','field-guide-title');dialog.innerHTML='<p class="eyebrow">LIVE MAP / NEXT STEP / MESSAGE HISTORY</p><h2 id="field-guide-title">What do I do next?</h2><p id="field-guide-copy"></p><form method="dialog"><button id="field-guide-back" data-initial-focus>Back</button></form><button id="field-guide-next-step">Show current next step</button><button id="field-guide-older">Older message</button><button id="field-guide-newer">Newer message</button><button id="field-guide-prev-page">Previous text page</button><button id="field-guide-next-page">Next text page</button><button id="field-guide-size">Menu and floor-map size</button><button id="field-guide-window">Diorama size and height</button><button id="field-guide-recall">Recall floor guide here</button>';
 document.body.append(dialog);const $=id=>document.getElementById(id);let entries=[],entry=-1,page=0;
 function fill(){const d=api.guide?.()||{},g=fieldGuidance(api.state(),d.near,api.useLabel?.()||'Right grip');const text=entry<0?(g.goal?'NEXT: '+g.goal.name+'. ':'')+g.step+' '+g.interaction:entries[entry]?.text||'No messages yet.';const pages=readingPages(text);page=Math.max(0,Math.min(page,pages.length-1));$('field-guide-copy').textContent=(entry<0?'Next step. ':'Message '+(entry+1)+' of '+entries.length+'. ')+pages[page]+' (Text page '+(page+1)+' of '+pages.length+').';$('field-guide-prev-page').disabled=page===0;$('field-guide-next-page').disabled=page>=pages.length-1;$('field-guide-older').disabled=!entries.length||entry===0;$('field-guide-newer').disabled=!entries.length||entry===entries.length-1;}
 function open(){entries=api.guide?.()?.history||[];entry=-1;page=0;fill();api.show('field-guide-dialog');}
 $('field-guide-next-step').onclick=()=>{entry=-1;page=0;fill();};$('field-guide-older').onclick=()=>{entry=entry<0?entries.length-1:Math.max(0,entry-1);page=0;fill();};$('field-guide-newer').onclick=()=>{entry=Math.min(entries.length-1,entry+1);page=0;fill();};$('field-guide-prev-page').onclick=()=>{page--;fill();};$('field-guide-next-page').onclick=()=>{page++;fill();};$('field-guide-size').onclick=()=>api.show('workspace-dialog');$('field-guide-window').onclick=()=>api.show('presentation-dialog');$('field-guide-recall').onclick=()=>recall();
 for(const [target,id]of [['#pause-dialog','pause-field-guide'],['.start-actions','start-field-guide']]){const parent=document.querySelector(target);if(!parent)continue;const b=document.createElement('button');b.id=id;b.textContent='What do I do? / map and messages';b.onclick=open;parent.append(b);}
 function update({enabled,head,config,now}){
  if(!enabled){root.visible=false;return;}lastHead=head||lastHead;if(!anchor)recall(head);root.visible=!!anchor;if(!anchor)return;
  root.position.y=config.floorHeight;root.scale.setScalar(config.mapScale);map.mesh.visible=config.map;
  const data=api.guide?.()||{};source=noticeView.read(data.notice,now);info=fieldGuidance(api.state(),data.near,api.useLabel?.()||'Right grip');
  alpha=noticeAlpha(source,now);noticeAge=source?Math.max(0,now-source.started):null;notice.mesh.visible=alpha>0;notice.mesh.material.opacity=alpha;
  if(source?.id!==lastNotice){lastNotice=source?.id;const c=notice.c;c.clearRect(0,0,1024,192);if(source){c.fillStyle='#102e39ee';c.fillRect(0,0,1024,192);c.fillStyle='#ffe29b';c.font='bold 26px sans-serif';c.fillText('MESSAGE / saved in What do I do? > Older message',24,33);c.fillStyle='#fff1ce';c.font='32px sans-serif';lines(c,source.text,24,78,976,3,38);}notice.tex.needsUpdate=true;}
  if(now-lastPaint>=200){lastPaint=now;const s=api.state(),c=map.c;c.clearRect(0,0,1024,560);c.fillStyle='#10252eea';c.fillRect(0,0,1024,560);c.fillStyle='#e8ddaa';c.font='bold 27px sans-serif';c.fillText('LIVE MAP / LOOK DOWN',26,33);marker=drawLiveMap(c,s,info.goal);c.fillStyle='#ffe29b';c.font='bold 26px sans-serif';lines(c,info.goal?'NEXT: '+info.goal.name:'NEXT: Explore the city',490,39,506,2,31);c.font='22px sans-serif';c.fillStyle='#d3ebe5';c.fillText(info.goal?info.goal.distance+' m / '+info.goal.level:'',490,113);c.font='27px sans-serif';c.fillStyle='#fff5d7';lines(c,info.step,490,154,506,6,32);c.fillStyle=info.canInteract?'#ffe08e':'#b6ceca';c.font='bold 25px sans-serif';lines(c,info.interaction,490,372,506,3,29);c.fillStyle='#d3ebe5';c.font='19px sans-serif';c.fillText('Dashed gold = bearing, not a clear route.',490,478);c.fillText('Y / Menu: help, messages and size controls',490,502);if(config.hud!=='hidden'){c.fillStyle='#fff0c6';c.font='bold 25px sans-serif';c.fillText('HP '+Math.ceil(s.p.health)+' / Shield '+Math.ceil(s.p.shield)+' / Ammo '+s.p.ammo,26,544);}map.tex.needsUpdate=true;mapPaints++;}
  root.updateWorldMatrix(true,true);
 }
 return {update,recall,open,reset(){anchor=null;root.visible=false;lastPaint=-Infinity;alpha=0;},suspend(){root.visible=false;},stats:()=>({visible:root.visible,liveMap:root.visible&&map.mesh.visible,roomAnchored:true,headLocked:false,interactive:false,anchor:anchor?{...anchor,y:root.position.y}:null,mapScale:root.scale.x,mapPaints,player:info?{x:api.state().p.x,z:api.state().p.z,yaw:api.state().p.yaw}:null,goal:info?.goal||null,nextStep:info?.step||'',interaction:info?.interaction||'',interactionId:info?.interactionId||null,notice:source?.text||'',noticeId:source?.id||null,noticeAlpha:root.visible?alpha:0,noticeAge,historyCount:api.guide?.()?.history?.length||0,goalMarker:marker})};
}
