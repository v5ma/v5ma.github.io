"""Separate-code fit/trace/native reconstruction; author self-review, not independent review."""
import argparse
import hashlib
import json
import subprocess
import sys
from qwen35_adapter_v9 import ROOT, MODEL, STATE_NAMES, Decoder, ResourceGuard, sha, write, np, Tokenizer

OUT = ROOT / 'reviews/qwen35-learning-10'
PREP = ROOT / 'results/qwen35-learning-10-prepared'
FIT = ROOT / 'results/qwen35-learning-10-fit'
KV = [n for n in STATE_NAMES if n.startswith('past_key_values.')]
ARMS = ('original','linear_ridge','rbf_ridge','yoked_ridge','slot_swap','oracle_kv','full_donor','text_instruction')

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def digest(array):
    return hashlib.sha256(np.ascontiguousarray(array).tobytes()).hexdigest()

def hashes(state):
    return {n: digest(state[n]) for n in STATE_NAMES}

def verify_receipt(folder, receipt_name='RECEIPT.json'):
    receipt = read(folder / receipt_name)
    for name, expected in receipt['files'].items():
        assert sha(folder / name) == expected, str(folder / name)
    return receipt

def frozen():
    for p,h in read(PREP / 'INPUT-FREEZE.json').items(): assert sha(ROOT/p) == h
    verify_receipt(PREP, 'PREPARATION-RECEIPT.json')
    return verify_receipt(FIT)

def fit_audit():
    frozen(); OUT.mkdir(exist_ok=True)
    train = read(PREP/'TRAIN-CASES.json')
    rows = []; inputs = {}
    for i in range(6):
        folder = ROOT/f'results/qwen35-learning-10-train-{i}'
        verify_receipt(folder)
        rows.append(np.load(folder/'WINDOWS.npy',allow_pickle=False))
        inputs[(folder/'RECEIPT.json').relative_to(ROOT).as_posix()] = sha(folder/'RECEIPT.json')
    x = np.concatenate(rows).reshape(24,-1).astype(np.float64)
    ids = {c['id']:i for i,c in enumerate(train)}
    target = x[[ids[c['opposite']] for c in train]]
    with np.load(FIT/'MODEL.npz',allow_pickle=False) as data: m = {k:data[k] for k in data.files}
    mu = np.mean(x,axis=0)
    centered = (x-mu).reshape(24,12,9,512)
    scales = np.maximum(1e-8,np.sqrt(np.mean(centered**2,axis=(0,2,3))))
    scale = np.repeat(scales,4608)
    z = (x-mu)/scale; y = (target-x)/scale
    assert np.array_equal(mu,m['mu']) and np.array_equal(scales,m['scales']) and np.array_equal(z,m['z'])
    gram = (z@z.T)/55296
    d = np.maximum(0,(np.sum(z*z,axis=1)[:,None]+np.sum(z*z,axis=1)[None,:]-2*z@z.T)/55296)
    bandwidth = float(np.median(d[d>1e-12]))
    assert bandwidth == float(m['bandwidth2'])
    assert float(m['cap']) == float(2*np.max(np.linalg.norm(y,axis=1)))
    permutation = read(PREP/'YOKED-PERMUTATION.json')
    assert np.array_equal(m['permutation'],permutation)
    residuals = {}
    for label,k,targets,a in [('linear',gram,y,m['linear_a']),
        ('rbf',np.exp(-d/(2*bandwidth)),y,m['rbf_a']),('yoked',gram,y[permutation],m['yoked_a'])]:
        equation_residual = (k+0.001*np.eye(24))@a-targets
        residuals[label] = float(np.max(np.abs(equation_residual)))
        assert residuals[label] < 1e-8
    write(OUT/'FIT-EQUATION-AUDIT.json',{'status':'PASS_SEPARATE_EQUATION_CHECK_NOT_INDEPENDENT_REVIEW',
        'training_rows':24,'features':55296,'equation_max_abs_residuals':residuals,
        'raw_mean_delta_norm':float(np.linalg.norm(np.mean(target-x,axis=0))),
        'test_outcomes_used':False,'native_calls':0,'training_receipts':inputs,
        'fit_receipt_sha256':sha(FIT/'RECEIPT.json'),'auditor_sha256':sha(__file__)})
    print(json.dumps(residuals),flush=True)

def answer(decoder, state, suffix):
    start_hashes = hashes(state)
    logits,next_state = decoder.advance(suffix,state)
    first = digest(logits); result=[]
    for _ in range(4):
        result.append(int(np.argmax(logits)))
        if result[-1] in decoder.eos_ids or len(result)==4: break
        logits,next_state = decoder.advance([result[-1]],next_state)
    assert hashes(state)==start_hashes
    return first,result

def get_window(state,start):
    result = np.empty((12,9,512),dtype=np.float32)
    for i,n in enumerate(KV):
        result[i] = state[n][0,:,start:,:].transpose(1,0,2).reshape(9,512)
    return result

def native(index,split):
    frozen(); OUT.mkdir(exist_ok=True)
    output = OUT/f'native-{split}-{index}'; output.mkdir(); guard=ResourceGuard(output)
    decoder=Decoder(); comparisons=0
    if split=='train':
        cases = read(PREP/'TRAIN-CASES.json')[index*4:index*4+4]
        folder = ROOT/f'results/qwen35-learning-10-train-{index}'
        receipt=verify_receipt(folder); recorded=read(folder/'PREFIXES.json'); answers=read(folder/'ANSWERS.json')
        windows=np.load(folder/'WINDOWS.npy',allow_pickle=False)
        for j,c in enumerate(cases):
            logits,state=decoder.advance(c['prefix_ids'])
            assert digest(logits)==recorded[j]['prefix_logit_sha256']
            assert hashes(state)==recorded[j]['state_hashes']
            assert np.array_equal(get_window(state,c['window_start']),windows[j])
            for r in [r for r in answers if r['case']==c['id']]:
                first,tokens=answer(decoder,state,c['branches'][r['query']]['ids'])
                assert (first,tokens)==(r['first_logit_sha256'],r['generated_ids'])
                comparisons+=1
        assert decoder.calls==receipt['native_calls']
    else:
        cases=read(PREP/'TEST-CASES.json'); c=cases[index]
        other=next(row for row in cases if row['id']==c['opposite'])
        folder=ROOT/f'results/qwen35-learning-10-test-{index}'
        receipt=verify_receipt(folder); commitment=read(folder/'POLICY-COMMITMENT.json')
        controls=read(folder/'ORACLE-CONTROLS.json')
        logits,original=decoder.advance(c['prefix_ids'])
        assert hashes(original)==commitment['original_state_hashes']
        assert digest(logits)==commitment['original_prefix_logits_sha256']
        w=get_window(original,c['window_start'])
        assert digest(w)==commitment['original_window_sha256']
        with np.load(FIT/'MODEL.npz',allow_pickle=False) as data: m={k:data[k] for k in data.files}
        scale=np.repeat(m['scales'],4608); flat=w.reshape(-1).astype(np.float64)
        z=(flat-m['mu'])/scale
        states={'original':original}
        for arm in ('linear_ridge','rbf_ridge','yoked_ridge','slot_swap'):
            if arm=='slot_swap':
                replacement=w.copy(); replacement[:,[0,6],:]=w[:,[6,0],:]
            else:
                if arm=='rbf_ridge':
                    left=z[None,:]; right=m['z']
                    dist=np.maximum(0,(np.sum(left*left,axis=1)[:,None]
                        +np.sum(right*right,axis=1)[None,:]-2*left@right.T)/55296)
                    weights=np.exp(-dist[0]/(2*float(m['bandwidth2'])))
                    delta=weights@m['rbf_a']
                else:
                    weights=(z@m['z'].T)/55296
                    delta=weights@m['linear_a' if arm=='linear_ridge' else 'yoked_a']
                multiplier=min(1.0,float(m['cap'])/max(float(np.linalg.norm(delta)),1e-300))
                replacement=(flat+scale*delta*multiplier).reshape(12,9,512).astype(np.float32)
                assert digest(replacement)==commitment['learned_predictions'][arm]['prediction_sha256']
                assert digest(weights)==commitment['learned_predictions'][arm]['kernel_weights_sha256']
            state=dict(original)
            for i,n in enumerate(KV):
                state[n]=original[n].copy()
                state[n][0,:,c['window_start']:,:]=replacement[i].reshape(9,2,256).transpose(1,0,2)
            states[arm]=state
            if arm!='slot_swap': assert hashes(state)==commitment['learned_state_hashes'][arm]
        donor_logits,donor=decoder.advance(other['prefix_ids'])
        _,text_state=decoder.advance(c['text_prefix_ids'])
        assert hashes(donor)==controls['donor_state_hashes']
        assert digest(donor_logits)==controls['donor_prefix_logits_sha256']
        assert hashes(text_state)==controls['text_state_hashes']
        states['oracle_kv']={n:donor[n] if n in KV else original[n] for n in STATE_NAMES}
        states['full_donor']=donor; states['text_instruction']=text_state
        for row in read(folder/'STATE-SUPPORT.json'):
            assert digest(states[row['arm']][row['tensor']])==row['sha256']
        for row in read(folder/'ANSWERS.json'):
            first,tokens=answer(decoder,states[row['arm']],c['branches'][row['query']]['ids'])
            assert (first,tokens)==(row['first_logit_sha256'],row['generated_ids'])
            comparisons+=1
        if index==0:
            for row in read(folder/'WORKFLOW-ANSWERS.json'):
                first,tokens=answer(decoder,states[row['selected_state_arm']],c['branches'][row['query']]['ids'])
                assert (first,tokens)==(row['first_logit_sha256'],row['generated_ids'])
                comparisons+=1
        assert decoder.calls==receipt['native_calls']
    write(output/'RECEIPT.json',{'status':'PASS_NATIVE_EXACT_RECONSTRUCTION_SAME_AUTHOR_SHARED_ADAPTER',
        'split':split,'index':index,'exact_generated_answers_and_first_logits':comparisons,
        'native_calls':decoder.calls,'auditor_sha256':sha(__file__),
        'source_receipt_sha256':sha(folder/'RECEIPT.json'),'resource':guard.finish()})
    print(json.dumps({'split':split,'index':index,'exact_answers':comparisons,'calls':decoder.calls}),flush=True)

def trace():
    frozen(); OUT.mkdir(exist_ok=True)
    cases=read(PREP/'TEST-CASES.json'); token=Tokenizer.from_file(str(MODEL/'tokenizer.json'))
    rows=[]; receipts=[]; inputs={}; support_count=0
    for i,c in enumerate(cases):
        folder=ROOT/f'results/qwen35-learning-10-test-{i}'
        receipt=verify_receipt(folder); receipts.append(receipt)
        inputs[str((folder/'RECEIPT.json').relative_to(ROOT))]=sha(folder/'RECEIPT.json')
        assert receipt['case']==c['id'] and receipt['primary_answers']==24
        assert receipt['fit_receipt_sha256']==sha(FIT/'RECEIPT.json')
        assert receipt['resource']['numerical_threads']==1 and receipt['resource']['elapsed_seconds']<75
        assert receipt['resource']['peak_commit_bytes']<5500000000
        answers=read(folder/'ANSWERS.json')
        assert len({(r['arm'],r['query']) for r in answers})==24
        commit=read(folder/'POLICY-COMMITMENT.json')
        assert commit['donor_inference_calls_at_commitment']==0 and commit['native_calls_so_far']==1
        support=read(folder/'STATE-SUPPORT.json'); assert len(support)==384
        for s in support:
            assert s['same_as_original']==(s['sha256']==commit['original_state_hashes'][s['tensor']])
            if s['arm'] in ('linear_ridge','rbf_ridge','yoked_ridge','slot_swap') and s['tensor'] not in KV:
                assert s['same_as_original']
        support_count+=len(support)
        for r in answers:
            assert r['case']==c['id'] and 1<=len(r['generated_ids'])<=4
            assert r['answer']==token.decode(r['generated_ids'],skip_special_tokens=True).strip()
            assert r['stopped_on_eos']==(r['generated_ids'][-1] in (248044,248046))
            for key in ('original','swapped'):
                target=c[r['query']] if key=='original' or r['query']=='color' else c['recipient' if r['query']=='giver' else 'giver']
                assert r[key+'_target']==target
                assert r[key+'_score']['correct']==(r['answer'].strip().casefold()==target.casefold())
                assert r[key+'_score']['exact_case_correct']==(r['answer'].strip()==target)
            rows.append(r)
    lookup={(r['case'],r['arm'],r['query']):r for r in rows}
    for c in cases:
        for q in ('giver','recipient','color'):
            r=lookup[c['id'],'full_donor',q]; s=lookup[c['opposite'],'original',q]
            assert (r['first_logit_sha256'],r['generated_ids'])==(s['first_logit_sha256'],s['generated_ids'])
    metrics=[]; joints=[]; strata=[]
    for arm in ARMS:
        for q in ('giver','recipient','color'):
            selected=[r for r in rows if r['arm']==arm and r['query']==q]
            metrics.append({'arm':arm,'query':q,'n':16,
                'original_correct':sum(r['original_score']['correct'] for r in selected),
                'swapped_correct':sum(r['swapped_score']['correct'] for r in selected),
                'exact_case_swapped':sum(r['swapped_score']['exact_case_correct'] for r in selected),
                'changed_full_logits':sum(r['first_logit_sha256']!=lookup[r['case'],'original',q]['first_logit_sha256'] for r in selected)})
        for family in sorted({c['family'] for c in cases}):
            familyrows=[r for r in rows if r['arm']==arm and r['family']==family]
            strata.append({'arm':arm,'family':family,'n':len(familyrows),
                'swapped_correct':sum(r['swapped_score']['correct'] for r in familyrows)})
            for color in ('purple','orange'):
                selected=[r for r in familyrows if r['color']==color]
                assert len(selected)==6
                joints.append({'arm':arm,'family':family,'color':color,
                    'all_six_swapped':all(r['swapped_score']['correct'] for r in selected),
                    'all_six_original':all(r['original_score']['correct'] for r in selected)})
    folder=ROOT/'results/qwen35-learning-10-test-0'
    events=read(folder/'AUTHORITY-EVENTS.json'); workflow=read(folder/'WORKFLOW-ANSWERS.json')
    assert [e['accepted'] for e in events]==[True,True,False,True,False]
    assert [e['store_revision'] for e in events]==[1,2,2,3,3]
    for event in events:
        selected=[r for r in workflow if r['arm']==event['stage']]
        assert len(selected)==(3 if event['accepted'] else 0)
        assert (event['fresh_native_calls']>0)==event['accepted']
        for r in selected:
            control=lookup[cases[0]['id'],r['selected_state_arm'],r['query']]
            assert (r['first_logit_sha256'],r['generated_ids'])==(control['first_logit_sha256'],control['generated_ids'])
    gate={q:sum(r['original_score']['correct'] for r in rows if r['arm']=='original' and r['query']==q) for q in ('giver','recipient','color')}
    write(OUT/'METRICS.json',metrics); write(OUT/'GROUPS.json',joints); write(OUT/'STRATA.json',strata)
    write(OUT/'AUDIT-INPUTS.json',inputs)
    write(OUT/'TRACE-AUDIT.json',{'status':'PASS_TRACE_AND_COUNTS_NOT_INDEPENDENT_REVIEW',
        'primary_answers':384,'fresh_workflow_answers':len(workflow),'state_support_rows':support_count,
        'baseline_counts':gate,'prospective_baseline_gate_passed':all(v>=14 for v in gate.values()),
        'native_calls':sum(r['native_calls'] for r in receipts),
        'summed_model_process_seconds':sum(r['resource']['elapsed_seconds'] for r in receipts),
        'max_process_commit_bytes':max(r['resource']['peak_commit_bytes'] for r in receipts),
        'authority_event_count':len(events),
        'authority_limit':'Known scripted sequence and actual outputs audited; this log does not retain raw update signatures. Prior store tests and frozen program are separate evidence, not an arbitrary-message audit.',
        'auditor_sha256':sha(__file__)})
    print(json.dumps({'gate':gate,'summary':[{**m,'all_six_groups':sum(g['all_six_swapped'] for g in joints if g['arm']==m['arm'])} for m in metrics]}),flush=True)

def tests():
    OUT.mkdir(exist_ok=True)
    suites=[('prior',['test_labs','test_protocol_v2','test_context_provenance_v3','test_active_receiver_v4',
        'test_gpt2_v5','test_gpt2_learning_v6','test_gpt2_intent_v7','test_gpt2_continuation_v8'],61),
        ('qwen',['test_qwen35_v9','test_qwen35_hybrid_v9','test_qwen35_learning_v10'],23)]
    counts=[]
    for label,names,count in suites:
        result=subprocess.run([sys.executable,'-m','unittest',*names,'-v'],cwd=ROOT/'applications',
            capture_output=True,text=True,timeout=60)
        with (OUT/(label+'-TESTS.log')).open('x',encoding='utf-8') as f: f.write(result.stdout+result.stderr)
        assert result.returncode==0 and f'Ran {count} tests' in result.stderr
        counts.append({'suite':label,'count':count,'returncode':result.returncode})
    write(OUT/'TEST-RECEIPT.json',{'status':'PASS','tests':84,'suites':counts,'auditor_sha256':sha(__file__)})
    print(json.dumps(counts),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('mode',choices=['fit','trace','tests','native'])
    p.add_argument('--split',choices=['train','test'],default='test'); p.add_argument('--index',type=int,default=0)
    a=p.parse_args()
    if a.mode=='fit':fit_audit()
    elif a.mode=='trace':trace()
    elif a.mode=='tests':tests()
    else:
        assert 0<=a.index<(6 if a.split=='train' else 16)
        native(a.index,a.split)
