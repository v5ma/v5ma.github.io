/* Explicit same-origin travel. A link is not seamless XR or shared progression. */
export const ROAD_DESTINATIONS=Object.freeze({vesperfall:'../vesperfall/?from=vinci',vinci:'../leonardos-guild/?journey=return'});
export function createRoadTravel({save,getSession,navigate,baseURL,timers=globalThis,timeout=10000}){
 let busy=false;
 return {
  async go(destination){
   if(busy)return {ok:false,error:'A journey is already starting.'};
   if(!Object.hasOwn(ROAD_DESTINATIONS,destination))return {ok:false,error:'Unknown destination.'};
   busy=true;
   try{
    if(await save()!==true)throw Error('The checkpoint was not saved. You remain here.');
    const session=getSession();
    if(session){
     await new Promise((resolve,reject)=>{
      let done=false;
      const finish=error=>{if(done)return;done=true;timers.clearTimeout(timer);session.removeEventListener?.('end',onEnd);error?reject(error):resolve();};
      const onEnd=()=>finish();
      const timer=timers.setTimeout(()=>finish(Error('XR did not finish exiting. Use the headset exit, then retry.')),timeout);
      session.addEventListener('end',onEnd,{once:true});
      // Both an actual end event and a fulfilled end operation indicate shutdown.
      try{Promise.resolve(session.end()).then(()=>finish(),finish);}catch(error){finish(error);}
     });
    }
    const target=new URL(ROAD_DESTINATIONS[destination],baseURL);
    if(target.origin!==new URL(baseURL).origin)throw Error('Cross-origin travel was refused.');
    navigate(target.href);return {ok:true};
   }catch(error){return {ok:false,error:String(error?.message||error)};}
   finally{busy=false;}
  },
  inspect:()=>({busy})
 };
}
