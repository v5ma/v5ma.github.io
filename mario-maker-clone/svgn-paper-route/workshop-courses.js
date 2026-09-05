/* Deliberately different authored topologies. One set of shapes feeds both
 * gameplay and the maker: no separate demonstration scene or copied assets. */
(function(root){
 'use strict';
 const C=WorkshopCore,old=DeliveryCampaign,oldBuild=SkyRoutes.build;
 const names=[{id:'switchback-quarry',name:'Switchback Quarry',district:'OPEN RAMPS / DESCENDING ROUTE',style:'quarry',theme:'hills',difficulty:'MOMENTUM + DROPS',stages:4,quota:1,par:130,description:'A wedge launch, a suspended C-ramp, a deep bowl and a low escape ramp. Descend through the quarry instead of circling a row of rings.',tip:'D: accelerate. A: brake. Ride off an open edge to launch; Space jumps off a rail.'},{id:'relay-vault',name:'The Relay Vault',district:'EXPLORE / UNLOCK / RETURN',style:'vault',theme:'city',difficulty:'EXPLORATION + WHIP',stages:0,quota:1,par:200,description:'Explore the upper gallery for a relay key, return to the locked passage, then use the peg chamber to reach the exit. The map remembers rooms you visit.',tip:'Explore both heights. Space jumps on floors. Z catches pegs or lashes nearby sentries. M opens the map.'}];
 function path(points,i,label){return {points,meta:{version:1,kind:'open',id:'loop-'+i,stage:i,begin:0,end:1,checkpoint:true,label},anchors:null};}
 function tiles(d,T,x,y,w,h,id){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<d.w&&j<d.h)d.cells[j*d.w+i]=T[id]||0;}
 function make(which,T){
  const spec=names[which],d=C.empty(which===0?112:92,78);d.name=spec.name;d.theme=spec.theme;d.music='off';
  let rooms,keys=[],doors=[],sentries=[];
  if(which===0){
   const a=[[100,1800],[310,1800],...C.cubic([310,1800],[410,1800],[440,1740],[505,1675]).slice(1)];
   const b=C.arc(1110,1540,185,162,18,64);
   const c=C.cubic([1390,1790],[1430,2010],[1540,2060],[1790,2060]);c.push([2030,2060]);c.push(...C.cubic([2030,2060],[2100,2060],[2140,2010],[2200,1960]).slice(1));
   const e=C.cubic([2700,2070],[2790,2200],[2810,2340],[3000,2340]);e.push([3490,2340]);
   d.paths=[path(a,0,'Wedge launch'),path(b,1,'Suspended partial loop'),path(c,2,'Deep quarry bowl'),path(e,3,'Lower escape')];
   tiles(d,T,3,49,1,1,'START');tiles(d,T,2,50,5,2,'STEEL');tiles(d,T,96,65,14,2,'STEEL');tiles(d,T,105,64,1,1,'GOAL');
   tiles(d,T,18,42,1,1,'MAILBOX');tiles(d,T,64,50,1,1,'MAILBOX');
   rooms=[{id:'ridge',name:'Launch ridge',x:0,y:1300,w:900,h:780},{id:'drop',name:'Suspended cut',x:900,y:1300,w:1050,h:950},{id:'basin',name:'Lower basin',x:1950,y:1700,w:2010,h:970}];
  }else{
   // Enclosed chambers, a real upper detour and a return through the same hub.
   // The key is left of its door: reaching it does not directly advance east.
   tiles(d,T,2,62,22,2,'STEEL');tiles(d,T,24,62,20,2,'STEEL');tiles(d,T,44,62,15,2,'STEEL');tiles(d,T,73,62,16,2,'STEEL');
   tiles(d,T,2,46,1,16,'STEEL');tiles(d,T,2,46,21,1,'STEEL');
   tiles(d,T,5,58,4,1,'PLAT');tiles(d,T,10,55,4,1,'PLAT');tiles(d,T,15,52,7,1,'PLAT');
   tiles(d,T,4,61,1,1,'START');tiles(d,T,83,61,1,1,'MAILBOX');tiles(d,T,87,61,1,1,'GOAL');
   tiles(d,T,24,48,1,14,'STEEL');
   for(let y=57;y<62;y++)d.cells[y*d.w+24]=T.BARRIER;
   doors=[{id:'relay-door',key:'relay',x:24*36,y:57*36,w:36,h:180}];
   keys=[{id:'relay',name:'Gallery relay key',x:19*36+18,y:51*36+18}];
   d.paths=[path(C.cubic([31*36,62*36],[38*36,62*36],[40*36,60*36],[42*36,58*36]),0,'Service ramp'),path(C.cubic([71*36,56*36],[72*36,59*36],[74*36,62*36],[79*36,62*36]),1,'Receiver balcony')];
   tiles(d,T,60,53,1,1,'PEG');tiles(d,T,66,52,1,1,'PEG');tiles(d,T,69,55,1,1,'PEG');
   tiles(d,T,46,59,3,1,'PLAT');tiles(d,T,50,56,4,1,'PLAT');tiles(d,T,54,54,3,1,'PLAT');
   sentries=[{id:'sentry-1',x:36*36,y:61*36+12,r:18}];
   rooms=[{id:'hub',name:'West hub',x:36,y:1850,w:800,h:430},{id:'gallery',name:'Upper gallery',x:36,y:1610,w:800,h:290},{id:'service',name:'Service passage',x:870,y:1740,w:1150,h:570},{id:'peg-room',name:'Peg chamber',x:2020,y:1620,w:650,h:690},{id:'depot',name:'East depot',x:2670,y:1900,w:550,h:410}];
  }
  d.mission={version:1,id:spec.id,style:spec.style,precision:which===1,groundStart:which===1,stages:spec.stages,minTransfers:which===0?3:0,quota:1,requiredGrapples:0,requiredKeys:keys.map(k=>k.id),rooms,keys,doors,sentries};
  const ct=d.paths.map(p=>{const a=C.clone(p.points);a.sky=p.meta;return a;});
  const boxes=[];let goal=null;for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){if(d.cells[y*d.w+x]===T.MAILBOX)boxes.push({x,y});if(d.cells[y*d.w+x]===T.GOAL)goal={x,y:y+1};}
  return {...spec,width:d.w,height:d.h,ground:which===0?65:62,kind:'open',minTransfers:d.mission.minTransfers,requiredGrapples:0,mail:boxes.map(p=>p.x),boxes,goal,cells:d.cells,ct,wm:d.mission,document:d};
 }
 function build(i,T){return i<4?oldBuild(i,T):make(i-4,T);}
 SkyRoutes.specs.push(...names);SkyRoutes.build=build;
 root.DeliveryCampaign=Object.freeze({...old,build,routes:[...old.routes,...names.map((s,i)=>({...s,mail:i===0?[18,64]:[83]}))],encode(r){if(r.wm)return C.encode(r.document);return old.encode(r);}});
 root.WorkshopCourses={make,names,build};
})(globalThis);
