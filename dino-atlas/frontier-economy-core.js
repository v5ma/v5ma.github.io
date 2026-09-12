// Pure market model for Dino Atlas. All goods are ordinary park, research, food, or mycology supplies.
export const ECONOMY_KEY='dino-atlas.market.v1';
export const GOODS=[
 {id:'rations',name:'Ranger rations',base:38,slots:1,vol:.18,detail:'Shelf-stable food packs for remote crews.'},
 {id:'vet-kits',name:'Veterinary field kits',base:170,slots:2,vol:.23,detail:'Bandages, sterile tools and animal-care consumables.'},
 {id:'fence-coils',name:'Fence conductor coils',base:126,slots:2,vol:.27,detail:'Replacement conductors and gate-control hardware.'},
 {id:'battery-cells',name:'Field battery cells',base:92,slots:1,vol:.24,detail:'Rechargeable packs for tools, lights and sensor stations.'},
 {id:'biofuel',name:'Reserve biofuel',base:74,slots:2,vol:.25,detail:'Low-emission fuel stock for generators and service vehicles.'},
 {id:'drone-rotors',name:'Survey drone rotors',base:155,slots:2,vol:.31,detail:'Balanced replacement rotor assemblies for mapping drones.'},
 {id:'lidar',name:'LiDAR modules',base:310,slots:3,vol:.34,detail:'Precision ranging modules for habitat mapping.'},
 {id:'camera-traps',name:'Camera traps',base:118,slots:2,vol:.22,detail:'Weather-sealed wildlife monitoring cameras.'},
 {id:'wetland-reagents',name:'Wetland test reagents',base:84,slots:1,vol:.29,detail:'Water-quality and environmental assay supplies.'},
 {id:'mushroom-cultures',name:'Culinary mushroom cultures',base:64,slots:1,vol:.35,detail:'Legal edible-mushroom cultures for the park greenhouse and kitchens.'},
 {id:'mycology-substrate',name:'Mycology substrate',base:46,slots:1,vol:.28,detail:'Sterile growing substrate for culinary and ecological fungal research.'},
 {id:'fossil-resin',name:'Fossil casting resin',base:136,slots:2,vol:.26,detail:'Museum-grade casting material for replicas and teaching specimens.'}
];
export const RIVALS=[
 {id:'meridian',name:'Meridian Rangers',specialty:'wildlife response'},
 {id:'fossilworks',name:'FossilWorks Operations',specialty:'museum and excavation logistics'},
 {id:'greenline',name:'Greenline Logistics',specialty:'power, food and field supplies'}
];
export const MARKET_IDS=['base','redwood','wetland','north','mesa','coast'];
const LOCAL={
 base:{'rations':.90,'vet-kits':.94,'camera-traps':.92,'lidar':1.08},
 redwood:{'fence-coils':1.18,'camera-traps':1.13,'mycology-substrate':.86,'mushroom-cultures':.91},
 wetland:{'wetland-reagents':.76,'biofuel':1.14,'drone-rotors':1.08,'mycology-substrate':.90},
 north:{'battery-cells':.78,'lidar':.88,'rations':1.13,'vet-kits':1.09},
 mesa:{'fossil-resin':.73,'lidar':1.12,'camera-traps':1.08,'wetland-reagents':1.16},
 coast:{'biofuel':.82,'rations':1.10,'drone-rotors':.91,'mushroom-cultures':1.15}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=s=>{let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;};
export const goodById=id=>GOODS.find(g=>g.id===id);
export const rivalById=id=>RIVALS.find(r=>r.id===id);
export const cargoUsed=s=>GOODS.reduce((n,g)=>n+(Number(s.cargo?.[g.id])||0)*g.slots,0);
export const cargoCount=s=>GOODS.reduce((n,g)=>n+(Number(s.cargo?.[g.id])||0),0);
export function emptyEconomy(){return {version:1,credits:1800,capacity:32,rewardLedger:[],cargo:{},tick:0,trades:0,completed:0,lastOutpost:'base',activeContract:null,rivalPressure:{base:.18,redwood:.35,wetland:.22,north:.28,mesa:.31,coast:.24}};}
export function sanitizeEconomy(v){
 const s=emptyEconomy();if(!v||v.version!==1)return s;
 if(Array.isArray(v.rewardLedger))s.rewardLedger=[...new Set(v.rewardLedger.filter(x=>typeof x==='string'&&(x.startsWith('ranch:')||['aaa:storm-response','aaa:living-herds','aaa:northstar-canopy','aaa:crew-introductions'].includes(x))))].slice(0,64);
 if(Number.isFinite(v.credits))s.credits=clamp(Math.round(v.credits),0,9999999);if(Number.isFinite(v.capacity))s.capacity=clamp(Math.round(v.capacity),16,80);if(Number.isFinite(v.tick))s.tick=clamp(Math.floor(v.tick),0,999999);if(Number.isFinite(v.trades))s.trades=clamp(Math.floor(v.trades),0,999999);if(Number.isFinite(v.completed))s.completed=clamp(Math.floor(v.completed),0,999999);
 if(MARKET_IDS.includes(v.lastOutpost))s.lastOutpost=v.lastOutpost;
 for(const g of GOODS){const q=Number(v.cargo?.[g.id]);if(Number.isFinite(q)&&q>0)s.cargo[g.id]=clamp(Math.floor(q),0,99);}
 for(const id of MARKET_IDS){const q=Number(v.rivalPressure?.[id]);if(Number.isFinite(q))s.rivalPressure[id]=clamp(q,0,1);}
 if(v.activeContract&&MARKET_IDS.includes(v.activeContract.from)&&MARKET_IDS.includes(v.activeContract.to)&&goodById(v.activeContract.good)&&Number.isFinite(v.activeContract.qty)&&Number.isFinite(v.activeContract.reward))s.activeContract={from:v.activeContract.from,to:v.activeContract.to,good:v.activeContract.good,qty:clamp(Math.floor(v.activeContract.qty),1,8),reward:clamp(Math.floor(v.activeContract.reward),50,5000)};
 return s;
}
export function priceFor(goodId,outpostId,tick=0,pressure=0){
 const g=goodById(goodId);if(!g||!MARKET_IDS.includes(outpostId))return 0;
 const seed=hash(goodId+':'+outpostId),wave=Math.sin(tick*.63+seed*11.4)*g.vol,slow=Math.sin(tick*.17+seed*27.1)*g.vol*.42,local=LOCAL[outpostId]?.[goodId]||1,rival=1+(clamp(pressure,0,1)-.3)*.18;
 return Math.max(4,Math.round(g.base*local*rival*(1+wave+slow)));
}
export function quote(s,goodId,outpostId){const p=priceFor(goodId,outpostId,s.tick,s.rivalPressure[outpostId]||0);return {buy:p,sell:Math.max(1,Math.round(p*.82))};}
export function buy(s,goodId,outpostId,qty=1){
 const g=goodById(goodId);qty=clamp(Math.floor(qty)||1,1,8);if(!g)return {ok:false,reason:'Unknown supply item.'};const q=quote(s,goodId,outpostId),cost=q.buy*qty;if(s.credits<cost)return {ok:false,reason:'Not enough credits.'};if(cargoUsed(s)+g.slots*qty>s.capacity)return {ok:false,reason:'Cargo rack is full.'};s.credits-=cost;s.cargo[goodId]=(s.cargo[goodId]||0)+qty;s.trades++;return {ok:true,cost,price:q.buy};
}
export function sell(s,goodId,outpostId,qty=1){
 const g=goodById(goodId);qty=clamp(Math.floor(qty)||1,1,8);if(!g)return {ok:false,reason:'Unknown supply item.'};if((s.cargo[goodId]||0)<qty)return {ok:false,reason:'You do not have that cargo.'};const q=quote(s,goodId,outpostId),value=q.sell*qty;s.cargo[goodId]-=qty;if(s.cargo[goodId]<=0)delete s.cargo[goodId];s.credits+=value;s.trades++;return {ok:true,value,price:q.sell};
}
export function advanceMarket(s,steps=1){
 steps=clamp(Math.floor(steps)||1,1,12);for(let k=0;k<steps;k++){s.tick++;for(const [i,id] of MARKET_IDS.entries()){const rival=.3+.26*Math.sin(s.tick*.31+i*1.17)+.12*Math.sin(s.tick*.11+i*2.9);s.rivalPressure[id]=clamp((s.rivalPressure[id]??rival)*.7+rival*.3,.04,.92);}}return s;
}
export function contractOffer(s,from='base'){
 if(!MARKET_IDS.includes(from))from='base';const options=MARKET_IDS.filter(id=>id!==from),to=options[(s.tick+s.completed*3)%options.length],g=GOODS[(s.tick*5+s.completed*7+2)%GOODS.length],qty=2+((s.tick+s.completed)%4),buyPrice=priceFor(g.id,from,s.tick,s.rivalPressure[from]),sellPrice=priceFor(g.id,to,s.tick,s.rivalPressure[to]);return {from,to,good:g.id,qty,reward:Math.max(180,Math.round(qty*(Math.max(buyPrice,sellPrice)*.55+65)))};
}
export function acceptContract(s,from='base'){if(s.activeContract)return {ok:false,reason:'Finish the active contract first.'};s.activeContract=contractOffer(s,from);return {ok:true,contract:s.activeContract};}
export function completeContract(s,outpostId){const c=s.activeContract;if(!c)return {ok:false,reason:'No active delivery contract.'};if(c.to!==outpostId)return {ok:false,reason:'This delivery belongs at another outpost.'};if((s.cargo[c.good]||0)<c.qty)return {ok:false,reason:'Required cargo is not aboard.'};s.cargo[c.good]-=c.qty;if(s.cargo[c.good]<=0)delete s.cargo[c.good];s.credits+=c.reward;s.completed++;s.activeContract=null;advanceMarket(s,1);return {ok:true,reward:c.reward};}
