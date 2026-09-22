/* Startup/recovery only. No gameplay state, storage, room poses or bindings. */
export function createXRStartupWatch({current,timeout,delay=12000,timers=globalThis}){
 let timer=null,owner=null,phase='idle',expired=false;
 function stop(){if(timer!==null)timers.clearTimeout(timer);timer=null;owner=null;}
 function stage(session,next){
  stop();owner=session;phase=next;expired=false;
  timer=timers.setTimeout(()=>{
   timer=null;if(owner!==session||current()!==session)return;
   expired=true;owner=null;timeout(next);
  },delay);timer?.unref?.();
 }
 return {stage,stop,inspect:()=>({phase,expired,armed:timer!==null})};
}

export function bindGraphicsRecovery({canvas,failure,detail,pause,release,restore}){
 let lost=false,owned=false,count=0,restored=0;
 const message='Graphics were interrupted. Waiting for graphics recovery; your saved adventure is unchanged.';
 function onLost(event){
  event.preventDefault();if(lost)return;lost=true;count++;
  // Do not overwrite an independent fatal error or dismiss it on restoration.
  owned=failure.hidden;if(owned){detail.textContent=message;failure.hidden=false;}
  release();pause();
 }
 function onRestored(){
  if(!lost)return;lost=false;restored++;release();
  try{restore();}
  catch(error){owned=false;detail.textContent='Graphics recovery failed: '+String(error?.message||error);failure.hidden=false;return;}
  if(owned&&detail.textContent===message){failure.hidden=true;detail.textContent='';}
  owned=false;
 }
 canvas.addEventListener('webglcontextlost',onLost);
 canvas.addEventListener('webglcontextrestored',onRestored);
 return {isLost:()=>lost,inspect:()=>({lost,interruptions:count,restorations:restored}),dispose(){canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);}};
}
