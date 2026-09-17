/* Presentation only: physical exhibit configuration, not rider coordinates. */
export const DEFAULT_STAGE=Object.freeze({scale:1,height:0,distance:2.4,yaw:0});
export function stageSettings(value={}) {
  const clamp=(v,d,a,b)=>Number.isFinite(+v)?Math.max(a,Math.min(b,+v)):d;
  return {scale:clamp(value.scale,1,.6,1.8),height:clamp(value.height,0,-.75,.75),distance:clamp(value.distance,2.4,1.4,4),yaw:clamp(value.yaw,0,-180,180)};
}
export function sessionOptions(mode) {
  if(!['immersive-vr','immersive-ar'].includes(mode))throw new TypeError('Unknown immersive mode');
  // No camera pixels are requested. The browser owns the AR passthrough layer.
  return {optionalFeatures:['hand-tracking','local-floor']};
}
export function presentation({workshop=false,legacyEditor=false,view='3d',theater=false}={}) {
  if(workshop)return 'workshop';
  if(legacyEditor)return 'editor';
  return theater||view==='2d'?'screen':'diorama';
}
export function clipPlanes(T, matrix, config) {
  const s=stageSettings(config),w=1.5*s.scale,h=.95*s.scale,z=s.distance;
  return [new T.Plane(new T.Vector3(1,0,0),w),new T.Plane(new T.Vector3(-1,0,0),w),
    new T.Plane(new T.Vector3(0,1,0),h-s.height),new T.Plane(new T.Vector3(0,-1,0),h+s.height),
    new T.Plane(new T.Vector3(0,0,1),z+.8*s.scale),new T.Plane(new T.Vector3(0,0,-1),-z+.5*s.scale)]
    .map(p=>p.applyMatrix4(matrix));
}
