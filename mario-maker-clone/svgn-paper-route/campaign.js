/* SVGN.io Paper Delivery - curated routes. Original, deterministic level data. */
'use strict';
globalThis.DeliveryCampaign = (() => {
  const routes = [
    {id:'morning-edition',name:'The Morning Edition',district:'SUNRISE DISTRICT',theme:'dawn',width:108,height:24,ground:20,par:85,quota:4,mail:[12,26,40,55,72,91],description:'Learn the throw. Serve the neighborhood. Bring the morning news home.',tip:'Press C to throw. A paper follows a fixed arc: stand a few tiles before a mailbox and time it.',difficulty:'FIRST ROUTE'},
    {id:'bay-express',name:'The Bay Express',district:'COASTAL EXPRESS',theme:'hills',width:136,height:24,ground:20,par:105,quota:5,mail:[12,30,49,69,91,112,124],description:'Run the coastal route with spring launches, raised walkways, and moving platforms.',tip:'Space jumps, X uses a collected nitro charge. You can always stop and line up a delivery.',difficulty:'INTERMEDIATE'},
    {id:'midnight-dispatch',name:'Midnight Dispatch',district:'AFTER-HOURS EDITION',theme:'city',width:156,height:26,ground:22,par:130,quota:6,mail:[12,29,47,65,85,106,128,143],description:'Neon streets, conveyor runs, and patrolling robots. Finish the late edition.',tip:'Delivered mailboxes stay delivered after a fall. Checkpoint flags shorten the trip back.',difficulty:'ADVANCED'}
  ];
  function build(index,T){
    if(!Number.isInteger(index)||!routes[index])throw new RangeError('Unknown delivery route');
    const r=routes[index],w=r.width,h=r.height,f=r.ground,a=new Uint8Array(w*h);
    const put=(x,y,t)=>{if(x>=0&&x<w&&y>=0&&y<h)a[y*w+x]=t;};
    for(let x=0;x<w;x++)for(let y=f;y<h;y++)put(x,y,T.STEEL);
    put(3,f-1,T.START);put(w-4,f-1,T.GOAL);
    r.mail.forEach(x=>put(x,f-1,T.MAILBOX));
    for(let x=6;x<w-6;x+=3)if(!a[(f-1)*w+x])put(x,f-1,T.GEAR);
    for(const x of [Math.floor(w*.35),Math.floor(w*.68)])put(r.mail.includes(x)?x+2:x,f-1,T.CHECK);
    put(7,f-1,T.SHIELD);
    const platforms=index===0?[[32,4],[62,5],[81,4]]:index===1?[[18,6],[38,5],[58,5],[78,7],[99,6]]:[[18,5],[37,5],[55,6],[73,5],[96,5],[116,6],[136,4]];
    for(const [x,n]of platforms){for(let j=0;j<n;j++){put(x+j,f-3,T.PLAT);put(x+j,f-4,T.GEAR);}put(x-1,f-1,T.SPRING);}
    if(index>0){
      for(const x of index===1?[24,61,101]:[23,57,96,119])put(x,f-1,index===1?T.BLOOP:T.SHELL);
      for(const x of index===1?[45,86]:[43,81,123])put(x,f-5,T.MOVER);
      put(9,f-1,T.BIKEDOCK);put(Math.floor(w*.5),f-1,T.NITRO);
    }
    if(index===2){
      for(const start of [33,70,112])for(let x=start;x<start+6;x++)put(x,f,T.CONVR);
      put(52,f-5,T.HOVER);put(102,f-5,T.HOVER);put(80,f-1,T.SHIELD);
    }
    return {...r,cells:a};
  }
  function encode(r){
    const meta={n:r.name,w:r.width,h:r.height,p:'platform',t:r.theme,m:r.theme==='city'?'midnight':'gearwork'};
    let data=[],run=1;
    for(let i=1;i<=r.cells.length;i++){if(i<r.cells.length&&r.cells[i]===r.cells[i-1]&&run<255)run++;else{data.push(r.cells[i-1],run);run=1;}}
    const utf8=new TextEncoder().encode(JSON.stringify(meta));
    return btoa(String.fromCharCode(...utf8))+'.'+btoa(String.fromCharCode(...data));
  }
  function medal({delivered,total,seconds,par,attempts}){return delivered>=total&&attempts===1&&seconds<=par?'gold':delivered>=total?'silver':'bronze';}
  function loadRecords(storage){try{const r=JSON.parse(storage.getItem('svgn_delivery_records_v1')||'{}');return r&&typeof r==='object'&&!Array.isArray(r)?r:{};}catch{return {};}}
  return Object.freeze({routes,build,encode,medal,loadRecords});
})();
