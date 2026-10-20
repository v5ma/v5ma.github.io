/**
 * Learning to Feel — Application 04.
 * Learned Gaussian reciprocal reconstruction, active observation, and
 * evidence-reuse control. Bounded 9-coordinate synthetic model only.
 * No filesystem writes, downloads, regex, external packages or workers.
 */
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {rng} from './learned-receiver-application.mjs';
export const CONFIG=Object.freeze({
 revision:3,
 seeds:Array.from({length:12},(_,i)=>201+i),latent:3,cues:8,dimensions:9,
 training:512,testing:128,cueSD:0.25,targetSD:0.15,measurementSD:0.6,
 covarianceRidge:0.05,initialCues:[0,4],maxSweeps:256,tolerance:1e-8,
 copiedObservationMultiplicity:4,
 conditions:['reciprocal','direct','block_lesion','marginal_block_control','shuffled_target','reused_observations_x4','greedy_extra','random_extra']
});
const zeros=n=>Array(n).fill(0),matrix=n=>Array.from({length:n},()=>zeros(n));
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm2=a=>dot(a,a);
const mv=(A,x)=>A.map(row=>dot(row,x));
const maxAbs=a=>Math.max(...a.map(Math.abs));
export function cholesky(A){
 const n=A.length,L=matrix(n);
 for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
  let v=A[i][j];for(let k=0;k<j;k++)v-=L[i][k]*L[j][k];
  if(i===j){assert.ok(v>0&&Number.isFinite(v),'Non-positive Cholesky pivot');L[i][j]=Math.sqrt(v);}
  else L[i][j]=v/L[j][j];
 }return L;
}
export function solveL(L,b){
 const n=b.length,y=zeros(n),x=zeros(n);
 for(let i=0;i<n;i++){let s=b[i];for(let j=0;j<i;j++)s-=L[i][j]*y[j];y[i]=s/L[i][i];}
 for(let i=n-1;i>=0;i--){let s=y[i];for(let j=i+1;j<n;j++)s-=L[j][i]*x[j];x[i]=s/L[i][i];}
 return x;
}
export function inverseL(L){
 const n=L.length,A=matrix(n);
 for(let j=0;j<n;j++){const e=zeros(n);e[j]=1;const x=solveL(L,e);for(let i=0;i<n;i++)A[i][j]=x[i];}
 return A;
}
const inverse=A=>inverseL(cholesky(A));
export function learn(rows){
 const d=rows[0].length,mu=zeros(d),M=matrix(d);let n=0;
 for(const x of rows){
  n++;const delta=x.map((v,i)=>v-mu[i]);
  for(let i=0;i<d;i++)mu[i]+=delta[i]/n;
  for(let i=0;i<d;i++)for(let j=0;j<d;j++)M[i][j]+=delta[i]*(x[j]-mu[j]);
 }
 const covariance=matrix(d);
 for(let i=0;i<d;i++)for(let j=0;j<d;j++)covariance[i][j]=(M[i][j]+M[j][i])/(2*(n-1))+(i===j?CONFIG.covarianceRidge:0);
 return {mean:mu,covariance,precision:inverse(covariance)};
}
export function quadratic(H,b,x){return 0.5*dot(x,mv(H,x))-dot(b,x);}
export function relax(H,b,start=zeros(b.length),capture=false){
 const z=[...start],energies=capture?[quadratic(H,b,z)]:null;
 const target=CONFIG.tolerance*(1+maxAbs(b));let sweeps=0,descentFailures=0;
 let residual=maxAbs(mv(H,z).map((x,i)=>x-b[i])),old=quadratic(H,b,z);
 while(residual>target&&sweeps<CONFIG.maxSweeps){
  for(let i=0;i<z.length;i++){
   let value=b[i];for(let j=0;j<z.length;j++)if(j!==i)value-=H[i][j]*z[j];
   z[i]=value/H[i][i];
  }
  sweeps++;const E=quadratic(H,b,z);
  if(E>old+1e-10*(1+Math.abs(old)))descentFailures++;
  old=E;if(energies)energies.push(E);
  residual=maxAbs(mv(H,z).map((x,i)=>x-b[i]));
 }
 return {delta:z,sweeps,residual,converged:residual<=target,descentFailures,energies};
}
export function posterior(model,observations,{copies=1,start=null,capture=false}={}){
 const H=model.precision.map(row=>[...row]),b=zeros(H.length);
 const variance=CONFIG.measurementSD**2;
 for(const o of observations){const precision=copies/variance;H[o.index][o.index]+=precision;b[o.index]+=precision*(o.value-model.mean[o.index]);}
 const L=cholesky(H),C=inverseL(L),exactDelta=solveL(L,b);
 const rec=relax(H,b,start||zeros(H.length),capture);
 const mean=rec.delta.map((x,i)=>x+model.mean[i]),exact=exactDelta.map((x,i)=>x+model.mean[i]);
 return {mean,exact,covariance:C,rec,precision:H,rhs:b,maxStateError:maxAbs(rec.delta.map((x,i)=>x-exactDelta[i]))};
}
export function varianceReduction(C,j){
 const target=C.length-1;return C[target][j]**2/(C[j][j]+CONFIG.measurementSD**2);
}
export function probabilityPositive(mean,variance){
 const x=mean/Math.sqrt(2*variance),sgn=x<0?-1:1,a=Math.abs(x),t=1/(1+0.3275911*a);
 const erf=sgn*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-a*a));
 return Math.min(1-1e-12,Math.max(1e-12,0.5*(1+erf)));
}
function world(seed){
 const r=rng(seed),mixing=[];
 for(let i=0;i<CONFIG.cues;i++){const g=Array.from({length:3},()=>r.normal()),n=Math.sqrt(norm2(g));mixing.push(g.map(x=>x/n));}
 return {mixing,offset:Array.from({length:9},()=>0.4*r.normal())};
}
function examples(w,seed,n){
 const r=rng(seed),out=[];
 for(let k=0;k<n;k++){
  const h=Array.from({length:3},()=>r.normal());
  const row=w.mixing.map((g,i)=>dot(g,h)+w.offset[i]+CONFIG.cueSD*r.normal());
  row.push(h[0]-0.6*h[1]+0.3*h[2]+w.offset[8]+CONFIG.targetSD*r.normal());
  out.push(row);
 }return out;
}
function shuffledRows(rows,seed){
 const r=rng(seed),targets=rows.map(x=>x[8]);
 for(let i=targets.length-1;i>0;i--){const j=Math.floor(r.uniform()*(i+1));[targets[i],targets[j]]=[targets[j],targets[i]];}
 return rows.map((x,i)=>[...x.slice(0,8),targets[i]]);
}
function lesion(model){
 const P=model.precision.map((row,i)=>row.map((x,j)=>(i<4)!==(j<4)?0:x));
 cholesky(P);return {...model,precision:P};
}
function marginalBlockControl(model){
 const C=model.covariance.map((row,i)=>row.map((x,j)=>(i<4)!==(j<4)?0:x));
 return {...model,covariance:C,precision:inverse(C)};
}
function blankMetrics(){return {n:0,correct:0,targetSquaredError:0,reconstructionSquaredError:0,reconstructionTerms:0,commonReconstructionSquaredError:0,commonReconstructionTerms:0,
 brierSum:0,logLossSum:0,varianceSum:0,confident:0,confidentWrong:0};}
function accumulate(m,means,C,truth,observed){
 const y=truth[8],pred=means[8],p=probabilityPositive(pred,C[8][8]),positive=y>=0;
 const correct=(pred>=0)===positive;
 m.n++;m.correct+=Number(correct);m.targetSquaredError+=(pred-y)**2;
 for(let j=0;j<8;j++)if(!observed.includes(j)){m.reconstructionSquaredError+=(means[j]-truth[j])**2;m.reconstructionTerms++;}
 for(let j=0;j<8;j++)if(!CONFIG.initialCues.includes(j)){m.commonReconstructionSquaredError+=(means[j]-truth[j])**2;m.commonReconstructionTerms++;}
 m.brierSum+=(p-Number(positive))**2;m.logLossSum-=Math.log(positive?p:1-p);m.varianceSum+=C[8][8];
 if(Math.max(p,1-p)>=0.9){m.confident++;m.confidentWrong+=Number(!correct);}
}
function finalize(m){return {...m,accuracy:m.correct/m.n,targetMSE:m.targetSquaredError/m.n,commonCueMSE:m.commonReconstructionSquaredError/m.commonReconstructionTerms,
 unobservedCueMSE:m.reconstructionSquaredError/m.reconstructionTerms,
 brier:m.brierSum/m.n,logLoss:m.logLossSum/m.n,meanVariance:m.varianceSum/m.n,
 confidentWrongRate:m.confident?m.confidentWrong/m.confident:null};}
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
function describe(a){const m=mean(a);return {mean:m,sd:Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)),min:Math.min(...a),max:Math.max(...a)};}
export function run(){
 const checks=[],test=(name,fn)=>{fn();checks.push({name,passed:true});};
 const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,String(a)+' != '+String(b));
 test('Cholesky/direct solver recovers a known SPD system',()=>{
  const A=[[2,0.5],[0.5,1]],x=[-1,2];solveL(cholesky(A),mv(A,x)).forEach((v,i)=>near(v,x[i]));
 });
 test('Computed inverse multiplies to identity',()=>{
  const A=[[2,0.5],[0.5,1]],B=inverse(A);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(dot(A[i],B.map(r=>r[j])),Number(i===j));
 });
 test('Reciprocal relaxation matches the exact fixture',()=>{
  const A=[[2,-0.5],[-0.5,1]],b=[1,-2],r=relax(A,b,zeros(2),true),d=solveL(cholesky(A),b);
  r.delta.forEach((x,i)=>near(x,d[i],1e-7));assert.equal(r.descentFailures,0);assert.ok(r.converged);
 });
 test('Every coordinate minimization has the declared energy decrease',()=>{
  const H=[[2,-0.5],[-0.5,1]],b=[1,-2],x=[2,1],next=[...x];next[0]=(b[0]-H[0][1]*x[1])/H[0][0];
  near(quadratic(H,b,x)-quadratic(H,b,next),0.5*H[0][0]*(x[0]-next[0])**2);
 });
 const simple={mean:[0,0],covariance:[[1,0.7],[0.7,1]],precision:inverse([[1,0.7],[0.7,1]])};
 test('Conditional mean and variance match the analytic two-variable case',()=>{
  const p=posterior(simple,[{index:0,value:1}]);near(p.exact[1],0.7/1.36);near(p.covariance[1][1],1-0.49/1.36);
 });
 test('New independent observation gives the predicted variance reduction',()=>{
  const C=simple.covariance,p=posterior(simple,[{index:0,value:1}]);near(C[1][1]-p.covariance[1][1],varianceReduction(C,0));
 });
 test('Repeating identical observations falsely contracts conditional variance',()=>{
  const a=posterior(simple,[{index:0,value:1}]),b=posterior(simple,[{index:0,value:1}],{copies:4});
  assert.ok(b.covariance[1][1]<a.covariance[1][1]);
 });
 test('Repeated sweeps do not add observation precision',()=>{
  const a=posterior(simple,[{index:0,value:1}]),b=posterior(simple,[{index:0,value:1}],{start:a.rec.delta});
  assert.deepEqual(a.precision,b.precision);near(a.exact[1],b.exact[1]);
 });
 test('Normal probability approximation matches standard values',()=>{
  near(probabilityPositive(0,1),0.5);near(probabilityPositive(1,1),0.841344746,2e-7);
  near(probabilityPositive(-1,1),1-probabilityPositive(1,1));
 });
 test('Online learning matches a batch moment calculation',()=>{
  const rows=[[1,2],[2,4],[3,1]],m=learn(rows);
  near(m.mean[0],2);near(m.mean[1],7/3);near(m.covariance[0][0],1+CONFIG.covarianceRidge);
  near(m.covariance[0][1],-0.5);
 });
 test('Within-model finite intervention matches conditional influence',()=>{
  const a=posterior(simple,[{index:0,value:0}]),d=0.01,b=posterior(simple,[{index:0,value:d}]);
  near((b.exact[1]-a.exact[1])/d,a.covariance[1][0]/CONFIG.measurementSD**2);
 });
 test('Deleting a precision cross-term retains conditional rather than marginal variance',()=>{
  const P=simple.precision.map((row,i)=>row.map((x,j)=>i===j?x:0));
  near(inverse(P)[1][1],1-0.7**2);assert.ok(inverse(P)[1][1]<simple.covariance[1][1]);
 });
 test('Deleting a covariance cross-term preserves marginal variance',()=>{
  const C=[[1,0],[0,1]],p=posterior({mean:[0,0],covariance:C,precision:inverse(C)},[{index:0,value:1}]);
  near(p.covariance[1][1],1);near(p.exact[1],0);
 });
 const seedResults=[],traces=[],diagnostics={inferences:0,notConverged:0,maxSweeps:0,maxResidual:0,maxStateError:0,descentFailures:0,decisionDisagreements:0};
 const record=p=>{diagnostics.inferences++;diagnostics.notConverged+=Number(!p.rec.converged);diagnostics.maxSweeps=Math.max(diagnostics.maxSweeps,p.rec.sweeps);
 diagnostics.maxResidual=Math.max(diagnostics.maxResidual,p.rec.residual);diagnostics.maxStateError=Math.max(diagnostics.maxStateError,p.maxStateError);diagnostics.descentFailures+=p.rec.descentFailures;};
 for(const seed of CONFIG.seeds){
  const w=world(seed),training=examples(w,seed*10+1,CONFIG.training),testing=examples(w,seed*10+2,CONFIG.testing);
  const model=learn(training),shuffled=learn(shuffledRows(training,seed*10+3)),broken=lesion(model),marginal=marginalBlockControl(model),random=rng(seed*10+4);
  const frozen=JSON.stringify(model),metrics=Object.fromEntries(CONFIG.conditions.map(c=>[c,blankMetrics()]));
  const queryCounts={greedy:zeros(8),random:zeros(8)},influences=[];
  let maxFormulaError=0;
  for(let k=0;k<testing.length;k++){
   const truth=testing[k],initialNoise=Array.from({length:8},()=>CONFIG.measurementSD*random.normal());
   const freshNoise=Array.from({length:8},()=>CONFIG.measurementSD*random.normal());
   const obs=CONFIG.initialCues.map(j=>({index:j,value:truth[j]+initialNoise[j]}));
   const base=posterior(model,obs,{capture:k===0});record(base);
   diagnostics.decisionDisagreements+=Number((base.mean[8]>=0)!==(base.exact[8]>=0));
   accumulate(metrics.reciprocal,base.mean,base.covariance,truth,CONFIG.initialCues);
   accumulate(metrics.direct,base.exact,base.covariance,truth,CONFIG.initialCues);
   influences.push(base.covariance[0][4]/CONFIG.measurementSD**2);
   for(const [name,m,copies]of [['block_lesion',broken,1],['marginal_block_control',marginal,1],['shuffled_target',shuffled,1],['reused_observations_x4',model,4]]){
    const p=posterior(m,obs,{copies});record(p);accumulate(metrics[name],p.mean,p.covariance,truth,CONFIG.initialCues);
   }
   const candidates=Array.from({length:8},(_,i)=>i).filter(i=>!CONFIG.initialCues.includes(i));
   let best=candidates[0];
   for(const j of candidates)if(varianceReduction(base.covariance,j)>varianceReduction(base.covariance,best))best=j;
   const randomIndex=candidates[Math.floor(random.uniform()*candidates.length)];
   for(const [name,j]of [['greedy_extra',best],['random_extra',randomIndex]]){
    assert.ok(j<8&&!CONFIG.initialCues.includes(j));
    const extra={index:j,value:truth[j]+freshNoise[j]},p=posterior(model,[...obs,extra],{start:base.rec.delta});record(p);
    const reduction=base.covariance[8][8]-p.covariance[8][8];
    maxFormulaError=Math.max(maxFormulaError,Math.abs(reduction-varianceReduction(base.covariance,j)));
    accumulate(metrics[name],p.mean,p.covariance,truth,[...CONFIG.initialCues,j]);
    queryCounts[name==='greedy_extra'?'greedy':'random'][j]++;
   }
   if(k===0)traces.push({seed,selection:'first test episode',initialObservations:obs,truth,mean:base.mean,exact:base.exact,
    sweeps:base.rec.sweeps,residual:base.rec.residual,converged:base.rec.converged,energies:base.rec.energies});
  }
  assert.equal(JSON.stringify(model),frozen);
  seedResults.push({seed,training:CONFIG.training,testing:CONFIG.testing,
   learnedMean:model.mean,learnedCovariance:model.covariance,
   conditions:Object.fromEntries(CONFIG.conditions.map(c=>[c,finalize(metrics[c])])),
   queryCounts,meanReciprocalCueInfluence:mean(influences),maxVarianceFormulaError:maxFormulaError});
 }
 test('All 12 seeds and all eight conditions exposed',()=>{assert.equal(seedResults.length,12);for(const s of seedResults)assert.equal(Object.keys(s.conditions).length,8);});
 test('Frozen learned organization preserved during every test',()=>assert.equal(seedResults.length,CONFIG.seeds.length));
 test('All query budgets are identical and exclude outcome access',()=>{
  for(const s of seedResults)for(const policy of ['greedy','random']){
   assert.equal(s.queryCounts[policy].reduce((a,b)=>a+b,0),CONFIG.testing);
   assert.equal(s.queryCounts[policy][0]+s.queryCounts[policy][4],0);
  }
 });
 test('Variance policy agrees with exact conditioning on all trials',()=>{
  for(const s of seedResults)assert.ok(s.maxVarianceFormulaError<1e-8);
 });
 test('Every probability and metric is finite',()=>{
  for(const s of seedResults)for(const m of Object.values(s.conditions)){
   for(const key of ['accuracy','targetMSE','unobservedCueMSE','brier','logLoss','meanVariance'])assert.ok(Number.isFinite(m[key]));
   assert.ok(m.accuracy>=0&&m.accuracy<=1&&m.meanVariance>0);assert.equal(m.n,CONFIG.testing);
  }
 });
 test('Descent failures are explicitly counted',()=>assert.equal(diagnostics.descentFailures,0));
 test('Common reconstruction endpoint always uses the same six coordinates',()=>{
  for(const s of seedResults)for(const m of Object.values(s.conditions)){
   assert.equal(m.commonReconstructionTerms,6*CONFIG.testing);assert.ok(Number.isFinite(m.commonCueMSE));
  }
 });
 test('Common and missing-coordinate losses coincide before extra sampling',()=>{
  for(const s of seedResults)for(const c of CONFIG.conditions.filter(c=>!c.endsWith('_extra')))near(s.conditions[c].commonCueMSE,s.conditions[c].unobservedCueMSE);
 });
 const keys=['accuracy','targetMSE','unobservedCueMSE','commonCueMSE','brier','logLoss','meanVariance'];
 const summary=CONFIG.conditions.map(condition=>({condition,seeds:12,
  ...Object.fromEntries(keys.map(k=>[k,describe(seedResults.map(s=>s.conditions[condition][k]))])),
  confident:seedResults.reduce((a,s)=>a+s.conditions[condition].confident,0),
  confidentWrong:seedResults.reduce((a,s)=>a+s.conditions[condition].confidentWrong,0)}));
 const policyContrasts=Object.fromEntries(['accuracy','targetMSE','brier'].map(k=>[k,describe(seedResults.map(s=>s.conditions.greedy_extra[k]-s.conditions.random_extra[k]))]));
 return {artifact:'Learning to Feel — Application 04',scope:'learned statistical reconstruction and action, not physiology or consciousness',
  config:CONFIG,passedChecks:checks.length,totalChecks:checks.length,checks,diagnostics,summary,policyContrasts,seedResults,traces};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.stdout.write(JSON.stringify(run())+'\n');
