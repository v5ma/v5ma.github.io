/* Tideglass Baths: deterministic additive destination, no browser dependencies. */
export const BUILD='sky-cycle-tideglass-2026.09.13';
export const ID='tideglass-baths';
export const RAIL='bathhouse-waterline';
export const STORE='svgn.skycycle.bathhouse.v1';
export const VALVE=1800;
export const DRAIN_TICKS=150;
export const SPEC=Object.freeze({id:ID,name:'Tideglass Baths',district:'PORTAL 01 / THE WATER DESTINATION',theme:'city',music:'canal',difficulty:'RELAXED / OPTIONAL WATERLINE RUN',par:160,quota:0,width:168,height:70,ground:60,kind:'ground',style:'canal',stages:0,minTransfers:0,requiredGrapples:0,description:'Enter the tiled bathhouse. Follow the dry promenade beside three luminous pools, open the sluice, and discover a waterline detour. The exit portal is always reachable on the dry road.',tip:'Ride with A/D or the stick. Jump with Space or A. E or D-pad Down operates nearby portals and the sluice.'});
function curve(a,b,c,d,n=36){return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];});}
export function waterline(){const y=2160,p=curve([2260,y-86],[2320,y-86],[2350,y-128],[2440,y-128]);p.push(...curve([2440,y-128],[2530,y-128],[2630,y-128],[2690,y-86]).slice(1));p.sky={version:1,id:RAIL,kind:'open',stage:0,begin:0,end:1,optional:true,network:true,tier:1,sector:1,roadDepth:34,label:'Sluice waterline run',shape:'practice-balcony',entry:true};return p;}
export function make(T){
 const s=SPEC,cells=new Uint8Array(s.width*s.height),put=(x,y,t)=>{cells[y*s.width+x]=t;};
 for(let y=s.ground;y<s.height;y++)for(let x=0;x<s.width;x++)put(x,y,T.STEEL);
 put(3,59,T.START);put(s.width-5,59,T.GOAL);
 const mail=[15,43,83,122,151];mail.forEach(x=>put(x,59,T.MAILBOX));
 for(const x of [37,78,118,149])put(x,59,T.CHECK);
 for(let x=8;x<s.width-7;x+=5)if(!cells[59*s.width+x])put(x,59,T.GEAR);
 for(const x of[25,99,137])put(x,59,T.SHIELD);
 // The dry road is intentionally continuous; all jump and sluice tasks are optional.
 const p=waterline();for(let i=15;i<p.length-7;i+=14){const q=p[i],x=Math.floor(q[0]/36),y=Math.floor((q[1]-45)/36);put(x,y,T.GEAR);}
 const sections=[{x:0,name:'Arrival Rotunda',scene:'village'},{x:36,name:'Sluice Gallery',scene:'market'},{x:63,name:'Mirror Pool',scene:'canal'},{x:99,name:'Lantern Baths',scene:'garden'},{x:137,name:'Return Arcade',scene:'festival'}];
 const cast=[{id:'mara',name:'Mara',x:8,y:60,text:'Welcome to Tideglass. The dry promenade reaches the return portal. Waterline discoveries are optional.'},{id:'keeper',name:'Keeper Sol',x:46,y:60,text:'Stop at the brass sluice wheel. Press E or D-pad Down to lower Mirror Pool and reveal its rail.'},{id:'echo',name:'Echo',x:131,y:60,text:'Ride the revealed waterline and finish to bank a Bathhouse Keeper seal. You can also just enjoy the pools.'}];
 const gp={version:1,adventure:2,index:3,style:'canal',ground:60,groundStart:true,quota:0,stages:0,minTransfers:0,requiredGrapples:0,bonusPerRail:100,finishOnly:true,sections,cast,bathhouse:{version:1,id:ID,valve:VALVE,rail:RAIL},skyNetwork:{version:1,groundOptional:true,mainIDs:[],pegCount:0,links:[],sectors:sections.map((v,i)=>({id:'bath-'+i,name:v.name,x:v.x*36,y:1750,w:1200,h:420}))}};
 return {...s,cells,ct:[p],mail,boxes:mail.map(x=>({x,y:59})),roadBoxes:mail,goal:{x:s.width-5,y:60},gp};
}
export function fresh(){return {steps:0,opened:false,drain:0,railDistance:0,lastS:null,rode:false,finished:false,incidents:0};}
export function canOperate(s,p){return !!s&&!s.finished&&!s.opened&&Number.isFinite(p?.x)&&Math.abs(p.x-VALVE)<145&&Math.abs(p.y-2130)<70&&!p.dead;}
export function operate(s,p){if(!canOperate(s,p))return false;s.opened=true;return true;}
export function observe(s,p){if(!s||s.finished)return;s.steps++;if(s.opened)s.drain=Math.min(DRAIN_TICKS,s.drain+1);if(p?.dead){s.lastS=null;return;}if(s.drain===DRAIN_TICKS&&p?.rail===RAIL&&Number.isFinite(p.s)){if(s.lastS!==null)s.railDistance+=Math.max(0,Math.min(40,p.s-s.lastS));s.lastS=p.s;if(s.railDistance>=140)s.rode=true;}else s.lastS=null;}
export function sanitize(r){return {visits:Number.isSafeInteger(r?.visits)?Math.max(0,Math.min(1000000,r.visits)):0,keeper:r?.keeper===true};}
export function settle(record,s,accepted){const next=sanitize(record);if(!accepted||!s||s.finished||s.steps<1)return {record:next,banked:false,fresh:false};s.finished=true;next.visits=Math.min(1000000,next.visits+1);const earn=s.opened&&s.rode,fresh=earn&&!next.keeper;next.keeper=next.keeper||earn;return {record:next,banked:true,fresh};}
export function status(s){return !s?.opened?'Explore the dry promenade. At the brass wheel: E / D-pad Down opens the sluice.':s.drain<DRAIN_TICKS?'Mirror Pool is draining. Its waterline rail will emerge shortly.':!s.rode?'Waterline open. Jump from the mint approach to try the optional rail.':'Waterline discovered. Cross the return portal to bank the Keeper seal.';}
export const POOLS=Object.freeze([{x:1010,width:1210,sluice:false},{x:2620,width:1320,sluice:true},{x:4310,width:1430,sluice:false}]);
