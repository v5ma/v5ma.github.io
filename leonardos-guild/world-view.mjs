/* Temporarily present the actual complete scene. Region updates still run in
 * original coordinates; all parents/order/visibility are restored in finally. */
import * as T from './vendor/three.module.js';
import {QUARTER_BOUNDS} from './quarter-data.mjs';
export function createWorldView(view,getState){
 const root=new T.Group();root.name='Live game presentation';let adopted=[],hidden=[],fades=[];
 const quarter=view.spatial;
 function avatar(){let result=null;view.scene.traverse(o=>{if(o.userData.guildControlled&&visible(o))result=o;});return result;}
 function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
 function anchor(){const s=getState(),a=avatar();return {x:s.x,y:a?a.getWorldPosition(new T.Vector3()).y:(s.quarter?.groundY||0)+(s.lift||0),z:s.z};}
 function acquire(mode){
  if(adopted.length)throw Error('Nested world presentation');
  const a=avatar();if(mode==='first-person'&&a)hidden.push([a,a.visible]);quarter?.setPresentation(mode==='diorama'?'desktop':mode);
  if(mode==='diorama'&&a){const seen=new Set();a.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){if(seen.has(m))continue;seen.add(m);fades.push([m,m.opacity,m.transparent,m.depthWrite]);m.opacity=1;m.transparent=false;m.depthWrite=true;}});}
  view.scene.traverse(o=>{if(o.userData.xrBackdrop){hidden.push([o,o.visible]);o.visible=false;}if(mode==='first-person'&&o===a)o.visible=false;});
  adopted=[...view.scene.children];for(const o of adopted)root.add(o);return root;
 }
 function release(){for(const o of adopted)view.scene.add(o);adopted=[];quarter?.setPresentation('desktop');for(const [o,v]of hidden)o.visible=v;hidden=[];for(const [m,opacity,transparent,depthWrite]of fades){m.opacity=opacity;m.transparent=transparent;m.depthWrite=depthWrite;}fades=[];}
 return {root,bounds:QUARTER_BOUNDS,available:()=>true,anchor,acquire,release,background:()=>view.scene.background?.isColor?view.scene.background:new T.Color('#9bcceb'),blocked:(x,z,r)=>view.headBlocked?.(x,z,r)||false,scope:()=>getState().quarter?.active?'Waterwheel Quarter':getState().frontier?.zone==='badlands'?'Cinder Hollow / Stillwater':'Vinci / households / vehicles',setPresentation:v=>quarter?.setPresentation(v),setSkipRender:v=>quarter?.setSkipRender(v)};
}
