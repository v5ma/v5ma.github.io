/* Original path grammar: straight approaches, tangent-continuous circular
 * turns and visibly open mouths. Coordinate units are the live game's pixels.
 * Authoring parameters describe a ride, not a proximity graph. */
(function(root){'use strict';
 const RAD=Math.PI/180;
 function path(spec){
  let x=spec.x||0,y=spec.y||0,a=(spec.heading||0)*RAD;const points=[[x,y]];
  for(const op of spec.ops){
   if(op.curve){const [c1,c2,end]=op.curve,ox=x,oy=y;const n=Math.max(24,Math.ceil(Math.hypot(...end)/9));for(let i=1;i<=n;i++){const t=i/n,u=1-t;x=ox+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*end[0];y=oy+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*end[1];points.push([x,y]);}a=Math.atan2(end[1]-c2[1],end[0]-c2[0]);}
   else if(op.line!==undefined){const n=Math.max(1,Math.ceil(Math.abs(op.line)/14)),d=op.line/n;for(let i=0;i<n;i++){x+=Math.cos(a)*d;y+=Math.sin(a)*d;points.push([x,y]);}}
   else {const angle=op.turn*RAD,r=op.radius;if(!Number.isFinite(r)||r<40||!Number.isFinite(angle))throw Error('Invalid turn');const n=Math.max(3,Math.ceil(Math.abs(angle)*r/10)),da=angle/n,k=Math.sign(angle)/r;for(let i=0;i<n;i++){const next=a+da;x+=(Math.sin(next)-Math.sin(a))/k;y+=(-Math.cos(next)+Math.cos(a))/k;a=next;points.push([x,y]);}}
  }
  return points;
 }
 function recipe(kind,heading,exit,radius=200){
  const h=heading,delta=exit-h;
  if(kind==='open-curl')return [{line:100},{turn:delta-360,radius},{line:70}];
  if(kind==='ribbon')return [{line:115},{turn:delta-35,radius},{turn:35,radius:radius*1.5},{line:95}];
  if(kind==='landing')return [{line:150},{turn:delta,radius},{line:250}];
  return [{line:120},{turn:delta,radius},{line:95}];
 }
 const api={path,recipe};root.PhraseGeometry=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
