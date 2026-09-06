/* Two physical rail faces with swept contact, directional momentum, and bounded
 * near-miss assistance. No world-space target teleporting or automatic route wins. */
(function(root){'use strict';
 const K=root.GrappleCore;if(!K)throw Error('GrappleCore must load before RailGripCore');
 function create(){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 let mode='forgiving',solid=()=>false;
 const history=[];
 function configure(options={}){if(options.mode!==undefined){if(!['forgiving','precision'].includes(options.mode))throw Error('Unknown grip mode');mode=options.mode;}if(options.solid)solid=options.solid;}
 const depth=t=>Number.isFinite(t.sky?.roadDepth)?clamp(t.sky.roadDepth,0,80):t.sky?.network?34:18;
 const side=p=>p._railFace===-1?-1:1;
 function pose(p,t,s){const q=K.sample(t,s),face=side(p),off=face>0?K.OFFSET:-(K.OFFSET+depth(t));
  p.x=q.x+q.nx*off-p.w/2;p.y=q.y+q.ny*off-p.h/2;p._bside={bx:q.nx*face,by:q.ny*face};p.drawA=Math.atan2(q.nx*face,-q.ny*face);
  p.footX=q.x-(face<0?q.nx*depth(t):0);p.footY=q.y-(face<0?q.ny*depth(t):0);p.vx=q.tx*p.speed;p.vy=q.ty*p.speed;p.onGround=true;return {...q,nx:q.nx*face,ny:q.ny*face};
 }
 function detach(p,q,type){p.vx=q.tx*p.speed;p.vy=q.ty*p.speed;if(type==='jump'){p.vx+=q.nx*5;p.vy+=q.ny*5;}const t=p.track;p.track=null;p._bside=null;p.trackCD=6;p.onGround=false;p.jumping=false;p._railAir=true;p._railFace=1;p._gripSlow=0;return {type,track:t,exit:type==='lip'?(p.speed<0?-1:1):0};}
 function ride(p,input){const t=p.track;if(!t)return null;const q=K.sample(t,p.trackS),boost=p.nitroT>0;
  const cap=boost?28:Math.max(19,Math.abs(p.speed)*.997);
  p.speed=clamp((p.speed+K.G*q.ty*.5+(input.right?.42:0)-(input.left?.65:0))*.999,-Math.max(16,cap),cap);
  p.trackS+=p.speed;p.roll=(p.roll||0)+p.speed/11;const at=pose(p,t,clamp(p.trackS,0,t.len));
  if(p.trackS>=t.len||p.trackS<=0&&p.speed<0)return detach(p,at,'lip');
  if(input.jump)return detach(p,at,'jump');
  if(at.ny>.3&&!boost&&Math.abs(p.speed)<3.4){p._gripSlow=(p._gripSlow||0)+1;if(p._gripSlow>=12)return detach(p,at,'slow-release');}else p._gripSlow=0;
  return null;
 }
 function blocked(a,b){/* Keep rider-clearance samples on its actual near-contact path. */const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6));for(let j=1;j<=n;j++){const t=j/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;for(const [dx,dy]of[[0,0],[-9,-9],[9,-9],[-9,9],[9,9]])if(solid(x+dx,y+dy))return true;}return false;}
 function catchRail(p,old,rails,blockedId=null){if(p.trackCD>0||p.peg||p.dead>0)return null;
  const from={x:old.x+p.w/2,y:old.y+p.h/2},to={x:p.x+p.w/2,y:p.y+p.h/2},speed=Math.hypot(p.vx,p.vy),margin=mode==='precision'?0:Math.min(9,1.2+speed*.22);let hit=null;
  for(const tr of rails){if(tr.sky?.kind!=='open'&&!tr.custom)continue;if(tr.sky?.id===blockedId&&(p._airTicks||0)<10)continue;
   for(let i=1;i<tr.pts.length;i++){const a=tr.pts[i-1],b=tr.pts[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.0001)continue;const tx=dx/len,ty=dy/len,nx=ty,ny=-tx,tangent=p.vx*tx+p.vy*ty;
    for(const face of [1,-1]){const ex=nx*face,ey=ny*face,offset=face>0?K.OFFSET:-(K.OFFSET+depth(tr)),ax=a[0]+nx*offset,ay=a[1]+ny*offset;
     if(p.vx*ex+p.vy*ey>=-.01)continue;
     if(ey>.3&&Math.abs(tangent)<3.4&&!p.nitroT)continue;
     const d0=(from.x-ax)*ex+(from.y-ay)*ey,d1=(to.x-ax)*ex+(to.y-ay)*ey;
     // Never catch the opposite face after crossing through the solid deck.
     if(d0<-.05||d1>margin)continue;
     let time=d1<=0?d0/(d0-d1||1):1;if(time<0||time>1)continue;
     const x=from.x+(to.x-from.x)*time,y=from.y+(to.y-from.y)*time,u=((x-ax)*tx+(y-ay)*ty)/len;
     if(u<0||u>1)continue;
     const cx=ax+dx*u,cy=ay+dy*u,assist=Math.hypot(x-cx,y-cy);
     if(assist>margin+.001&&d1>0)continue;
     if(blocked(from,{x:cx,y:cy}))continue;
     const candidate={tr,s:tr.cum[i-1]+u*len,tx,ty,face,time,assist,contact:{x:cx,y:cy},offset};
     if(!hit||time<hit.time-.0001||Math.abs(time-hit.time)<.0001&&assist<hit.assist)hit=candidate;
    }
   }
  }
  if(!hit)return null;const before={x:p.x,y:p.y,vx:p.vx,vy:p.vy};p.speed=p.vx*hit.tx+p.vy*hit.ty;p.track=hit.tr;p.trackS=hit.s;p._railFace=hit.face;p._gripSlow=0;p._railAir=false;pose(p,hit.tr,hit.s);
  const event={id:hit.tr.sky?.id||'native',face:hit.face,side:hit.face>0?'top':'underside',speed:p.speed,assist:hit.assist,mode,x:p.x,y:p.y};history.push(event);if(history.length>400)history.shift();return {...hit,before};
 }
 const physics=Object.freeze({...K,pose,ride,catchRail});
 const grip=Object.freeze({configure,depth,pose,ride,catchRail,history,create,get mode(){return mode}});
 return {physics,grip};
 }
 const live=create();root.GrappleCore=live.physics;root.RailGripCore=live.grip;
 if(typeof module!=='undefined')module.exports=root.RailGripCore;
})(globalThis);
