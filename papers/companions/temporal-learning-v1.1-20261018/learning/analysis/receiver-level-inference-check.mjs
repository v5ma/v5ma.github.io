/**
 * Learning to Feel: receiver-level inference stress test.
 * Synthetic Gaussian coefficient estimates only. No data downloads, training,
 * recursion, regular expressions, file writes, or external dependencies.
 * Defaults are hard bounded: 12 scenarios x 128 datasets x 199 permutations.
 */
import assert from 'node:assert/strict';
const TAU=2*Math.PI;
const det=(v,w)=>v[0]*w[1]-v[1]*w[0];
const norm2=v=>v[0]*v[0]+v[1]*v[1];
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const vecMean=vs=>[mean(vs.map(v=>v[0])),mean(vs.map(v=>v[1]))];
const scale=(v,g)=>v.map(x=>g*x);
const rotate=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t)];
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,String(a)+' != '+String(b));
function random(seed){
  let s=seed>>>0,spare=null;
  const uniform=()=>{
    s=(s+0x6D2B79F5)>>>0;
    let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
  const normal=()=>{
    if(spare!==null){const z=spare;spare=null;return z;}
    const u=1-uniform(),v=uniform(),r=Math.sqrt(-2*Math.log(u));
    spare=r*Math.sin(TAU*v);return r*Math.cos(TAU*v);
  };
  return {uniform,normal};
}
const observed=(v,s,r)=>v.map(x=>x+s*r.normal());
const varianceJ=(v,w,sx2,sy2)=>sy2*norm2(v)+sx2*norm2(w)+2*sx2*sy2;
function shuffle(xs,r){
  for(let i=xs.length-1;i>0;i--){const j=Math.floor(r.uniform()*(i+1));[xs[i],xs[j]]=[xs[j],xs[i]];}
  return xs;
}
function permutationP(values,treatedIndices,B,r){
  const n=treatedIndices.length,total=values.reduce((a,b)=>a+b,0),squares=values.reduce((a,b)=>a+b*b,0);
  assert.equal(values.length,2*n);
  const contrast=ids=>{
    const sum=ids.reduce((a,i)=>a+values[i],0),ss=ids.reduce((a,i)=>a+values[i]*values[i],0);
    const other=total-sum,difference=(sum-other)/n;
    const va=Math.max(0,(ss-sum*sum/n)/(n-1));
    const vb=Math.max(0,(squares-ss-other*other/n)/(n-1));
    const se=Math.sqrt((va+vb)/n);
    return {difference,studentized:se>0?difference/se:0};
  };
  const actual=contrast(treatedIndices);
  const order=Array.from({length:values.length},(_,i)=>i);
  let atLeast=0;
  for(let b=0;b<B;b++){
    shuffle(order,r);
    if(contrast(order.slice(0,n)).studentized>=actual.studentized-1e-12)atLeast++;
  }
  return {statistic:actual.difference,studentized:actual.studentized,p:(atLeast+1)/(B+1)};
}
function wilson(k,n){
  const z=1.959963984540054,p=k/n,den=1+z*z/n;
  const center=(p+z*z/(2*n))/den;
  const radius=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
  return [Math.max(0,center-radius),Math.min(1,center+radius)];
}
const checks=[];
const test=(name,fn)=>{fn();checks.push({name,passed:true});};
const v1=[1,0],v2=[0,1],w1=[2,0],w2=[0,1];
const aggregation={
  individualDeterminants:[det(v1,w1),det(v2,w2)],
  pooledPre:vecMean([v1,v2]),pooledPost:vecMean([w1,w2]),
};
aggregation.pooledDeterminant=det(aggregation.pooledPre,aggregation.pooledPost);
test('Heterogeneous gains create pooled rotation without individual rotation',()=>{
  aggregation.individualDeterminants.forEach(x=>near(x,0));near(aggregation.pooledDeterminant,-0.25);
});
test('Common gain does not create pooled rotation',()=>{
  const vs=[v1,v2],ws=vs.map(v=>scale(v,2));near(det(vecMean(vs),vecMean(ws)),0);
});
test('Opposed retuning cancels signed averaging but not squared determinants',()=>{
  const js=[det(v1,rotate(v1,Math.PI/4)),det(v1,rotate(v1,-Math.PI/4))];
  near(mean(js),0);near(mean(js.map(x=>x*x)),0.5);
});
test('Half-cycle reversal remains invisible to determinant-based statistics',()=>near(det(v1,[-1,0]),0));
test('Absent baseline has unidentified orientation',()=>near(det([0,0],[0,1]),0));
test('Common within-unit reference rotation leaves determinant unchanged',()=>{
  near(det(rotate(v1,0.7),rotate(w1,0.7)),det(v1,w1));
});
test('Stage-specific reference drift is indistinguishable from retuning',()=>near(det(v1,rotate(v1,0.3)),Math.sin(0.3)));
test('Coefficient variance from balanced phase means',()=>near(2/(8*4),0.0625));
test('Variance formula at noiseless and zero-signal limits',()=>{
  near(varianceJ(v1,w1,0,0),0);near(varianceJ([0,0],[0,0],0.1,0.2),0.04);
});
const momentChecks=[];
for(const degrees of [0,20]){
  const r=random(1024+degrees),v=[1,0.4],w=scale(rotate(v,degrees*Math.PI/180),1.4);
  const s=0.25,J=det(v,w),V=varianceJ(v,w,s*s,s*s),N=8192;
  let sumCross=0,sumSingleSquared=0;
  for(let k=0;k<N;k++){
    const j1=det(observed(v,s,r),observed(w,s,r));
    const j2=det(observed(v,s,r),observed(w,s,r));
    sumCross+=j1*j2;sumSingleSquared+=j1*j1;
  }
  const expectedCross=J*J,expectedSquared=J*J+V;
  const crossSE=Math.sqrt((2*J*J*V+V*V)/N);
  momentChecks.push({degrees,draws:N,J,varianceJ:V,expectedIndependentCross:expectedCross,
    measuredIndependentCross:sumCross/N,expectedReusedSplit:expectedSquared,
    measuredReusedSplit:sumSingleSquared/N,independentCrossMonteCarloSE:crossSE});
  test('Independent-split moment agreement at '+degrees+' degrees',()=>assert.ok(Math.abs(sumCross/N-expectedCross)<7*crossSE));
}
test('Reusing a split introduces a positive null moment in this fixture',()=>{
  assert.ok(momentChecks[0].measuredReusedSplit>0.1);
  assert.ok(Math.abs(momentChecks[0].measuredIndependentCross)<0.03);
});

const design={phaseBins:8,trialsPerPhasePerSplit:4,splits:2,stages:2,trialEndpointSD:1,
  datasetsPerScenario:128,permutationsPerDataset:199,oneSidedAlpha:0.05,
  unitsPerArm:[16,32,64],conditions:[
    {name:'exchangeable_null',degrees:0,extraGain:1},
    {name:'gain_only_unequal_distributions',degrees:0,extraGain:2},
    {name:'retuning_15_degrees',degrees:15,extraGain:1},
    {name:'retuning_30_degrees',degrees:30,extraGain:1}
  ]};
const coefficientSD=Math.sqrt(2*design.trialEndpointSD**2/(design.phaseBins*design.trialsPerPhasePerSplit));
const scenarios=[];
for(const n of design.unitsPerArm){
  for(const condition of design.conditions){
    const {degrees,extraGain}=condition;
    const r=random(20261007+n*100+degrees+(extraGain-1)*10000),repetitions=design.datasetsPerScenario;
    let rejected=0,sumTarget=0,sumStatistic=0,negativeScores=0,totalScores=0;
    for(let rep=0;rep<repetitions;rep++){
      const labels=shuffle(Array.from({length:2*n},(_,i)=>i),r).slice(0,n),treated=new Set(labels);
      const scores=[],truth=[];
      for(let i=0;i<2*n;i++){
        const phase=TAU*r.uniform(),amplitude=0.8+0.4*r.uniform(),gain=0.6+0.8*r.uniform();
        const v=[amplitude*Math.cos(phase),amplitude*Math.sin(phase)];
        const w=scale(rotate(v,treated.has(i)?degrees*Math.PI/180:0),gain*(treated.has(i)?extraGain:1));
        const j1=det(observed(v,coefficientSD,r),observed(w,coefficientSD,r));
        const j2=det(observed(v,coefficientSD,r),observed(w,coefficientSD,r));
        const score=j1*j2;
        scores.push(score);truth.push(det(v,w)**2);
        if(score<0)negativeScores++;
        totalScores++;
      }
      const result=permutationP(scores,labels,design.permutationsPerDataset,r);
      if(result.p<=design.oneSidedAlpha)rejected++;
      sumStatistic+=result.statistic;
      const all=truth.reduce((a,b)=>a+b,0),tr=labels.reduce((a,i)=>a+truth[i],0);
      sumTarget+=(2*tr-all)/n;
    }
    scenarios.push({condition:condition.name,unitsPerArm:n,degrees,extraGain,datasets:repetitions,rejections:rejected,
      rejectionFraction:rejected/repetitions,monteCarloWilson95:wilson(rejected,repetitions),
      meanTrueSquaredOrientationContrast:sumTarget/repetitions,meanEstimatedContrast:sumStatistic/repetitions,
      negativeScoreFraction:negativeScores/totalScores});
  }
}
test('Bounded scenario grid and finite outputs',()=>{
  assert.equal(scenarios.length,12);
  scenarios.forEach(s=>{assert.ok(Number.isFinite(s.meanEstimatedContrast));assert.ok(s.rejectionFraction>=0&&s.rejectionFraction<=1);});
});
const result={
 artifact:'Learning to Feel — receiver-level inference stress test',
 evidenceType:'constructed Gaussian coefficient experiments; not recordings, a learned neural network, or consciousness evidence',
 seedScheme:'20261007 + 100*unitsPerArm + rotationDegrees + 10000*(extraGain-1); separate fixed seeds for moment checks',
 estimand:'difference between randomized arms in mean per-unit squared pre/post orientation determinant',
 design,coefficientSD,aggregation,momentChecks,scenarios,checks,
 passedChecks:checks.filter(c=>c.passed).length,totalChecks:checks.length,
 limits:[
  'No calibrated biological effect size or recommended sample size.',
  'Studentized permutation calibration is exact only under assignment exchangeability/sharp null; gain-only unequal-distribution rows audit a weaker equal-moment null without asserting finite-sample exactness.',
  'Independent splits and independent pre/post zero-mean errors are assumed; correlated drift or shared preprocessing can invalidate moments.',
  'Squared determinants are amplitude-weighted, miss half-cycle reversals and zero-baseline onset, and do not establish phase causality.',
  'Units are independent experimental participants in this generator, not multiple neurons falsely counted as independent animals.',
  'No statement that all null rejection fractions must equal alpha; finite Monte Carlo intervals are reported.',
  'No binary report process, dropouts, phase-estimation error or serially dependent trial model is implemented.'
 ]
};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
