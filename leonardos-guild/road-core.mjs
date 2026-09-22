/* The Road Beyond the Lanterns: local solo adventure, not an online economy.
 * Pure action plans. No DOM, networking, hidden rewards or live-state assignment.
 * Only commitRoadReview publishes an already-persisted transaction to memory. */
export const ROAD_BUILD='guild-lantern-road-20260922';
export const ROAD_NODES=Object.freeze([
 {id:'guild',name:'Leonardo / Guild charter',x:-8,z:3,sign:'GUILD CHARTER\nROAD OF LANTERNS'},
 {id:'table',name:'Tessa / Common Table',x:10.8,z:24,sign:'COMMON TABLE\nPROVISIONS'},
 {id:'maps',name:'Mara / Map House',x:-10.8,z:61,sign:'MAP HOUSE\nIDENTIFICATION'},
 {id:'glass',name:'Ilaria / Lantern Glassworks',x:10.8,z:98,sign:'LANTERN GLASS\nWORKSHOP'},
 {id:'gate',name:'Expedition Gate / frontier lantern',x:0,z:-17,sign:'THE FRONTIER\nVESPERFALL'}
]);
export const ROAD_ITEMS=Object.freeze({
 herbs:{name:'Medicinal herbs',type:'Material',buy:3,sell:1,shop:'table',detail:'Two bundles and one linen make one travel tonic.'},
 linen:{name:'Clean linen',type:'Material',buy:4,sell:1,shop:'table',detail:'Used with herbs at the Common Table.'},
 tonic:{name:'Travel tonic',type:'Consumable',buy:12,sell:5,shop:'table',detail:'Restores up to 30 vitality. Not consumed at full health.'},
 glass:{name:'Clear glass',type:'Material',buy:4,sell:1,shop:'glass',detail:'Two pieces and one brass fitting make a saleable lens.'},
 brass:{name:'Brass fitting',type:'Material',buy:6,sell:2,shop:'glass',detail:'A workshop component for crafted lenses.'},
 lens:{name:'Polished trade lens',type:'Crafted material',buy:18,sell:9,shop:'glass',detail:'A saleable lens, separate from the bound story component.'},
 parcel:{name:'Sealed survey parcel',type:'Quest material',bound:true,detail:'Guild-owned glass and fittings. Reserved for the frontier signal lens.'},
 chart:{name:'Unidentified route chart',type:'Quest evidence',bound:true,detail:'Its faded marks need Mara at the Map House. Not for sale.'},
 route:{name:'Identified lantern-route chart',type:'Quest evidence',bound:true,detail:'Mara identifies a road linking Vinci to the Vesperfall frontier.'},
 signal:{name:'Frontier signal lens',type:'Quest component',bound:true,detail:'Install it at the expedition gate. Not for sale.'},
 seal:{name:'Lantern-road guild seal',type:'Keepsake',bound:true,detail:'Recognition for restoring the frontier signal. No hidden combat bonus.'}
});
export const ROAD_STEPS=Object.freeze([
 ['guild','A place worth returning to.','Meet Leonardo at the Guild charter beside his workshop. Help Vinci reconnect with the wider fantasy world.'],
 ['maps','The missing route.','Find Mara at the Map House. Her old chart may explain the silent frontier lantern.'],
 ['maps','Read before you rebuild.','Ask Mara to identify the faded route chart. This charter covers the service; no fee is required.'],
 ['glass','A craft shared by many hands.','Take the sealed survey parcel to Ilaria at Lantern Glassworks. Commission the signal lens.'],
 ['gate','Light the road beyond Vinci.','Install Ilaria\'s lens at the expedition gate. Cinder Hollow remains nearby; Vesperfall is the farther frontier.'],
 ['guild','Bring the discovery home.','Report the restored signal to Leonardo at the Guild charter. The town needs knowledge as much as fighters.'],
 ['gate','The road is open.','The frontier lantern is restored. Prepare supplies, visit Vesperfall, or continue the original Vinci adventures.']
]);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const bounded=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const copy=v=>JSON.parse(JSON.stringify(v));
export function roadState(raw, fresh=false){
 const r={version:1,stage:0,tracking:fresh,selected:'',items:{},revision:0,receipts:[],away:false,returned:false};
 if(!raw||raw.version!==1)return r;
 if(bounded(raw.stage,6))r.stage=raw.stage;
 r.tracking=raw.tracking===true;r.selected=ROAD_NODES.some(n=>n.id===raw.selected)?raw.selected:'';
 r.away=raw.away===true;r.returned=raw.returned===true;
 if(bounded(raw.revision,100000000))r.revision=raw.revision;
 for(const id of Object.keys(ROAD_ITEMS))if(bounded(raw.items?.[id],99)&&raw.items[id]>0)r.items[id]=raw.items[id];
 // Quest custody is reconstructed from its checkpoint, never purchased or sold.
 for(const id of ['parcel','chart','route','signal','seal'])delete r.items[id];
 if(r.stage>=1&&r.stage<=3)r.items.parcel=1;
 if(r.stage===2)r.items.chart=1;
 if(r.stage>=3)r.items.route=1;
 if(r.stage===4)r.items.signal=1;
 if(r.stage===6)r.items.seal=1;
 if(Array.isArray(raw.receipts))r.receipts=raw.receipts.filter(x=>x&&bounded(x.id,100000000)&&typeof x.action==='string'&&x.action.length<80&&typeof x.summary==='string'&&x.summary.length<600&&bounded(x.balance,10000000)).slice(-12).map(x=>({id:x.id,action:x.action,summary:x.summary,balance:x.balance}));
 return r;
}
export function saveRoad(r){return roadState(r);}
export function inRoadTown(s){return !s.quarter?.active&&(!s.frontier||s.frontier.zone==='town')&&!s.doors?.level&&!s.life?.inside;}
export function roadNear(s,id){const n=ROAD_NODES.find(x=>x.id===id);return !!n&&inRoadTown(s)&&s.mode==='foot'&&Math.abs(s.speed||0)<=1.7&&Math.hypot(s.x-n.x,s.z-n.z)<=3.5;}
export function roadTarget(s){if(!inRoadTown(s)||!s.road?.tracking)return null;const id=s.road.selected||ROAD_STEPS[s.road.stage][0];return {...ROAD_NODES.find(n=>n.id===id),level:0};}
export function roadText(s){const target=roadTarget(s);if(!target)return null;const step=ROAD_STEPS[s.road.stage];return {tag:'THE ROAD BEYOND THE LANTERNS / '+(s.road.stage===6?'CHARTER COMPLETE':'CHAPTER '+(s.road.stage+1)),title:s.road.selected?target.name:step[1],text:s.road.selected?'Visit '+target.name+' on foot. Inventory and the original notebook remain available from the field desk.':step[2]};}
export function roadFingerprint(s){return JSON.stringify([s.credits,s.health,s.road]);}
function plan(s,action){
 const r=copy(s.road||roadState()),items=r.items;let credits=s.credits,health=s.health,summary='',merchant='Guild charter';
 const fail=error=>({ok:false,error});
 const need=id=>roadNear(s,id);
 const add=(id,n)=>{const q=(items[id]||0)+n;if(q<0||q>99)throw Error('Not enough items or stack capacity.');if(q)items[id]=q;else delete items[id];};
 const spend=n=>{if(credits<n)throw Error('Not enough florins.');credits-=n;};
 try{
 if(action==='track'){r.tracking=true;r.selected='';summary='Track The Road Beyond the Lanterns.';}
 else if(action==='untrack'){r.tracking=false;r.selected='';summary='Return to the original Vinci objective.';}
 else if(action.startsWith('mark:')){const id=action.slice(5);if(!ROAD_NODES.some(n=>n.id===id))return fail('Unknown destination.');r.tracking=true;r.selected=id;summary='Map destination selected. Travel there to interact.';}
 else if(action==='accept'){
  if(!need('guild')||r.stage!==0)return fail('Meet Leonardo on foot beside the Guild charter.');
  r.stage=1;r.tracking=true;r.selected='';add('parcel',1);credits+=20;summary='Accept the survey charter. Receive 20 florins and one bound survey parcel, once.';
 }else if(action==='recover-chart'){
  if(!need('maps')||r.stage!==1)return fail('Bring the charter to Mara at the Map House.');
  r.stage=2;add('chart',1);summary='Mara lends one faded route chart. It is quest evidence, not trade stock.';
 }else if(action==='identify-chart'){
  if(!need('maps')||r.stage!==2||!items.chart)return fail('Mara needs the faded chart at the Map House.');
  r.stage=3;add('chart',-1);add('route',1);summary='Identify the route chart. The charter covers the fee: 0 florins. It names Vesperfall beyond Vinci\'s frontier.';
 }else if(action==='craft-signal'){
  if(!need('glass')||r.stage!==3||!items.parcel||!items.route)return fail('Bring the identified chart and sealed parcel to Ilaria.');
  r.stage=4;add('parcel',-1);add('signal',1);summary='Ilaria crafts one frontier signal lens from the sealed parcel. No florins or other inventory items are spent.';
 }else if(action==='install'){
  if(!need('gate')||r.stage!==4||!items.signal)return fail('Stop on foot at the expedition gate with the signal lens.');
  r.stage=5;add('signal',-1);summary='Install the frontier lens. The gate lantern remains lit in your saved adventure. Return to Leonardo.';
 }else if(action==='report'){
  if(!need('guild')||r.stage!==5)return fail('Report the restored signal at the Guild charter.');
  r.stage=6;add('seal',1);credits+=30;summary='Receive 30 florins and the lantern-road guild seal, once. The Vesperfall journey is now available at the gate.';
 }else if(action==='depart'){
  if(!need('gate')||r.stage!==6)return fail('Finish the charter and stop on foot at the expedition gate.');
  if(s.cycle?.active)return fail('Finish or cancel the active road test before travelling.');
  r.away=true;summary='Save Vinci before visiting Vesperfall. Its separate expedition, equipment and currency are not transferred. XR ends before the next game opens.';
 }else if(action==='returned'){
  if(!r.away)return fail('No outbound journey is recorded.');r.away=false;r.returned=true;summary='Welcome back to Vinci. No expedition completion or reward is inferred from visiting another game.';
 }else if(action.startsWith('buy:')||action.startsWith('sell:')){
  const [kind,id]=action.split(':');if(!own(ROAD_ITEMS,id))return fail('Unknown item.');const d=ROAD_ITEMS[id];
  if(d.bound||!Number.isInteger(d.buy)||!Number.isInteger(d.sell))return fail('Quest property cannot be traded.');
  if(!need(d.shop))return fail('Visit this item\'s merchant on foot to trade.');merchant=ROAD_NODES.find(n=>n.id===d.shop).name;
  if(kind==='buy'){spend(d.buy);add(id,1);summary='Buy 1 '+d.name+' for '+d.buy+' florins.';}else{add(id,-1);credits+=d.sell;summary='Sell 1 '+d.name+' for '+d.sell+' florins.';}
 }else if(action==='craft:tonic'||action==='craft:lens'){
  const id=action.slice(6),shop=id==='tonic'?'table':'glass';if(!need(shop))return fail('Visit the appropriate workshop on foot.');
  const a=id==='tonic'?'herbs':'glass',b=id==='tonic'?'linen':'brass';add(a,-2);add(b,-1);add(id,1);merchant=ROAD_NODES.find(n=>n.id===shop).name;summary='Craft 1 '+ROAD_ITEMS[id].name+'. Consume 2 '+ROAD_ITEMS[a].name+' and 1 '+ROAD_ITEMS[b].name+'. No florin fee.';
 }else if(action==='use:tonic'){
  const max=100+12*(s.life?.attrs?.vitality||0);
  if(s.health>=max)return fail('Vitality is full; nothing is consumed.');
  if(s.health<=0)return fail('Recover first; a tonic cannot revive a defeated character.');
  add('tonic',-1);health=Math.min(max,s.health+30);summary='Use 1 travel tonic. Restore '+Math.round(health-s.health)+' vitality, up to '+max+'.';
 }else return fail('Unknown guild action.');
 if(!bounded(credits,10000000)||!Number.isFinite(health)||r.revision>=100000000)return fail('Balance or record limit reached.');
 if(r.stage!==s.road?.stage){r.selected='';r.tracking=true;}
 r.revision++;r.receipts.push({id:r.revision,action,summary,balance:credits});r.receipts=r.receipts.slice(-12);
 return {ok:true,road:r,credits,health,summary,merchant};
 }catch(e){return fail(e.message);}
}
export function reviewRoadAction(s,action){const p=plan(s,action);if(!p.ok)return p;return Object.freeze({ok:true,action,summary:p.summary,merchant:p.merchant,before:s.credits,after:p.credits,expected:roadFingerprint(s)});}
export function commitRoadReview(s,review,persist){
 if(typeof persist!=='function')return {ok:false,error:'A durable save is required.'};
 if(!review?.ok||review.expected!==roadFingerprint(s))return {ok:false,error:'The offer or inventory changed. Review it again; nothing was spent.'};
 const p=plan(s,review.action);
 if(!p.ok)return p;
 if(review.summary!==p.summary||review.after!==p.credits||review.merchant!==p.merchant)return {ok:false,error:'The reviewed offer changed. Review it again.'};
 const next={...s,road:p.road,credits:p.credits,health:p.health};
 try{if(persist(next)!==true)throw Error('Storage did not confirm the save.');}catch(e){return {ok:false,error:'Not completed: '+e.message+' Nothing was spent.'};}
 s.road=p.road;s.credits=p.credits;s.health=p.health;
 return {ok:true,summary:p.summary};
}
