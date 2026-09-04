/* Original loop-first courses. Geometry is shared by physics, the editor and 3D. */
'use strict';
(function(){
  const previous=globalThis.DeliveryCampaign;
  const specs=[
    {id:'sky-first-flight',name:'First Flight',district:'SKY POST / FLIGHT SCHOOL',theme:'dawn',radii:[105,115,110,120],rise:[0,-50,45,-55],difficulty:'LEARN THE LAUNCH',quota:2,par:100},
    {id:'sky-switchback',name:'Cloudline Junction',district:'SKY POST / HIGH ROUTE',theme:'hills',radii:[120,95,125,100,120],rise:[0,-90,-65,100,-70],difficulty:'FIVE-LOOP SKYWAY',quota:3,par:135},
    {id:'sky-night-mail',name:'Aurora Express',district:'SKY POST / NIGHT FLIGHT',theme:'city',radii:[125,110,135,100,125,115],rise:[0,-80,60,-95,70,-55],difficulty:'SIX-LOOP NIGHT RUN',quota:3,par:165}
  ];
  function curve(points,a,b,c,d,n=20){for(let i=1;i<=n;i++){const t=i/n,u=1-t;points.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}}
  function length(p,to=p.length-1){let s=0;for(let i=1;i<=to;i++)s+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return s;}
  function loop(cx,base,r,stage,last=false){
    // A descending receiver feeds a complete circle. The exit is a separate lip.
    const pts=[[cx-330,base-95]];
    curve(pts,pts[0],[cx-270,base-70],[cx-260,base],[cx-180,base]);
    pts.push([cx,base]);const begin=length(pts);
    for(let i=1;i<=100;i++){const a=Math.PI/2-i/100*Math.PI*2;pts.push([cx+r*Math.cos(a),base-r+r*Math.sin(a)]);}
    const end=length(pts);pts.push([cx+r+60,base]);
    const rr=100;
    for(let i=1;i<=20;i++){const a=i/20*Math.PI/4;pts.push([cx+r+60+rr*Math.sin(a),base-rr+rr*Math.cos(a)]);}
    const total=length(pts);
    pts.sky={version:1,id:'loop-'+stage,stage,begin:begin/total,end:end/total,last,checkpoint:stage>0};
    return pts;
  }
  function build(index,T){
    if(!specs[index])throw new RangeError('Unknown sky route');
    const def=specs[index],ct=[];let cx=490,base=2100;
    for(let i=0;i<def.radii.length;i++){
      base+=def.rise[i];const path=loop(cx,base,def.radii[i],i,i===def.radii.length-1);ct.push(path);
      // Long open-air gaps; the receiving lip is positioned for ballistic flight.
      if(i+1<def.radii.length){
        const lip=path.at(-1),prev=path.at(-2),l=Math.hypot(lip[0]-prev[0],lip[1]-prev[1]);
        let vx=(lip[0]-prev[0])/l*20,vy=(lip[1]-prev[1])/l*20,xx=lip[0]+16.65,yy=lip[1]-17.30;
        const target=base+def.rise[i+1]-24;
        // Design-time receiver placement for the nominal throttle flight.
        // The player still has to execute it with the independent collision engine.
        for(let n=0;n<120;n++){vx=(vx+.035)*.9996;vy+=.48;xx+=vx;yy+=vy;if(vy>0&&yy>=target)break;}
        cx=xx+120;
      }
    }
    const final=ct.at(-1).at(-1),goalX=Math.ceil((final[0]+940)/36),goalY=Math.round((final[1]+60)/36);
    const w=goalX+9,h=82,a=new Uint8Array(w*h),put=(x,y,t)=>{if(x>=0&&x<w&&y>=0&&y<h)a[y*w+x]=t;};
    // Launch pad and depot only. There is deliberately no bypass floor.
    for(let x=1;x<6;x++){put(x,58,T.STEEL);put(x,59,T.STEEL);}put(3,57,T.START);put(4,57,T.EUCDOCK);
    for(let x=goalX-6;x<=goalX+5;x++){put(x,goalY,T.STEEL);put(x,goalY+1,T.STEEL);}put(goalX,goalY-1,T.GOAL);
    const boxes=[];
    for(const path of ct){
      const end=path.at(-1),x=Math.round((end[0]+85)/36),y=Math.round((end[1]-72)/36);put(x,y,T.MAILBOX);boxes.push({x,y});
      // Parcels mark the approach, not a substitute ground-level route.
      for(let k=8;k<20;k+=4){const p=path[k];put(Math.round(p[0]/36),Math.round((p[1]-45)/36),T.GEAR);}
    }
    // An optional lower recovery loop is a genuine alternate catch at stage two.
    if(index>0){
      const ref=ct[2],pt=ref[21],alt=loop(pt[0]-210,pt[1]+170,88,2),begin=alt.sky.begin*length(alt);
      alt.splice(122);const end=length(alt),last=alt.at(-1),lip=ref.at(-1);
      curve(alt,last,[last[0]+140,last[1]],[lip[0]-100,lip[1]+100],lip,42);
      alt.sky={version:1,id:'loop-2-low',stage:2,begin:begin/length(alt),end:end/length(alt),recovery:true,checkpoint:true};ct.push(alt);
    }
    return {...def,width:w,height:h,ground:goalY,mail:boxes.map(b=>b.x),boxes,cells:a,ct,stages:def.radii.length,minTransfers:def.radii.length-1,goal:{x:goalX,y:goalY},
      description:`Ride ${def.radii.length} full loops and launch across open sky. Deliver papers while airborne.`,
      tip:'Hold D / right to accelerate. Tap Space when the loop turns gold to arm its exit. C throws; R retries from your last catch.'};
  }
  function encode(r){
    const meta={n:r.name,w:r.width,h:r.height,p:'speed',t:r.theme,m:r.theme==='city'?'midnight':'gearwork',ct:r.ct,cm:r.ct.map(p=>p.sky)};
    const data=[];let run=1;for(let i=1;i<=r.cells.length;i++){if(i<r.cells.length&&r.cells[i]===r.cells[i-1]&&run<255)run++;else{data.push(r.cells[i-1],run);run=1;}}
    return btoa(unescape(encodeURIComponent(JSON.stringify(meta))))+'.'+btoa(String.fromCharCode(...data));
  }
  globalThis.SkyRoutes={specs,loop,length,build};
  globalThis.DeliveryCampaign=Object.freeze({routes:specs.map((s,i)=>({...s,mail:Array(s.radii.length).fill(0),description:`${s.radii.length} connected launch loops above the clouds. No street-level shortcut.`,tip:'Accelerate. Time the gold launch sector. Catch the next rail.',stages:s.radii.length})),build,encode,medal:previous.medal,loadRecords:previous.loadRecords});
})();
