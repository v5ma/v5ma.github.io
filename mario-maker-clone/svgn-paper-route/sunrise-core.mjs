/* Sunrise Borough's additive practice branch and observable skill challenge. */
export const BUILD='sky-cycle-sunrise-2026.09.12';
export const BRANCH='sunrise-market';
export const STORE='svgn.skycycle.sunrise.v1';
export function practicePath(ground=2160){
  const pts=[];
  const curve=(a,b,c,d,n)=>{for(let i=pts.length?1:0;i<=n;i++){const t=i/n,u=1-t;pts.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}};
  curve([1610,ground-86],[1730,ground-86],[1760,ground-160],[1880,ground-160],36);
  curve([1880,ground-160],[2000,ground-160],[2130,ground-130],[2190,ground-130],36);
  pts.sky={version:1,kind:'open',optional:true,network:true,id:BRANCH,begin:0,end:1,tier:1,sector:1,roadDepth:24,label:'Market Pocket Park',shape:'practice-balcony',entry:true};
  return pts;
}
export function upgradeCourse(d){
  if(d?.id!=='first-neighborhood'||d.kind!=='ground'||d.gp?.sunrise?.version===1)return d;
  const extra=practicePath(d.ground*36);extra.sky.stage=d.ct.length;
  return {...d,ct:[...d.ct,extra],gp:{...d.gp,sunrise:{version:1,branch:BRANCH,name:'Penny\'s Market Pilot',entry:1610,exit:2190}}};
}
export function freshRun(){return {phase:'approach',riding:0,lastS:null,departedAt:0,steps:0,landed:false,finished:false,incidents:0};}
export function observe(run,sample){
  if(!run||run.finished||!sample||!Number.isFinite(sample.x))return;
  run.steps++;
  if(sample.dead){run.lastS=null;run.riding=0;if(!run.landed)run.phase='approach';return;}
  if(sample.rail===BRANCH){
    if(run.phase==='approach')run.phase='ride';
    if(Number.isFinite(sample.s)){if(run.lastS!==null)run.riding+=Math.max(0,Math.min(40,sample.s-run.lastS));run.lastS=sample.s;}
  }else{
    // A legitimate exit needs sustained forward riding, not grazing the deck.
    if(run.lastS!==null){if(run.riding>=150&&sample.x>=2140){run.phase='return';run.departedAt=run.steps;}else if(!run.landed){run.phase='approach';run.riding=0;}run.lastS=null;}
    if(run.phase==='return'&&sample.road&&sample.x>=2190&&sample.x<=2850&&run.steps-run.departedAt<150){run.landed=true;run.phase='finish';}
    if(run.phase==='return'&&(run.steps-run.departedAt>=150||sample.x>2850)){run.phase='approach';run.riding=0;}
  }
}
export function incident(run){if(!run||run.finished)return;run.incidents++;run.lastS=null;run.riding=0;if(!run.landed)run.phase='approach';}
export function sanitize(raw){return {marketPilot:raw?.marketPilot===true,finishes:Number.isSafeInteger(raw?.finishes)?Math.max(0,Math.min(1000000,raw.finishes)):0};}
export function settle(records,run,accepted){
  const next=sanitize(records);
  if(!accepted||!run||run.finished||!run.steps)return {records:next,fresh:false,banked:false};
  run.finished=true;const earned=run.landed;const fresh=earned&&!next.marketPilot;
  if(earned){next.marketPilot=true;next.finishes=Math.min(1000000,next.finishes+1);}
  return {records:next,fresh,banked:earned};
}
export function mission(run,record,saveOK=true){
  const banked=sanitize(record).marketPilot;
  return {title:"Penny's Market Pilot",intro:'Try the low Pocket Park balcony in Market Lanes, return to the road, then finish Sunrise Borough. It is an optional detour, not a gate.',banked,saveOK,steps:[
    {title:'Ride the pocket park',detail:'Jump toward the marked low balcony and keep moving across it.',done:banked||!!run&&(run.riding>=150||run.landed)},
    {title:'Return wheels down',detail:'Leave its far end and land on the market road without a crash.',done:banked||!!run?.landed},
    {title:'Finish your delivery route',detail:'Cross the existing striped finish to bank the Market Pilot seal.',done:banked}
  ]};
}
export function cues(d,K){
  if(!d?.gp?.sunrise)return [];
  const gy=d.ground*36;
  const out=[{id:'choice',x:1470,y:gy-154,title:'POCKET PARK',detail:'LOW DETOUR / ROAD STAYS OPEN',kind:'choice'},
    {id:'jump',x:1540,y:gy-72,title:'JUMP',detail:'AIM FOR THE LOW GOLD DECK',kind:'jump'},
    {id:'return',x:2500,y:gy-152,title:'WHEELS DOWN',detail:'REJOIN THE MARKET ROAD',kind:'return'}];
  const fork=d.ct.find(p=>p.sky?.id==='m4');
  if(fork&&K){const tr=K.rail(fork,fork.sky),q=K.sample(tr,Math.max(0,tr.len-125));out.push({id:'brake',x:q.x,y:q.y-90,title:'CANAL FORK',detail:'BRAKE: LOW / HOLD PACE: HIGH',kind:'brake'});}
  const first=d.ct.find(p=>p.sky?.id==='m0');
  if(first){out.push({id:'runway',x:first[0][0]-120,y:gy-164,title:'GOLD RUNWAY',detail:'JUMP TO TRY / ROAD TO CONTINUE',kind:'choice'});}
  for(const id of ['m1','b0']){const p=d.ct.find(p=>p.sky?.id===id);if(!p)continue;out.push({id:'catch-'+id,x:p[0][0]+70,y:p[0][1]-95,title:'RECEIVING DECK',detail:'MATCH THE CURVE / KEEP MOVING',kind:'catch'});}
  return out;
}
