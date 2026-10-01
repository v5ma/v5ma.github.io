"""Separate trace/metric and native reconstruction; not independent review."""
import argparse
import csv
import hashlib
import hmac
import json
from pathlib import Path
import subprocess
import sys
import time
from gpt2_adapter_v5 import ROOT, Decoder, np, sha
from audit_gpt2_intent_v7 import reconstruction

PREP=ROOT/'results/gpt2-continuation-08-prepared'
OUT=ROOT/'reviews/gpt2-continuation-08'
TRAIN=ROOT/'results/gpt2-learning-06'
KEY=b'public-development-fixture-not-a-production-secret'

def read(path):return json.loads(path.read_text(encoding='utf-8'))
def csv_read(path):
    with path.open(newline='',encoding='utf-8') as stream:return list(csv.DictReader(stream))
def emit(path,value):
    with path.open('x',encoding='utf-8') as stream:json.dump(value,stream,indent=2,allow_nan=False);stream.write('\n')
def emit_csv(path,rows):
    with path.open('x',newline='',encoding='utf-8') as stream:
        writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
def cache_digest(arrays):
    value=hashlib.sha256()
    for array in arrays:value.update(str((array.shape,str(array.dtype))).encode());value.update(array.tobytes())
    return value.hexdigest()
def frozen(directory):
    for path,value in read(directory/'INPUT-FREEZE.json').items():assert sha(ROOT/path)==value,path
    assert sha(PREP/'FAMILIES.json')==read(PREP/'PREPARATION-RECEIPT.json')['family_manifest_sha256']
    OUT.mkdir(parents=True,exist_ok=True)
def check_number(actual,expected,tolerance=1e-9):assert abs(float(actual)-float(expected))<=tolerance,(actual,expected)

def row_check(row,case):
    query=row['query']; wanted=case['color'] if query=='later_color' else case['giver'] if query=='initial_recipient' else case['recipient']
    natural=case['color'] if query=='later_color' else case['recipient'] if query=='initial_recipient' else case['giver']
    assert row['swap_target']==wanted and row['original_target']==natural
    top=int(row['top_id']); identifiers=dict(zip(case['all_words'],case['all_word_ids']))
    assert int(row['swap_correct'])==int(top==identifiers[wanted])
    assert int(row['original_correct'])==int(top==identifiers[natural])
    relevant=case['all_word_ids'][2:] if query=='later_color' else case['all_word_ids'][:2]
    assert int(row['invalid'])==int(top not in relevant)
    probabilities=json.loads(row['word_probabilities'])
    check_number(row['swap_probability'],probabilities[wanted]);check_number(row['original_probability'],probabilities[natural])

def report():
    frozen(PREP);families=read(PREP/'FAMILIES.json');cases={c['id']:c for f in families for c in f['cases']}
    roots=[];later=[];supports=[];events=[];workflow=[];receipts=[];inputs={}
    for i in range(8):
        directory=ROOT/f'results/gpt2-continuation-08-family-{i}';frozen(directory)
        names=['INPUT-FREEZE.json','root-readouts.csv','continuation-readouts.csv','cache-support.csv','controls.csv','readout-states.npz','EXECUTION-RECEIPT.json']
        if i==0:names+=['workflow-events.csv','workflow-root-readouts.csv','workflow-readouts.csv']
        for name in names:inputs[str((directory/name).relative_to(ROOT))]=sha(directory/name)
        roots+=csv_read(directory/'root-readouts.csv');later+=csv_read(directory/'continuation-readouts.csv');supports+=csv_read(directory/'cache-support.csv')
        for control in csv_read(directory/'controls.csv'):assert all(value=='True' for key,value in control.items() if key!='case')
        receipts.append(read(directory/'EXECUTION-RECEIPT.json'))
        if i==0:
            events=csv_read(directory/'workflow-events.csv');workflow=csv_read(directory/'workflow-readouts.csv')
            for row in csv_read(directory/'workflow-root-readouts.csv'):row_check(row,cases[row['case']])
    assert len(roots)==320 and len(later)==640 and len(supports)==4608 and len(events)==20 and len(workflow)==16
    assert len({r['id'] for r in roots+later})==960
    index={(r['case'],r['arm'],r['query']):r for r in roots+later}
    for row in roots+later+workflow:row_check(row,cases[row['case']])
    for row in later:
        case=cases[row['case']];assert json.loads(row['suffix_ids'])==case['branches'][row['query']]['ids']
        root=index[(row['case'],row['arm'],'initial_recipient')]
        assert root['continuation_cache_sha256']==row['input_cache_sha256']
        comparator={'internal_restore_upper':'no_edit','internal_restore_lower':'internal'}.get(row['arm'])
        opposite=row['arm']=='prefix_donor'
        if comparator or opposite:
            reference=index[(case['opposite'] if opposite else case['id'],'no_edit' if opposite else comparator,row['query'])]
            for field in ('top_id','top_text','word_logits','word_probabilities','output_cache_sha256'):assert row[field]==reference[field]
    for row in supports:
        assert float(row['prior_positions_max_error'])==0
        if int(row['layer'])<9:assert float(row['last_position_max_error'])==0
    for case in families[0]['cases']:
        sequence=[r for r in events if r['case']==case['id']]
        assert [r['stage'] for r in sequence]==['initial_swap','stop_future_edits','forged_restore','restore_original','old_replay']
        revision=-1;scope=[]
        for event in sequence:
            proposed=int(event['update_revision']);candidate=json.loads(event['update_scope'])
            body=json.dumps([proposed,sorted(candidate)],separators=(',',':')).encode()
            valid=hmac.compare_digest(hmac.new(KEY,body,'sha256').hexdigest(),event['signature']) and proposed>revision
            if valid:revision,scope=proposed,candidate
            assert int(valid)==int(event['accepted']) and revision==int(event['store_revision']) and scope==json.loads(event['store_scope'])
            if event['stage'] in ('stop_future_edits','restore_original'):
                assert int(event['new_suffix_steps'])==sum(len(b['ids']) for b in case['branches'].values())
                for row in [r for r in workflow if r['case']==case['id'] and r['arm']==event['stage']]:
                    assert int(row['authority_revision'])==revision and row['selected_cache']==event['selected_cache']
                    expected=case['color'] if row['query']=='later_color' else case['giver'] if event['stage']=='restore_original' else case['recipient']
                    assert row['requested_target']==expected
                    assert int(row['requested_correct'])==int(row['original_correct'] if event['stage']=='restore_original' else row['swap_correct'])
                    control=index[(case['id'],'no_edit' if event['stage']=='restore_original' else 'internal',row['query'])]
                    for field in ('top_id','top_text','word_logits','word_probabilities','input_cache_sha256'):assert row[field]==control[field]
                    assert float(row['max_logit_difference_from_same_state_control'])==0
    arms=read(ROOT/'applications/PROTOCOL-GPT2-CONTINUATION-08.json')['arms'];metrics=[];pairs=[];contracts=[]
    for arm in arms:
        for query in ('initial_recipient','later_giver','later_color'):
            rows=[r for r in roots+later if r['arm']==arm and r['query']==query];assert len(rows)==32
            record={'arm':arm,'query':query,'cases':32}
            for key in ('swap_correct','original_correct','invalid'):record[key]=sum(int(r[key]) for r in rows)
            for key in ('swap_probability','original_probability'):record['mean_'+key]=sum(float(r[key]) for r in rows)/32
            record['top1_changed_from_no_edit']=sum(int(r['top_id']!=index[(r['case'],'no_edit',query)]['top_id']) for r in rows)
            record['mean_max_logit_change_vs_unedited']=None if query=='initial_recipient' else sum(float(r['max_logit_change_vs_unedited']) for r in rows)/32
            metrics.append(record)
        for family in families:
            for color in ('red','blue'):
                subset=[r for r in roots+later if r['arm']==arm and r['family']==family['id'] and r['color']==color]
                assert len(subset)==6
                for query in ('initial_recipient','later_giver','later_color'):
                    rows=[r for r in subset if r['query']==query];assert len(rows)==2
                    pairs.append({'arm':arm,'family':family['id'],'color':color,'query':query,
                        'both_swap_targets_correct':int(all(int(r['swap_correct']) for r in rows)),
                        'both_original_targets_correct':int(all(int(r['original_correct']) for r in rows))})
                contracts.append({'arm':arm,'family':family['id'],'color':color,'all_six_swap_targets_correct':int(all(int(r['swap_correct']) for r in subset)),
                    'all_six_original_targets_correct':int(all(int(r['original_correct']) for r in subset))})
    assert len(metrics)==30 and len(pairs)==480 and len(contracts)==160
    baseline={r['query']:r for r in metrics if r['arm']=='no_edit'}
    adequacy={'status':'POST-HOC_BASELINE_ADEQUACY_DIAGNOSTIC','unaltered_native_correct':{k:v['original_correct'] for k,v in baseline.items()},
        'denominator_per_query':32,'interpretation':'A zero native giver baseline cannot discriminate failure to preserve a semantic operation from failure to answer this wording. Keep all outcomes; do not use joint zero scores as an intervention-specific failure verdict.',
        'zero_native_giver_baseline':baseline['later_giver']['original_correct']==0,'independent_review':False}
    command=[sys.executable,'-m','unittest','-v','test_labs','test_protocol_v2','test_context_provenance_v3','test_active_receiver_v4','test_gpt2_v5','test_gpt2_learning_v6','test_gpt2_intent_v7','test_gpt2_continuation_v8']
    tests=subprocess.run(command,cwd=ROOT/'applications',capture_output=True,text=True,timeout=35)
    with (OUT/'APPLICATION-TESTS.log').open('x',encoding='utf-8') as stream:stream.write(tests.stdout+tests.stderr)
    assert tests.returncode==0
    emit(OUT/'AUDIT-INPUTS.json',inputs);emit_csv(OUT/'METRICS.csv',metrics);emit_csv(OUT/'PAIRED-DETAIL.csv',pairs);emit_csv(OUT/'CONTRACT-DETAIL.csv',contracts);emit(OUT/'BASELINE-ADEQUACY.json',adequacy)
    receipt={'status':'PASS','root_rows_with_reuse_checked':320,'native_continuations_checked':640,'actual_workflow_continuations_checked':16,
        'actual_roots_including_workflow':sum(r['actual_root_readouts_including_workflow'] for r in receipts),
        'cache_support_rows_checked':4608,'workflow_events_reconstructed':20,'tests':61,'metric_rows':30,'paired_rows':480,'contract_rows':160,
        'execution_seconds':sum(r['elapsed_seconds'] for r in receipts),'decoder_steps':sum(r['decoder_steps'] for r in receipts),
        'independent_review':False,'auditor_sha256':sha(Path(__file__))}
    emit(OUT/'TRACE-AND-METRIC-AUDIT.json',receipt)
    print(json.dumps({'receipt':receipt,'adequacy':adequacy,'metrics':metrics},indent=2))

def native(family_index):
    start=time.monotonic();directory=ROOT/f'results/gpt2-continuation-08-family-{family_index}';frozen(directory)
    family=read(PREP/'FAMILIES.json')[family_index];cases=family['cases']
    roots={(r['case'],r['arm']):r for r in csv_read(directory/'root-readouts.csv')}
    later={(r['case'],r['arm'],r['query']):r for r in csv_read(directory/'continuation-readouts.csv')}
    with np.load(directory/'readout-states.npz',allow_pickle=False) as data:states={k:data[k] for k in data.files}
    with np.load(TRAIN/'basis.npz',allow_pickle=False) as data:basis={k:data[k] for k in data.files}
    with np.load(TRAIN/'learned-parameters.npz',allow_pickle=False) as data:weights={k:data[k] for k in data.files}
    support={(r['case'],r['arm'],int(r['layer']),r['kind']):r for r in csv_read(directory/'cache-support.csv')}
    decoder=Decoder(max_seconds=75);base={c['id']:decoder.prompt(c['ids']) for c in cases};count=0;maximum=0.;actual_roots=4
    def inspect(result,row,case):
        nonlocal count,maximum
        z=result['logits'].astype(np.float64);prob=np.exp(z-z.max());prob/=prob.sum()
        assert int(row['top_id'])==int(np.argmax(z)) and row['top_text']==decoder.tokenizer.decode([int(np.argmax(z))])
        recorded=json.loads(row['word_logits']);probabilities=json.loads(row['word_probabilities'])
        for word,ident in zip(case['all_words'],case['all_word_ids']):
            check_number(recorded[word],z[ident],1e-6);check_number(probabilities[word],prob[ident],1e-7)
            maximum=max(maximum,abs(recorded[word]-float(z[ident])))
        if 'output_cache_sha256' in row:assert cache_digest(result['cache'])==row['output_cache_sha256']
        for hook in ('r8','a9'):
            key=row['id']+'/'+hook
            if key in states:np.testing.assert_array_equal(result['hooks'][hook],states[key])
        count+=1
    def continue_from(cache,tokens):
        before=cache_digest(cache);current=cache
        for token in tokens:result=decoder.step(token,current);current=result['cache']
        assert cache_digest(cache)==before
        return result
    for case in cases:
        original=base[case['id']];h=original['hooks']['r8'];root={'no_edit':original}
        for arm in ('internal','task','yoked','supervised_ridge','reflection','residual_donor'):
            if arm=='residual_donor':value=base[case['opposite']]['hooks']['r8']
            else:
                alias={'internal':'d6_internal','task':'d6_task','yoked':'d6_yoked','supervised_ridge':'d6_ridge'}.get(arm,arm)
                value,_,_=reconstruction(h,alias,basis,weights)
            root[arm]=decoder.step(case['ids'][-1],original['before'],{'r8':value});actual_roots+=1
            for i,(a,b) in enumerate(zip(root[arm]['cache'],original['cache'])):
                row=support[(case['id'],arm,i//2,'key' if i%2==0 else 'value')]
                check_number(row['prior_positions_max_error'],np.max(np.abs(a[:,:,:-1,:]-b[:,:,:-1,:])))
                check_number(row['last_position_max_error'],np.max(np.abs(a[:,:,-1,:]-b[:,:,-1,:])),1e-6)
        root.update(prefix_donor=base[case['opposite']],internal_restore_upper=root['internal'],internal_restore_lower=root['internal'])
        for arm,result in root.items():
            row=roots[(case['id'],arm)];inspect(result,row,case)
            cache=list(result['cache'])
            if arm=='internal_restore_upper':cache[18:]=original['cache'][18:]
            if arm=='internal_restore_lower':cache[:18]=original['cache'][:18]
            assert cache_digest(cache)==row['continuation_cache_sha256']
            for query,branch in case['branches'].items():
                result=continue_from(cache,branch['ids']);record=later[(case['id'],arm,query)]
                assert cache_digest(cache)==record['input_cache_sha256'];inspect(result,record,case)
        if family_index==0:
            initial=next(r for r in csv_read(directory/'workflow-root-readouts.csv') if r['case']==case['id'])
            value,_,_=reconstruction(h,'d6_internal',basis,weights)
            live=decoder.step(case['ids'][-1],original['before'],{'r8':value});actual_roots+=1;inspect(live,initial,case)
            for row in [r for r in csv_read(directory/'workflow-readouts.csv') if r['case']==case['id']]:
                cache=original['cache'] if row['arm']=='restore_original' else live['cache']
                assert cache_digest(cache)==row['input_cache_sha256']
                result=continue_from(cache,case['branches'][row['query']]['ids']);inspect(result,row,case)
        print('Audited',case['id'],'steps',decoder.calls,flush=True)
    expected=140 if family_index==0 else 120
    assert count==expected and decoder.calls<1600
    receipt={'status':'PASS','family_index':family_index,'reported_readouts_with_reuse_checked':count,
        'actual_roots_recomputed':actual_roots,'actual_continuations_recomputed':96 if family_index==0 else 80,
        'decoder_steps':decoder.calls,'elapsed_seconds':time.monotonic()-start,'numerical_threads':1,
        'maximum_compared_logit_error':maximum,'saved_state_arrays_and_cache_digests_match':True,
        'independent_review':False,'shared_adapter_and_prior_audit_formula':True,'auditor_sha256':sha(Path(__file__)),
        'prior_formula_sha256':sha(ROOT/'applications/audit_gpt2_intent_v7.py')}
    emit(OUT/f'NATIVE-AUDIT-FAMILY-{family_index}.json',receipt);print(json.dumps(receipt,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=('report','native'));parser.add_argument('--family',type=int,choices=range(8));args=parser.parse_args()
    if args.mode=='report':report()
    else:
        assert args.family is not None
        native(args.family)
