/** Application 05. Synthetic identification, not biological/theory validation. */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {episodes, rng, train, features, evaluate} from './learned-receiver-application.mjs';

export const CONFIG = Object.freeze({
  version: 1, seeds: Array.from({length: 12}, (_, i) => 101 + i),
  acquisition: 384, baseline: 384, calibrationPerCondition: 192, testPerCondition: 256,
  beta: 2.5, intercept: 0.2, sigma: 0.35, newtonSteps: 40, backtracks: 20,
  gradientTolerance: 1e-8, testScales: [0.7, 1.3],
  families: {
    gain: {calibration: [1, 0.6, 1.4, 1.8], test: [1, 0.8, 1.2, 1.6, 2]},
    registration: {calibration: [0, Math.PI/4, -Math.PI/4, Math.PI/2],
      test: [0, Math.PI/8, -Math.PI/8, 3*Math.PI/8, -3*Math.PI/8, Math.PI, -Math.PI/2]}
  },
  worlds: {receiver: [1, 1], policy: [0, 1], mixed: [1, 0.35], null: [0, 0]},
  candidates: ['receiver', 'policy', 'mixed']
});
const TAU = 2*Math.PI;
const variance = CONFIG.sigma**2;
const gaussianConstant = Math.log(CONFIG.sigma*Math.sqrt(TAU));
const dot = (a, b) => a.reduce((s, x, j) => s + x*b[j], 0);
const sum = a => a.reduce((s, x) => s+x, 0);
const mean = a => sum(a)/a.length;
const sigmoid = z => z >= 0 ? 1/(1+Math.exp(-z)) : Math.exp(z)/(1+Math.exp(z));
const softplus = z => Math.max(0,z) + Math.log1p(Math.exp(-Math.abs(z)));
const bernoulliLoss = (eta, y) => softplus(eta)-y*eta;
const near = (a,b,t=1e-10) => assert.ok(Math.abs(a-b)<=t, `${a} != ${b}`);

function describe(values) {
  const m=mean(values), sd=Math.sqrt(sum(values.map(x=>(x-m)**2))/(values.length-1));
  return {mean:m, sd, monteCarloSE:sd/Math.sqrt(values.length), min:Math.min(...values),
    max:Math.max(...values), values};
}

// Two algebraically equivalent implementations; no endogenous oscillator.
export function scorePhase(weights, obs, theta=0) {
  let constant=0, cosine=0, sine=0;
  for(let t=0;t<8;t++) {
    constant+=0.5*obs.samples[t];
    cosine+=Math.cos(TAU*t/8+theta)*obs.samples[t];
    sine+=Math.sin(TAU*t/8+theta)*obs.samples[t];
  }
  return weights[0]+obs.context*obs.actionTag*
    (weights[1]*constant+weights[2]*cosine+weights[3]*sine);
}
export function scoreBins(weights, obs, theta=0) {
  const coefficients=Array.from({length:8},(_,t)=>weights[1]/2+
    weights[2]*Math.cos(TAU*t/8+theta)+weights[3]*Math.sin(TAU*t/8+theta));
  return weights[0]+obs.context*obs.actionTag*dot(coefficients,obs.samples);
}

function fixtures(seed, weights, family, split) {
  const familyIndex=family==='gain'?0:1;
  const count=split==='calibration'?CONFIG.calibrationPerCondition:CONFIG.testPerCondition;
  const raw=episodes(1000*seed+(split==='calibration'?3:4),'timing',count);
  const scales=split==='calibration'?[1]:CONFIG.testScales;
  const levels=CONFIG.families[family][split];
  const out=[];
  for(let si=0;si<scales.length;si++)for(let li=0;li<levels.length;li++) {
    const level=levels[li], scale=scales[si];
    const random=rng(1000*seed+(split==='calibration'?100:500)+familyIndex*40+si*20+li);
    for(let i=0;i<raw.length;i++) {
      const obs={...raw[i].observation,samples:raw[i].observation.samples.map(x=>x*scale)};
      const s=scorePhase(weights,obs), sb=scoreBins(weights,obs);
      const d=family==='gain'?(level-1)*s:scorePhase(weights,obs,level)-s;
      const db=family==='gain'?(level-1)*sb:scoreBins(weights,obs,level)-sb;
      out.push({condition:`${family}:${level}:${scale}`,level,scale,s,sb,d,db,
        epsilon:random.normal(),uniform:random.uniform()});
    }
  }
  return out;
}
function observe(fixture, a, b) {
  return fixture.map(row=>{
    const mu=row.s+a*row.d, eta=CONFIG.beta*(row.s+b*row.d)+CONFIG.intercept;
    const probability=sigmoid(eta);
    return {...row,mu,eta,probability,neural:mu+CONFIG.sigma*row.epsilon,
      response:Number(row.uniform<probability)};
  });
}

function newton(objective, initial, count) {
  let parameters=initial.slice(), reductions=0;
  for(let iteration=0;iteration<=CONFIG.newtonSteps;iteration++) {
    const state=objective(parameters);
    const gradientPerObservation=Math.max(...state.gradient.map(Math.abs))/count;
    if(gradientPerObservation<CONFIG.gradientTolerance)
      return {parameters,converged:true,iterations:iteration,reductions,gradientPerObservation};
    if(iteration===CONFIG.newtonSteps)
      return {parameters,converged:false,iterations:iteration,reductions,gradientPerObservation};
    let step;
    if(parameters.length===1)step=[state.gradient[0]/(state.hessian[0][0]+1e-12)];
    else {
      const a=state.hessian[0][0]+1e-12,b=state.hessian[0][1],c=state.hessian[1][1]+1e-12;
      const determinant=a*c-b*b;
      assert.ok(determinant>0,'Positive baseline Hessian required');
      step=[(c*state.gradient[0]-b*state.gradient[1])/determinant,
        (a*state.gradient[1]-b*state.gradient[0])/determinant];
    }
    let accepted=false;
    for(let backtrack=0;backtrack<=CONFIG.backtracks;backtrack++) {
      const scale=2**(-backtrack),trial=parameters.map((x,j)=>x-scale*step[j]);
      const loss=objective(trial).loss;
      if(Number.isFinite(loss)&&loss<=state.loss-1e-4*scale*dot(state.gradient,step)+1e-10) {
        parameters=trial;reductions+=backtrack;accepted=true;break;
      }
    }
    if(!accepted)return {parameters,converged:false,iterations:iteration,reductions,
      gradientPerObservation,reason:'line search did not accept a step'};
  }
}
function baselineObjective(rows, parameters) {
  const [beta,c]=parameters, gradient=[0,0],hessian=[[0,0],[0,0]];
  let loss=0;
  for(const row of rows) {
    const eta=beta*row.s+c,p=sigmoid(eta),residual=p-row.response,curvature=p*(1-p);
    loss+=bernoulliLoss(eta,row.response);
    gradient[0]+=row.s*residual;gradient[1]+=residual;
    hessian[0][0]+=row.s*row.s*curvature;hessian[0][1]+=row.s*curvature;
    hessian[1][1]+=curvature;
  }
  hessian[1][0]=hessian[0][1];
  return {loss,gradient,hessian};
}
function stageObjective(rows, beta, c, useNeural, parameters) {
  const alpha=parameters[0];let loss=0,gradient=0,hessian=0;
  for(const row of rows) {
    const eta=beta*(row.s+alpha*row.d)+c,p=sigmoid(eta),v=beta*row.d;
    loss+=bernoulliLoss(eta,row.response);
    gradient+=v*(p-row.response);hessian+=v*v*p*(1-p);
    if(useNeural) {
      const residual=row.s+alpha*row.d-row.neural;
      loss+=residual*residual/(2*variance)+gaussianConstant;
      gradient+=row.d*residual/variance;hessian+=row.d*row.d/variance;
    }
  }
  return {loss,gradient:[gradient],hessian:[[hessian]]};
}
function fitCandidates(rows, baseline) {
  const [beta,c]=baseline.parameters;
  const behavioral=newton(p=>stageObjective(rows,beta,c,false,p),[0],rows.length);
  const receiver=newton(p=>stageObjective(rows,beta,c,true,p),[0],rows.length);
  const numerator=sum(rows.map(r=>r.d*(r.neural-r.s))),denominator=sum(rows.map(r=>r.d*r.d));
  assert.ok(denominator>0,'Neural coefficient identifiable in calibration design');
  const alphaN=numerator/denominator;
  return {behaviorOnly:{receiverAlpha:behavioral.parameters[0],policyAlpha:behavioral.parameters[0],
      identicalObjective:true,optimizer:behavioral},
    candidates:{
      receiver:{a:receiver.parameters[0],b:receiver.parameters[0],parameters:1,optimizer:receiver},
      policy:{a:0,b:behavioral.parameters[0],parameters:1,optimizer:behavioral},
      mixed:{a:alphaN,b:behavioral.parameters[0],parameters:2,optimizer:behavioral,
        neuralNormalEquationResidual:sum(rows.map(r=>r.d*(r.s+alphaN*r.d-r.neural)))/rows.length}
    }};
}
function score(rows, model, baseline, bins=false) {
  const [beta,c]=baseline.parameters;let receiver=0,behavior=0,klN=0,klY=0,mse=0,correct=0;
  for(const row of rows) {
    const s=bins?row.sb:row.s,d=bins?row.db:row.d;
    const mu=s+model.a*d,eta=beta*(s+model.b*d)+c;
    receiver+=gaussianConstant+(row.neural-mu)**2/(2*variance);
    behavior+=bernoulliLoss(eta,row.response);
    const squared=(mu-row.mu)**2;
    mse+=squared;klN+=squared/(2*variance);
    klY+=bernoulliLoss(eta,row.probability)-bernoulliLoss(row.eta,row.probability);
    correct+=Number(Number(eta>=0)===row.response);
  }
  return {observations:rows.length,receiverNLL:receiver/rows.length,behaviorNLL:behavior/rows.length,
    jointNLL:(receiver+behavior)/rows.length,expectedReceiverExcess:klN/rows.length,
    expectedBehaviorExcess:klY/rows.length,expectedJointExcess:(klN+klY)/rows.length,
    receiverMeanMSE:mse/rows.length,responseAccuracy:correct/rows.length};
}

export function run() {
  const checks=[];
  const check=(name,fn)=>{try{fn();checks.push({name,passed:true});}
    catch(error){checks.push({name,passed:false,error:String(error.message).slice(0,300)});}};
  const results=[],baselines=[],equivalence={maxScoreDifference:0,maxPredictionDifference:0,
    pairedBehaviorDisagreements:0,behaviorOnlyParameterDifference:0},restoration={maxContrast:0};
  let preservedWeights=true,maxNormalEquationResidual=0;

  check('Stable finite logistic loss at extreme arguments',()=>{
    for(const z of [-1000,-100,0,100,1000]) {
      assert.ok(Number.isFinite(softplus(z)));assert.ok(sigmoid(z)>=0&&sigmoid(z)<=1);
    }
  });
  check('Algebraic phase/time-bin identity includes perturbations and arbitrary weights',()=>{
    const weights=[0.3,-0.2,0.7,-0.8],raw=episodes(778,'timing',16);
    for(const row of raw)for(const theta of [0,0.29,-1.7,Math.PI])
      near(scorePhase(weights,row.observation,theta),scoreBins(weights,row.observation,theta));
    for(const row of raw)near(scorePhase(weights,row.observation),dot(weights,features(row.observation,'phase')));
  });
  check('Frozen input split seeds are disjoint',()=>{
    const all=CONFIG.seeds.flatMap(seed=>[1,2,3,4].map(n=>seed*1000+n));
    assert.equal(new Set(all).size,all.length);
  });
  for(const seed of CONFIG.seeds) {
    const acquisition=episodes(seed*1000+1,'timing',CONFIG.acquisition);
    const weights=train(acquisition,'phase','contingent',acquisition).weights;
    const weightSnapshot=JSON.stringify(weights);
    const baselineRaw=episodes(seed*1000+2,'timing',CONFIG.baseline),random=rng(seed*1000+5);
    const baselineFixture=baselineRaw.map(row=>({s:scorePhase(weights,row.observation),
      sb:scoreBins(weights,row.observation),d:0,db:0,epsilon:random.normal(),uniform:random.uniform()}));
    const baselineRows=observe(baselineFixture,0,0);
    const baseline=newton(p=>baselineObjective(baselineRows,p),[1,0],baselineRows.length);
    baselines.push({seed,weights,calibration:baseline,
      learnedHeldoutAccuracy:evaluate(weights,baselineRaw,'phase').accuracy});
    for(const family of Object.keys(CONFIG.families)) {
      const calibrationFixture=fixtures(seed,weights,family,'calibration');
      const testFixture=fixtures(seed,weights,family,'test');
      for(const row of testFixture) {
        equivalence.maxPredictionDifference=Math.max(equivalence.maxPredictionDifference,
          Math.abs(row.s-row.sb),Math.abs(row.d-row.db));
        if((family==='gain'&&row.level===1)||(family==='registration'&&row.level===0))
          restoration.maxContrast=Math.max(restoration.maxContrast,Math.abs(row.d));
      }
      const receiverResponses=observe(testFixture,1,1),policyResponses=observe(testFixture,0,1);
      equivalence.pairedBehaviorDisagreements+=sum(receiverResponses.map((r,i)=>
        Number(r.response!==policyResponses[i].response||r.probability!==policyResponses[i].probability)));
      for(const [world,[a,b]]of Object.entries(CONFIG.worlds)) {
        const calibrationRows=observe(calibrationFixture,a,b),testRows=observe(testFixture,a,b);
        const fit=fitCandidates(calibrationRows,baseline);
        equivalence.behaviorOnlyParameterDifference=Math.max(equivalence.behaviorOnlyParameterDifference,
          Math.abs(fit.behaviorOnly.receiverAlpha-fit.behaviorOnly.policyAlpha));
        maxNormalEquationResidual=Math.max(maxNormalEquationResidual,
          Math.abs(fit.candidates.mixed.neuralNormalEquationResidual));
        for(const candidate of CONFIG.candidates) {
          const model=fit.candidates[candidate],phaseScore=score(testRows,model,baseline);
          const binScore=score(testRows,model,baseline,true);
          for(const key of Object.keys(phaseScore))equivalence.maxScoreDifference=
            Math.max(equivalence.maxScoreDifference,Math.abs(phaseScore[key]-binScore[key]));
          const conditions=Array.from(new Set(testRows.map(r=>r.condition))).map(condition=>{
            const rows=testRows.filter(r=>r.condition===condition);
            return {condition,level:rows[0].level,scale:rows[0].scale,...score(rows,model,baseline)};
          });
          results.push({seed,family,world,candidate,fit:model,baselineParameters:baseline.parameters,
            behaviorOnly:fit.behaviorOnly,phaseScore,binScore,conditions});
        }
        if(seed===101&&family==='gain'&&world==='mixed') {
          check('Analytic joint-stage gradient and Hessian match finite differences',()=>{
            const beta=baseline.parameters[0],c=baseline.parameters[1],x=0.43,h=1e-5;
            const center=stageObjective(calibrationRows,beta,c,true,[x]);
            const left=stageObjective(calibrationRows,beta,c,true,[x-h]);
            const right=stageObjective(calibrationRows,beta,c,true,[x+h]);
            near(center.gradient[0],(right.loss-left.loss)/(2*h),1e-5);
            near(center.hessian[0][0],(right.gradient[0]-left.gradient[0])/(2*h),1e-5);
          });
          check('Analytic baseline gradient/Hessian match finite differences',()=>{
            const x=[1.2,0.13],h=1e-5,center=baselineObjective(baselineRows,x);
            for(let j=0;j<2;j++) {
              const left=x.slice(),right=x.slice();left[j]-=h;right[j]+=h;
              const l=baselineObjective(baselineRows,left),r=baselineObjective(baselineRows,right);
              near(center.gradient[j],(r.loss-l.loss)/(2*h),1e-5);
              for(let k=0;k<2;k++)near(center.hessian[k][j],(r.gradient[k]-l.gradient[k])/(2*h),1e-5);
            }
          });
          check('Gaussian expected excess equals receiver mean-square error / (2 variance)',()=>{
            for(const candidate of CONFIG.candidates) {
              const value=score(testRows,fit.candidates[candidate],baseline);
              near(value.expectedReceiverExcess,value.receiverMeanMSE/(2*variance));
            }
          });
        }
      }
    }
    preservedWeights=preservedWeights&&JSON.stringify(weights)===weightSnapshot;
  }

  check('All 288 joint candidate fits and 12 common baseline fits retained',()=>{
    assert.equal(results.length,288);assert.equal(baselines.length,12);
  });
  check('All fitted optimizers meet the prespecified gradient tolerance',()=>{
    assert.ok(baselines.every(x=>x.calibration.converged));
    assert.ok(results.every(x=>x.fit.optimizer.converged&&x.behaviorOnly.optimizer.converged));
  });
  check('OLS normal equations satisfied',()=>assert.ok(maxNormalEquationResidual<1e-10));
  check('Receiver/policy generators produce exactly identical paired behavior',()=>
    assert.equal(equivalence.pairedBehaviorDisagreements,0));
  check('Behavior-only receiver/policy fitted families are identical',()=>
    assert.equal(equivalence.behaviorOnlyParameterDifference,0));
  check('Capable nonoscillatory implementation matches all joint test scores',()=>{
    assert.ok(equivalence.maxScoreDifference<1e-10);assert.ok(equivalence.maxPredictionDifference<1e-10);
  });
  check('Reset condition exactly restores the supplied baseline relation',()=>near(restoration.maxContrast,0));
  check('Calibration and probes preserve acquired weights',()=>assert.ok(preservedWeights));
  check('All condition scores exposed and finite, no hidden winner gate',()=>{
    for(const result of results) {
      assert.equal(result.conditions.length,CONFIG.families[result.family].test.length*CONFIG.testScales.length);
      for(const record of [result.phaseScore,result.binScore,...result.conditions]) {
        for(const [key,value]of Object.entries(record))if(typeof value==='number')assert.ok(Number.isFinite(value),key);
        assert.ok(record.expectedJointExcess>=-1e-12);
        assert.ok(record.responseAccuracy>=0&&record.responseAccuracy<=1);
      }
    }
  });
  const summaries=[],contrasts=[];
  for(const family of Object.keys(CONFIG.families))for(const world of Object.keys(CONFIG.worlds)) {
    for(const candidate of CONFIG.candidates) {
      const rows=results.filter(r=>r.family===family&&r.world===world&&r.candidate===candidate);
      const metrics={};
      for(const metric of ['jointNLL','receiverNLL','behaviorNLL','expectedJointExcess','responseAccuracy'])
        metrics[metric]=describe(rows.map(r=>r.phaseScore[metric]));
      summaries.push({family,world,candidate,alphaN:describe(rows.map(r=>r.fit.a)),
        alphaY:describe(rows.map(r=>r.fit.b)),metrics});
    }
    for(const [left,right]of [['policy','receiver'],['receiver','mixed'],['policy','mixed']]) {
      const paired=CONFIG.seeds.map(seed=>{
        const find=c=>results.find(r=>r.seed===seed&&r.family===family&&r.world===world&&r.candidate===c);
        return {seed,realized:find(left).phaseScore.jointNLL-find(right).phaseScore.jointNLL,
          expected:find(left).phaseScore.expectedJointExcess-find(right).phaseScore.expectedJointExcess};
      });
      contrasts.push({family,world,contrast:`${left}_minus_${right}`,
        realized:describe(paired.map(x=>x.realized)),expected:describe(paired.map(x=>x.expected))});
    }
  }
  return {artifact:'Learning to Feel — Application 05',
    scope:'Synthetic joint-measurement identifiability; not mediation, consciousness or external-theory replication',
    config:CONFIG,checks,passedChecks:checks.filter(x=>x.passed).length,totalChecks:checks.length,
    equivalence,restoration,maxNormalEquationResidual,baselines,summaries,contrasts,results};
}

const boundPaths=[
  '../APPLICATION-05-JOINT-IDENTIFIABILITY-PROTOCOL.md',
  'joint-receiver-comparison.mjs','learned-receiver-application.mjs',
  '../drafts/DRAFT-15-EXPERIENCE-DEPENDENT-RECEIVING-STATE-20261007.md',
  '../drafts/DRAFT-06-TECHNICAL-SUPPLEMENT-20261007.md',
  '../output/pdf/draft15-review-r2/Learning-to-Feel-Draft15-Review.pdf',
  '../output/pdf/draft15-review-r2/Learning-to-Feel-Draft15-Technical-Supplement.pdf',
  '../review-packets/draft14-private-review-20261007-r2.zip'
];
function bindings() {
  return boundPaths.map(path=>{const bytes=readFileSync(new URL(path,import.meta.url));
    return {path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const target=new URL('joint-receiver-comparison-results.json',import.meta.url);
  const mode=process.argv[2];assert.ok(['--save','--replay'].includes(mode),'Use --save or --replay');
  if(mode==='--save')assert.ok(!existsSync(target),'Refuse to overwrite any historical results');
  const sourceBindings=bindings(),started=new Date().toISOString(),t=performance.now();
  const experiment=run(),elapsedSeconds=(performance.now()-t)/1000;
  assert.deepEqual(bindings(),sourceBindings,'All bound inputs must remain unchanged');
  if(mode==='--save')writeFileSync(target,JSON.stringify({started,node:process.version,elapsedSeconds,
    sourceBindings,experiment},null,2)+'\n',{flag:'wx'});
  else {
    const saved=JSON.parse(readFileSync(target,'utf8'));
    assert.deepEqual(sourceBindings,saved.sourceBindings,'Exact saved source bindings');
    assert.deepEqual(experiment,saved.experiment,'Exact deterministic replay');
  }
  console.log(JSON.stringify({mode,path:fileURLToPath(target),elapsedSeconds,
    passedChecks:experiment.passedChecks,totalChecks:experiment.totalChecks,
    failedChecks:experiment.checks.filter(x=>!x.passed),equivalence:experiment.equivalence,
    contrasts:experiment.contrasts.filter(x=>x.contrast==='policy_minus_receiver').map(x=>
      ({family:x.family,world:x.world,mean:x.realized.mean,mcse:x.realized.monteCarloSE}))},null,2));
  if(experiment.passedChecks!==experiment.totalChecks)process.exitCode=1;
}
