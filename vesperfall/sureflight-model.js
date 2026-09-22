/* Sureflight: impact-local recovery and structural rail support. Metres/seconds.
 * No route shortcuts through walls, no arbitrary range limit, no save geometry.
 * The same solver is used by actual Blink impact and optional preview. */
(function(root){'use strict';
 const R=.28,PERCH=new Set(['balustrade','rail','railing','parapet','cover']);
 const perchCache=new WeakMap(),bottomCache=new WeakMap();
 const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function canPerch(b){return PERCH.has(b.type)&&finite(b.min)&&finite(b.max)&&b.max[0]-b.min[0]>=.08&&b.max[2]-b.min[2]>=.08;}
 function perchAt(w,p,rise=.42,drop=Infinity){
  let cache=perchCache.get(w);if(!cache||cache.source!==w.solids||cache.count!==w.solids.length){cache={source:w.solids,count:w.solids.length,boxes:w.solids.filter(canPerch)};perchCache.set(w,cache);}
  let best=null;for(const b of cache.boxes){if(p[0]<b.min[0]+.02||p[0]>b.max[0]-.02||p[2]<b.min[2]+.02||p[2]>b.max[2]-.02)continue;
   const y=b.max[1];if(y>p[1]+rise+1e-5||y<p[1]-drop-1e-5)continue;if(!best||y>best.y)best={y,solid:b};
  }return best;
 }
 function bottom(w){const cached=bottomCache.get(w);if(cached&&cached.source===w.floors&&cached.count===w.floors.length)return cached.value;let y=0;for(const f of w.floors){const edge=Math.abs(f.slopeZ||0)*f.d/2+Math.abs(f.slopeX||0)*f.w/2;const center=f.y+(f.slopeZ||0)*(f.z-(f.anchorZ??f.z))+(f.slopeX||0)*(f.x-(f.anchorX??f.x));y=Math.min(y,center-edge);}bottomCache.set(w,{source:w.floors,count:w.floors.length,value:y-8});return y-8;}
 function duration(w,p,v){const low=bottom(w);return Math.max(.1,(v[1]+Math.sqrt(v[1]*v[1]+19.6*Math.max(0,p[1]-low)))/9.8+.5);}
 function normal(hit,v){const b=hit.box,n=[0,0,0];let best=Infinity;
  for(let k=0;k<3;k++)for(const side of[-1,1]){if(v[k]*side>=0)continue;const d=Math.abs(hit.p[k]-(side<0?b.min[k]-.02:b.max[k]+.02));if(d<best){best=d;n.fill(0);n[k]=side;}}
  return n;
 }
 function resolve(s,hit,v,a){
  if(!hit||!finite(hit.p)||!finite(v))return {ok:false,reason:'invalid impact'};
  const w=s.world,p=hit.p,up=q=>[q[0],q[1]+1.65,q[2]];
  const clear=(from,to,except=null)=>!w.solids.some(b=>b!==except&&a.boxHit(from,to,b,.015)!==null);
  function accept(q,reason){const c=a.landing(s,q);return c.ok?{...c,reason}:null;}
  if(hit.kind==='floor'){
   const exact=accept(p,'clear floor');if(exact)return exact;
   // Nudge only to the nearby same-height surface. Never the far side of stone.
   for(const d of[.16,.32,.5,.72,.95])for(let i=0;i<16;i++){
    const t=i*Math.PI/8,q=[p[0]+Math.cos(t)*d,p[1],p[2]+Math.sin(t)*d],y=a.floorAt(w,q,0,.42,.5);
    if(y===null||Math.abs(y-p[1])>.5)continue;q[1]=y;
    if(!clear(up(p),up(q)))continue;const c=accept(q,'nearby clear footing');if(c)return c;
   }return {ok:false,reason:'no clear footing near impact'};
  }
  if(hit.kind!=='wall'||!hit.box)return {ok:false,reason:'no supporting surface'};
  const b=hit.box,n=normal(hit,v);
  if(n[1]<-.5)return {ok:false,reason:'ceiling underside; no safe landing'};
  // A real narrow handrail supports a centred perch even when the avatar's
  // footprint overhangs. Tall enclosing walls and movable shutters are not rails.
  if(canPerch(b)&&b.max[1]-p[1]<=1.25){
   const q=[clamp(p[0],b.min[0]+.025,b.max[0]-.025),b.max[1],clamp(p[2],b.min[2]+.025,b.max[2]-.025)];
   if(clear(up(p),up(q),b)){const c=accept(q,'rail / stone perch');if(c)return c;}
  }
  if(Math.abs(n[1])>.5)return {ok:false,reason:'no supported landing on this surface'};
  // Find the nearest supported spot on the face actually hit. The downward
  // segment rejects intervening ceilings/platforms; the head sweep rejects
  // corner tunnelling. Nothing searches across a wall or over an empty abyss.
  const tangent=[-n[2],0,n[0]],start=[p[0]+n[0]*(R+.055),p[1],p[2]+n[2]*(R+.055)];
  for(const out of[0,.18,.4,.65])for(const side of[0,.24,-.24,.48,-.48,.8,-.8]){
   const q=[start[0]+n[0]*out+tangent[0]*side,p[1],start[2]+n[2]*out+tangent[2]*side];
   const y=a.floorAt(w,q,0,.42,Infinity);if(y===null)continue;q[1]=y;
   const end=[q[0],Math.max(y+.04,Math.min(p[1],y+1.65)),q[2]];
   if(!clear(start,end)||!clear([start[0],Math.max(p[1],y+1.65),start[2]],up(q)))continue;
   const c=accept(q,'beside the wall');if(c)return c;
  }return {ok:false,reason:'wall has no safe footing on this side'};
 }
 const api=Object.freeze({R,canPerch,perchAt,bottom,duration,normal,resolve});root.SureflightModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
