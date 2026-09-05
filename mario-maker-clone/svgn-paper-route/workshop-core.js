/* Route Workshop: pure document/geometry operations, compatible with the native
 * Paper Delivery code format. No DOM, renderer, accounts or implicit network. */
(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), clone=x=>JSON.parse(JSON.stringify(x));
 const b64e=s=>btoa(unescape(encodeURIComponent(s))),b64d=s=>decodeURIComponent(escape(atob(s)));
 const LIMITS=Object.freeze({tiles:179200,tracks:192,points:6000,totalPoints:80000,code:4000000});
 const reserved=new Set(['__proto__','prototype','constructor']);
 function safeTree(value,depth=0){
  if(depth>24)throw Error('Metadata nesting is too deep.');
  if(typeof value==='number'&&!Number.isFinite(value))throw Error('Nonfinite metadata value.');
  if(value&&typeof value==='object')for(const k of Object.keys(value)){if(reserved.has(k))throw Error('Unsafe metadata key.');safeTree(value[k],depth+1);}
 }
 function finitePoint(q,n=2){return Array.isArray(q)&&q.length===n&&q.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=50000);}
 function validate(d){
  if(!Number.isInteger(d.w)||!Number.isInteger(d.h)||d.w<16||d.h<12||d.w>640||d.h>280||d.w*d.h>LIMITS.tiles)throw Error('Supported level size: 16-640 columns and 12-280 rows.');
  if(!(d.cells instanceof Uint8Array)||d.cells.length!==d.w*d.h)throw Error('Tile data does not match the level size.');
  if(!Array.isArray(d.paths)||d.paths.length>LIMITS.tracks)throw Error('This level exceeds 192 track pieces.');
  let count=0;
  for(const p of d.paths){
   if(!Array.isArray(p.points)||p.points.length<2||p.points.length>LIMITS.points||!p.points.every(q=>finitePoint(q)))throw Error('Invalid or oversized track geometry.');
   count+=p.points.length;
   if(length(p.points)<.01)throw Error('A track must have two distinct positions.');
   if(p.anchors&&(!Array.isArray(p.anchors)||!p.anchors.every(q=>finitePoint(q,4))))throw Error('Invalid curve handles.');
   const t=p.meta;
   if(t&&(t.version!==1||!Number.isInteger(t.stage)||t.stage<0||typeof t.id!=='string'||t.id.length>120||!Number.isFinite(t.begin)||!Number.isFinite(t.end)||t.begin<0||t.end>1||t.begin>=t.end))throw Error('Invalid track movement metadata.');
  }
  if(count>LIMITS.totalPoints)throw Error('The combined track geometry is too large.');
  if(typeof d.name!=='string'||d.name.length>96)throw Error('Level name must be 96 characters or fewer.');
  safeTree(d.extra||{});safeTree(d.paths.map(p=>p.meta));
  const gp=d.extra?.gp;
  if(gp){
   if(gp.version!==1||!['village','canal','garden'].includes(gp.style)||!Number.isInteger(gp.ground)||gp.ground<3||gp.ground>=d.h||!Number.isInteger(gp.quota)||gp.quota<0||gp.quota>40)throw Error('Invalid ground-world metadata.');
   if(gp.adventure===2&&(!Array.isArray(gp.sections)||gp.sections.length>32||!Array.isArray(gp.cast)||gp.cast.length>24))throw Error('Invalid adventure sections or characters.');
   for(const n of gp.cast||[])if(!Number.isFinite(n.x)||!Number.isFinite(n.y)||typeof n.name!=='string'||n.name.length>60||typeof n.text!=='string'||n.text.length>250||typeof n.id!=='string')throw Error('Invalid neighbor data.');
   for(const sec of gp.sections||[])if(!Number.isFinite(sec.x)||typeof sec.name!=='string'||sec.name.length>100)throw Error('Invalid adventure area.');
   const net=gp.skyNetwork;
   if(net){
    if(net.version!==1||!Array.isArray(net.sectors)||net.sectors.length>32||!Array.isArray(net.links)||net.links.length>2000||!Array.isArray(net.mainIDs)||net.mainIDs.length>192)throw Error('Invalid connected-world map data.');
    for(const t of net.sectors)if(typeof t.id!=='string'||typeof t.name!=='string'||t.name.length>100||!['x','y','w','h'].every(k=>Number.isFinite(t[k])&&Math.abs(t[k])<50000)||t.w<=0||t.h<=0)throw Error('Invalid map area.');
    for(const t of net.links)if(typeof t.from!=='string'||typeof t.to!=='string')throw Error('Invalid route connection.');
   }
  }
  return d;
 }
 function decode(code){
  if(typeof code!=='string'||code.length>LIMITS.code)throw Error('Level file is too large.');
  const parts=code.trim().split('.');if(parts.length!==2)throw Error('Expected a Paper Delivery .route level code.');
  let m,raw;try{m=JSON.parse(b64d(parts[0]));raw=atob(parts[1]);}catch{throw Error('This file is not a valid Paper Delivery level.');}
  if(!m||typeof m!=='object'||Array.isArray(m))throw Error('Missing level metadata.');safeTree(m);
  const w=m.w||160,h=m.h||22;if(!Number.isInteger(w)||!Number.isInteger(h)||w<16||h<12||w>640||h>280||w*h>LIMITS.tiles)throw Error('Invalid level size.');
  const cells=new Uint8Array(w*h);let at=0;
  if(raw.length%2)throw Error('Invalid run-length tile data.');
  for(let i=0;i<raw.length;i+=2){const id=raw.charCodeAt(i),n=raw.charCodeAt(i+1);if(!n||at+n>cells.length)throw Error('Tile data overflow.');cells.fill(id,at,at+n);at+=n;}
  if(at!==cells.length)throw Error('Incomplete tile data.');
  if(m.ct!==undefined&&!Array.isArray(m.ct))throw Error('Invalid track array.');
  const paths=(m.ct||[]).map((points,i)=>({points:clone(points),meta:clone(m.cm?.[i]||null),anchors:Array.isArray(m.ca?.[i])?clone(m.ca[i]):null}));
  // Preserve every native/extension field, including gp, network IDs, cast,
  // original soundtrack and fields this editor does not yet expose.
  return validate({w,h,cells,paths,name:String(m.n||'Untitled route').slice(0,96),physics:m.p||'platform',theme:m.t||'dawn',music:m.m||'off',extra:clone(m)});
 }
 function encode(d){
  validate(d);const m=clone(d.extra||{});Object.assign(m,{n:d.name,w:d.w,h:d.h,p:d.physics,t:d.theme,m:d.music});
  if(d.paths.length)m.ct=d.paths.map(p=>p.points);else delete m.ct;
  if(d.paths.some(p=>p.meta))m.cm=d.paths.map(p=>p.meta);else delete m.cm;
  if(d.paths.some(p=>p.anchors))m.ca=d.paths.map(p=>p.anchors||0);else delete m.ca;
  let run=1,data=[];for(let i=1;i<=d.cells.length;i++){if(i<d.cells.length&&d.cells[i]===d.cells[i-1]&&run<255)run++;else{data.push(d.cells[i-1],run);run=1;}}
  let binary='';for(let i=0;i<data.length;i+=16000)binary+=String.fromCharCode(...data.slice(i,i+16000));const code=b64e(JSON.stringify(m))+'.'+btoa(binary);if(code.length>LIMITS.code)throw Error('The encoded level is too large.');return code;
 }
 function empty(w=100,h=68){return {w,h,cells:new Uint8Array(w*h),paths:[],name:'My neighborhood',physics:'platform',theme:'dawn',music:'morning',extra:{}};}
 function starter(){
  const d=empty(96,68),ground=60;
  for(let y=ground;y<d.h;y++)d.cells.fill(1,y*d.w,(y+1)*d.w);
  for(const [x,y,t]of[[3,59,15],[91,59,8],[15,59,63],[50,59,13],[22,54,5],[36,51,60],[43,53,43]])d.cells[y*d.w+x]=t;
  const a=piece('ramp',620,2070),b=piece('catcher',1240,1960);d.paths=[a,b];
  d.extra.gp={version:1,index:0,style:'village',ground,quota:0,groundStart:true,stages:0,minTransfers:0,requiredGrapples:0,adventure:2,sections:[{x:0,name:'Your neighborhood'}],cast:[],skyNetwork:{version:1,sectors:[{id:'sector-0',name:'Your neighborhood',x:0,y:1100,w:d.w*36,h:1060}],links:[],mainIDs:[],pegCount:1,groundOptional:true}};
  d.paths.forEach((p,i)=>{p.meta.id='loop-'+i;p.meta.stage=i;p.meta.network=true;p.meta.optional=true;p.meta.sector=0;p.meta.tier=1;});return d;
 }
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
  {id:'loop',name:'Full loop',hint:'A complete circle with an open exit. Custom adventures ride off its lip.'}
 ];
 function piece(id,x,y){
  let pts;
  if(id==='ramp')pts=[[0,0],[120,0],...cubic([120,0],[220,0],[240,-80],[300,-140]).slice(1)];
  else if(id==='catcher')pts=cubic([0,-180],[35,-65],[105,0],[250,0]);
  else if(id==='quarter')pts=arc(0,-130,130,90,0);
  else if(id==='half')pts=arc(150,-150,150,45,315,72);
  else if(id==='bowl')pts=arc(150,-140,150,180,0);
  else if(id==='shelf')pts=[[0,0],[100,0],[220,0]];
  else if(id==='s-curve')pts=cubic([0,-130],[170,-150],[95,70],[300,0]);
  else if(id==='loop'){
   pts=[[0,0],[140,0],...arc(140,-110,110,90,-270,88).slice(1),[315,0],...cubic([315,0],[340,0],[365,-35],[395,-65],18).slice(1)];
  }else throw Error('Unknown track piece');
  const meta={version:1,kind:'open',id:'piece',stage:0,begin:0,end:1,label:PARTS.find(p=>p.id===id).name};
  if(id==='loop'){delete meta.kind;const before=140,lap=2*Math.PI*110,total=length(pts);meta.begin=before/total;meta.end=(before+lap)/total;}
  // Closed-looking loop plus a real exit is an open path in the story physics.
  meta.kind='open';meta.begin=0;meta.end=1;
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
 function syncNetwork(d){
  const ids=new Set();let n=0;
  for(const p of d.paths){if(!p.meta)continue;let id=p.meta.id;if(!id||ids.has(id)){do{id='workshop-'+n++;}while(ids.has(id));p.meta.id=id;}ids.add(id);}
  const net=d.extra?.gp?.skyNetwork;if(!net)return;
  net.links=net.links.filter(l=>ids.has(l.from)&&ids.has(l.to));net.mainIDs=net.mainIDs.filter(id=>ids.has(id));net.pegCount=d.cells.reduce((a,t)=>a+(t===60),0);
 }
 function tagNew(d,p){
  const ids=new Set(d.paths.map(p=>p.meta?.id));let i=0;while(ids.has('workshop-'+i))i++;
  const stage=1+Math.max(-1,...d.paths.map(p=>p.meta?.stage??-1));
  p.meta={...p.meta,version:1,id:'workshop-'+i,stage,kind:'open',begin:0,end:1,optional:true};
  if(d.extra?.gp?.skyNetwork){const b=bounds([p]),secs=d.extra.gp.skyNetwork.sectors;let sector=secs.findIndex(s=>b.x>=s.x&&b.x<s.x+s.w);p.meta.network=true;p.meta.sector=Math.max(0,sector);p.meta.tier=b.y<d.extra.gp.ground*36-550?3:1;}
  return p;
 }
 function paintLine(d,from,to,id){
  const ax=Math.floor(from[0]/36),ay=Math.floor(from[1]/36),bx=Math.floor(to[0]/36),by=Math.floor(to[1]/36),n=Math.max(Math.abs(bx-ax),Math.abs(by-ay),1);
  if(id===15||id===8){for(let i=0;i<d.cells.length;i++)if(d.cells[i]===id)d.cells[i]=0;if(bx>=0&&by>=0&&bx<d.w&&by<d.h)d.cells[by*d.w+bx]=id;return;}
  for(let i=0;i<=n;i++){const x=Math.round(ax+(bx-ax)*i/n),y=Math.round(ay+(by-ay)*i/n);if(x>=0&&x<d.w&&y>=0&&y<d.h)d.cells[y*d.w+x]=id;}
 }
 function join(d,indices){
  if(indices.length!==2)throw Error('Shift-select exactly 2 tracks to join.');
  const [i,j]=[...indices].sort((a,b)=>a-b),p=d.paths[i],q=d.paths[j];
  const combos=[[p.points,q.points],[p.points,[...q.points].reverse()],[[...p.points].reverse(),q.points],[[...p.points].reverse(),[...q.points].reverse()]];
  const gap=c=>Math.hypot(c[0].at(-1)[0]-c[1][0][0],c[0].at(-1)[1]-c[1][0][1]);combos.sort((a,b)=>gap(a)-gap(b));
  p.points=clone(combos[0][0].concat(combos[0][1]));p.anchors=null;p.meta={...p.meta,kind:'open',begin:0,end:1,label:'Joined roadway'};d.paths.splice(j,1);syncNetwork(d);return i;
 }
 function resize(d,w,h){
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<16||h<12||w>640||h>280||w*h>LIMITS.tiles)throw Error('Unsupported level dimensions.');
  if(d.extra?.gp&&d.extra.gp.ground>=h)throw Error('The level must extend below its ground height.');
  if(w<d.w||h<d.h){if(d.paths.some(p=>p.points.some(q=>q[0]>=w*36||q[1]>=h*36)))throw Error('Move tracks inside the new bounds before shrinking.');for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if((x>=w||y>=h)&&d.cells[y*d.w+x])throw Error('Erase out-of-bounds tiles before shrinking.');}
  const a=new Uint8Array(w*h);for(let y=0;y<Math.min(h,d.h);y++)a.set(d.cells.slice(y*d.w,y*d.w+Math.min(w,d.w)),y*w);d.cells=a;d.w=w;d.h=h;return d;
 }
 function check(d){
  const errors=[],warnings=[];const starts=d.cells.reduce((n,t)=>n+(t===15),0),goals=d.cells.reduce((n,t)=>n+(t===8),0);
  if(starts!==1)errors.push('Place exactly one Start flag.');if(goals!==1)errors.push('Place exactly one Finish.');
  for(let i=0;i<d.paths.length;i++)if(d.paths[i].points.some(([x,y])=>x<0||y<0||x>d.w*36||y>d.h*36))errors.push('Track '+(i+1)+' extends outside the level.');
  for(const n of d.extra?.gp?.cast||[])if(n.x<0||n.y<0||n.x>=d.w||n.y>=d.h)errors.push('Neighbor '+n.name+' is outside the level.');
  if(d.extra?.gp){let gaps=0;const y=d.extra.gp.ground;for(let x=0;x<d.w;x++)if(![1,2,3,9].includes(d.cells[y*d.w+x]))gaps++;if(gaps)warnings.push(gaps+' columns differ from the original ground row; test the lower route.');}
  warnings.push('Jump reachability is not automatic. Test every route you want players to use.');return {errors,warnings};
 }
 class History{
  constructor(code){this.items=[code];this.index=0;}
  push(code){if(this.items[this.index]===code)return;this.items.splice(this.index+1);this.items.push(code);while(this.items.length>50||this.items.reduce((n,x)=>n+x.length,0)>16000000&&this.items.length>1)this.items.shift();this.index=this.items.length-1;}
  undo(){this.index=Math.max(0,this.index-1);return this.items[this.index];}
  redo(){this.index=Math.min(this.items.length-1,this.index+1);return this.items[this.index];}
 }
 root.WorkshopCore=Object.freeze({LIMITS,PARTS,clone,empty,starter,decode,encode,validate,piece,cubic,arc,length,bounds,transform,deform,hit,tagNew,syncNetwork,paintLine,join,resize,check,History});
 if(typeof module!=='undefined')module.exports=root.WorkshopCore;
})(globalThis);
