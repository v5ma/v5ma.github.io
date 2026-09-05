"""Fixed-text continuation of actual edited GPT-2 KV state; bounded diagnostics."""
import argparse
import csv
import gc
import hashlib
import json
from pathlib import Path
import time
from gpt2_adapter_v5 import ROOT, DEPENDENCY, MODEL, Decoder, Tokenizer, np, sha
from gpt2_learning_v6 import edit
from gpt2_intent_v7 import reflection
from gpt2_receiver_v5 import write_json, write_csv
from commitment_lab import CommitmentStore, Update, sign_update

PROTOCOL=ROOT/'applications/PROTOCOL-GPT2-CONTINUATION-08.json'
PREP=ROOT/'results/gpt2-continuation-08-prepared'
TRAIN=ROOT/'results/gpt2-learning-06'
ARMS=('no_edit','internal','task','yoked','supervised_ridge','reflection','residual_donor','prefix_donor','internal_restore_upper','internal_restore_lower')
INPUTS=('applications/PROTOCOL-GPT2-CONTINUATION-08.json','applications/gpt2_continuation_v8.py','applications/test_gpt2_continuation_v8.py',
    'applications/gpt2_adapter_v5.py','applications/gpt2_learning_v6.py','applications/gpt2_intent_v7.py','applications/gpt2_receiver_v5.py','applications/commitment_lab.py',
    'results/gpt2-learning-06/basis.npz','results/gpt2-learning-06/learned-parameters.npz',
    'results/gpt2-intent-07-prepared/FAMILIES.json','results/gpt2-intent-07-part-0/measurements.csv','results/gpt2-intent-07-part-1/measurements.csv')

def read(path):return json.loads(path.read_text(encoding='utf-8'))

def destination(path):
    out=Path(path).resolve();assert out.is_relative_to(ROOT/'results')
    out.mkdir(parents=True,exist_ok=False);return out

def cache_hash(cache):
    digest=hashlib.sha256()
    for value in cache:
        digest.update(str((value.shape,str(value.dtype))).encode());digest.update(value.tobytes())
    return digest.hexdigest()

def restore(cache,original,upper):
    return [original[i] if (i//2>=9)==upper else value for i,value in enumerate(cache)]

def select_resume(store,case,edited,original):
    if (case,'restore_original') in store.scope:return original,'original'
    if (case,'stop_future_edits') in store.scope:return edited,'edited_no_new_patch'
    raise ValueError('No supported current resume instruction')

def target(case,query,swapped):
    if query=='later_color':return case['color']
    if query=='initial_recipient':return case['giver'] if swapped else case['recipient']
    assert query=='later_giver'
    return case['recipient'] if swapped else case['giver']

def prepare():
    protocol=read(PROTOCOL);assert tuple(protocol['arms'])==ARMS
    tokenizer=Tokenizer.from_file(str(DEPENDENCY/'tokenizer.json'))
    families=read(ROOT/'results/gpt2-intent-07-prepared/FAMILIES.json')
    prepared=[]
    for family in families:
        cases=[]
        for prior in family['cases']:
            if prior['query']!='recipient':continue
            case=dict(prior);case['branches']={}
            for query,suffix in protocol['branches'].items():
                ids=tokenizer.encode(case['text']+suffix,add_special_tokens=False).ids
                assert ids[:len(case['ids'])]==case['ids'] and len(ids)<48
                case['branches'][query]={'text':suffix,'ids':ids[len(case['ids']):]}
            case['all_words']=case['names']+['red','blue']
            word_ids=[tokenizer.encode(' '+word,add_special_tokens=False).ids for word in case['all_words']]
            assert all(len(ids)==1 for ids in word_ids)
            case['all_word_ids']=[ids[0] for ids in word_ids]
            cases.append(case)
        assert len(cases)==4
        prepared.append({'id':family['id'],'cases':cases})
    assert len(prepared)==8
    out=destination(PREP)
    write_json(out/'INPUT-FREEZE.json',{path:sha(ROOT/path) for path in INPUTS})
    write_json(out/'FAMILIES.json',prepared)
    receipt={'status':'PREPARED_WITHOUT_MODEL_INFERENCE','families':8,'root_prompts':32,
        'case_status':'Previously exposed Draft 7 families; no untouched-data claim',
        'branch_lengths':sorted({len(b['ids']) for f in prepared for c in f['cases'] for b in c['branches'].values()}),
        'family_manifest_sha256':sha(out/'FAMILIES.json'),'model_sha256':sha(MODEL),'frozen_before_new_continuations':True}
    write_json(out/'PREPARATION-RECEIPT.json',receipt);print(json.dumps(receipt,indent=2))

def observe(decoder,result,case,arm,query):
    z=result['logits'].astype(np.float64);prob=np.exp(z-z.max());prob/=prob.sum()
    top=int(np.argmax(z));words=case['all_words'];ids=case['all_word_ids']
    wanted=target(case,query,True);natural=target(case,query,False)
    wanted_id=ids[words.index(wanted)];natural_id=ids[words.index(natural)]
    relevant=ids[2:] if query=='later_color' else ids[:2]
    return {'id':case['id']+'/'+arm+'/'+query,'case':case['id'],'family':case['family'],'color':case['color'],
        'giver':case['giver'],'arm':arm,'query':query,'top_id':top,'top_text':decoder.tokenizer.decode([top]),
        'swap_target':wanted,'original_target':natural,'swap_correct':int(top==wanted_id),'original_correct':int(top==natural_id),
        'invalid':int(top not in relevant),'swap_probability':float(prob[wanted_id]),'original_probability':float(prob[natural_id]),
        'word_logits':json.dumps({w:float(z[i]) for w,i in zip(words,ids)}),
        'word_probabilities':json.dumps({w:float(prob[i]) for w,i in zip(words,ids)})}

def suffix(decoder,cache,ids):
    before=cache_hash(cache);state=cache
    for token in ids:result=decoder.step(token,state);state=result['cache']
    assert cache_hash(cache)==before,'Suffix mutated shared root cache'
    return result

def check_frozen():
    for path,value in read(PREP/'INPUT-FREEZE.json').items():assert sha(ROOT/path)==value,path
    assert sha(PREP/'FAMILIES.json')==read(PREP/'PREPARATION-RECEIPT.json')['family_manifest_sha256']

def run(family_index,output):
    started=time.monotonic();check_frozen();out=destination(output)
    protocol=read(PROTOCOL);limits=protocol['resource_limits']
    frozen={path:sha(ROOT/path) for path in INPUTS}
    frozen.update({str((PREP/name).relative_to(ROOT)):sha(PREP/name) for name in ('INPUT-FREEZE.json','FAMILIES.json','PREPARATION-RECEIPT.json')})
    write_json(out/'INPUT-FREEZE.json',frozen)
    try:
        decoder=Decoder(max_seconds=limits['seconds_per_family'])
        basis=dict(np.load(TRAIN/'basis.npz'));weights=dict(np.load(TRAIN/'learned-parameters.npz'))
        family=read(PREP/'FAMILIES.json')[family_index];cases=family['cases']
        base={case['id']:decoder.prompt(case['ids']) for case in cases}
        roots=[];continuations=[];support=[];controls=[];states={};actual_roots=4
        workflow_events=[];workflow_roots=[];workflow_results=[]
        later={};root_cache_hashes={}
        prior_rows=[]
        for part in (0,1):
            with (ROOT/f'results/gpt2-intent-07-part-{part}/measurements.csv').open(newline='',encoding='utf-8') as stream:prior_rows.extend(csv.DictReader(stream))
        prior={r['id']:r for r in prior_rows}
        for case in cases:
            original=base[case['id']];h=original['hooks']['r8'];root={'no_edit':original}
            for arm in ('internal','task','yoked','supervised_ridge','reflection','residual_donor'):
                if arm=='reflection':value,_,_=reflection(h,basis)
                elif arm=='residual_donor':value=base[case['opposite']]['hooks']['r8']
                else:value,_,_=edit(h,weights[arm],basis)
                root[arm]=decoder.step(case['ids'][-1],original['before'],{'r8':value});actual_roots+=1
                for i,(a,b) in enumerate(zip(root[arm]['cache'],original['cache'])):
                    old_error=float(np.max(np.abs(a[:,:,:-1,:]-b[:,:,:-1,:])))
                    last_error=float(np.max(np.abs(a[:,:,-1,:]-b[:,:,-1,:])))
                    assert old_error==0 and (i//2>=9 or last_error==0)
                    support.append({'case':case['id'],'arm':arm,'layer':i//2,'kind':'key' if i%2==0 else 'value',
                        'prior_positions_max_error':old_error,'last_position_max_error':last_error})
            root['prefix_donor']=base[case['opposite']]
            root['internal_restore_upper']=root['internal'];root['internal_restore_lower']=root['internal']
            caches={arm:result['cache'] for arm,result in root.items()}
            caches['internal_restore_upper']=restore(caches['internal'],original['cache'],True)
            caches['internal_restore_lower']=restore(caches['internal'],original['cache'],False)
            assert cache_hash(caches['internal_restore_upper'])==cache_hash(original['cache'])
            assert cache_hash(caches['internal_restore_lower'])==cache_hash(caches['internal'])
            for arm in ARMS:
                result=root[arm];row=observe(decoder,result,case,arm,'initial_recipient')
                alias={'no_edit':'none','supervised_ridge':'d6_ridge','internal':'d6_internal','task':'d6_task','yoked':'d6_yoked','residual_donor':'donor',
                    'internal_restore_upper':'d6_internal','internal_restore_lower':'d6_internal','prefix_donor':'none'}.get(arm,arm)
                old_case=case['opposite'] if arm=='prefix_donor' else case['id']
                historical=prior[old_case+'/'+alias]
                assert int(historical['top_id'])==row['top_id']
                for n,word in enumerate(case['names']):assert float(historical['word_'+('a' if n==0 else 'b')+'_logit'])==json.loads(row['word_logits'])[word]
                row['source_measurement']=old_case+'/'+alias
                row['output_cache_sha256']=cache_hash(result['cache'])
                row['continuation_cache_sha256']=cache_hash(caches[arm])
                roots.append(row);root_cache_hashes[(case['id'],arm)]=row['continuation_cache_sha256']
                if arm not in ('prefix_donor','internal_restore_upper','internal_restore_lower'):
                    for hook in ('r8','a9'):states[row['id']+'/'+hook]=result['hooks'][hook].copy()
                for query,branch in case['branches'].items():
                    result=suffix(decoder,caches[arm],branch['ids'])
                    readout=observe(decoder,result,case,arm,query)
                    readout['input_cache_sha256']=cache_hash(caches[arm]);readout['suffix_ids']=json.dumps(branch['ids'])
                    readout['output_cache_sha256']=cache_hash(result['cache'])
                    baseline=result if arm=='no_edit' else later[(case['id'],'no_edit',query)]
                    readout['max_logit_change_vs_unedited']=float(np.max(np.abs(result['logits']-baseline['logits'])))
                    continuations.append(readout);later[(case['id'],arm,query)]={'logits':result['logits']}
                    for hook in ('r8','a9'):states[readout['id']+'/'+hook]=result['hooks'][hook].copy()
                    if arm=='internal_restore_upper':np.testing.assert_array_equal(result['logits'],baseline['logits'])
                    if arm=='internal_restore_lower':np.testing.assert_array_equal(result['logits'],later[(case['id'],'internal',query)]['logits'])
                assert decoder.calls<limits['decoder_steps_per_family']
            controls.append({'case':case['id'],'upper_restoration_equals_original_cache':True,'lower_restoration_equals_edited_cache':True,
                'all_suffixes_leave_root_cache_unchanged':True,'root_cache_unchanged_after_branches':all(cache_hash(caches[a])==root_cache_hashes[(case['id'],a)] for a in ARMS)})
            if family_index==0:
                store=CommitmentStore();initial=sign_update(1,frozenset({(case['id'],'swap')}))
                assert store.accept(initial)
                value,_,_=edit(h,weights['internal'],basis)
                live_root=decoder.step(case['ids'][-1],original['before'],{'r8':value});actual_roots+=1
                np.testing.assert_array_equal(live_root['logits'],root['internal']['logits'])
                workflow_roots.append(observe(decoder,live_root,case,'authorized_initial_edit','initial_recipient'))
                workflow_events.append({'case':case['id'],'stage':'initial_swap','update_revision':1,'update_scope':json.dumps(sorted(initial.scope)),
                    'signature':initial.signature,'accepted':1,'store_revision':store.revision,'store_scope':json.dumps(sorted(store.scope)),
                    'selected_cache':'edited','new_suffix_steps':0})
                stop=sign_update(2,frozenset({(case['id'],'stop_future_edits')}))
                events=[('stop_future_edits',stop),('forged_restore',Update(3,frozenset({(case['id'],'restore_original')}),'forged')),
                    ('restore_original',sign_update(3,frozenset({(case['id'],'restore_original')}))),('old_replay',stop)]
                for stage,message in events:
                    accepted=store.accept(message);cache,selected=select_resume(store,case['id'],live_root['cache'],original['cache'])
                    before_calls=decoder.calls
                    if stage in ('stop_future_edits','restore_original'):
                        for query,branch in case['branches'].items():
                            result=suffix(decoder,cache,branch['ids'])
                            row=observe(decoder,result,case,stage,query)
                            row['selected_cache']=selected;row['input_cache_sha256']=cache_hash(cache)
                            row['authority_revision']=store.revision;row['suffix_ids']=json.dumps(branch['ids'])
                            row['requested_target']=target(case,query,stage!='restore_original')
                            row['requested_correct']=row['original_correct'] if stage=='restore_original' else row['swap_correct']
                            comparison=later[(case['id'],'no_edit' if stage=='restore_original' else 'internal',query)]
                            row['max_logit_difference_from_same_state_control']=float(np.max(np.abs(result['logits']-comparison['logits'])))
                            assert row['max_logit_difference_from_same_state_control']==0
                            workflow_results.append(row)
                            for hook in ('r8','a9'):states[row['id']+'/'+hook]=result['hooks'][hook].copy()
                    workflow_events.append({'case':case['id'],'stage':stage,'update_revision':message.revision,
                        'update_scope':json.dumps(sorted(message.scope)),'signature':message.signature,'accepted':int(accepted),
                        'store_revision':store.revision,'store_scope':json.dumps(sorted(store.scope)),
                        'selected_cache':selected,'new_suffix_steps':decoder.calls-before_calls})
                assert [r['accepted'] for r in workflow_events if r['case']==case['id']]==[1,1,0,1,0]
            print('Completed root',case['id'],'steps',decoder.calls,flush=True)
        for case in cases:
            for query in case['branches']:
                np.testing.assert_array_equal(later[(case['id'],'prefix_donor',query)]['logits'],later[(case['opposite'],'no_edit',query)]['logits'])
        assert decoder.calls<limits['decoder_steps_per_family']
        for path,value in frozen.items():assert sha(ROOT/path)==value,path
        write_csv(out/'root-readouts.csv',roots);write_csv(out/'continuation-readouts.csv',continuations)
        write_csv(out/'cache-support.csv',support);write_csv(out/'controls.csv',controls)
        np.savez(out/'readout-states.npz',**states)
        if family_index==0:
            write_csv(out/'workflow-events.csv',workflow_events);write_csv(out/'workflow-root-readouts.csv',workflow_roots);write_csv(out/'workflow-readouts.csv',workflow_results)
        receipt={'status':'EXECUTED_NOT_INDEPENDENTLY_REVIEWED','family_index':family_index,'family':family['id'],'root_prompts':4,
            'actual_root_readouts_including_workflow':actual_roots,'reported_root_rows_with_reuse':len(roots),'actual_continuation_readouts':len(continuations),
            'actual_workflow_continuation_readouts':len(workflow_results),'workflow_events':len(workflow_events),
            'cache_support_rows':len(support),'decoder_steps':decoder.calls,'elapsed_seconds':time.monotonic()-started,
            'numerical_threads':1,'parameter_updates':0,'model_sha256':sha(MODEL),'all_root_readouts_match_prior_data':True,
            'baseline_and_replacement_cache_controls_pass':True,'no_generated_answer_fed_back':True,'full_cache_tensors_saved':False}
        write_json(out/'EXECUTION-RECEIPT.json',receipt)
        assert sum(p.stat().st_size for p in out.iterdir() if p.is_file())<limits['output_bytes_per_family']
        print(json.dumps(receipt,indent=2))
    except Exception as error:
        write_json(out/'FAILURE.json',{'type':type(error).__name__,'message':str(error),'elapsed_seconds':time.monotonic()-started})
        raise

if __name__=='__main__':
    parser=argparse.ArgumentParser();sub=parser.add_subparsers(dest='mode',required=True);sub.add_parser('prepare')
    p=sub.add_parser('run');p.add_argument('--family',type=int,choices=range(8),required=True);p.add_argument('--output',required=True)
    args=parser.parse_args()
    if args.mode=='prepare':prepare()
    else:run(args.family,args.output)
