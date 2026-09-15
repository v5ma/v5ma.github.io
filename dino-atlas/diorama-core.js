// Presentation settings never mutate simulation coordinates or old save records.
import * as T from './vendor/three.module.js';
export const PRESENTATION_KEY='dino-atlas.presentation.v1';
export const APERTURES=['both','top','front'];
export const VIEWS=['first-person-vr','diorama-vr','diorama-ar'];
export function settings(raw){return {version:1,view:VIEWS.includes(raw?.view)?raw.view:'diorama-vr',aperture:APERTURES.includes(raw?.aperture)?raw.aperture:'both',width:Number.isFinite(raw?.width)?Math.max(1.2,Math.min(3.2,raw.width)):2.4};}
export function openings(aperture){return {top:aperture!=='front',front:aperture!=='top'};}
export function setOpening(aperture,face,open){const v=openings(APERTURES.includes(aperture)?aperture:'both');if(!['top','front'].includes(face))return aperture;v[face]=!!open;if(!v.top&&!v.front)v[face==='top'?'front':'top']=true;return v.top&&v.front?'both':v.top?'top':'front';}
export function readPresentation(storage){try{return settings(JSON.parse(storage?.getItem(PRESENTATION_KEY)||'null'));}catch{return settings();}}
export function savePresentation(storage,value){try{if(!storage)return false;storage.setItem(PRESENTATION_KEY,JSON.stringify(settings(value)));return true;}catch{return false;}}
export function stageMatrix(anchor,yaw,scale,center={x:0,y:0,z:0}){
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),p=new T.Vector3(center.x,center.y,center.z).multiplyScalar(scale).applyQuaternion(q).negate().add(anchor);
 return new T.Matrix4().compose(p,q,new T.Vector3(scale,scale,scale));
}
export function gameRay(ray,matrix){const inv=matrix.clone().invert();return {origin:ray.origin.clone().applyMatrix4(inv),direction:ray.direction.clone().transformDirection(inv)};}
export function stagePlanes(anchor,yaw,width,depth,height){
 const transform=new T.Matrix4().compose(anchor,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(1,1,1));
 return [new T.Plane(new T.Vector3(1,0,0),width/2),new T.Plane(new T.Vector3(-1,0,0),width/2),new T.Plane(new T.Vector3(0,0,1),depth/2),new T.Plane(new T.Vector3(0,0,-1),depth/2),new T.Plane(new T.Vector3(0,1,0),.06),new T.Plane(new T.Vector3(0,-1,0),height)].map(p=>p.applyMatrix4(transform));
}
