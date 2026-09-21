import * as T from './vendor/three.module.js';
/* Original Rainward spatial UI. Layout is stored separately from campaign saves.
 * Coordinates are captured at summon, never continuously attached to gaze.
 * The virtual base is calibrated, not a detected physical floor or room anchor. */
export const DESK_KEY='svgn.rainward.v1.field-desk';
export const DESK_DEFAULTS=Object.freeze({height:-.12,distance:1.45,scale:.82,yaw:0,pedestal:true,motion:false});
const bounds={height:[-.55,.45],distance:[1,2.2],scale:[.65,1.12],yaw:[-.7,.7]};
export function deskOptions(value={}){
 const v=value&&typeof value==='object'?value:{},out={};
 for(const [key,[min,max]]of Object.entries(bounds))out[key]=typeof v[key]==='number'&&Number.isFinite(v[key])?Math.max(min,Math.min(max,v[key])):DESK_DEFAULTS[key];
 out.pedestal=v.pedestal!==false;out.motion=v.motion===true;return out;
}
export function readDesk(storage){try{return deskOptions(JSON.parse(storage?.getItem(DESK_KEY)||'{}'));}catch{return deskOptions();}}
export function writeDesk(storage,value){try{storage?.setItem(DESK_KEY,JSON.stringify(deskOptions(value)));return !!storage;}catch{return false;}}
export function deskAnchor(head){
 if(!head?.position||!head?.orientation)return null;
 const {position:p,orientation:q}=head;
 if(![p.x,p.y,p.z,q.x,q.y,q.z,q.w].every(Number.isFinite))return null;
 const forward=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));
 return {x:p.x,y:p.y,z:p.z,yaw:Math.atan2(-forward.x,-forward.z)};
}
export function deskTransform(anchor,options){
 if(!anchor)return null;const p=deskOptions(options),yaw=anchor.yaw+p.yaw;
 const position=new T.Vector3(0,p.height,-p.distance).applyAxisAngle(new T.Vector3(0,1,0),yaw).add(new T.Vector3(anchor.x,anchor.y,anchor.z));
 return {position,yaw,scale:p.scale,baseY:anchor.y-1.62};
}
export function createFieldDesk(panel,rig,storage){
 let options=readDesk(storage),anchor=null,open=false,recalled=true,lift=0,saved=true;
 const root=new T.Group();root.name='Rainward summonable field desk';rig.add(root);
 const material=new T.MeshBasicMaterial({color:0x23423e,transparent:true,opacity:.88,depthTest:false,depthWrite:false});
 const accent=new T.MeshBasicMaterial({color:0xc6d7b5,transparent:true,opacity:.9,depthTest:false,depthWrite:false});
 const mesh=(geometry,mat=material)=>{const m=new T.Mesh(geometry,mat);m.renderOrder=9998;root.add(m);return m;};
 const base=mesh(new T.CylinderGeometry(.36,.4,.025,32)),column=mesh(new T.CylinderGeometry(.023,.033,1,12)),rim=mesh(new T.TorusGeometry(.34,.008,6,32),accent),shelf=mesh(new T.CylinderGeometry(.30,.31,.025,32));rim.rotation.x=Math.PI/2;root.visible=false;
 function place(mode,head,pinned=false){
  const next=mode!=='play'||pinned;
  if(!next){open=false;panel.visible=false;return;}
  if(!anchor||!open||recalled){const nextAnchor=deskAnchor(head);if(!nextAnchor){panel.visible=false;root.visible=false;return;}anchor=nextAnchor;recalled=false;}
  open=true;apply();
 }
 function apply(){
  const t=deskTransform(anchor,options);if(!t)return;
  panel.position.copy(t.position);panel.rotation.set(0,t.yaw,0);panel.scale.setScalar(t.scale);panel.visible=open;panel.updateMatrix();
  root.position.set(t.position.x,t.baseY,t.position.z);root.rotation.set(0,t.yaw,0);root.scale.setScalar(1);
  const top=Math.max(.2,t.position.y-.725*t.scale-.04-t.baseY),height=.035+(top-.035)*lift;
  base.position.y=.018;rim.position.y=.04;shelf.position.y=height;column.scale.y=Math.max(.01,height);column.position.y=height/2;
  root.visible=options.pedestal&&(open||lift>.01);rig.updateMatrixWorld(true);
 }
 function update(dt){const target=open?1:0;if(!options.motion)lift=target;else{const step=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0))*6;lift+=Math.sign(target-lift)*Math.min(Math.abs(target-lift),step);}apply();}
 function change(key,delta){options=deskOptions({...options,[key]:options[key]+delta});saved=writeDesk(storage,options);apply();}
 const action=(label,id,run)=>({label,id,run});
 function actions(){return [
  action('LOWER / '+options.height.toFixed(2)+' m','desk-lower',()=>change('height',-.1)),action('RAISE / '+options.height.toFixed(2)+' m','desk-raise',()=>change('height',.1)),
  action('CLOSER / '+options.distance.toFixed(2)+' m','desk-closer',()=>change('distance',-.15)),action('FARTHER / '+options.distance.toFixed(2)+' m','desk-farther',()=>change('distance',.15)),
  action('SMALLER / '+Math.round(options.scale*100)+'%','desk-smaller',()=>change('scale',-.08)),action('LARGER / '+Math.round(options.scale*100)+'%','desk-larger',()=>change('scale',.08)),
  action('ROTATE LEFT','desk-left',()=>change('yaw',.1)),action('ROTATE RIGHT','desk-right',()=>change('yaw',-.1)),
  action('RECALL HERE / KEEP MY SIZE','desk-recall',()=>{recalled=true;}),
  action('RESET COMFORTABLE POSITION','desk-reset',()=>{options=deskOptions();saved=writeDesk(storage,options);recalled=true;}),
  action('PEDESTAL: '+(options.pedestal?'ON':'OFF'),'desk-pedestal',()=>{options.pedestal=!options.pedestal;saved=writeDesk(storage,options);apply();}),
  action('PEDESTAL MOTION: '+(options.motion?'ON':'OFF'),'desk-motion',()=>{options.motion=!options.motion;saved=writeDesk(storage,options);})
 ];}
 return {place,update,actions,recall(){recalled=true;},reset(){anchor=null;open=false;recalled=true;lift=0;panel.visible=false;root.visible=false;},stats:()=>({open,anchor:anchor?{...anchor}:null,options:{...options},saved,lift,visible:root.visible,reference:'summon-local; calibrated virtual base, not a room anchor',panel:panel.matrix.toArray()}),dispose(){root.removeFromParent();root.traverse(o=>o.geometry?.dispose());material.dispose();accent.dispose();}};
}
