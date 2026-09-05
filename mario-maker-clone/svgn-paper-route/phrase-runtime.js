/* Collision and readable choices, not steering assistance. All positive paths
 * work without a bump. Misses meet the same 34px road bodies that are drawn. */
(function(){'use strict';function boot(){
 const state={brushes:[],speedSamples:[],branch:null};let source=null,rails=[];
 const active=()=>__ground.active()&&__ground.meta?.flowPlan?.version===2;
 function compile(){if(source===tracks)return;source=tracks;rails=PhrasePlayback.compile(tracks.filter(t=>t.sky?.network).map(t=>({points:t.pts,meta:t.sky})));}
 const spawn=spawnWorld;window.spawnWorld=function(x,y){spawn(x,y);source=null;state.brushes=[];state.branch=null;};
 const step=stepPlayer;window.stepPlayer=function(){if(!active())return step();compile();const p=player,previous=[p.x+p.w/2,p.y+p.h/2],old=p.track;step();if(player!==p||p.dead>0)return;
  if(!p.track&&!p.onGround){const hit=PhrasePlayback.sweepBody(previous,[p.x+p.w/2,p.y+p.h/2],rails);if(hit){PhrasePlayback.deflect(p,hit);state.brushes.push({id:hit.id,step:__ground.state.steps,x:p.x,y:p.y});if(state.brushes.length>120)state.brushes.shift();}}
  if(p.track!==old&&p.track){state.branch=p.track.sky.id;}
 };
 const render=window.render;window.render=function(){render();if(!active()||__delivery.state.menu||RouteWorkshop.active)return;const p=player,tr=p.track;
  if(tr?.sky.id==='m4'){const remaining=tr.len-p.trackS;document.getElementById('cloud-flight-label').textContent=remaining<190?'YOUR CHOICE: HOLD D TO CLIMB / BRAKE A FOR CANAL SPRINT':'CANAL FORK AHEAD: TWO DIFFERENT ROUTES';}
  else if(tr?.sky.id==='m6'||tr?.sky.id==='m7')document.getElementById('cloud-flight-label').textContent='FOLLOW THE HOOK LEFT; THE NEXT CRADLE BRINGS YOU RIGHT';
  else if(p.peg)document.getElementById('cloud-flight-label').textContent='EXPERT TRANSFER: WIND, RELEASE, READ THE NEXT CATCHER';
 };
 window.__phrases={state,active,get rails(){compile();return rails}};
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
