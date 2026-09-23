/* Courier's Light: read-only guidance and intent validation. The expedition
 * model still owns every mechanism, target, reward and saved world. */
(function(root){'use strict';
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
 function holster(head,forward,floor,bowLeft=true){
  if(!vec(head)||!vec(forward)||!Number.isFinite(floor))return null;
  const length=Math.hypot(forward[0],forward[2]);
  const f=length>.001?[forward[0]/length,0,forward[2]/length]:[0,0,-1],sign=bowLeft?1:-1;
  return [head[0]-f[2]*sign*.25+f[0]*.46,Math.max(floor+.38,head[1]-.64),head[2]+f[0]*sign*.25+f[2]*.46];
 }
 function guide(s,head,forward,W,P,R){
  if(!s||!vec(head)||!vec(forward))return {title:'Courier lantern',detail:'No bearing available',point:null};
  const goal=W.goal(s,P,R),point=goal?.point;
  if(!vec(point))return {title:goal?.text||'Courier lantern',detail:goal?.detail||'Explore the cloister',point:null};
  const dx=point[0]-head[0],dz=point[2]-head[2],length=Math.hypot(forward[0],forward[2]);
  const fx=length>.01?forward[0]/length:0,fz=length>.01?forward[2]/length:-1;
  const angle=Math.atan2(-fz*dx+fx*dz,fx*dx+fz*dz),distance=Math.hypot(dx,dz),height=point[1]-s.p[1];
  const word=Math.abs(angle)>2.35?'behind':angle>.55?'right':angle<-.55?'left':'ahead';
  return {title:goal.text,detail:Math.round(distance)+' m '+word+(height>2?' / upper level':height<-.7?' / below':''),point:[...point],distance,angle};
 }
 function canOperate(s,control,origin,direction,C,W,K){
  return !!(s?.phase==='playing'&&control&&vec(origin)&&vec(direction)&&vec(s.head)&&W.aimed(s,control,origin,direction,C)&&K.visible(s,s.head,origin,C)&&K.visible(s,origin,control.point,C));
 }
 const api=Object.freeze({holster,guide,canOperate});root.CourierLanternModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
