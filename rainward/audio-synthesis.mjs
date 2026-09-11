/* Original bounded sample synthesis; no external audio dependencies. */
export function seeded(seed=1){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
const freq=n=>440*2**((n-69)/12),tau=2*Math.PI;
export function synthesize(kind,seconds=1,rate=24000,seed=1,midi=57){
 const out=new Float32Array(Math.max(1,Math.ceil(seconds*rate))),rand=seeded(seed),f=freq(midi);let low=0,mid=0,phase=0;const step=kind.startsWith('step-'),surface=step?kind.slice(5):'';
 for(let i=0;i<out.length;i++){const t=i/rate,u=i/out.length,n=rand()*2-1;low+=.026*(n-low);mid+=.20*(n-mid);let v=0;
  if(['felt','glass','pluck','bow','bass'].includes(kind)){
   const attack=Math.min(1,t/(kind==='bow'?.7:.012)),end=Math.min(1,(seconds-t)/.22),decay=Math.exp(-t*(kind==='bow'?.13:kind==='glass'?1.1:kind==='pluck'?2.2:1.6));
   v=(Math.sin(tau*f*t)+.30*Math.sin(tau*f*2.002*t)*Math.exp(-t*2)+.15*Math.sin(tau*f*3*t)*Math.exp(-t*3));
   if(kind==='glass')v+=.28*Math.sin(tau*f*2.756*t)*Math.exp(-t*1.6);if(kind==='pluck')v+=mid*.8*Math.exp(-t*32);
   if(kind==='bow')v=(Math.sin(tau*f*t+Math.sin(t*4.5)*.01)+.22*Math.sin(tau*f*2*t))*(.95+.05*Math.sin(t*5.6));if(kind==='bass')v=Math.sin(tau*f*t)+.10*Math.sin(tau*f*2*t);v*=attack*end*decay*.55;
  }else if(['rain','wind','surf','rail','water'].includes(kind)){const swell=.65+.24*Math.sin(tau*u*2)+.11*Math.sin(tau*u*7);v=kind==='rain'?(n*.19+mid*.31):kind==='wind'?low*1.5*swell:kind==='surf'?(low*1.8+mid*.35)*swell:kind==='rail'?low*.8+Math.sin(tau*48*t)*.014:mid*.45+low*.9;
  }else if(step){const impact=Math.sin(tau*(surface==='metal'?155:surface==='wood'?108:72)*t)*Math.exp(-t*42);let texture;
   if(surface==='snow')texture=(n-mid)*Math.exp(-t*13)*.26;else if(surface==='water')texture=(mid+.25*n)*Math.exp(-t*11)*.7;else if(surface==='grass')texture=(n-mid)*Math.exp(-t*18)*.14;else if(surface==='metal')texture=Math.sin(tau*540*t)*Math.exp(-t*21)*.25+mid*Math.exp(-t*30)*.2;else if(surface==='wood')texture=Math.sin(tau*290*t)*Math.exp(-t*35)*.16+mid*Math.exp(-t*29)*.4;else texture=mid*Math.exp(-t*33)*.6;v=impact*.44+texture;
  }else if(kind==='gun'||kind==='rifle')v=(n*.65+Math.sin(tau*(88*t-45*t*t))*.5)*Math.exp(-t*(kind==='rifle'?15:23))+low*Math.exp(-t*5)*.9;
  else if(kind==='tail')v=mid*Math.exp(-t*3)*.40;
  else if(kind==='metal'||kind==='casing'||kind==='reload')v=(Math.sin(tau*1100*t)+.4*Math.sin(tau*1723*t))*Math.exp(-t*50)*.22+mid*Math.exp(-t*65)*.5;
  else if(kind==='glass-break'){for(let j=0;j<4;j++)v+=Math.sin(tau*(620+j*471)*t)*Math.exp(-t*(11+j*4))*.13;v+=(n-mid)*Math.exp(-t*10)*.38;}
  else if(kind==='cloth'||kind==='bandage'||kind==='craft'){const pulses=kind==='craft'?(.5+.5*Math.sin(tau*t*7))**5:1;v=(n-mid)*Math.exp(-t*5)*.24*pulses+mid*Math.exp(-t*9)*.14;}
  else if(kind==='whoosh')v=mid*.8*Math.sin(Math.PI*Math.min(1,t/seconds))**2;
  else if(kind==='impact'||kind==='drum'){phase+=tau*(kind==='drum'?70:110)*Math.exp(-t*5)/rate;v=Math.sin(phase)*Math.exp(-t*10)*.65+mid*Math.exp(-t*35)*.5;}
  else if(kind==='breath')v=mid*Math.sin(Math.PI*u)**2*.48;
  else if(kind==='growl'||kind==='shriek'){const hz=kind==='shriek'?460:68;v=(Math.sin(tau*hz*t+3*Math.sin(tau*19*t))*.35+mid*.7)*Math.sin(Math.PI*u)**.7*(.65+.35*Math.sin(tau*7*t)**2);}
  else if(kind==='mechanism')v=mid*(.4+.6*Math.sin(t*60)**2)*Math.sin(Math.PI*u)*.65+Math.sin(tau*84*t)*.08;
  else if(kind==='smoke')v=(mid*.7+n*.15)*Math.sin(Math.PI*u)*Math.exp(-t*1.5);
  else if(kind==='tick')v=Math.sin(tau*f*t)*Math.exp(-t*48)*.4+mid*Math.exp(-t*60)*.3;
  else if(kind==='heartbeat')v=Math.sin(tau*54*t)*Math.exp(-t*18)*.5+(t>.16?Math.sin(tau*64*(t-.16))*Math.exp(-(t-.16)*28)*.3:0);
  else v=Math.sin(tau*f*t)*Math.exp(-t*9)*.35;
  const edge=Math.min(1,i/48,(out.length-1-i)/96);out[i]=Math.max(-.9,Math.min(.9,v))*Math.max(0,edge);
 }
 if(['rain','wind','surf','rail','water'].includes(kind)){const fade=Math.min(600,out.length>>3);for(let i=0;i<fade;i++){const mix=i/fade,value=out[i]*mix+out[out.length-fade+i]*(1-mix);out[i]=value;out[out.length-fade+i]=value;}}
 return out;
}
export function makeBuffer(context,kind,seconds=1,seed=1,midi=57){const rate=24000,data=synthesize(kind,seconds,rate,seed,midi),buffer=context.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);return buffer;}
export function impulse(context,seconds=1.6){const rate=24000,b=context.createBuffer(2,rate*seconds,rate);for(let c=0;c<2;c++){const r=seeded(341+c),a=b.getChannelData(c);for(let i=0;i<a.length;i++){const t=i/rate;a[i]=(r()*2-1)*Math.exp(-t*5.5)*(t<.019?0:.20);}}return b;}
