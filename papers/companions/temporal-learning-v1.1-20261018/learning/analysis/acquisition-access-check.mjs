// Measurement/contrast fixtures, not a learned model or biological power study.
// No filesystem access, network, workers, regex, packages, or random sampling.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export function phi(x){
 if(x===0)return 0.5;
 if(x>=9)return 1;if(x<=-9)return 0;
 // Integrated Gaussian series: exp(-x*x/2)*(x+x^3/3+x^5/15+...).
 // Bounded here to |x|<9; no fitted approximation or relaxed test tolerance.
 let term=x,sum=x;
 for(let k=1;k<=200;k++){
  term*=x*x/(2*k+1);const next=sum+term;
  if(next===sum)break;sum=next;
 }
 return 0.5+sum*Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
}
export function invPhi(p){
 assert.ok(p>0&&p<1,'Inverse normal requires an interior probability');
 let lo=-9,hi=9;
 for(let i=0;i<80;i++){const m=(lo+hi)/2;if(phi(m)<p)lo=m;else hi=m;}
 return (lo+hi)/2;
}
export function rates({d,b=0,k=0}){return {hit:phi(d/2+b-k),falseAlarm:phi(-d/2+b-k)};}
export function decode({hit,falseAlarm}){
 return {d:invPhi(hit)-invPhi(falseAlarm),c:-(invPhi(hit)+invPhi(falseAlarm))/2};
}
export function contrast(arms){
 const L={};
 for(const [name,x]of Object.entries(arms))L[name]=(x.post.compatible-x.pre.compatible)-(x.post.disrupted-x.pre.disrupted);
 return {L,CR:L.C-L.R,CN:L.C-L.N,pooledControl:L.C-(L.R+L.N)/2};
}
export function run(){
 const checks=[],check=(name,fn)=>{fn();checks.push({name,passed:true});};
 const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,String(a)+' != '+String(b));
 check('Normal CDF matches independent standard values',()=>{near(phi(0),0.5);near(phi(1),0.841344746,1e-7);near(phi(-1),0.158655254,1e-7);});
 check('Inverse CDF known quantile and round trips',()=>{near(invPhi(0.975),1.959963985,1e-6);for(const x of [-2,-0.5,0,0.5,2])near(invPhi(phi(x)),x);});
 check('Population hit/false-alarm inversion recovers d and c',()=>{
  for(const d of [0,1,2])for(const b of [-0.25,0.25])for(const k of [-0.5,0.5]){
   const m=decode(rates({d,b,k}));near(m.d,d);near(m.c,k-b);
  }
 });
 const base=rates({d:1,b:0,k:0.5}),sensory=rates({d:1,b:0.5,k:0.5}),decision=rates({d:1,b:0,k:0}),precision=rates({d:2,b:0,k:0.5});
 check('Sensory-baseline and threshold shifts give the same observable rates',()=>assert.deepEqual(sensory,decision));
 check('More yes reports need not improve discrimination',()=>{assert.ok(sensory.hit>base.hit&&sensory.falseAlarm>base.falseAlarm);near(decode(sensory).d,decode(base).d);});
 check('Joint evidence/threshold shift leaves rates invariant',()=>assert.deepEqual(base,rates({d:1,b:2,k:2.5})));
 check('Sensitivity change is distinct at fixed effective criterion',()=>{assert.ok(precision.hit>base.hit&&precision.falseAlarm<base.falseAlarm);near(decode(precision).c,decode(base).c);});
 const people=[rates({d:0.5}),rates({d:3.5})];
 const pooled=decode({hit:(people[0].hit+people[1].hit)/2,falseAlarm:(people[0].falseAlarm+people[1].falseAlarm)/2});
 check('Pooling heterogeneous rates does not recover average sensitivity',()=>assert.ok(Math.abs(pooled.d-2)>0.1));
 const fromL=l=>({pre:{compatible:0,disrupted:0},post:{compatible:l,disrupted:0}});
 const common=contrast({C:fromL(1),R:fromL(1),N:fromL(1)});
 check('Shared change in all arms cancels in both control contrasts',()=>{near(common.CR,0);near(common.CN,0);});
 const equalReplay=contrast({C:fromL(1),R:fromL(1),N:fromL(0)});
 check('Averaging controls can hide equality with informative replay',()=>{near(equalReplay.pooledControl,0.5);near(equalReplay.CR,0);near(equalReplay.CN,1);});
 const both=contrast({C:fromL(1),R:fromL(0.2),N:fromL(0.4)});
 check('Both control contrasts retain their separate effects',()=>{near(both.CR,0.8);near(both.CN,0.6);});
 const noTiming=contrast(Object.fromEntries(['C','R','N'].map((a,i)=>[a,{pre:{compatible:0,disrupted:0},post:{compatible:1-i*0.2,disrupted:1-i*0.2}}])));
 check('Learning gain without timing dependence is not a timing interaction',()=>{near(noTiming.CR,0);near(noTiming.CN,0);});
 check('Boundary probabilities are rejected rather than silently clipped',()=>{assert.throws(()=>invPhi(0));assert.throws(()=>invPhi(1));});
 return {artifact:'Learning to Feel — acquisition/access measurement fixtures',date:'2026-10-07',
  scope:'Deterministic population-probability examples and algebra checks only; no participants, hypothesis-test calibration or power estimate.',
  passedChecks:checks.length,totalChecks:checks.length,checks,
  examples:{base:{...base,...decode(base)},sensoryBaseline:{...sensory,...decode(sensory)},decisionThreshold:{...decision,...decode(decision)},sensitivity:{...precision,...decode(precision)},
   heterogeneousPooling:{individualSensitivities:[0.5,3.5],meanSensitivity:2,pooledSensitivity:pooled.d},
   commonChange:common,equalInformativeReplay:equalReplay,bothControls:both,learningWithoutTiming:noTiming}
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
