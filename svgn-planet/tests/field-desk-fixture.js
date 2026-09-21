/* Test device only: expose a local-floor pose from the existing synthetic XR runtime. */
(()=>{
 const request=navigator.xr.requestSession.bind(navigator.xr);
 navigator.xr.requestSession=async(...args)=>{
  const session=await request(...args),reference=session.requestReferenceSpace.bind(session);
  session.requestReferenceSpace=async type=>{
   const space=await reference(type);
   if(type==='local-floor')space.pose={position:{x:0,y:-1.65,z:0},orientation:{x:0,y:0,z:0,w:1}};
   return space;
  };
  return session;
 };
})();
