/* Read-only riding cues for the authored Hookline course. A cue never changes
 * velocity, grip, inputs, points, or progression. Edited/other layouts opt out. */
(function(root){
 'use strict';
 function cue({course, stage, position, speed, peg, won}) {
  if(course!=='hookline-run'||peg||won||!Number.isFinite(position)||!Number.isFinite(speed))return null;
  if(stage===2){
   if(speed<-.1)return {id:'backtrack',text:'BACKTRACKING / D CHANGES DIRECTION; Z CAN CATCH A PEG'};
   if(position<.835)return speed>19?{id:'brake',text:'LONG CRADLE / HOLD A TO TRIM SPEED BEFORE THE RISING EXIT'}:{id:'runup',text:'LONG CRADLE / KEEP MOMENTUM FOR THE NEXT LAUNCH'};
   return {id:'release-brake',text:'RISING EXIT / RELEASE THE BRAKE AND HOLD D TOWARD THE RECEIVER'};
  }
  if(stage===3)return {id:'finish',text:'RECEIVING ROAD / FOLLOW THE ROLLING CURVE DOWN TO THE DEPOT'};
  return null;
 }
 root.HooklineFeedback=Object.freeze({cue});
 if(typeof document==='undefined')return;
 const previous=root.render;
 root.render=function(){
  previous();
  if(!root.__grapple?.isOpen()||root.RouteWorkshop?.active||root.__delivery?.state.menu||root.__delivery?.state.route!==3)return;
  const p=player,tr=p?.track,s=cue({course:__sky.state.data?.id,stage:tr?.sky.stage,position:tr?tr.len? p.trackS/tr.len:NaN:NaN,speed:p?.speed,peg:!!p?.peg,won});
  if(!s)return;
  const label=document.getElementById('cloud-flight-label'),hint=document.getElementById('delivery-hint');
  if(label){label.textContent=s.text;label.dataset.ridingCue=s.id;}
  if(hint)hint.textContent=s.text;
 };
})(globalThis);
