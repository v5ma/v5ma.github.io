/* Pure scoring and swept-blade geometry. No DOM, device APIs, saves or clock.
 * All times are seconds on the audio timeline. Pose discontinuities cannot hit. */
(function(root){'use strict';
 const VERSION='0.1.0',WINDOW=.17,SPEED=3.4,PLANE=-1.05,SIZE=.17;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),sub=(a,b)=>a.map((v,i)=>v-b[i]),len=a=>Math.hypot(...a),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const dirs=[[0,-1],[0,1],[1,0],[-1,0],[.707,-.707],[-.707,-.707],[0,0]];
 const TRACKS=[{id:'first-light',name:'First Light',subtitle:'Find the downbeat',bpm:104,root:50,bars:24,style:'mallet',description:'Warm keys, soft bass and wide, unhurried strokes.'},{id:'afterglow',name:'Afterglow',subtitle:'Follow the syncopation',bpm:120,root:53,bars:32,style:'pluck',description:'Bright arpeggios, swung accents and answering hands.'},{id:'ion-drift',name:'Ion Drift',subtitle:'Ride the current',bpm:136,root:55,bars:32,style:'bell',description:'A faster synth line with alternating diagonal phrases.'}];
 function chart(id='first-light',difficulty='flow'){
  const song=TRACKS.find(s=>s.id===id);if(!song||!['flow','pulse'].includes(difficulty))throw Error('Unknown track or chart');const notes=[];
  for(let bar=2;bar<song.bars;bar++){
   const steps=difficulty==='flow'?[0,2]:bar%4===3?[0,1,2,2.5,3.5]:[0,1,2,3];
   for(let j=0;j<steps.length;j++){
    const hand=(bar+j)%2,lane=hand===0?(bar%3===0?0:1):(bar%3===0?3:2),row=bar%4===2?1:0;
    const dir=difficulty==='flow'?(bar%4<2?0:6):[0,1,hand?5:4,0,6][(bar+j)%5];
    notes.push({id:notes.length,time:(bar*4+steps[j])*60/song.bpm,lane,row,hand,dir});
   }
  }
  return {...song,difficulty,duration:(song.bars*4+4)*60/song.bpm,notes};
 }
 function create(song,options={}){if(!song?.notes?.length)throw Error('A chart is required');return {song,mode:options.mode||'slice',reach:clamp(Number(options.reach)||1,.7,1.1),state:'ready',time:0,judged:{},hits:0,misses:0,bad:0,combo:0,best:0,score:0,quality:0,last:null};}
 function position(note,time,reach=1){return [(note.lane-1.5)*.43*reach,.97+note.row*.40,PLANE+(time-note.time)*SPEED];}
 function segmentPoint(a,b,p){const v=sub(b,a),l=dot(v,v),t=l?clamp(dot(sub(p,a),v)/l,0,1):0;return len(sub(mix(a,b,t),p));}
 function finish(s,n,type,quality=0){if(s.judged[n.id])return null;s.judged[n.id]=type;s.last={id:n.id,type,quality,time:s.time};if(type==='hit'){s.hits++;s.combo++;s.best=Math.max(s.best,s.combo);s.quality+=quality;const multiplier=Math.min(8,2**Math.floor(s.combo/8));s.score+=Math.round(100*quality)*multiplier;}else{s.combo=0;s[type==='miss'?'misses':'bad']++;}return s.last;}
 function advance(s,time){if(s.state!=='playing'||!Number.isFinite(time)||time<s.time)return;s.time=time;for(const n of s.song.notes)if(!s.judged[n.id]&&time-n.time>WINDOW)finish(s,n,'miss');if(time>=s.song.duration)s.state='complete';}
 function slice(s,hand,previous,current,t0,t1){
  if(s.state!=='playing'||s.mode==='keys'||![0,1].includes(hand))return [];
  if(![...previous.a,...previous.b,...current.a,...current.b,t0,t1].every(Number.isFinite))return [];
  const dt=t1-t0;if(dt<=0||dt>.085||t0<s.time-.2||Math.abs(t1-s.time)>.12)return [];
  const motion=sub(current.b,previous.b),travel=len(motion),baseTravel=len(sub(current.a,previous.a));
  if(travel/dt>18||baseTravel/dt>14||travel/dt<.45)return [];
  const nsteps=Math.min(48,Math.max(2,Math.ceil(Math.max(travel,baseTravel)/.025))),events=[];
  for(const n of s.song.notes){if(s.judged[n.id]||t0>n.time+WINDOW||t1<n.time-WINDOW)continue;
   let closest=Infinity,hitTime=t1;
   for(let k=0;k<=nsteps;k++){const f=k/nsteps,t=t0+f*dt;if(Math.abs(t-n.time)>WINDOW)continue;const d=segmentPoint(mix(previous.a,current.a,f),mix(previous.b,current.b,f),position(n,t,s.reach));if(d<closest){closest=d;hitTime=t;}}
   if(closest>SIZE)continue;
   const xy=Math.hypot(motion[0],motion[1]),direction=n.dir===6?1:(xy>.008?(motion[0]*dirs[n.dir][0]+motion[1]*dirs[n.dir][1])/xy:-1);
   if(n.hand!==hand){events.push(finish(s,n,'bad'));continue;}
   if(direction<.55){events.push(finish(s,n,'bad'));continue;}
   const quality=clamp(.45+.3*(1-Math.abs(hitTime-n.time)/WINDOW)+.25*(1-closest/SIZE),.45,1);events.push(finish(s,n,'hit',quality));
  }return events.filter(Boolean);
 }
 function tap(s,lane,time){if(s.state!=='playing'||s.mode!=='keys'||!Number.isInteger(lane))return null;const n=s.song.notes.filter(n=>n.lane===lane&&!s.judged[n.id]&&Math.abs(time-n.time)<=WINDOW).sort((a,b)=>Math.abs(time-a.time)-Math.abs(time-b.time))[0];if(!n)return null;return finish(s,n,'hit',clamp(1-Math.abs(time-n.time)/WINDOW*.55,.45,1));}
 function result(s){return {track:s.song.id,difficulty:s.song.difficulty,mode:s.mode,score:s.score,hits:s.hits,misses:s.misses,bad:s.bad,best:s.best,accuracy:s.song.notes.length?Math.round(s.quality/s.song.notes.length*1000)/10:0,complete:s.state==='complete'};}
 const api={VERSION,WINDOW,SPEED,PLANE,SIZE,TRACKS,dirs,chart,create,position,advance,slice,tap,result,segmentPoint};root.PrismCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
