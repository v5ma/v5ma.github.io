/* A dedicated worker owns private grip settings and copied document data. */
'use strict';
importScripts('./grapple-core.js','./rail-grip-core.js','./workshop-core.js','./bezier-core.js','./ride-lab-core.js');
self.onmessage=event=>{
 const {id,code,settings,compare,liveSeed}=event.data||{};
 try{const doc=WorkshopCore.decode(code);const traces=compare?RideLabCore.compare(doc,settings):[RideLabCore.trace(doc,settings,liveSeed)];self.postMessage({id,traces});}
 catch(error){self.postMessage({id,error:String(error.message||error).slice(0,300)});}
};
