/* Perspective is a presentation transform only. The original orthographic
 * editor camera and side-scrolling collision plane remain untouched.
 */
'use strict';
globalThis.CloudDepthCamera=(()=>{
  let perspective=null,activeCamera=null;
  function forFrame(orthographic,view){
    if(!window.__sky?.active()||!window.__cloudDepth){activeCamera=null;return orthographic;}
    const T=__merged.THREE;
    if(!perspective){perspective=new T.PerspectiveCamera(32,1,5,10000);perspective.name='Cloudview playable perspective';}
    // Preserve the existing camera's target and visible height at the rider.
    // Distant scenery now recedes naturally instead of keeping foreground size.
    const direction=new T.Vector3();orthographic.getWorldDirection(direction);
    const target=orthographic.position.clone().addScaledVector(direction,-orthographic.position.z/direction.z);
    const offset=new T.Vector3(240,145,800),distance=offset.length();
    const halfHeight=(orthographic.top-orthographic.bottom)/2;
    perspective.fov=Math.atan(halfHeight/distance)*360/Math.PI;
    perspective.aspect=view.w/view.h;perspective.position.copy(target).add(offset);
    perspective.lookAt(target);perspective.updateProjectionMatrix();perspective.updateMatrixWorld();
    activeCamera=perspective;
    __cloudDepth.stats.camera='perspective with fixed side-scrolling physics plane';
    return perspective;
  }
  return {forFrame,get active(){return activeCamera}};
})();
