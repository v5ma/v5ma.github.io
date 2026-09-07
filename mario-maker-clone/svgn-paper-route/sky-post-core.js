/* Pure run-local discovery tracking. Rewards are route stamps, not currency.
 * A preview, a forged level ID or a modeled trajectory cannot write this log. */
(function(root){
 'use strict';
 const ROUTES=[
  {id:'street',name:'Neighborhood courier',hint:'Reach the finish without entering an upper rail. The road is a complete adventure.',path:[]},
  {id:'high',name:'Clocktower and Bellflower',hint:'Use the early runway, keep your pace at the fork, then follow the hook left and its cradle right.',path:['m0','m1','m2','m3','m4','m5','m6','m7','m9','m8']},
  {id:'canal',name:'Canal explorer',hint:'Brake at Canal Fork, then rebuild speed on the lower collector and follow the long swoop.',path:['m0','m1','m2','m3','m4','b0','b1','b2','m8']},
  {id:'reentry',name:'Back into the sky',hint:'Missed the first ramp? Jump at the Canal road entrance and follow the collector to the finish.',path:['e2','b0','b1','b2','m8']},
  {id:'underside',name:'Underpass rider',hint:'Enter above the Orchard road, ride underneath the lower swoop and return to the top of the Festival glide.',path:['e4','b2','m8'],under:'b2'},
  {id:'relay',name:'Sky Post relay',hint:'After High Garden, hold Z on the violet buoy. Wind up with D, release upward-right, ride the balcony and reconnect to the Festival glide.',path:['sky-post','m8'],peg:'peg-124-18'}
 ].map(r=>Object.freeze({...r,path:Object.freeze(r.path)}));
 Object.freeze(ROUTES);
 function create(){
  const progress=Object.fromEntries(ROUTES.map(r=>[r.id,0])),earned=new Set();let usedRail=false,release=false,under=false,last=null,finished=false;
  function breakLine(){for(const k of Object.keys(progress))progress[k]=0;last=null;release=false;under=false;}
  return Object.freeze({
   step(event){
    if(finished||!event)return;
    if(event.type==='road'||event.type==='retry'){breakLine();return;}
    if(event.type==='release'&&event.peg==='peg-124-18'){release=true;return;}
    if(event.type!=='catch'||typeof event.id!=='string')return;
    usedRail=true;if(event.id===last)return;last=event.id;
    if(event.id==='b2'&&event.face===-1)under=true;
    for(const r of ROUTES){if(!r.path.length||earned.has(r.id))continue;
     let i=progress[r.id];i=event.id===r.path[i]?i+1:event.id===r.path[0]?1:0;progress[r.id]=i;
     if(i===r.path.length&&(!r.peg||release)&&(!r.under||under))earned.add(r.id);
    }
   },
   finish(){if(!finished){if(!usedRail)earned.add('street');finished=true;}return [...earned];},
   snapshot(){return {earned:[...earned],progress:{...progress},usedRail,finished};}
  });
 }
 function parse(text){const result={version:1,stamps:{}};try{const a=JSON.parse(text);if(a?.version!==1||!a.stamps||typeof a.stamps!=='object')return result;
  for(const r of ROUTES){const v=a.stamps[r.id];if(v&&Number.isFinite(v.first)&&v.first>=0&&Number.isInteger(v.finishes)&&v.finishes>=1)result.stamps[r.id]={first:v.first,finishes:Math.min(v.finishes,9999)};}
 }catch{}return result;}
 function complete(previous,ids,now){const next=parse(JSON.stringify(previous));if(!Number.isFinite(now)||now<0)throw Error('Invalid completion time');
  for(const id of new Set(ids)){if(!ROUTES.some(r=>r.id===id))continue;const v=next.stamps[id];next.stamps[id]=v?{first:v.first,finishes:Math.min(9999,v.finishes+1)}:{first:now,finishes:1};}return next;}
 root.SkyPostProgress=Object.freeze({ROUTES,create,parse,complete,key:'svgn.route-passport.v1'});
 if(typeof module!=='undefined')module.exports=root.SkyPostProgress;
})(globalThis);
