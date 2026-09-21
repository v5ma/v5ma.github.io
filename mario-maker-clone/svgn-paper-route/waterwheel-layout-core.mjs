/* Original Waterwheel r2 authoring candidate. Builds documents, never player state.
 * Preview is isolated by the existing Workshop; no campaign layout is replaced. */
import {FORK} from './waterwheel-fork-core.mjs';
export const ID='canal-choices';
export const REVISION=2;
export const RECORD_ID='canal-choices-r2';
export const PREVIEW='waterwheel-r2-preview';
export const REGIONS=Object.freeze([
 {x:0,name:'South Quay Post Office',scene:'village'},
 {x:24,name:'Parcel Market',scene:'market'},
 {x:61,name:'Service Bridge',scene:'canal'},
 {x:92,name:'Express Junction',scene:'canal'},
 {x:135,name:'Millworkers Court',scene:'market'},
 {x:176,name:'Waterwheel Galleries',scene:'canal'},
 {x:222,name:'Wheelhouse Depot',scene:'festival'}
].map(Object.freeze));
export const TRANSFERS=Object.freeze([
 {id:'porch',from:'road',to:'ww-porch',entry:940,approach:[760,860],receiver:'Parcel porch',recovery:[1480,2020],onward:'road',status:'candidate'},
 {id:'runway',from:'road',to:'ww-runway',entry:3200,approach:[3020,3110],receiver:'Express runway',recovery:[3200,4610],onward:'ww-crescent',status:'candidate'},
 {id:'crescent',from:'ww-runway',to:'ww-crescent',receiver:'Open mill crescent',recovery:[4070,5310],onward:'ww-gallery',status:'candidate'},
 {id:'gallery',from:'ww-crescent',to:'ww-gallery',receiver:'Rolling gallery',recovery:[4980,6630],onward:'ww-finish',status:'candidate'},
 {id:'finish',from:'ww-gallery',to:'ww-finish',receiver:'Wheelhouse landing',recovery:[7280,8890],onward:'road',status:'candidate'}
].map(x=>Object.freeze({...x,approach:x.approach&&Object.freeze(x.approach),recovery:Object.freeze(x.recovery)})));
// Delivery targets are authored as a rhythm on the complete road. None is required
// to finish this non-awarding preview. Each target has a reason to exist and is
// separated from the next target and from encounter centers so a paper throw does
// not compete with an unreadable combat or route-choice moment.
export const DELIVERIES=Object.freeze([
 {id:'south-quay-warmup',tx:12,region:'South Quay Post Office',role:'teaching',intent:'Broad flat warm-up for a direct paper throw before the first route choice.'},
 {id:'parcel-market-front',tx:27,region:'Parcel Market',role:'ordinary',intent:'A market doorstep that establishes the delivery purpose of the neighborhood.'},
 {id:'parcel-porch-return',tx:42,region:'Parcel Market',role:'return-reward',intent:'The road target immediately after the short porch rejoins the market.'},
 {id:'service-bridge-post',tx:68,region:'Service Bridge',role:'ordinary',intent:'A calm post after the first court encounter and before the terrace crest.'},
 {id:'service-terrace-crest',tx:83,region:'Service Bridge',role:'control',intent:'A broad crest rewards carrying enough control to throw without stopping the ride.'},
 {id:'express-road-choice',tx:101,region:'Express Junction',role:'road-choice',intent:'A road delivery beneath the optional express line makes staying low an intentional choice.'},
 {id:'canal-observation-stop',tx:117,region:'Express Junction',role:'discovery',intent:'A quieter canal-side doorstep gives road riders time to read the aerial network above.'},
 {id:'millworkers-arrival',tx:138,region:'Millworkers Court',role:'ordinary',intent:'An arrival delivery resets the rhythm after the express decision.'},
 {id:'millworkers-terrace',tx:157,region:'Millworkers Court',role:'control',intent:'A terraced delivery rewards braking and stable approach rather than maximum speed.'},
 {id:'gallery-gate',tx:176,region:'Waterwheel Galleries',role:'ordinary',intent:'A readable doorstep before the gallery encounter, not on its receiving deck.'},
 {id:'waterwheel-overlook',tx:206,region:'Waterwheel Galleries',role:'discovery',intent:'A landmark-facing delivery ties the waterwheel to the road journey and upper route.'},
 {id:'wheelhouse-finale',tx:238,region:'Wheelhouse Depot',role:'finale',intent:'A final optional doorstep after the last encounter and before the depot flags.'}
].map(Object.freeze));
function curve(points,a,b,c,d,n=64){for(let i=points.length?1:0;i<=n;i++){const t=i/n,u=1-t;points.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}}
function rail(id,label,segments,{entry=false,tier=2,sector=3,...extra}={}){
 const p=[];for(const s of segments)curve(p,...s);
 p.sky={version:1,kind:'open',optional:true,network:true,id,label,begin:0,end:1,roadDepth:34,shape:'authored-waterwheel',entry,tier,sector,...extra};return p;
}
export function paths(){return [
 rail('ww-porch','Parcel porch / return to market',[
  [[940,2074],[1015,2074],[1060,2026],[1160,2026]],
  [[1160,2026],[1270,2026],[1390,2026],[1480,2074]]],{entry:true,tier:1,sector:1}),
 rail('ww-runway','Express runway',[
  [[3200,2074],[3400,2074],[3540,2040],[3640,1960]],
  [[3640,1960],[3800,1840],[3850,1740],[4000,1700]]],{entry:true}),
 rail('ww-crescent','Open mill crescent',[
  [[4320,1670],[4480,1900],[4870,1840],[4870,1550]],
  [[4870,1550],[4870,1380],[4630,1360],[4610,1550]],
  [[4610,1550],[4590,1740],[4820,1740],[5000,1640]]]),
 rail('ww-gallery','High postal gallery',[
  [[5400,1550],[5480,1780],[5850,1760],[6100,1640]],
  [[6100,1640],[6320,1540],[6650,1480],[6970,1520]],
  [[6970,1520],[7130,1540],[7250,1600],[7380,1630]]],{sector:5}),
 rail('ww-finish','Wheelhouse landing and descent',[
  [[7620,1830],[7780,2130],[8110,1990],[8310,2020]],
  [[8310,2020],[8400,2040],[8480,2074],[8550,2074]]],{tier:1,sector:6}),
 rail('ww-collector','Canal collector / road recovery',[
  [[4060,1970],[4320,2030],[4740,2050],[4980,2076]]],{tier:1,sector:3}),
 rail('ww-court-return','Mill court lower return',[
  [[5640,2020],[5810,1920],[6050,1920],[6290,2050]]],{tier:1,sector:4})
 ];}
export function groundRow(tx){
 // Broad one-tile terraces use the existing step-up rule, not route-specific physics.
 if(tx>=65&&tx<72||tx>=84&&tx<91)return 59;
 if(tx>=72&&tx<84)return 58;
 if(tx>=142&&tx<151||tx>=162&&tx<171)return 59;
 if(tx>=151&&tx<162)return 58;
 return 60;
}
export function build(T,{groundOnly=false}={}){
 for(const name of ['STEEL','START','GOAL','MAILBOX','CHECK','SHIELD','BLOOP','GEAR'])if(!Number.isInteger(T?.[name]))throw new TypeError('Missing tile '+name);
 const width=256,height=70,ground=60,cells=new Uint8Array(width*height),put=(x,y,id)=>{if(x<0||x>=width||y<0||y>=height)throw new RangeError('Tile outside authored bounds');cells[y*width+x]=id;};
 for(let x=0;x<width;x++)for(let y=groundRow(x);y<height;y++)put(x,y,T.STEEL);
 put(3,59,T.START);put(251,59,T.GOAL);
 const roadBoxes=DELIVERIES.map(x=>x.tx);
 for(const x of roadBoxes)put(x,groundRow(x)-1,T.MAILBOX);
 for(const x of [53,94,132,173,220])put(x,groundRow(x)-1,T.CHECK);
 // Separated court encounters. Receiving decks are not ambush locations.
 for(const x of [56,125,183,225])put(x,groundRow(x)-1,T.SHIELD);
 for(const x of [60,130,190,230])put(x,groundRow(x)-1,T.BLOOP);
 for(const [a,b] of [[7,22],[30,47],[103,112],[200,211],[241,245]])for(let x=a;x<=b;x+=4)if(!cells[(groundRow(x)-1)*width+x])put(x,groundRow(x)-1,T.GEAR);
 const ct=groundOnly?[]:paths();ct.forEach((p,i)=>p.sky.stage=i);
 const boxes=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(cells[y*width+x]===T.MAILBOX)boxes.push({x,y});
 const gp={version:1,adventure:2,index:1,style:'canal',ground,groundStart:true,quota:0,stages:0,minTransfers:0,requiredGrapples:0,bonusPerRail:100,finishOnly:true,
  sections:REGIONS.map(x=>({...x})),cast:[
   {id:'penny',name:'Penny',x:6,y:60,text:'This is a Workshop preview. Ride the whole delivery road, or try the porch and return. No campaign records are awarded.'},
   {id:'otto',name:'Otto',x:25,y:60,text:'The porch is a short detour. It returns to this market, not the express route.'},
   {id:'milo',name:'Milo',x:92,y:60,text:'Keep speed for the high gallery. Brake on the striped runway, then release for the canal and Millworkers deliveries. The road stays open.'},
   {id:'fern',name:'Fern',x:175,y:60,text:'The wheelhouse is ahead. Deliver first, then read the gallery encounter; the sky route stays optional.'},
   {id:'pip',name:'Pip',x:247,y:60,text:'Cross the flags to finish the preview. Return to Workshop to edit; your campaign records stay unchanged.'}],
  waterwheel:{revision:REVISION,preview:true,groundOnly,plannedRecordID:RECORD_ID,landmark:{x:7930,y:1880,radius:190},transfers:TRANSFERS.map(x=>({...x})),deliveries:DELIVERIES.map(x=>({...x})),fork:groundOnly?null:{...FORK,decisionRemaining:[...FORK.decisionRemaining]}}};
 if(!groundOnly)gp.skyNetwork={version:1,sectors:REGIONS.map((r,i)=>({id:'ww-sector-'+i,name:r.name,x:r.x*36,y:1180,w:1250,h:1000})),links:TRANSFERS.filter(x=>x.from!=='road').map(x=>({from:x.from,to:x.to,type:'unqualified-authoring-candidate'})),mainIDs:['ww-runway','ww-crescent','ww-gallery','ww-finish'],pegCount:0,groundOptional:true};
 return {id:ID,name:'Waterwheel Boulevard / r2 preview',district:'WATERWHEEL / AUTHORING PREVIEW',description:'South Quay, Parcel Market, Service Bridge, Express Junction, Millworkers Court and Wheelhouse Depot. The ground road is complete; sky connections are candidates, not certified routes.',tip:'Ride the promenade. B or C throws a paper near a mailbox. Sky detours stay optional; preview saves no campaign progress.',difficulty:'WORKSHOP PREVIEW',music:'canal',theme:'hills',width,height,ground,cells,ct,boxes,mail:boxes.map(p=>p.x),roadBoxes,goal:{x:251,y:60},kind:'ground',quota:0,par:250,stages:0,minTransfers:0,requiredGrapples:0,gp};
}
export function recordKey(id,revision){
 if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)||!Number.isSafeInteger(revision)||revision<1||revision>99)throw new TypeError('Invalid layout identity');
 return revision===1?id:id+'-r'+revision;
}
