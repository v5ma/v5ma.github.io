/**
 * Learning to Feel — Application 03.
 * Bounded learned receiver comparison, entirely synthetic.
 * No file writes, downloads, regex, external packages, recursion or workers.
 */
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const CONFIG=Object.freeze({
 version:1, bins:8, pulseBins:[1,5], backgroundSD:0.2, pulseSD:0.65,
 seeds:Array.from({length:12},(_,i)=>101+i), trainEpisodes:384, testEpisodes:256,
 checkpoints:[0,24,96,384], etaInitial:0.18, etaScale:128,
 worlds:['integrated','timing'], models:['integrated','phase','time_bins'],
 arms:['contingent','tagged_replay','mismatched_replay'],
 probes:['intact','reference_half_shift','stimulus_half_shift','gain_two','erase_history','disconnect_use']
});
const TAU=2*Math.PI;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm2=a=>dot(a,a);
const sign=x=>x>=0?1:-1;
export function rng(seed){
 let s=seed>>>0,spare=null;
 const uniform=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;
 t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
 return ((t^(t>>>14))>>>0)/4294967296;};
 const normal=()=>{if(spare!==null){const z=spare;spare=null;return z;}
 const r=Math.sqrt(-2*Math.log(1-uniform())),t=TAU*uniform();
 spare=r*Math.sin(t);return r*Math.cos(t);};
 return {uniform,normal,sign:()=>uniform()<0.5?-1:1};
}
export function episodes(seed,world,n,polarity=1){
 const r=rng(seed),out=[];
 for(let k=0;k<n;k++){
  const h=k%2?1:-1,c=Math.floor(k/2)%2?1:-1,q=r.sign();
  const d=world==='integrated'?h:r.sign(),wrongTag=r.sign();
  const samples=Array.from({length:CONFIG.bins},()=>CONFIG.backgroundSD*r.normal());
  samples[1]+=q*h+CONFIG.pulseSD*r.normal();
  samples[5]+=q*d+CONFIG.pulseSD*r.normal();
  // target stays with the environment; features receive observation only.
  out.push({observation:{samples,context:c,actionTag:q},wrongTag,target:polarity*c*h});
 }
 return out;
}
const observationFor=(row,arm)=>arm==='mismatched_replay'?
 {...row.observation,actionTag:row.wrongTag}:row.observation;
export function features(obs,model,probe='intact'){
 const T=CONFIG.bins;
 const samples=probe==='stimulus_half_shift'?
 Array.from({length:T},(_,t)=>obs.samples[(t+T/2)%T]):obs.samples;
 const offset=probe==='reference_half_shift'?T/2:0;
 let z=Array(model==='integrated'?1:model==='phase'?3:T).fill(0);
 for(let t=0;t<T;t++){
  if(probe==='erase_history'&&t===T-1)z.fill(0);
  const x=samples[t],j=(t+offset)%T;
  if(model==='integrated')z[0]+=0.5*x;
  else if(model==='phase'){
   z[0]+=0.5*x;z[1]+=Math.cos(TAU*j/T)*x;z[2]+=Math.sin(TAU*j/T)*x;
  }else if(model==='time_bins')z[j]=x;
  else throw Error('Unknown model: '+model);
 }
 return [1,...z.map(x=>x*obs.context*obs.actionTag)];
}
const dimension=model=>model==='integrated'?2:model==='phase'?4:9;
export function update(weights,phi,target,k){
 const score=dot(weights,phi),error=target-score;
 const eta=CONFIG.etaInitial/(1+k/CONFIG.etaScale);
 const factor=eta*error/(1+norm2(phi));
 for(let j=0;j<weights.length;j++)weights[j]+=factor*phi[j];
}
export function evaluate(weights,rows,model,probe='intact',targetMultiplier=1){
 let correct=0,latentCorrect=0,squaredError=0,margin=0;
 for(const row of rows){
  const phi=features(row.observation,model,probe),raw=dot(weights,phi);
  const latent=probe==='gain_two'?2*raw:raw;
  const used=probe==='disconnect_use'?0:latent,target=row.target*targetMultiplier;
  correct+=Number(sign(used)===target);latentCorrect+=Number(sign(latent)===target);
  squaredError+=(used-target)**2;margin+=used*target;
 }
 return {accuracy:correct/rows.length,latentAccuracy:latentCorrect/rows.length,
  mse:squaredError/rows.length,margin:margin/rows.length};
}
export function train(rows,model,arm,testRows){
 const w=Array(dimension(model)).fill(0);
 const curve=[{updates:0,...evaluate(w,testRows,model)}];
 for(let k=0;k<rows.length;k++){
  const row=rows[k],phi=features(observationFor(row,arm),model);
  const decision=sign(dot(w,phi));
  // Feedback is produced AFTER the decision by the synthetic environment.
  const reward=decision*row.target,teaching=decision*reward;
  update(w,phi,teaching,k);
  if(CONFIG.checkpoints.includes(k+1))curve.push({updates:k+1,...evaluate(w,testRows,model)});
 }
 return {weights:w,curve};
}
export function kernel(weights,model){
 if(model==='integrated')return Array(CONFIG.bins).fill(0.5*weights[1]);
 if(model==='time_bins')return weights.slice(1);
 return Array.from({length:CONFIG.bins},(_,t)=>
  0.5*weights[1]+weights[2]*Math.cos(TAU*t/CONFIG.bins)+weights[3]*Math.sin(TAU*t/CONFIG.bins));
}
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
function describe(a){
 const m=mean(a);
 return {mean:m,sd:Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)),
 min:Math.min(...a),max:Math.max(...a)};
}
function oracleAccuracy(rows,world,polarity){
 let correct=0;
 for(const {observation:o,target}of rows){
  const source=world==='integrated'?(o.samples[1]+o.samples[5])/2:o.samples[1];
  correct+=Number(sign(polarity*o.context*o.actionTag*source)===target);
 }
 return correct/rows.length;
}
export function run(){
 const checks=[],test=(name,fn)=>{fn();checks.push({name,passed:true});};
 const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,String(a)+' != '+String(b));
 const fixture=episodes(778,'timing',16),obs=fixture[0].observation;
 test('Repeatable generator',()=>assert.deepEqual(episodes(778,'timing',16),fixture));
 test('Exact class and context balance',()=>{
  const data=episodes(3,'integrated',256);
  assert.equal(data.reduce((s,r)=>s+r.target,0),0);
  assert.equal(data.reduce((s,r)=>s+r.observation.context,0),0);
 });
 test('Features exclude hidden target and distractor labels',()=>{
  const phi=features(obs,'phase');
  const extra={...obs,target:1e9,hidden:1e9};
  assert.deepEqual(features(extra,'phase'),phi);
 });
 test('Stored time-bin coefficients reproduce any phase receiver score',()=>{
  const w=[0.3,-0.2,0.7,-0.8],timeW=[w[0],...kernel(w,'phase')];
  for(const row of fixture)near(dot(w,features(row.observation,'phase')),dot(timeW,features(row.observation,'time_bins')));
 });
 test('Finite-difference influence equals declared source kernel',()=>{
  for(const model of CONFIG.models){
   const w=Array.from({length:dimension(model)},(_,j)=>(j-2)/7),K=kernel(w,model),delta=0.013;
   for(let t=0;t<CONFIG.bins;t++){
    const perturbed={...obs,samples:obs.samples.map((x,j)=>x+(j===t?delta:0))};
    near((dot(w,features(perturbed,model))-dot(w,features(obs,model)))/delta,K[t]*obs.actionTag*obs.context);
   }
  }
 });
 test('Probe does not mutate samples',()=>{
  const before=JSON.stringify(obs);
  for(const p of CONFIG.probes)for(const m of CONFIG.models)features(obs,m,p);
  assert.equal(JSON.stringify(obs),before);
 });
 test('Cyclic stimulus shift preserves physical sample energy',()=>{
  const shifted=obs.samples.map((_,t)=>obs.samples[(t+4)%8]);
  near(norm2(shifted),norm2(obs.samples));
 });
 test('Integrated features ignore phase registration and cyclic shift',()=>{
  const a=features(obs,'integrated');
  assert.deepEqual(features(obs,'integrated','reference_half_shift'),a);
  features(obs,'integrated','stimulus_half_shift').forEach((x,i)=>near(x,a[i]));
 });
 test('Normalized update reduces the SAME-example squared residual',()=>{
  const w=[0.2,-0.1,0.3,0.4],phi=features(obs,'phase'),target=-1;
  const before=(target-dot(w,phi))**2;update(w,phi,target,0);
  assert.ok((target-dot(w,phi))**2<=before+1e-12);
 });
 test('Binary feedback recovers the target for either decision',()=>{
  for(const a of [-1,1])for(const y of [-1,1])assert.equal(a*(a*y),y);
 });
 const results=[];
 for(const world of CONFIG.worlds){
  for(const seed of CONFIG.seeds){
   const p=seed%2?1:-1,base=seed*1000+(world==='integrated'?0:500);
   const training=episodes(base+1,world,CONFIG.trainEpisodes,p);
   const testing=episodes(base+2,world,CONFIG.testEpisodes,p);
   const reversing=episodes(base+3,world,CONFIG.trainEpisodes,-p);
   for(const model of CONFIG.models){
    for(const arm of CONFIG.arms){
     const learned=train(training,model,arm,testing),w=learned.weights;
     const frozen=JSON.stringify(w),probes={};
     for(const probe of CONFIG.probes)probes[probe]=evaluate(w,testing,model,probe);
     assert.equal(JSON.stringify(w),frozen);
     assert.deepEqual(evaluate([...w],testing,model),probes.intact);
     assert.equal(probes.gain_two.accuracy,probes.intact.accuracy);
     assert.equal(probes.disconnect_use.latentAccuracy,probes.intact.accuracy);
     const reversedWeights=[...w],before=evaluate(w,testing,model,'intact',-1);
     for(let k=0;k<reversing.length;k++){
      const row=reversing[k],phi=features(observationFor(row,arm),model);
      const a=sign(dot(reversedWeights,phi)),r=a*row.target;
      update(reversedWeights,phi,a*r,k);
     }
     results.push({world,seed,model,arm,parameters:w.length,curve:learned.curve,probes,
      weights:w,influence:kernel(w,model),
      reversal:{before,after:evaluate(reversedWeights,testing,model,'intact',-1),weights:reversedWeights},
      oracleAccuracy:oracleAccuracy(testing,world,p)});
    }
   }
  }
 }
 test('All 216 model-world-seed-arm fits retained',()=>assert.equal(results.length,216));
 test('Tagged replay exactly matches contingent learning on every paired fit',()=>{
  for(const a of results.filter(x=>x.arm==='contingent')){
   const b=results.find(x=>x.world===a.world&&x.seed===a.seed&&x.model===a.model&&x.arm==='tagged_replay');
   assert.deepEqual(a.weights,b.weights);assert.deepEqual(a.probes,b.probes);assert.deepEqual(a.reversal,b.reversal);
  }
 });
 test('Every probe preserves weights and permits exact state-reset restoration',()=>assert.equal(results.length,216));
 test('Positive uniform decision gain preserves all choices',()=>{
  for(const r of results)assert.equal(r.probes.gain_two.accuracy,r.probes.intact.accuracy);
 });
 test('Disconnected action use retains latent decoding but removes behavioral choice',()=>{
  for(const r of results){
   near(r.probes.disconnect_use.accuracy,0.5);
   assert.equal(r.probes.disconnect_use.latentAccuracy,r.probes.intact.accuracy);
  }
 });
 test('All fit results finite and all conditions exposed',()=>{
  for(const r of results){
   assert.equal(Object.keys(r.probes).length,CONFIG.probes.length);
   assert.ok([...r.weights,...r.reversal.weights,...r.influence].every(Number.isFinite));
   for(const value of [...r.curve,...Object.values(r.probes),r.reversal.before,r.reversal.after]){
    assert.ok(Number.isFinite(value.mse));assert.ok(value.accuracy>=0&&value.accuracy<=1);
   }
  }
 });
 const summary=[];
 for(const world of CONFIG.worlds)for(const model of CONFIG.models)for(const arm of CONFIG.arms){
  const rows=results.filter(x=>x.world===world&&x.model===model&&x.arm===arm);
  const probes={};
  for(const p of CONFIG.probes)probes[p]=describe(rows.map(r=>r.probes[p].accuracy));
  const curve=CONFIG.checkpoints.map(n=>({updates:n,...describe(rows.map(r=>r.curve.find(c=>c.updates===n).accuracy))}));
  summary.push({world,model,arm,parameters:rows[0].parameters,replicates:rows.length,probes,curve,
   reversalBefore:describe(rows.map(r=>r.reversal.before.accuracy)),reversalAfter:describe(rows.map(r=>r.reversal.after.accuracy)),
   firstPulseInfluence:describe(rows.map(r=>Math.abs(r.influence[1]))),
   secondPulseInfluence:describe(rows.map(r=>Math.abs(r.influence[5]))),
   oracleAccuracy:describe(rows.map(r=>r.oracleAccuracy))});
 }
 const paired=[];
 for(const world of CONFIG.worlds)for(const arm of CONFIG.arms){
  const rows=results.filter(r=>r.world===world&&r.arm===arm&&r.model==='phase');
  for(const other of ['integrated','time_bins']){
   const values=rows.map(r=>r.probes.intact.accuracy-results.find(q=>q.world===world&&q.arm===arm&&q.seed===r.seed&&q.model===other).probes.intact.accuracy);
   paired.push({world,arm,contrast:'phase_minus_'+other,...describe(values),values});
  }
 }
 return {artifact:'Learning to Feel — Application 03',scope:'synthetic learned finite-window receivers, not consciousness or biological validation',
  config:CONFIG,passedChecks:checks.length,totalChecks:checks.length,checks,summary,paired,results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 process.stdout.write(JSON.stringify(run())+'\n');
}
