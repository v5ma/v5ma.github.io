"""Post-result trace, learning-count and uncertainty audit, separate from frozen code."""
from common import ROOT,SOURCES,CONDITIONS,CLASSES,config,low_priority,read,save,sha,np
import sys
import time


def labels(x):
    out=np.empty((len(x),8),dtype=np.int8)
    for i,r in enumerate(x):
        out[i]=[r[6],r[11],4*(r[8]//2)+2*(r[9]//2)+r[10]//2,
            4*r[7]+r[9],4*r[0]+r[5],int((int(r[10])-int(r[4]))%4==1),
            0 if r[8]<2 else 1+r[6],r[10]]
    return out


def read_value(fid,assembly):
    entry=assembly.get(fid//2);lev=1+fid%2
    if entry is None or entry[0]<lev:return None
    return entry[1]//2 if entry[0]==2 and lev==1 else entry[1]


def probability(node,assembly):
    if 'features' not in node:return np.asarray(node['prob']),1
    fs=node['features'];got=[read_value(f,assembly) for f in fs]
    if None not in got:
        key=0
        for f,v in zip(fs,got):key=key*(2**(1+f%2))+v
        if str(key) not in node['children']:return np.asarray(node['prob']),1
        p,n=probability(node['children'][str(key)],assembly);return p,n+1
    total=0;out=np.zeros(len(node['prob']));work=1
    for key,child in node['children'].items():
        k=int(key);values=[]
        for f in fs[::-1]:
            values.insert(0,k%(2**(1+f%2)));k//=2**(1+f%2)
        valid=True
        for f,v in zip(fs,values):
            entry=assembly.get(f//2)
            if entry is None:continue
            lev=1+f%2
            if entry[0]>=lev:
                valid &= v==read_value(f,assembly)
            else:
                valid &= v//2==entry[1]
        if valid:
            p,n=probability(child,assembly);out+=child['n']*p;total+=child['n'];work+=n
    return (out/total if total else np.asarray(node['prob'])),work


def unpack(a):
    return {i:(int(row[0]),int(row[1])) for i,row in enumerate(a) if row[0]>=0}


def main(version):
    low_priority();started=time.perf_counter();cfg=config();checks={}
    def ck(name,value):
        checks[name]=bool(value)
        if not value:raise AssertionError(name)
    frozen=read(ROOT/'fit-01/FROZEN.json');tests=read(ROOT/'TESTS-02.json')
    ck('41_current_pre_fit_checks',tests['passed']==tests['total']==41)
    ck('source_freeze_unchanged',frozen['source_hashes']==tests['source_hashes']=={n:sha(ROOT/n) for n in SOURCES})
    ck('training_archive_unchanged',frozen['training_data_sha256']==sha(ROOT/'fit-01/training-data.npz'))
    ck('twelve_complete_models',frozen['complete'] and len(frozen['models'])==12)
    ck('all_model_hashes_unchanged',all(sha(ROOT/'fit-01'/m['name'])==m['sha256'] for m in frozen['models']))
    fits={(m['seed'],m['family']):read(ROOT/'fit-01'/m['name']) for m in frozen['models']}
    result=read(ROOT/'heldout-01/RESULT.json');replay=read(ROOT/'heldout-replay-01/RESULT.json')
    dev=read(ROOT/'development-01/RESULT.json')
    ck('all_three_evaluations_complete',all(v['complete'] and v['rows']==101376 for v in (result,replay,dev)))
    ck('each_evaluation_reuses_freeze',all(v['frozen_sha256']==sha(ROOT/'fit-01/FROZEN.json') and v['source_hashes']==frozen['source_hashes'] for v in (result,replay,dev)))
    for folder,r in (('heldout-01',result),('heldout-replay-01',replay),('development-01',dev)):
        ck(folder+'_artifact_hashes',all(sha(ROOT/folder/n)==v['sha256'] and (ROOT/folder/n).stat().st_size==v['bytes'] for n,v in r['files'].items()))
    ck('full_heldout_artifact_byte_replay',result['files']==replay['files'])
    ck('heldout_all_reported_cells_replay',result['cells']==replay['cells'])
    data=np.load(ROOT/'heldout-01/predictions.npz',allow_pickle=False)
    cases=np.load(ROOT/'heldout-01/cases.npz',allow_pickle=False)
    dcases=np.load(ROOT/'development-01/cases.npz',allow_pickle=False)
    training=np.load(ROOT/'fit-01/training-data.npz',allow_pickle=False)
    meta=data['meta'];pr=data['prob'];counts=data['counts'];actions=data['actions'];assemblies=data['assembly'];caches=data['cache']
    ck('array_dimensions',meta.shape==(101376,9) and pr.shape==(101376,16) and counts.shape==(101376,10) and actions.shape==(101376,32,3) and assemblies.shape==(101376,12,2) and caches.shape==(101376,12,2))
    ck('normalized_positive_legal_probabilities',all(np.all(pr[meta[:,6]==t,:k]>0) and np.all(pr[meta[:,6]==t,k:]==0) and np.allclose(pr[meta[:,6]==t,:k].sum(axis=1),1,rtol=0,atol=1e-12) for t,k in enumerate(CLASSES)))
    ck('all_predictions_are_probability_argmax',np.array_equal(pr.argmax(axis=1),meta[:,8]))
    ck('trace_storage_has_no_invalid_levels',np.isin(assemblies[:,:,0],[-1,1,2]).all() and np.isin(caches[:,:,0],[-1,1,2]).all())
    learned_nodes=0;roots=[];split_codes={}
    for si,seed in enumerate(cfg['seeds']):
        x=cases[f's{seed}_x'];tx=training[f's{seed}_x'];y=labels(tx)
        split_codes[seed]={key:set(int(v) for v in bundle[f's{seed}_codes']) for key,bundle in [('training',training),('development',dcases),('heldout',cases)]}
        ck(f'{seed}_all_background_splits_disjoint',all(split_codes[seed][a].isdisjoint(split_codes[seed][b]) for a,b in [('training','development'),('training','heldout'),('development','heldout')]))
        ck(f'{seed}_training_labels_recomputed',np.array_equal(y,training[f's{seed}_y']))
        ck(f'{seed}_all_training_classes',all(set(y[:,t])==set(range(k)) for t,k in enumerate(CLASSES)))
        for split,bundle in [('training',training),('development',dcases),('heldout',cases)]:
            z=bundle[f's{seed}_x'];b=bundle[f's{seed}_blocks'];tar=labels(z)[:,5]
            valid=True
            for block in range(cfg['blocks'][split]):
                rows=z[b==block]
                valid &= len(rows)==8 and sorted((int(r[4]),int((r[10]-r[4])%4)) for r in rows)==[(o,d) for o in range(4) for d in (1,3)]
                for mode in ('old','new','coarse','unordered','mixed'):
                    groups={}
                    for row,t in zip(rows,tar[b==block]):
                        old,new=int(row[4]),int(row[10])
                        key={'old':(old,),'new':(new,),'coarse':(old//2,new//2),'unordered':tuple(sorted((old,new))),'mixed':(old//2,new)}[mode]
                        groups.setdefault(key,[0,0])[int(t)]+=1
                    bound=sum(max(v) for v in groups.values())/8
                    valid &= bound==(1 if mode=='mixed' else .5)
            ck(f'{seed}_{split}_exact_temporal_contract',valid)
        expected=labels(x);first_expected=labels(np.concatenate((x[:,:6],x[:,:6]),axis=1))
        keep=meta[:,0]==si;mm=meta[keep]
        correct=np.where(mm[:,5]==0,first_expected[mm[:,2],mm[:,6]],expected[mm[:,2],mm[:,6]])
        ck(f'{seed}_every_evaluation_target_recomputed',np.array_equal(correct,mm[:,7]))
        for family in ('paired','single','fine','coarse'):
            model=fits[(seed,family)]
            for task,tree in enumerate(model['trees']):
                roots.append({'seed':seed,'family':family,'task':task,'root_views':tree.get('features',[]),'nodes':model['work'][task]['nodes']})
                def review_node(node,indices,depth):
                    nonlocal learned_nodes
                    learned_nodes+=1
                    hist=np.bincount(y[indices,task],minlength=CLASSES[task])
                    assert node['n']==len(indices) and hist.tolist()==node['counts']
                    assert np.allclose(node['prob'],(hist+cfg['smoothing'])/(len(indices)+CLASSES[task]*cfg['smoothing']),rtol=0,atol=1e-14)
                    assert depth<=cfg['max_depth']
                    if 'features' not in node:return
                    fs=node['features'];assert len(fs)==1 or (family!='single' and len(fs)==2)
                    assert len({f//2 for f in fs})==len(fs)
                    if family=='fine':assert all(f%2==1 for f in fs)
                    if family=='coarse':assert all(f%2==0 for f in fs)
                    code=np.zeros(len(indices),dtype=np.int16)
                    for f in fs:
                        value=tx[indices,f//2];value=value if f%2 else value//2
                        code=code*(2**(1+f%2))+value
                    assert set(node['children'])=={str(int(v)) for v in np.unique(code)}
                    for key,child in node['children'].items():
                        ix=indices[code==int(key)];assert len(ix)>=cfg['min_leaf']
                        review_node(child,ix,depth+1)
                review_node(tree,np.arange(len(tx)),0)
    ck('all_learned_node_counts_and_probabilities_recomputed',learned_nodes>96)
    ck('tree_families_are_not_identical_placeholders',all(fits[(s,'paired')]['trees']!=fits[(s,'single')]['trees'] and fits[(s,'paired')]['trees']!=fits[(s,'coarse')]['trees'] for s in cfg['seeds']))
    ck('seed_specific_learned_counts_differ',fits[(cfg['seeds'][0],'paired')]['trees']!=fits[(cfg['seeds'][1],'paired')]['trees'])
    # Reconstruct every observed cache, assembly and readout directly from logged actions.
    trace_rows=0
    for start in range(0,len(meta),3):
        si,ci,case,block,second=map(int,meta[start,:5]);condition=CONDITIONS[ci];seed=cfg['seeds'][si]
        row=cases[f's{seed}_x'][case];current={};reference={}
        family=condition if condition in ('single','fine','coarse') else 'paired'
        trees=fits[(seed,family)]['trees']
        for stage in range(3):
            ix=start+stage;mm=meta[ix]
            assert np.array_equal(mm[:5],meta[start,:5]) and mm[5]==stage
            if stage==1:
                reference=dict(current) if condition!='reset_reference' else {};current={}
            task=int(mm[6]);node=trees[task];assembly={};logged=[tuple(map(int,a)) for a in actions[ix] if a[0]>=0]
            pos=0;bits=0;samples=0;retrievals=0;unavailable=0;policy_work=0
            def consume(fid):
                nonlocal pos,bits,samples,retrievals,unavailable
                if read_value(fid,assembly) is not None:return True
                assert pos<len(logged) and logged[pos][0]==fid
                _,src,val=logged[pos];pos+=1;idx=fid//2;lev=1+fid%2;physical=idx%6
                old=stage>0 and idx<6;cache=reference if old else current;entry=cache.get(physical)
                if entry is not None and entry[0]>=lev:
                    expected=entry[1]//2 if entry[0]==2 and lev==1 else entry[1]
                    assert src==1 and val==expected;retrievals+=1
                elif old or (stage>0 and condition=='no_new_samples'):
                    assert src==2 and val==-1;unavailable+=1;return False
                else:
                    expected=int(row[physical+(6 if stage>0 else 0)])
                    if lev==1:expected//=2
                    assert src==0 and val==expected;samples+=1;bits+=lev
                    cache[physical]=(lev,val)
                if idx not in assembly or assembly[idx][0]<lev:assembly[idx]=(lev,val)
                return True
            if condition=='full_record':
                for j in range(12):consume(2*j+1)
            while 'features' in node:
                policy_work+=1
                if not all(consume(f) for f in node['features']):break
                key=0
                for f in node['features']:key=key*(2**(1+f%2))+read_value(f,assembly)
                if str(key) not in node['children']:break
                node=node['children'][str(key)]
            assert pos==len(logged)
            if condition=='coarsen_assembly':assembly={k:(1,v//2 if lev==2 else v) for k,(lev,v) in assembly.items()}
            elif condition=='permute_binding':assembly={{0:1,1:0,6:7,7:6}.get(k,k):v for k,v in assembly.items()}
            # Inverse restoration is identity, independently checked against recorded assembly.
            assert assembly==unpack(assemblies[ix])
            assert {**reference,**{k+6:v for k,v in current.items()}}==unpack(caches[ix])
            pp,work=probability(trees[task],assembly)
            assert np.allclose(pp,pr[ix,:len(pp)],rtol=0,atol=1e-14)
            expected_counts=[bits,samples,retrievals,unavailable,policy_work,work,len(assembly),sum(v[0] for v in assembly.values()),len(reference),len(current)]
            assert expected_counts==counts[ix].tolist()
            trace_rows+=1
        if time.perf_counter()-started>90:raise TimeoutError('Audit deadline')
    ck('all_query_actions_cache_assembly_readout_and_costs_reconstructed',trace_rows==len(meta))
    summaries=[]
    for ci,condition in enumerate(CONDITIONS):
        base=meta[:,1]==ci;entry={'condition':condition}
        for stage in range(3):
            keep=base&(meta[:,5]==stage);mm=meta[keep];pp=pr[keep];ct=counts[keep]
            entry[f'query{stage+1}']={'n':int(keep.sum()),'record_mean_accuracy':float(np.mean(mm[:,7]==mm[:,8])),
                'nll':float(-np.log(pp[np.arange(len(pp)),mm[:,7]]).mean()),
                **{k:float(ct[:,j].mean()) for j,k in enumerate(result['count_columns'])}}
            task_cells=[c for c in result['cells'] if c['condition']==condition and c['stage']==stage]
            entry[f'query{stage+1}']['task_balanced_accuracy']=float(np.mean([c['accuracy'] for c in task_cells]))
        entry['episode_source_bits']=sum(entry[f'query{s}']['sampling_bits'] for s in (1,2,3))
        summaries.append(entry)
    for c in result['cells']:
        si=cfg['seeds'].index(c['seed']);ci=CONDITIONS.index(c['condition'])
        keep=(meta[:,0]==si)&(meta[:,1]==ci)&(meta[:,5]==c['stage'])&(meta[:,6]==c['task']);mm=meta[keep];pp=pr[keep]
        assert c['n']==len(mm) and c['accuracy']==float(np.mean(mm[:,7]==mm[:,8]))
        assert abs(c['nll']-float(-np.log(pp[np.arange(len(mm)),mm[:,7]]).mean()))<1e-14
        assert all(c[k]==float(counts[keep,j].mean()) for j,k in enumerate(result['count_columns']))
    ck('all_reported_cells_recomputed',True)
    keep0=meta[:,1]==0
    for name in ('attention_equivalent','restore_binding'):
        kk=meta[:,1]==CONDITIONS.index(name)
        ck(name+'_exact_prob_actions_cache_assembly_costs',all(np.array_equal(a[keep0],a[kk]) for a in (pr,counts,actions,assemblies,caches)))
    for name in ('coarsen_assembly','permute_binding'):
        kk=meta[:,1]==CONDITIONS.index(name)
        ck(name+'_sampling_and_cache_preserved',np.array_equal(actions[keep0],actions[kk]) and np.array_equal(caches[keep0],caches[kk]) and np.array_equal(counts[keep0,:5],counts[kk,:5]))
    full=meta[:,1]==CONDITIONS.index('full_record')
    ck('full_record_charges_12_bits_each_scene_not_each_query',all(np.all(counts[full&(meta[:,5]==s),0]==expected) for s,expected in enumerate((12,12,0))))
    reset=meta[:,1]==CONDITIONS.index('reset_reference')
    ck('reset_has_no_reference_cache',np.all(caches[reset,:,:][:,:6,0]==-1))
    no_new=(meta[:,1]==CONDITIONS.index('no_new_samples'))&(meta[:,5]>0)
    ck('no_new_samples_really_zero',np.all(counts[no_new,:2]==0))
    temporal=[];conditional=[]
    for ci,condition in enumerate(CONDITIONS):
        for stage in (1,2):
            keep=(meta[:,1]==ci)&(meta[:,5]==stage)&(meta[:,6]==5)
            for lev in (-1,1,2):
                kk=keep&(caches[:,4,0]==lev)
                if kk.any():temporal.append({'condition':condition,'query':stage+1,'retained_old_focal_level':lev,'n':int(kk.sum()),'accuracy':float(np.mean(meta[kk,7]==meta[kk,8])),'source_bits':float(counts[kk,0].mean())})
            for gate in (0,1):
                kk=(meta[:,1]==ci)&(meta[:,5]==stage)&(meta[:,6]==6)
                ids=np.flatnonzero(kk);ids=np.asarray([i for i in ids if int(cases[f's{cfg["seeds"][meta[i,0]]}_x'][meta[i,2],8])//2==gate],dtype=int)
                if len(ids):conditional.append({'condition':condition,'query':stage+1,'gate_coarse':gate,'n':len(ids),'accuracy':float(np.mean(meta[ids,7]==meta[ids,8])),'source_bits':float(counts[ids,0].mean()),'source_calls':float(counts[ids,1].mean())})
    rng=np.random.default_rng(cfg['bootstrap_seed']);contrasts=[]
    for name,other,metric in [('paired_minus_single_accuracy','single','accuracy'),('paired_minus_fine_accuracy','fine','accuracy'),('paired_minus_fine_query2_bits','fine','sampling_bits'),('paired_minus_full_accuracy','full_record','accuracy')]:
        diffs=np.zeros((3,cfg['blocks']['heldout']))
        for si in range(3):
            for b in range(cfg['blocks']['heldout']):
                values=[]
                for cond in ('paired',other):
                    keep=(meta[:,0]==si)&(meta[:,1]==CONDITIONS.index(cond))&(meta[:,3]==b)&(meta[:,5]==1)
                    values.append(float(np.mean(meta[keep,7]==meta[keep,8])) if metric=='accuracy' else float(counts[keep,0].mean()))
                diffs[si,b]=values[0]-values[1]
        boot=[]
        for _ in range(cfg['bootstrap_repeats']):
            ix=rng.integers(0,diffs.shape[1],size=diffs.shape);boot.append(float(np.mean(diffs[np.arange(3)[:,None],ix])))
        contrasts.append({'name':name,'mean':float(diffs.mean()),'seed_means':diffs.mean(axis=1).tolist(),
            'conditional_background_bootstrap_95_percentile':np.quantile(boot,[.025,.975]).tolist(),
            'paired_background_differences':diffs.tolist()})
    examples=read(ROOT/'heldout-01/EXAMPLES.json')
    ck('bounded_examples_match_actual_success_failure',all((all(q['target']==q['prediction'] for q in v['queries']))==k.endswith('_success') for k,v in examples.items()))
    summary={'source':'heldout-01; no model or hyperparameter selection after fitting','query2_and_query3_have_equal_task_counts':True,
        'seeds':cfg['seeds'],'training_backgrounds_per_seed':128,'heldout_backgrounds_per_seed':16,
        'independent_units_boundary':'Three fitted seeds and 48 seed-specific held-out backgrounds, not 101376 independent trials. Repeated role/case/condition queries are paired.',
        'conditions':summaries,'temporal_by_reference_access':temporal,'conditional_sampling':conditional,
        'query2_contrasts':contrasts,'bootstrap_boundary':'500 stratified paired-background resamples conditional on fixed fitted models and authored tasks; no population or biological interval.',
        'roots':roots,'learned_nodes_reviewed':learned_nodes,'training_seconds':frozen['seconds'],
        'development_seconds':dev['seconds'],'heldout_seconds':result['seconds'],'heldout_replay_seconds':replay['seconds'],
        'audit_seconds':time.perf_counter()-started}
    save(ROOT/f'SUMMARY-{version}.json',summary)
    save(ROOT/f'AUDIT-{version}.json',{'passed':sum(checks.values()),'total':len(checks),'checks':checks,
        'rows_reconstructed':trace_rows,'learned_nodes_reviewed':learned_nodes,
        'source_hashes':frozen['source_hashes'],'audit_code_sha256':sha(ROOT/'audit.py'),
        'summary_sha256':sha(ROOT/f'SUMMARY-{version}.json'),'seconds':time.perf_counter()-started,
        'scope':'Same-assistant post-result implementation audit. No independent human review, neural demonstration, or algorithm-superiority claim.'})
    print({'passed':sum(checks.values()),'total':len(checks),'trace_rows':trace_rows,'learned_nodes':learned_nodes,'seconds':round(time.perf_counter()-started,3)})


if __name__=='__main__':
    if len(sys.argv)!=2 or not sys.argv[1].isdecimal() or len(sys.argv[1])!=2:raise SystemExit('Use a new two-digit audit version')
    main(sys.argv[1])
