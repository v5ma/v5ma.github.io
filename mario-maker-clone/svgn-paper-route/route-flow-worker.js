'use strict';
importScripts('./grapple-core.js','./route-flow-core.js');
self.onmessage=e=>{
 const {id,job,doc,sourceID,jump}=e.data;
 try {
  if(job==='propose'){self.postMessage({id,proposal:RouteFlow.propose(doc,sourceID,{jump})});return;}
  self.postMessage({id,progress:'Tracing launch and receiving states...'});
  const audit=RouteFlow.audit(doc),witnesses=RouteFlow.witnesses(doc,{maxStates:1000});
  self.postMessage({id,audit,witnesses});
 }catch(error){self.postMessage({id,error:error.message});}
};
