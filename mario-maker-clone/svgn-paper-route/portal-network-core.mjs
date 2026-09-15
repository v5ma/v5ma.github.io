/* Authored destinations only. Stable IDs resolve against the live campaign. */
export const BUILD='sky-cycle-portals-2026.09.14';
export const DESTINATIONS=Object.freeze([
 Object.freeze({id:'tideglass-baths',slot:'PORTAL 01',name:'Tideglass Baths',button:'bathhouse-enter',action:'Enter Tideglass Baths',color:'#8edccc',pattern:'tiles',tone:174,subtitle:'TILED POOLS / WATERLINE DISCOVERY',description:'Ride the dry promenade through three vaulted pools. Open the brass sluice to uncover the optional waterline rail. Swimming is not part of this route.'}),
 Object.freeze({id:'first-neighborhood',slot:'HOME PORTAL',name:'Sunrise Borough',button:'bathhouse-return',action:'Start Sunrise Borough',color:'#ffd18e',pattern:'sunrise',tone:330,subtitle:'MARKET STREETS / POCKET PARK',description:'Return to the original neighborhood. Deliver along the lower road or try Penny\'s optional Market Pocket Park line.'})
]);
export function resolveDestination(id,routes,catalog=DESTINATIONS){
 const d=catalog.find(d=>d.id===id);if(!d)return null;
 const matches=routes.map((r,i)=>r.id===id?i:-1).filter(i=>i>=0);
 return matches.length===1?{...d,index:matches[0]}:null;
}
export function travelGate(id,routes,{dirty=false,ready=false}={}){
 if(dirty)return {ok:false,reason:'Save or export the unsaved Workshop draft before traveling.'};
 if(!ready)return {ok:false,reason:'The campaign is still loading. Travel is not available yet.'};
 const destination=resolveDestination(id,routes);
 return destination?{ok:true,destination}:{ok:false,reason:'That destination is not available in this campaign.'};
}
export const DEPARTURE='Travel starts a new route run. Unfinished progress is not banked or carried. Saved medals, discoveries, records and Workshop drafts stay intact.';
