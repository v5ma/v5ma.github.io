/* Waterwheel reference slice: static authored geometry. No runtime steering. */
export const ID='canal-choices';
export const REVISION='waterwheel-r2';
export const RECORD='canal-choices-waterwheel-r2';
export const IDS=Object.freeze(['ww-rise','ww-1','ww-2','ww-3','ww-4','ww-5']);
const SPECS=[{"x":2100,"y":2090,"heading":0,"ops":[{"curve":[[150,0],[320,-10],[440,-15]]},{"turn":-32,"radius":190},{"line":60}]},{"x":2928.8311160944672,"y":1988.1406295275526,"heading":-34.94918797690512,"ops":[{"line":255},{"turn":2.9491879769051224,"radius":230},{"line":100}]},{"x":3620.624370896346,"y":1805.1732614297352,"heading":-9.583008472614193,"ops":[{"line":255},{"turn":-22.416991527385807,"radius":280},{"line":100}]},{"x":4441.1527791158505,"y":1659.4560553544438,"heading":-19.409926594076808,"ops":[{"line":255},{"turn":-12.590073405923192,"radius":230},{"line":100}]},{"x":5102.086569155465,"y":1485.158004688401,"heading":-28.13364281860006,"ops":[{"line":255},{"turn":-3.866357181399941,"radius":230},{"line":100}]},{"x":5716.861422425626,"y":1298.3151260267055,"heading":-22.737486571823275,"ops":[{"line":255},{"turn":-9.262513428176725,"radius":230},{"line":100}]}];
const LABELS=['Mill Lane rising runway','Wheelhouse lift','Aqueduct approach','Wheelhouse receiving arc','Millrace receiving cradle','East-bank launch'];
export function recordKey(route){return route?.recordId||route?.id;}
export function recordRoute(route){return route?.recordId?{...route,baseID:route.id,id:route.recordId}:route;}
export function floorAt(x){
  // The existing one-tile step assist handles these broad stepped promenades.
  for(const [a,b] of [[39,49],[162,176],[220,230]]){
    if(x>=a&&x<=b)return 60-Math.min(2,x-a+1,b-x+1);
  }
  return 60;
}
function curve(a,b,c,d,n=72){return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];});}
export function buildCourse(before,T,makePath){
  if(before?.id!==ID||before.kind!=='ground')return before;
  const d={...before,cells:new Uint8Array(before.width*before.height)},w=d.width,g=60;
  const put=(x,y,t)=>{if(x>=0&&x<w&&y>=0&&y<d.height)d.cells[y*w+x]=t;};
  for(let x=0;x<w;x++)for(let y=floorAt(x);y<d.height;y++)put(x,y,T.STEEL);
  const onRoad=(x,t)=>put(x,floorAt(x)-1,t);
  onRoad(3,T.START);onRoad(w-5,T.GOAL);
  const roadBoxes=[12,31,52,86,118,156,181,215,239];roadBoxes.forEach(x=>onRoad(x,T.MAILBOX));
  for(const x of [43,78,116,156,193,235]){let at=x;while(roadBoxes.includes(at))at++;onRoad(at,T.CHECK);}
  for(const x of [22,91,132,185,229])onRoad(x,T.SHIELD);
  for(const x of [100,144,204])onRoad(x,T.BLOOP);
  for(const x of [73,165,236])onRoad(x,T.NITRO);
  for(const x of [35,160,231])onRoad(x,T.BIKEDOCK);
  // Broad road choices, not blind obstacles on an aerial receiving deck.
  for(const x of [68,124,190]){onRoad(x,T.CRATE);onRoad(x+1,T.BRICK);}
  for(let x=8;x<w-8;x+=4)if(!d.cells[(floorAt(x)-1)*w+x])onRoad(x,T.GEAR);
  const tag=(p,id,label,sector=1,extra={})=>{p.sky={version:1,kind:'open',optional:true,network:true,id,label,stage:0,begin:0,end:1,sector,tier:2,roadDepth:34,...extra};return p;};
  const intro=tag(curve([650,2090],[770,2040],[930,2018],[1040,2074]),'ww-quay','Post Quay practice return',0,{entry:true,tier:1,shape:'practice-return'});
  const main=SPECS.map((s,i)=>tag(makePath(s),IDS[i],LABELS[i],Math.min(4,1+Math.floor(i/2)),{entry:i===0,shape:'receiver'}));
  const low=tag(curve([2780,2074],[2980,2022],[3200,2022],[3420,2074]),'ww-low','Canal-side delivery balcony',1,{tier:1,shape:'brake-recovery'});
  const east=tag(curve([7400,1960],[7620,2050],[8210,1960],[8510,2020]),'ww-east','East-bank recovery promenade',4,{tier:1,shape:'recovery'});
  const trimmed=main[1].slice(7);trimmed.sky=main[1].sky;main[1]=trimmed;
  d.ct=[intro,...main,low,east];d.ct.forEach((p,i)=>p.sky.stage=i);
  for(const p of d.ct)for(let j=8;j<p.length-5;j+=13){const [x,y]=p[j],tx=Math.round(x/36),ty=Math.round((y-48)/36);if(!d.cells[ty*w+tx])put(tx,ty,T.GEAR);}
  // Two real, reachable-from-road optional aiming positions, not mandatory locks.
  put(86,55,T.MAILBOX);put(201,55,T.MAILBOX);
  const sections=[{x:0,name:'Post Quay',scene:'village'},{x:35,name:'Mill Lane',scene:'market'},{x:76,name:'Canal Choice',scene:'canal'},{x:110,name:'Wheelhouse Court',scene:'canal'},{x:157,name:'East-bank Promenade',scene:'garden'},{x:211,name:'Waterwheel Depot',scene:'festival'}];
  const cast=[{id:'penny',name:'Penny',x:6,y:60,text:'The road is a whole delivery adventure. Try the low quay ramp, then return here.'},{id:'otto',name:'Otto',x:54,y:60,text:'Keep riding for the depot. The express runway begins beyond Mill Lane.'},{id:'milo',name:'Milo',x:83,y:60,text:'Hold pace for the express lift. Brake on the runway for the canal balcony.'},{id:'fern',name:'Fern',x:149,y:60,text:'The wheelhouse express crosses above this court. Missing the sky line returns toward the road.'},{id:'pip',name:'Pip',x:w-11,y:60,text:'Every line comes home. The striped depot is the finish.'}];
  const sectors=sections.map((s,i)=>({id:'ww-sector-'+i,name:s.name,x:s.x*36,y:900,w:((sections[i+1]?.x||w)-s.x)*36,h:1260}));
  const links=IDS.slice(1).map((to,i)=>({from:IDS[i],to,type:'authored-flight'}));
  links.push({from:IDS[0],to:'ww-low',type:'brake-choice'},{from:IDS.at(-1),to:'ww-east',type:'recovery'});
  d.gp={...before.gp,sections,cast,layoutRevision:REVISION,ground:60,groundStart:true,quota:0,stages:0,minTransfers:0,requiredGrapples:0,finishOnly:true,waterwheel:{version:1,revision:REVISION,groundHeights:Array.from({length:w},(_,x)=>floorAt(x)),intro:'ww-quay',main:[...IDS],landmark:{x:4660,y:1950,radius:155}},skyNetwork:{version:1,sectors,links,mainIDs:[...IDS],pegCount:0,groundOptional:true}};
  delete d.gp.flowRoutes;delete d.gp.sunrise;
  d.boxes=[];for(let y=0;y<d.height;y++)for(let x=0;x<w;x++)if(d.cells[y*w+x]===T.MAILBOX)d.boxes.push({x,y});
  d.mail=d.boxes.map(b=>b.x);d.roadBoxes=roadBoxes;d.goal={x:w-5,y:60};d.recordId=RECORD;d.layoutRevision=REVISION;d.par=250;
  d.description='Ride Post Quay, choose the canal balcony or the linked wheelhouse express, and return along the east bank to the depot. Earlier-layout records remain separate.';
  d.tip='Ride the road to finish. A / Space jumps; brake on the express runway for the lower canal line.';
  d.difficulty='WATERWHEEL / REFERENCE SLICE';return d;
}
export const CUES=Object.freeze([
 {id:'intro',x:505,y:1994,title:'POST QUAY',detail:'Short jump / clear road return'},
 {id:'return',x:1150,y:1994,title:'BACK TO THE STREET',detail:'Continue to Mill Lane'},
 {id:'express',x:1930,y:1970,title:'EXPRESS RUNWAY',detail:'Jump to enter / road stays open'},
 {id:'fork',x:2560,y:1880,title:'CHOOSE YOUR LINE',detail:'Hold pace: lift / brake: canal'},
 {id:'lower',x:3170,y:1940,title:'CANAL DELIVERY',detail:'The lower route has its own stop'},
 {id:'court',x:4160,y:1994,title:'WHEELHOUSE COURT',detail:'Read the patrol before the crossing'},
 {id:'home',x:8150,y:1980,title:'DEPOT APPROACH',detail:'Road and express arrive together'}
]);

export function isLayout(data){const q=data?.gp?.waterwheel,p=q?.landmark;return q?.version===1&&q.revision===REVISION&&[p?.x,p?.y,p?.radius].every(Number.isFinite)&&p.x>=0&&p.x<=data.width*36&&p.y>=0&&p.y<=data.ground*36&&p.radius>=64&&p.radius<=240;}
