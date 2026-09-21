/* XRManager owns the eye framebuffer/texture. Spatial drawing must remain on
 * that target, not take a detour through the desktop theatre texture. */
import * as T from './vendor/three.module.js';
export function beginXRPass(renderer,theatreTarget,spatial){
 const record={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),scissorTest:renderer.getScissorTest(),spatial:!!spatial};
 renderer.xr.enabled=false;
 if(!spatial){renderer.setRenderTarget(theatreTarget);renderer.setScissorTest(false);renderer.setViewport(0,0,1024,576);}
 return record;
}
export function restoreXRPass(renderer,record){
 if(!record)return;
 // Never infer that null means the headset's framebuffer. Restore the exact
 // WebXRManager target, including its projection-layer attachments.
 if(renderer.getRenderTarget()!==record.target)renderer.setRenderTarget(record.target);
 renderer.setViewport(record.viewport);renderer.setScissor(record.scissor);renderer.setScissorTest(record.scissorTest);renderer.xr.enabled=true;
}
