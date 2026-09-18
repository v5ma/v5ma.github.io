/* UNDERTOW / original 132 BPM electronic score and paired-stroke choreography.
 * New track identity: legacy recordings, chart data and score keys stay intact.
 * Synthesized on-device. No external audio, samples, model or network service. */
(function(root){'use strict';
 const TRACK={id:'undertow',name:'Undertow',subtitle:'Breakbeat / all-direction cuts',bpm:132,root:50,bars:48,style:'undertow',chartVersion:1,countInBeats:4,description:'Punchy drums, syncopated bass and a returning synth hook. Eight-direction cuts across the pool stage. No dot notes in either chart.'};
 const PARTS=[['ignition','Ignition',0,4,'Four beats in. Follow each downstroke with its return.'],['pressure','Pressure',4,12,'Bass and drums lock together. Open, then return.'],['suspension','Suspension',12,16,'Fewer strokes; keep the melody moving.'],['undertow','Undertow',16,24,'Full drums. Alternate the hands, not the camera.'],['air','Air Pocket',24,28,'Breathe. The hook answers in a quieter register.'],['crosscurrent','Crosscurrent',28,36,'Horizontal and diagonal call-and-response.'],['surge','Final Surge',36,44,'The full phrase returns with a stronger backbeat.'],['surface','Surface',44,49,'Finish the phrase. Let the last chord resolve.']];
 function sections(){return PARTS.map(([id,name,a,b,cue])=>({id,name,cue,start:a*240/TRACK.bpm,end:b*240/TRACK.bpm}));}
 // Each pair prepares the next strike: down/up, outward/inward, outward diagonal/return.
 // These indices extend the old direction array; index 6 remains the legacy dot.
 const PAIRS=[[[0,1],[0,1]],[[3,2],[2,3]],[[5,7],[4,8]],[[4,8],[5,7]]];
 function chart(difficulty='flow'){
  if(!['flow','pulse'].includes(difficulty))throw Error('Unknown Undertow chart');
  const notes=[],stroke=[0,0];
  for(let bar=1;bar<48;bar++){
   const rest=(bar>=12&&bar<16)||(bar>=24&&bar<28)||bar>=46;
   const drop=(bar>=16&&bar<24)||(bar>=36&&bar<44);
   let beats=difficulty==='flow'?(rest?[0,2]:[0,1,2,3]):(rest?[0,1,2,3]:drop?[0,.5,1,1.5,2,2.5,3,3.5]:[0,.5,1.5,2,2.5,3.5]);
   // An explicit cadence every eight bars; no surprise full-pattern reset mid-pair.
   if(bar%8===7)beats=beats.filter(b=>b<3);
   for(const b of beats){
    const hand=notes.length%2,k=stroke[hand]++,pair=Math.floor(k/2),kind=bar<3?0:pair%4,dir=PAIRS[kind][hand][k%2];
    const row=dir===0||dir===4||dir===5?1:dir===1||dir===7||dir===8?0:1;
    const wide=kind===1||kind===2,lane=hand?(wide?3:2):(wide?0:1);
    notes.push({id:notes.length,time:(bar*4+b)*60/TRACK.bpm,lane,row,hand,dir});
   }
  }
  return {...TRACK,difficulty,duration:196*60/TRACK.bpm,notes,sections:sections()};
 }
 function events(){
  const out=[],add=(part,pitch,beat,duration,velocity,pan=0)=>out.push({part,pitch,beat,duration,velocity,pan});
  const roots=[38,34,41,36],chords=[[0,3,7,10],[0,4,7,11],[0,4,7,9],[0,7,10,14]];
  const hook=[[0,74,.65],[.75,77,.25],[1.5,81,.4],[2,79,.6],[3,77,.35],[3.5,74,.35]];
  for(let bar=0;bar<48;bar++){
   const b=bar*4,ci=Math.floor(bar/2)%4,base=roots[ci],ch=chords[ci];
   const quiet=(bar>=12&&bar<16)||(bar>=24&&bar<28),drop=(bar>=16&&bar<24)||(bar>=36&&bar<44),end=bar>=46;
   const energy=end?.36:quiet?.46:drop?1:.78;
   for(const at of(end?[0]:quiet?[0,2]:bar%2?[0,.75,2,2.75]:[0,1.5,2,3.5]))add('kick',0,b+at,.35,.90*energy);
   if(!end)for(const at of[1,3]){add('snare',0,b+at,.18,.56*energy,.02);if(drop)add('clap',0,b+at+.025,.15,.22,.1);}
   for(let i=0;i<(quiet||end?4:8);i++)add('hat',0,b+i*(quiet||end?1:.5),.055,i%2?.14*energy:.20*energy,(i%2?.35:-.25));
   if(drop)for(const at of[.5,2.5])add('openhat',0,b+at,.18,.16,.32);
   if(bar%8===7&&!end)for(const at of[3.25,3.5,3.75])add('snare',0,b+at,.12,.15+(at-3)*.32,-.08);
   for(const at of(quiet||end?[0,2]:[0,.75,1.5,2,2.75,3.5]))add('bass',base+(at===3.5?12:0),b+at,quiet?.65:.35,.56*energy);
   // Held harmony and short offbeat stabs give the rhythm a harmonic spine.
   for(let j=0;j<4;j++)add('pad',base+24+ch[j],b,3.8,.085*energy,(j-1.5)*.38);
   if(!quiet&&!end)for(const at of[.5,1.5,2.5,3.5])for(let j=0;j<3;j++)add('chord',base+24+ch[j],b+at,.23,.12*energy,(j-1)*.32);
   for(const [at,pitch,len]of hook){
    if((quiet||end)&&at!==0&&at!==2)continue;
    const transpose=ci===1?-5:ci===2?-2:ci===3?-7:0;
    add('lead',pitch+transpose+(bar>=28&&bar<36?-12:0),b+at,len,.25*energy,Math.sin(bar*.8)*.14);
   }
   if(drop||bar>=28&&bar<36)for(let i=0;i<8;i++)add('arp',base+36+ch[[0,2,1,3,2,1,3,0][i]],b+i*.5,.18,.10,(i%2?.48:-.48));
   if([0,4,16,28,36,44].includes(bar))add('crash',0,b,1.4,.22);
   if([15,35,43].includes(bar))add('riser',0,b,3.7,.18);
  }
  for(const [i,pitch]of[50,57,62,65,69].entries())add('pad',pitch,192,3.9,.11,(i-2)*.2);
  return out.sort((a,b)=>a.beat-b.beat);
 }
 const TAU=2*Math.PI,hz=m=>440*2**((m-69)/12);
 function voice(part,midi,duration,rate){
  const percussive=['kick','snare','clap','hat','openhat','crash'].includes(part),tail=part==='pad'?.65:percussive?.15:.25;
  const a=new Float32Array(Math.ceil((duration+tail)*rate)),f=hz(midi||48);let seed=12559,prev=0,phase=0,lp=0;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  for(let i=0;i<a.length;i++){
   const t=i/rate,n=noise(),hp=n-prev;prev=n;let v=0;
   if(part==='kick'){phase+=TAU*(47+118*Math.exp(-t*42))/rate;v=Math.sin(phase)*Math.exp(-t*9.5)+n*.11*Math.exp(-t*145);}
   else if(part==='snare')v=hp*.42*Math.exp(-t*20)+Math.sin(TAU*182*t)*.42*Math.exp(-t*28);
   else if(part==='clap'){const env=Math.exp(-t*42)+(t>.012?Math.exp(-(t-.012)*55)*.5:0)+(t>.026?Math.exp(-(t-.026)*35)*.65:0);v=hp*.4*env;}
   else if(part==='hat'||part==='openhat')v=hp*.36*Math.exp(-t*(part==='hat'?74:16));
   else if(part==='crash')v=(hp*.3+n*.14)*Math.exp(-t*3.5);
   else if(part==='riser')v=hp*.24*Math.min(1,t/Math.max(.1,duration))*(.6+.4*Math.sin(t*t*18));
   else if(part==='bass'){
    const saw=Math.sin(TAU*f*t)+.4*Math.sin(TAU*f*2*t)+.20*Math.sin(TAU*f*3*t)+.1*Math.sin(TAU*f*4*t);
    const c=1-Math.exp(-TAU*(140+1300*Math.exp(-t*17))/rate);lp+=c*(saw-lp);v=Math.tanh(lp*1.3)*.7;
   }else if(part==='pad')v=(Math.sin(TAU*f*.997*t)+Math.sin(TAU*f*1.003*t)+.24*Math.sin(TAU*f*2*t))*.28*Math.min(1,t/.16);
   else{
    const bright=part==='lead'?1:part==='chord'?.6:.4;
    const saw=(Math.sin(TAU*f*t)+Math.sin(TAU*f*1.003*t))*.42+Math.sin(TAU*f*2*t)*.22*bright+Math.sin(TAU*f*3*t)*.12*bright+Math.sin(TAU*f*4*t)*.055*bright;
    v=saw*(.60+.40*Math.exp(-t*12))*(part==='arp'?Math.exp(-t*8):1);
   }
   const attack=Math.min(1,t/(percussive?.0015:.006)),release=t<=duration?1:Math.exp(-(t-duration)*(part==='pad'?7:24));
   a[i]=v*attack*release*Math.min(1,(a.length-1-i)/(rate*.009));
  }return a;
 }
 function render(song,rate=24000){
  if(song.id!==TRACK.id||!Number.isInteger(rate)||rate<8000||rate>48000)throw Error('Invalid Undertow audio request');
  const length=Math.ceil(song.duration*rate),beat=60/TRACK.bpm,left=new Float32Array(length),right=new Float32Array(length),ml=new Float32Array(length),mr=new Float32Array(length),cache=new Map(),kicks=[];
  for(const e of events()){
   const duration=Math.round(e.duration*beat*1000)/1000,key=[e.part,e.pitch,duration].join('/');let a=cache.get(key);if(!a){a=voice(e.part,e.pitch,duration,rate);cache.set(key,a);}
   const melodic=['lead','chord','arp','pad','bass'].includes(e.part),l=melodic?ml:left,r=melodic?mr:right,at=Math.round(e.beat*beat*rate);
   const lg=e.velocity*Math.cos((e.pan+1)*Math.PI/4),rg=e.velocity*Math.sin((e.pan+1)*Math.PI/4);
   for(let i=0;i<a.length&&at+i<length;i++){l[at+i]+=a[i]*lg;r[at+i]+=a[i]*rg;}if(e.part==='kick')kicks.push(at);
  }
  // A restrained stereo delay on the music bus, never on the kick/snare transients.
  const delay=Math.round(beat*.75*rate);for(let i=length-1;i>=delay;i--){ml[i]+=mr[i-delay]*.13;mr[i]+=ml[i-delay]*.13;}
  let next=0,last=-rate,peak=0,sum=0;
  for(let i=0;i<length;i++){
   while(next<kicks.length&&kicks[next]<=i)last=kicks[next++];
   const duck=1-.43*Math.exp(-(i-last)/(rate*.10)),fade=Math.min(1,(length-1-i)/(rate*1.3));
   left[i]=Math.tanh((left[i]+ml[i]*duck)*1.18)*.82*fade;right[i]=Math.tanh((right[i]+mr[i]*duck)*1.18)*.82*fade;
   peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));sum+=left[i]**2+right[i]**2;
  }
  left[length-1]=0;right[length-1]=0;return {left,right,rate,peak,rms:Math.sqrt(sum/(2*length))};
 }
 const api={TRACK,sections,chart,events,render};root.PrismUndertow=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
