/* Original instrumental scores and sample synthesis. No downloaded songs,
 * franchise melodies, AI music provider, or network service. Shared by the
 * background renderer and the offline audio tests. Times are in beats. */
(function(root){
 'use strict';
 const TAU=Math.PI*2, hz=n=>440*Math.pow(2,(n-69)/12);
 const SONGS={
  morning:{title:'Postcards at Sunrise',bpm:124,root:50,bars:48,lead:'mallet',
   chords:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,16]],
   a:[[7,1],[9,.5],[11,.5],[14,1],[11,.5],[9,.5],[7,1.5],[4,.5],[2,1],[4,1],[9,1],[7,.5],[4,.5],[2,1],[0,1],[4,.5],[7,.5],[9,1],[7,1],[null,1]],
   b:[[14,1.5],[16,.5],[14,1],[11,1],[12,.5],[11,.5],[9,1.5],[7,.5],[9,1],[11,1],[9,.5],[7,.5],[4,1],[2,.5],[4,.5],[7,2],[null,1]]},
  canal:{title:'Waterwheel Boulevard',bpm:112,root:53,bars:48,lead:'piano',
   chords:[[0,4,7,9],[5,9,12,16],[2,5,9,12],[7,11,14,17]],
   a:[[4,.5],[7,.5],[9,1],[7,.5],[4,.5],[2,1],[0,1],[2,.5],[4,.5],[7,1],[null,1],[9,1],[12,.5],[11,.5],[9,1],[7,1],[4,1.5],[2,.5],[0,2]],
   b:[[12,1],[9,.5],[7,.5],[4,1],[7,1],[14,1],[12,.5],[9,.5],[7,1],[4,1],[5,1.5],[9,.5],[12,1],[9,1],[7,1],[4,.5],[2,.5],[0,2]]},
  garden:{title:'Copperleaf Express',bpm:132,root:55,bars:48,lead:'pluck',
   chords:[[0,4,7,11],[2,5,9,12],[9,12,16,19],[5,9,12,16]],
   a:[[7,.5],[7,.5],[11,1],[14,.5],[11,.5],[9,1],[7,1],[4,.5],[7,.5],[9,1],[null,1],[12,1],[11,.5],[9,.5],[7,1],[4,1],[2,.5],[4,.5],[7,1],[9,1],[7,1]],
   b:[[16,1],[14,.5],[11,.5],[9,1],[7,1],[12,1],[9,1],[5,1],[9,1],[14,.5],[12,.5],[11,1],[9,1],[7,1],[4,1],[7,1],[2,1],[7,1]]}
 };
 function arrangement(id='morning'){
  const s=SONGS[id];if(!s)throw Error('Unknown score');const out=[];
  const note=(part,pitch,beat,len,vel=1,pan=0)=>out.push({part,pitch,beat,len,vel,pan});
  for(let bar=0;bar<s.bars;bar++){
   const chord=s.chords[Math.floor(bar/2)%4],b=bar*4,bridge=bar>=24&&bar<32,intro=bar<4,outro=bar>=44;
   // Deliberate orchestration: intro, A, B, breakdown, full reprise, turnaround.
   for(let j=0;j<4;j++)note('piano',s.root+chord[j]+12,b+j*.025,bridge?3.9:2.4,.23,j/3*.8-.4);
   if(bar%2===0)for(const j of [0,2])note('pad',s.root+chord[j]+12,b,7.9,.15,j? .65:-.65);
   for(const [beat,offset,duration]of[[0,0,.8],[1.5,7,.35],[2,0,.7],[3,12,.35],[3.5,7,.30]]){
    if(intro&&beat!==0||bridge&&beat===1.5)continue;note('bass',s.root+chord[0]-12+offset,b+beat,duration,.57,0);
   }
   if(!intro&&!bridge){for(const [step,idx]of[[.5,1],[1.25,2],[2.5,1],[3.25,3]])note('pluck',s.root+chord[idx]+12,b+step,.3,.21,step<2?-.38:.38);}
   const thin=intro||bridge||outro;
   for(const beat of thin?[0,2]:[0,1.5,2,2.75])note('kick',0,b+beat,.35,thin?.52:.75);
   for(const beat of[1,3])note('snare',0,b+beat,.2,thin?.24:.5,.09);
   for(let k=0;k<(thin?4:8);k++)note('hat',0,b+k*(thin?1:.5),.065,k%2?.15:.25,-.3);
   if(!thin&&bar%8===7)for(let k=0;k<4;k++)note('tom',48-k*2,b+3+k*.25,.18,.32,k/4-.5);
   if([4,16,32,40].includes(bar))note('shimmer',0,b,1.2,.16,.2);
  }
  for(const [start,pattern,oct,volume] of [[4,'a',0,.53],[12,'a',0,.50],[16,'b',0,.51],[24,'b',-12,.29],[32,'a',0,.60],[40,'b',0,.48]]){
   let beat=start*4;const end=Math.min((start+(start===12?4:8))*4,s.bars*4);
   let i=0;while(beat<end){const [n,dur]=s[pattern][i++%s[pattern].length];if(n!==null)note(s.lead,s.root+12+n+oct,beat,Math.min(dur*.86,end-beat),volume,Math.sin(i*.9)*.16);beat+=dur;}
  }
  return {id,...s,seconds:s.bars*4*60/s.bpm,events:out.sort((a,b)=>a.beat-b.beat)};
 }
 function sample(part,midi,duration,sr,seed=19){
  const drum=['kick','snare','hat','tom','shimmer'].includes(part);
  const len=duration+(part==='pad'?.4:part==='piano'||part==='mallet'||part==='pluck'?.7:.12),a=new Float32Array(Math.ceil(sr*len)),f=hz(midi||48);
  let rng=seed>>>0,prev=0,phase=0;const rand=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/2147483648-1;};
  // A deterministic damped string instead of a raw square-wave lead.
  const string=part==='pluck'?new Float32Array(Math.max(8,Math.round(sr/f))):null;if(string)for(let k=0;k<string.length;k++)string[k]=rand()*.75;
  for(let i=0;i<a.length;i++){
   const t=i/sr,release=t<duration?1:Math.exp(-(t-duration)*(part==='pad'?10:7)),attack=Math.min(1,t/(part==='pad'?.16:.008));let v=0;
   if(part==='kick'){phase+=TAU*(48+110*Math.exp(-t*40))/sr;v=Math.sin(phase)*Math.exp(-t*10)+rand()*.07*Math.exp(-t*100);}
   else if(part==='snare'){const noise=rand(),hi=noise-prev;prev=noise;v=.38*hi*Math.exp(-t*21)+Math.sin(TAU*185*t)*.35*Math.exp(-t*29);}
   else if(part==='hat'||part==='shimmer'){const noise=rand(),hi=noise-prev;prev=noise;v=hi*.25*Math.exp(-t*(part==='hat'?65:5));}
   else if(part==='tom')v=Math.sin(TAU*(f*t+2*(1-Math.exp(-t*30))))*Math.exp(-t*13);
   else if(part==='piano'){for(let h=1;h<=6;h++)v+=Math.sin(TAU*f*h*(1+h*h*.00006)*t)*Math.exp(-t*(.7+h*.6))/Math.pow(h,1.7);v*=.62;}
   else if(part==='mallet')v=(Math.sin(TAU*f*t)*Math.exp(-t*3)+.25*Math.sin(TAU*f*4*t)*Math.exp(-t*12)+.07*Math.sin(TAU*f*7.02*t)*Math.exp(-t*18))*.75;
   else if(part==='pluck'){const k=i%string.length,next=(k+1)%string.length;v=string[k];string[k]=.498*(string[k]+string[next]);}
   else if(part==='bass')v=(Math.sin(TAU*f*t)+.25*Math.sin(TAU*f*2*t)+.10*Math.sin(TAU*f*3*t))*.72;
   else if(part==='pad')v=(Math.sin(TAU*f*t)+.35*Math.sin(TAU*f*2*t+.02*Math.sin(t*9))+.18*Math.sin(TAU*f*1.0015*t))*.48;
   const end=Math.min(1,(a.length-1-i)/(sr*.012));a[i]=v*(drum?Math.min(1,t/.0015):attack*release)*Math.max(0,end);
  }
  return a;
 }
 function render(id='morning',sr=32000){
  if(!Number.isInteger(sr)||sr<8000||sr>48000)throw Error('Unsupported sample rate');
  const song=arrangement(id),length=Math.ceil(song.seconds*sr),l=new Float32Array(length),r=new Float32Array(length),cache=new Map(),spb=60/song.bpm;
  for(const n of song.events){const dur=Math.round(n.len*spb*1000)/1000,key=[n.part,n.pitch,dur].join(':');let a=cache.get(key);if(!a){a=sample(n.part,n.pitch,dur,sr);cache.set(key,a);}const start=Math.round(n.beat*spb*sr),vl=n.vel*Math.cos((n.pan+1)*Math.PI/4)*.29,vr=n.vel*Math.sin((n.pan+1)*Math.PI/4)*.29;for(let j=0;j<a.length;j++){const i=(start+j)%length;l[i]+=a[j]*vl;r[i]+=a[j]*vr;}}
  // Quiet stereo early reflections. The circular tails make a seamless loop.
  for(const [delay,wet] of [[.071,.09],[.139,.065],[.227,.038]]){const d=Math.round(sr*delay);for(let i=length-1;i>=0;i--){const from=(i-d+length)%length;const a=l[from],b=r[from];l[i]+=b*wet;r[i]+=a*wet;}}
  let peak=0,sum=0;for(let i=0;i<length;i++){peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));sum+=l[i]*l[i]+r[i]*r[i];}
  const gain=.78/Math.max(.78,peak);for(let i=0;i<length;i++){l[i]*=gain;r[i]*=gain;}
  return {left:l,right:r,sampleRate:sr,duration:song.seconds,title:song.title,stats:{peak:peak*gain,rms:Math.sqrt(sum/(2*length))*gain,events:song.events.length,bars:song.bars,bpm:song.bpm}};
 }
 const api={SONGS,arrangement,sample,render};root.AdventureScore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
