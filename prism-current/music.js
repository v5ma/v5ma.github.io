/* Three original instrumental scores composed for Prism Current. Synthesized
 * locally, not copied or streamed songs. Shared beat grid with the note charts. */
(function(root){'use strict';const TAU=Math.PI*2,hz=n=>440*2**((n-69)/12);
 function events(song){const notes=[],add=(part,pitch,beat,duration,velocity=.4,pan=0)=>notes.push({part,pitch,beat,duration,velocity,pan});
  const chords=[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]],melodies=[[7,9,11,14,11,9,7,4],[12,11,9,7,4,7,9,11],[14,16,14,11,9,7,4,2]];
  for(let bar=0;bar<song.bars;bar++){
   const b=bar*4,ch=chords[Math.floor(bar/2)%4],breakdown=bar>=12&&bar<16,thin=bar<2||breakdown;
   for(let j=0;j<4;j++)add('pad',song.root+12+ch[j],b,3.8,.105,(j-1.5)/2);
   for(const t of(thin?[0,2]:[0,1.5,2,3.5]))add('bass',song.root+ch[0]-12+(t===3.5?7:0),b+t,.42,.48);
   for(const t of(thin?[0,2]:[0,1.5,2,2.75]))add('kick',0,b+t,.28,.58);
   for(const t of[1,3])add('snare',0,b+t,.17,thin?.17:.30,.1);
   for(let j=0;j<8;j++)add('hat',0,b+j*.5,.045,j%2?.09:.17,-.25);
   if(!thin)for(let j=0;j<8;j++)add('pluck',song.root+12+ch[j%4],b+j*.5,.24,.13,Math.sin(j)*.4);
   if(bar>=2){const motif=melodies[Math.floor(bar/8)%3];for(let j=0;j<4;j++)if(!(bar%4===3&&j===3))add(song.style,song.root+12+motif[(bar*4+j)%8],b+j+(j%2&&song.id==='afterglow'?.15:0),j===3?.7:.48,breakdown?.22:.39,Math.sin(j+bar)*.15);}
   if(bar<2)add('click',0,b, .05,.26);
  }return notes;
 }
 function sample(part,midi,duration,rate){const a=new Float32Array(Math.ceil((duration+.6)*rate)),f=hz(midi||48);let seed=1234567,phase=0,prev=0;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  for(let i=0;i<a.length;i++){const t=i/rate;let v=0;if(part==='kick'){phase+=TAU*(46+90*Math.exp(-t*38))/rate;v=Math.sin(phase)*Math.exp(-t*13);}else if(part==='snare'){const n=noise();v=.45*(n-prev)*Math.exp(-t*28)+.18*Math.sin(TAU*174*t)*Math.exp(-t*33);prev=n;}
   else if(part==='hat'){const n=noise();v=.22*(n-prev)*Math.exp(-t*85);prev=n;}else if(part==='click')v=Math.sin(TAU*1100*t)*Math.exp(-t*95)*.5;
   else if(part==='pad')v=(Math.sin(TAU*f*t)+.2*Math.sin(TAU*f*2.003*t))*.45*Math.min(1,t/.10);
   else if(part==='bass')v=(Math.sin(TAU*f*t)+.23*Math.sin(TAU*f*2*t))*.6;
   else if(part==='mallet')v=(Math.sin(TAU*f*t)*Math.exp(-t*2)+.2*Math.sin(TAU*f*4*t)*Math.exp(-t*12))*.6;
   else if(part==='bell')v=(Math.sin(TAU*f*t)*Math.exp(-t*1.8)+.24*Math.sin(TAU*f*2.01*t)*Math.exp(-t*5))*.5;
   else v=(Math.sin(TAU*f*t)+.3*Math.sin(TAU*f*2*t)+.12*Math.sin(TAU*f*3*t))*Math.exp(-t*6)*.55;
   const release=t<duration?1:Math.exp(-(t-duration)*12);a[i]=v*Math.min(1,t/.003)*release*Math.min(1,(a.length-1-i)/(rate*.01));
  }return a;
 }
 function render(song,rate=24000){if(!Number.isInteger(rate)||rate<8000||rate>48000)throw Error('Bad sample rate');const length=Math.ceil(song.duration*rate),left=new Float32Array(length),right=new Float32Array(length),cache=new Map(),beat=60/song.bpm;
  for(const e of events(song)){const dur=Math.round(e.duration*beat*1000)/1000,k=[e.part,e.pitch,dur].join('/');let a=cache.get(k);if(!a){a=sample(e.part,e.pitch,dur,rate);cache.set(k,a);}const at=Math.round(e.beat*beat*rate),l=e.velocity*Math.cos((e.pan+1)*Math.PI/4)*.46,r=e.velocity*Math.sin((e.pan+1)*Math.PI/4)*.46;for(let j=0;j<a.length&&at+j<length;j++){left[at+j]+=a[j]*l;right[at+j]+=a[j]*r;}}
  for(const [d,g]of[[.087,.09],[.167,.06]]){const delay=Math.round(d*rate);for(let i=length-1;i>=delay;i--){left[i]+=right[i-delay]*g;right[i]+=left[i-delay]*g;}}
  let peak=0,sum=0;for(let i=0;i<length;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));sum+=left[i]**2+right[i]**2;}const gain=.78/Math.max(.78,peak);for(let i=0;i<length;i++){left[i]*=gain;right[i]*=gain;}return {left,right,rate,peak:peak*gain,rms:Math.sqrt(sum/(2*length))*gain};
 }
 root.PrismMusic=Object.freeze({events,render});if(typeof module!=='undefined')module.exports=root.PrismMusic;
})(globalThis);
