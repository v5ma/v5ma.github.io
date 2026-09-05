/* Route Workshop: pure document/geometry operations, compatible with the native
 * Paper Delivery code format. No DOM, renderer, accounts or implicit network. */
(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), clone=x=>JSON.parse(JSON.stringify(x));
 const b64e=s=>btoa(unescape(encodeURIComponent(s))),b64d=s=>decodeURIComponent(escape(atob(s)));
 const LIMITS={tiles:180000,tracks:192,points:6000,code:8000000};
 function validate(d){
  if(!Number.isInteger(d.w)||!Number.isInteger(d.h)||d.w<16||d.h<12||d.w>640||d.h>280||d.w*d.h>LIMITS.tiles)throw Error('Level dimensions exceed the supported 640 by 280 tile bounds.');
  if(!d.cells||d.cells.length!==d.w*d.h)throw Error('Tile data does not match the level dimensions.');
  if(!Array.isArray(d.paths)||d.paths.length>LIMITS.tracks)throw Error('Too many track pieces.');
  for(const p of d.paths){if(!Array.isArray(p.points)||p.points.length<2||p.points.length>LIMITS.points||!p.points.every(q=>Array.isArray(q)&&q.length===2&&q.every(v=>Number.isFinite(v)&&Math.abs(v)<50000)))throw Error('Invalid or oversized track geometry.');}
  return d;
 }
 function decode(code){
  if(typeof code!=='string'||code.length>LIMITS.code)throw Error('Level file is too large.');
  const parts=code.trim().split('.');if(parts.length!==2)throw Error('Expected a Paper Delivery level code.');
  const m=JSON.parse(b64d(parts[0])),raw=atob(parts[1]);
  const w=m.w||160,h=m.h||22;if(!Number.isInteger(w)||!Number.isInteger(h)||w*h>LIMITS.tiles||w<16||h<12)throw Error('Invalid level size.');
  const cells=new Uint8Array(w*h);let at=0;
  if(raw.length%2)throw Error('Invalid run-length tile data.');
  for(let i=0;i<raw.length;i+=2){const id=raw.charCodeAt(i),n=raw.charCodeAt(i+1);if(!n||at+n>cells.length)throw Error('Tile data overflow.');cells.fill(id,at,at+n);at+=n;}
  if(at!==cells.length)throw Error('Incomplete tile data.');
  const paths=(m.ct||[]).map((points,i)=>({points:clone(points),meta:clone(m.cm?.[i]||null),anchors:Array.isArray(m.ca?.[i])?clone(m.ca[i]):null}));
  return validate({w,h,cells,paths,name:String(m.n||'Untitled route').slice(0,96),physics:m.p||'speed',theme:m.t||'dawn',music:m.m||'off',mission:m.wm?clone(m.wm):null});
 }
 function encode(d){
  validate(d);const m={n:d.name,w:d.w,h:d.h,p:d.physics,t:d.theme,m:d.music};
  if(d.paths.length){m.ct=d.paths.map(p=>p.points);if(d.paths.some(p=>p.meta))m.cm=d.paths.map(p=>p.meta);if(d.paths.some(p=>p.anchors))m.ca=d.paths.map(p=>p.anchors||0);}
  if(d.mission)m.wm=d.mission;
  let run=1,data=[];for(let i=1;i<=d.cells.length;i++){if(i<d.cells.length&&d.cells[i]===d.cells[i-1]&&run<255)run++;else{data.push(d.cells[i-1],run);run=1;}}
  let binary='';for(let i=0;i<data.length;i+=16000)binary+=String.fromCharCode(...data.slice(i,i+16000));return b64e(JSON.stringify(m))+'.'+btoa(binary);
 }
 function empty(w=100,h=64){return {w,h,cells:new Uint8Array(w*h),paths:[],name:'My sky route',physics:'speed',theme:'dawn',music:'off',mission:null};}
 function cubic(a,b,c,d,n=28){const out=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;out.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return out;}
 function arc(cx,cy,r,from,to,n=52){return Array.from({length:n+1},(_,i)=>{const a=(from+(to-from)*i/n)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});}
 const PARTS=[
  {id:'ramp',name:'Rising launch',hint:'A run-up that ends in open air.'},
  {id:'catcher',name:'Curved catcher',hint:'Receives a falling rider and redirects momentum.'},
  {id:'quarter',name:'Quarter pipe',hint:'Turns horizontal speed into a vertical launch.'},
  {id:'half',name:'Hanging C-ramp',hint:'A suspended partial loop, open at both ends.'},
  {id:'bowl',name:'Open bowl',hint:'Catch, descend and climb the opposite side.'},
  {id:'shelf',name:'Drop shelf',hint:'A short elevated surface ending in a drop.'},
  {id:'s-curve',name:'S-bend',hint:'A flowing descent, not a closed loop.'},
  {id:'loop',name:'Full loop',hint:'A gold-sector timed exit. One option, not every level.'}
 ];
 function piece(id,x,y){
  let pts;
  if(id==='ramp')pts=[[0,0],[120,0],...cubic([120,0],[220,0],[240,-80],[300,-140]).slice(1)];
  else if(id==='catcher')pts=cubic([0,-180],[35,-65],[105,0],[250,0]);
  else if(id==='quarter')pts=arc(0,-130,130,90,0);
  else if(id==='half')pts=arc(130,-65,130,162,18);
  else if(id==='bowl')pts=arc(150,-140,150,180,0);
  else if(id==='shelf')pts=[[0,0],[100,0],[220,0]];
  else if(id==='s-curve')pts=cubic([0,-130],[170,-150],[95,70],[300,0]);
  else if(id==='loop'){
   pts=[[0,0],[140,0],...arc(140,-110,110,90,-270,88).slice(1),[315,0],...cubic([315,0],[340,0],[365,-35],[395,-65],18).slice(1)];
  }else throw Error('Unknown track piece');
  const meta={version:1,kind:'open',id:'piece',stage:0,begin:0,end:1,label:PARTS.find(p=>p.id===id).name};
  if(id==='loop'){delete meta.kind;const before=140,lap=2*Math.PI*110,total=length(pts);meta.begin=before/total;meta.end=(before+lap)/total;}
  return {points:pts.map(p=>[p[0]+x,p[1]+y]),meta,anchors:null};
 }
 function length(pts){let n=0;for(let i=1;i<pts.length;i++)n+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return n;}
 function bounds(paths){const all=paths.flatMap(p=>p.points);if(!all.length)return {x:0,y:0,w:720,h:432};let x=Infinity,y=Infinity,x2=-Infinity,y2=-Infinity;for(const p of all){x=Math.min(x,p[0]);y=Math.min(y,p[1]);x2=Math.max(x2,p[0]);y2=Math.max(y2,p[1]);}return {x,y,w:x2-x,h:y2-y};}
 function transform(p,{dx=0,dy=0,angle=0,sx=1,sy=1,origin=null}){
  const b=bounds([p]),o=origin||[b.x+b.w/2,b.y+b.h/2],c=Math.cos(angle),s=Math.sin(angle);
  const f=q=>{const x=(q[0]-o[0])*sx,y=(q[1]-o[1])*sy;return [o[0]+x*c-y*s+dx,o[1]+x*s+y*c+dy];};
  p.points=p.points.map(f);
  if(p.anchors)p.anchors=p.anchors.map(a=>{const q=f(a),hx=a[2]*sx,hy=a[3]*sy;return [q[0],q[1],hx*c-hy*s,hx*s+hy*c];});
  return p;
 }
 function deform(p,index,dx,dy){const span=Math.max(2,Math.floor(p.points.length/7));p.points=p.points.map((q,i)=>{const t=Math.max(0,1-Math.abs(i-index)/span),w=t*t*(3-2*t);return [q[0]+dx*w,q[1]+dy*w];});p.anchors=null;}
 function distance(a,b,p){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);}
 function hit(paths,x,y,r=14){for(let i=paths.length-1;i>=0;i--)for(let k=1;k<paths[i].points.length;k++)if(distance(paths[i].points[k-1],paths[i].points[k],[x,y])<r)return i;return -1;}
 function renumber(d){d.paths.forEach((p,i)=>{if(p.meta){p.meta.stage=i;p.meta.id='loop-'+i;p.meta.checkpoint=true;}});}
 function check(d){const result=[];if(!d.cells.includes(15))result.push('Place a Start flag.');if(!d.cells.includes(8))result.push('Place a Depot goal.');for(let i=0;i<d.paths.length;i++)if(d.paths[i].points.some(([x,y])=>x<0||y<0||x>d.w*36||y>d.h*36))result.push('Track '+(i+1)+' extends outside the world.');if(!result.length)result.push('Ready to playtest. This check does not prove every jump is reachable.');return result;}
 class History{constructor(code){this.items=[code];this.index=0;}push(code){if(this.items[this.index]===code)return;this.items.splice(this.index+1);this.items.push(code);if(this.items.length>60)this.items.shift();this.index=this.items.length-1;}undo(){this.index=Math.max(0,this.index-1);return this.items[this.index];}redo(){this.index=Math.min(this.items.length-1,this.index+1);return this.items[this.index];}}
 root.WorkshopCore=Object.freeze({LIMITS,PARTS,clone,empty,decode,encode,validate,piece,cubic,arc,length,bounds,transform,deform,hit,renumber,check,History});
 if(typeof module!=='undefined')module.exports=root.WorkshopCore;
})(globalThis);
