/* Public presentation contract. No mode changes canonical positions or save layouts. */
import * as T from './vendor/three.module.js';
export const MODES=Object.freeze(['first-person-vr','third-person-vr','diorama-first-vr','diorama-third-vr','first-person-ar','third-person-ar','diorama-first-ar','diorama-third-ar']);
export function modeInfo(mode){
 const aliases={'diorama-vr':'diorama-third-vr','diorama-ar':'diorama-third-ar'};mode=aliases[mode]||mode;
 if(!MODES.includes(mode))throw Error('Unknown XR view: '+mode);
 return {id:mode,ar:mode.endsWith('-ar'),portal:mode.startsWith('diorama'),first:mode.startsWith('first')||mode.startsWith('diorama-first'),session:mode.endsWith('-ar')?'immersive-ar':'immersive-vr'};
}
export function modeLabel(mode){const m=modeInfo(mode);return (m.portal?'Diorama / ':'')+(m.first?'First person':'Third person')+' / '+(m.ar?'AR':'VR');}
const up=new T.Vector3(0,1,0);
export function presentationMatrix({feet,basis,origin,heading,settings,mode}){
 const m=modeInfo(mode),anchor=origin.clone().add(new T.Vector3(0,settings.height-4*settings.scale,-settings.distance).applyAxisAngle(up,heading));
 const portalSize=new T.Vector3(49*settings.scale,17*settings.scale,43*settings.scale);
 const rotation=heading+(m.portal?settings.rotation:0),q=new T.Quaternion().setFromAxisAngle(up,rotation);
 const scale=m.portal&&!m.first?settings.scale*2:1;
 // First-person maps the character's eyes to the calibrated physical eye pose.
 // Third-person places the actual courier ahead, not on a textured rectangle.
 const target=m.first?origin.clone().add(new T.Vector3(0,-1.65,0)):
  m.portal?anchor.clone().add(new T.Vector3(0,4*settings.scale,0)):
  origin.clone().add(new T.Vector3(0,-2.4,-4.5).applyAxisAngle(up,heading));
 const source=new T.Matrix4().copy(basis);source.setPosition(feet);
 const matrix=new T.Matrix4().compose(target,q,new T.Vector3(scale,scale,scale)).multiply(source.invert());
 return {matrix,anchor,portalSize,target,scale,rotation};
}
