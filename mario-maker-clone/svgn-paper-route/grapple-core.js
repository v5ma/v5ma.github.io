/* Shared deterministic movement for open rails and the courier's whip.
 * Units: world pixels / 60 Hz tick. No rendering, DOM, or remote services. */
(function(root){
 'use strict';
 const G=.48, OFFSET=24, REACH=240, MIN_ROPE=36;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function rail(points,tag={}){const cum=[0];for(let i=1;i<points.length;i++)cum.push(cum[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));return {pts:points,cum,len:cum.at(-1),sky:tag};}
 function sample(t,s){s=clamp(s,0,t.len);let i=1;while(i<t.cum.length-1&&t.cum[i]<s)i++;const a=t.pts[i-1],b=t.pts[i],len=t.cum[i]-t.cum[i-1]||1,f=(s-t.cum[i-1])/len,tx=(b[0]-a[0])/len,ty=(b[1]-a[1])/len;return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,tx,ty,nx:ty,ny:-tx};}
 function pose(p,t,s){const q=sample(t,s);p.x=q.x+q.nx*OFFSET-p.w/2;p.y=q.y+q.ny*OFFSET-p.h/2;p._bside={bx:q.nx,by:q.ny};p.drawA=Math.atan2(q.nx,-q.ny);p.footX=q.x;p.footY=q.y;p.vx=q.tx*p.speed;p.vy=q.ty*p.speed;p.onGround=true;return q;}
 function ride(p,input){const t=p.track,q=sample(t,p.trackS);p.speed=clamp((p.speed+G*q.ty*.5+(input.right?.42:0)-(input.left?.65:0))*.999,-16,19);p.trackS+=p.speed;p.roll=(p.roll||0)+p.speed/11;
  const exit=p.trackS>=t.len?1:p.trackS<=0&&p.speed<0?-1:0;const at=pose(p,t,clamp(p.trackS,0,t.len));
  if(exit||input.jump){p.vx=at.tx*p.speed+(input.jump?at.nx*5:0);p.vy=at.ty*p.speed+(input.jump?at.ny*5:0);p.track=null;p._bside=null;p.trackCD=6;p.onGround=false;p.jumping=false;return {type:exit?'lip':'jump',track:t,exit};}
  return null;
 }
 function sweep(ax,ay,bx,by,cx,cy,dx,dy){const ux=bx-ax,uy=by-ay,vx=dx-cx,vy=dy-cy,det=ux*vy-uy*vx;
  if(Math.abs(det)<1e-8)return null;const t=((cx-ax)*vy-(cy-ay)*vx)/det,u=((cx-ax)*uy-(cy-ay)*ux)/det;
  return t>=0&&t<=1&&u>=0&&u<=1?{t,u}:null;
 }
 function catchRail(p,old,rails,blockedId=null){if(p.trackCD>0)return null;let hit=null;
  for(const tr of rails){if(tr.sky?.kind!=='open')continue;if(tr.sky.id===blockedId&&p._airTicks<10)continue;
   for(let i=1;i<tr.pts.length;i++){const a=tr.pts[i-1],b=tr.pts[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,tx=dx/len,ty=dy/len,nx=ty,ny=-tx;
    if(p.vx*nx+p.vy*ny>=-.01)continue;
    const h=sweep(old.x+p.w/2,old.y+p.h/2,p.x+p.w/2,p.y+p.h/2,a[0]+nx*OFFSET,a[1]+ny*OFFSET,b[0]+nx*OFFSET,b[1]+ny*OFFSET);
    if(h&&(!hit||h.t<hit.t))hit={...h,tr,s:tr.cum[i-1]+h.u*len,tx,ty};
   }
  }
  if(!hit)return null;const before={x:p.x,y:p.y,vx:p.vx,vy:p.vy};p.speed=p.vx*hit.tx+p.vy*hit.ty;p.track=hit.tr;p.trackS=hit.s;pose(p,hit.tr,hit.s);return {...hit,before};
 }
 function flight(p,input,move){p.vx=(p.vx+(input.right?.06:0)-(input.left?.12:0))*.9995;p.vy=Math.min(26,p.vy+G);p.onGround=false;p.drawA=Math.atan2(p.vy,Math.abs(p.vx)||1)*.3;p.roll=(p.roll||0)+p.vx/11;
  if(move)move(p);else {p.x+=p.vx;p.y+=p.vy;}
 }
 function lineClear(a,b,solid=()=>false){const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/8));for(let i=1;i<=n;i++)if(solid(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;}
 function target(p,pegs,solid){const c={x:p.x+p.w/2,y:p.y+p.h/2};let best=null;
  for(const peg of pegs){const d=Math.hypot(peg.x-c.x,peg.y-c.y);if(d<MIN_ROPE||d>REACH||!lineClear(c,peg,solid))continue;
   const score=d+(peg.y>c.y?70:0);if(!best||score<best.score)best={...peg,d,score};
  }return best;
 }
 function cast(p,peg){if(!peg)return false;const dx=p.x+p.w/2-peg.x,dy=p.y+p.h/2-peg.y,r=Math.hypot(dx,dy);if(r<MIN_ROPE||r>REACH)return false;const th=Math.atan2(dx,dy),om=(p.vx*Math.cos(th)-p.vy*Math.sin(th))/r;
  p.peg={id:peg.id,x:peg.x,y:peg.y,r,th,om,start:th,loops:0,acc:0};p.track=null;p.onGround=false;p._bside=null;p.trackCD=6;return true;
 }
 function release(p){const a=p.peg;if(!a)return null;const boost=1+Math.min(.25,a.loops*.08),speed=clamp(a.om*a.r*boost,-26,26);p.vx=speed*Math.cos(a.th);p.vy=-speed*Math.sin(a.th);p.peg=null;p.onGround=false;p.jumping=false;p.trackCD=6;p._airTicks=0;return {id:a.id,r:a.r,th:a.th,loops:a.loops,speed:Math.abs(speed),vx:p.vx,vy:p.vy};}
 function swing(p,input,solid=()=>false){const a=p.peg;if(!a)return null;const old={x:p.x+p.w/2,y:p.y+p.h/2};
  if(input.up||input.down){const r=clamp(a.r+(input.up?-1.2:1.2),48,REACH);a.om*=a.r*a.r/(r*r);a.r=r;}
  a.om+=-G/a.r*Math.sin(a.th)+(input.right?.0032:0)-(input.left?.0032:0);a.om=clamp(a.om*.9988,-26/a.r,26/a.r);a.th+=a.om;a.acc=Math.abs(a.th-a.start);a.loops=Math.floor(a.acc/(2*Math.PI));
  const next={x:a.x+Math.sin(a.th)*a.r,y:a.y+Math.cos(a.th)*a.r};
  if(!lineClear(old,next,(x,y)=>solid(x,y)||solid(x-10,y+8)||solid(x+10,y+8))){release(p);p.vx*=-.25;p.vy*=-.25;return {type:'blocked'};}
  p.x=next.x-p.w/2;p.y=next.y-p.h/2;p.vx=Math.cos(a.th)*a.om*a.r;p.vy=-Math.sin(a.th)*a.om*a.r;p.onGround=false;p.drawA=-a.th;p.dir=p.vx<0?-1:1;return null;
 }
 const api={G,OFFSET,REACH,MIN_ROPE,rail,sample,pose,ride,sweep,catchRail,flight,lineClear,target,cast,release,swing};root.GrappleCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
