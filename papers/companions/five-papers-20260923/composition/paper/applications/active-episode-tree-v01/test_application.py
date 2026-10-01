"""Small deterministic interface, learning, conservation and counterexample checks."""
from common import ROOT,SOURCES,config,low_priority,save,sha,np,views,CLASSES
from world import generate,targets,roles,Environment,oracle_bound
from tree import train,predict,feature,entropy
from agent import Agent,permute
import time
import ast


def main():
    low_priority(); cfg=config();checks={}
    def ck(name,value):
        checks[name]=bool(value)
        if not value:
            raise AssertionError(name)
    x,blocks,codes=generate(9001,'test',4)
    y=targets(x); v=views(x)
    ck('view_shape_and_categories',v.shape==(32,24) and np.array_equal(v[:,::2],x//2) and np.array_equal(v[:,1::2],x))
    ck('all_targets_legal',all(np.all((y[:,t]>=0)&(y[:,t]<k)) for t,k in enumerate(CLASSES)))
    ck('each_block_balanced',all(np.bincount(y[blocks==b,5],minlength=2).tolist()==[4,4] for b in range(4)))
    for name,keep,expected in (
        ('old_focal',lambda r:(r[4],),.5),('new_focal',lambda r:(r[10],),.5),
        ('coarse_pair',lambda r:(r[4]//2,r[10]//2),.5),('unordered_pair',lambda r:sorted((r[4],r[10])),.5),
        ('ordered_pair',lambda r:(r[4],r[10]),1),('coarse_old_fine_new',lambda r:(r[4]//2,r[10]),1),
        ('fine_old_coarse_new',lambda r:(r[4],r[10]//2),1)):
        ck(name+'_exact_bound',all(oracle_bound(x[blocks==b],y[blocks==b,5],keep)==expected for b in range(4)))
    xx,bb,cc=generate(9001,'development',4,codes)
    ck('excluded_backgrounds_disjoint',set(codes).isdisjoint(cc))
    ck('seeded_generator_exact',all(np.array_equal(a,b) for a,b in zip((x,blocks,codes),generate(9001,'test',4))))
    ck('roles_never_repeat_adjacent',all(len(set(r[:2]))==2 and r[1]!=r[2] for b in range(4) for t in range(8) for r in [roles(b,t,cfg)]))
    assigned=np.asarray([[roles(int(b),t,cfg) for b in blocks] for t in range(8)])
    ck('roles_constant_within_eight_case_block',all(np.unique(assigned[t,blocks==b],axis=0).shape==(1,3) for t in range(8) for b in range(4)))
    ck('first_role_does_not_disclose_temporal_label',all(np.bincount(y[assigned[t,:,0]==first,5],minlength=2)[0]==np.bincount(y[assigned[t,:,0]==first,5],minlength=2)[1] for t in range(8) for first in cfg['first_roles']))
    ck('entropy_bits',abs(float(entropy([1,1]))-1)<1e-12 and float(entropy([2,0]))==0)
    # Exact repeated finite witness, not a held-out performance sample.
    tx=np.tile(x[:8],(8,1));ty=targets(tx)[:,5]
    paired,work=train(views(tx),ty,2,'paired',cfg,time.perf_counter()+5)
    single,_=train(views(tx),ty,2,'single',cfg,time.perf_counter()+5)
    ck('paired_rule_is_learned',work['nodes']>1 and 'features' in paired)
    ck('myopic_balanced_rule_has_no_split','features' not in single)
    ck('cheaper_mixed_granularity_selected',set(paired['features']) in ({8,21},{9,20}))
    probs=[predict(paired,{i:(2,int(val)) for i,val in enumerate(row)})[0] for row in tx]
    ck('learned_relation_prediction',np.array_equal(np.argmax(probs,axis=1),ty))
    ck('probabilities_normalized',all(abs(p.sum()-1)<1e-12 and np.all(p>0) for p in probs))
    # Learn the conditional task from a separate full Cartesian toy fixture.
    cx=np.zeros((128,12),dtype=np.int8)
    for i in range(128):
        cx[i,6]=(i//8)%4;cx[i,8]=(i//32)%4
    conditional,_=train(views(cx),targets(cx)[:,6],5,'paired',cfg,time.perf_counter()+5)
    ck('conditional_gate_learned',conditional.get('features')==[16])
    models=[conditional]*8
    low=Environment([3,0,0,0,0,0],[0]*6);high=Environment([3,0,3,0,0,0],[0]*6)
    al=Agent(models,'paired');ah=Agent(models,'paired')
    pl,ll=al.query(6,low.observe);ph,lh=ah.query(6,high.observe)
    ck('conditional_answers',pl.argmax()==0 and ph.argmax()==4)
    ck('state_dependent_sampling',len(low.calls)==1 and len(high.calls)==2 and low.calls[0][1:3]==(2,1) and high.calls[1][1:3]==(0,2))
    ck('no_free_familiarization',len(al.current)==1 and len(al.reference)==0)
    calls=len(high.calls);ph2,lh2=ah.query(6,high.observe)
    ck('cached_evidence_reused',len(high.calls)==calls and lh2['counts']['samples']==0 and np.array_equal(ph,ph2))
    previous=dict(ah.current);ah.switch();high.switch()
    ck('only_encountered_history_persists',ah.reference==previous and ah.current=={})
    # Same observable evidence, different unobserved values/future.
    e1=Environment([3,0,0,0,0,0],[0]*6);e2=Environment([2,3,0,2,1,3],[3]*6)
    a1=Agent(models,'paired');a2=Agent(models,'paired')
    q1,l1=a1.query(6,e1.observe);q2,l2=a2.query(6,e2.observe)
    ck('hidden_values_do_not_change_policy',l1['actions']==l2['actions'] and np.array_equal(q1,q2))
    ck('current_observe_ignores_future',e1.calls==e2.calls)
    source=(ROOT/'agent.py').read_text(encoding='utf-8');parsed=ast.parse(source)
    imported=[n.module for n in ast.walk(parsed) if isinstance(n,ast.ImportFrom)]
    ck('agent_has_no_world_or_label_import',imported==['common','tree'] and 'targets(' not in source and '._old' not in source and '._new' not in source)
    assembly={0:(1,0),1:(2,3),6:(2,2),9:(1,1)}
    ck('binding_map_exact_inverse',permute(permute(assembly))==assembly)
    ar=Agent(models,'restore_binding');pr,lr=ar.query(6,Environment([3,0,3,0,0,0],[0]*6).observe)
    ck('inverse_restores_prediction',np.array_equal(pr,ph) and lr['assembly']==lh['assembly'])
    ac=Agent(models,'coarsen_assembly');pc,lc=ac.query(6,Environment([3,0,3,0,0,0],[0]*6).observe)
    ck('coarsening_leaves_source_cache_fine',ac.current[0][0]==2 and lc['assembly'][6][0]==1)
    ck('coarsening_can_remove_readout_detail',pc.max()<ph.max() and np.isclose(pc.sum(),1))
    reset=Agent([paired]*8,'reset_reference');reset.current={4:(2,0)};reset.switch()
    ck('reset_removes_only_reference',reset.reference=={} and reset.models[5] is paired)
    unavailable=Agent([paired]*8,'paired');unavailable.switch()
    pu,lu=unavailable.query(5,Environment([0]*6,[0,0,0,0,1,0]).observe)
    ck('unseen_history_not_invented',lu['counts']['unavailable']==1 and unavailable.reference=={} and pu.max()==.5)
    denied=Agent([conditional]*8,'no_new_samples');denied.switch();calls=[]
    pn,ln=denied.query(6,lambda *args:calls.append(args))
    ck('denied_sample_never_calls_sensor',not calls and ln['counts']['unavailable']==1)
    rich=Agent(models,'full_record');er=Environment([3,0,3,0,0,0],[1]*6);_,rl=rich.query(6,er.observe)
    ck('full_record_charges_all_reference_samples',rl['counts']['samples']==6 and rl['counts']['sampling_bits']==12)
    rich.switch();er.switch();_,rl2=rich.query(6,er.observe)
    ck('full_record_charges_changed_scene',rl2['counts']['samples']==6 and rl2['counts']['sampling_bits']==12)
    _,rl3=rich.query(6,er.observe)
    ck('full_record_reuses_same_current_scene',rl3['counts']['samples']==0)
    timed=False
    try:
        train(views(tx),ty,2,'paired',cfg,time.perf_counter()-1)
    except TimeoutError:
        timed=True
    ck('fit_deadline_checked',timed)
    receipt={'passed':sum(checks.values()),'total':len(checks),'checks':checks,
        'source_hashes':{n:sha(ROOT/n) for n in SOURCES},
        'scope':'Internal finite/interface tests; no declared training/development/held-out model fit.'}
    save(ROOT/'TESTS-02.json',receipt)
    print({'passed':receipt['passed'],'total':receipt['total']})


if __name__=='__main__':
    main()
