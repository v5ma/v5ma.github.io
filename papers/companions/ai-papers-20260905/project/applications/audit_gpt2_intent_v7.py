"""Separate-code audit; shared decoder, same author, not independent review."""
import argparse
import csv
import gc
import hashlib
import hmac
import json
from pathlib import Path
import subprocess
import sys
import time
from gpt2_adapter_v5 import ROOT, MODEL, Decoder, np, sha

PREP = ROOT / 'results/gpt2-intent-07-prepared'
TRAIN = ROOT / 'results/gpt2-learning-06'
OUT = ROOT / 'reviews/gpt2-intent-07'
KEY = b'public-development-fixture-not-a-production-secret'

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def csv_rows(path):
    with path.open(newline='', encoding='utf-8') as stream:
        return list(csv.DictReader(stream))

def write_json(path, value):
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write('\n')

def write_csv(path, rows):
    with path.open('x', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)

def frozen():
    for directory in (PREP, ROOT/'results/gpt2-intent-07-part-0', ROOT/'results/gpt2-intent-07-part-1'):
        for path, value in read(directory/'INPUT-FREEZE.json').items():
            assert sha(ROOT/path) == value, path
    prepared = read(PREP/'PREPARATION-RECEIPT.json')
    assert sha(MODEL) == prepared['model_sha256']
    assert sha(PREP/'FAMILIES.json') == prepared['family_manifest_sha256']
    OUT.mkdir(parents=True, exist_ok=True)

def close(actual, expected, tolerance=1e-9):
    assert abs(float(actual)-float(expected)) <= tolerance, (actual, expected)

def reconstruction(h, name, basis, weights):
    vector = h.reshape(-1).astype(np.float64)
    coords = basis['R'] @ (vector-basis['mean'])
    reflected = name in ('reflection', 'reflection_capped')
    if reflected:
        delta = basis['R'].T @ (-2*coords)
    else:
        parameter = weights[{'d6_internal':'internal', 'd6_task':'task', 'd6_yoked':'yoked', 'd6_ridge':'supervised_ridge'}[name]]
        features = np.append(coords / basis['scale'], 1.)
        delta = basis['R'].T @ ((parameter@features)*basis['scale'])
    ratio = 1. if name == 'reflection' else min(1.,float(basis['cap'])/max(float(np.linalg.norm(delta)),1e-12))
    value = (vector+ratio*delta).astype(np.float32).reshape(1,1,768) if reflected else h+(ratio*delta).astype(np.float32).reshape(1,1,768)
    return value, float(np.linalg.norm(value-h)), int(ratio<1.)

def route(case, intent, arm):
    if arm in ('no_edit', 'revoked_reflection'):
        return case['id']+'/none'
    if arm == 'intent_blind_reflection':
        return case['id']+'/reflection'
    if arm == 'wrong_intent_reflection':
        return case['id']+('/reflection' if intent=='keep' else '/none')
    if intent == 'keep':
        return case['id']+'/none'
    if arm == 'textual_update':
        return case['opposite']+'/none'
    return case['id']+('/donor' if arm=='current_donor_oracle' else '/'+arm)

def report():
    frozen()
    families = read(PREP/'FAMILIES.json')
    cases = {c['id']:c for f in families for c in f['cases']}
    protocol = read(ROOT/'applications/PROTOCOL-GPT2-INTENT-07.json')
    measurements=[]; outcomes=[]; requests=[]; controls=[]
    inputs = {}
    for batch in (0,1):
        directory=ROOT/f'results/gpt2-intent-07-part-{batch}'
        for filename in ('measurements.csv','outcomes.csv','request-events.csv','reflection-controls.csv','states.npz','EXECUTION-RECEIPT.json'):
            inputs[str((directory/filename).relative_to(ROOT))] = sha(directory/filename)
        measurements.extend(csv_rows(directory/'measurements.csv'))
        outcomes.extend(csv_rows(directory/'outcomes.csv'))
        requests.extend(csv_rows(directory/'request-events.csv'))
        controls.extend(csv_rows(directory/'reflection-controls.csv'))
    assert len(cases)==64 and len(measurements)==512 and len(outcomes)==1536 and len(requests)==512 and len(controls)==64
    observed={r['id']:r for r in measurements}
    assert len(observed)==512
    assert len({(r['case'],r['intent'],r['arm']) for r in outcomes})==1536
    for case in cases.values():
        assert {r['candidate'] for r in measurements if r['case']==case['id']}=={'none','d6_internal','d6_task','d6_yoked','d6_ridge','reflection','reflection_capped','donor'}
        for intent in protocol['intents']:
            sequence=[r for r in requests if r['case']==case['id'] and r['intent']==intent]
            assert len(sequence)==4 and [r['stage'] for r in sequence]==['current','forged_opposite','revoke','old_replay']
            revision=-1; scope=[]
            for event in sequence:
                proposed_revision=int(event['update_revision']); proposed_scope=json.loads(event['update_scope'])
                body=json.dumps([proposed_revision,sorted(proposed_scope)],separators=(',',':')).encode()
                signature=hmac.new(KEY,body,'sha256').hexdigest()
                accepted=hmac.compare_digest(event['signature'],signature) and proposed_revision>revision
                if accepted: revision,scope=proposed_revision,proposed_scope
                selected=next((x[1] for x in scope if x[0]==case['id']),'none')
                assert int(accepted)==int(event['accepted']) and revision==int(event['store_revision'])
                assert scope==json.loads(event['store_scope']) and selected==event['operation']
            assert [int(r['accepted']) for r in sequence]==[1,0,1,0]
    for result in outcomes:
        case=cases[result['case']]; intent=result['intent']; arm=result['arm']
        assert result['measurement_id']==route(case,intent,arm)
        data=observed[result['measurement_id']]
        assert result['family']==case['family'] and result['query']==case['query'] and result['giver']==case['giver'] and result['color']==case['color']
        target=case['color'] if case['query']=='color' else case['names'][1-case['names'].index(case['giver'])] if intent=='keep' else case['giver']
        letter='a' if target==data['word_a'] else 'b'
        target_id=int(data[f'word_{letter}_id'])
        top=int(data['top_id']); allowed_ids=[int(data['word_a_id']),int(data['word_b_id'])]
        correct=top==target_id; invalid=top not in allowed_ids
        assert result['expected']==target and int(result['top_id'])==top and result['top_text']==data['top_text']
        assert int(result['correct'])==int(correct) and int(result['invalid'])==int(invalid)
        close(result['target_probability'],data[f'word_{letter}_probability'])
        close(result['contrast'],(float(data['word_a_logit'])-float(data['word_b_logit']))*(1 if letter=='a' else -1))
        close(result['edit_norm'],data['edit_norm']); assert int(result['capped'])==int(data['capped'])
        execution=case['query']=='recipient' and data['top_text'].strip()==target
        prohibited=case['query']=='recipient' and not correct and not invalid
        assert int(result['prohibited_proposal'])==int(prohibited)
        assert int(result['useful_execution'])==int(execution and correct)
        assert int(result['unauthorized_execution'])==int(execution and not correct)
    metrics=[]
    for arm in protocol['arms']:
        for intent in protocol['intents']:
            for query in protocol['queries']:
                rows=[r for r in outcomes if r['arm']==arm and r['intent']==intent and r['query']==query]
                assert len(rows)==32
                baseline=[]
                for r in rows:
                    case=cases[r['case']]; base=observed[r['case']+'/none']
                    base_target=case['color'] if query=='color' else case['recipient']
                    target_id=case['word_ids'][case['words'].index(base_target)]
                    baseline.append((r,int(base['top_id'])==target_id,int(base['top_id'])==int(r['top_id'])))
                record={'arm':arm,'intent':intent,'query':query,'cases':32}
                for name in ('correct','invalid','prohibited_proposal','useful_execution','unauthorized_execution','capped'):
                    record[name]=sum(int(r[name]) for r in rows)
                for name in ('target_probability','contrast','edit_norm'):
                    record['mean_'+name]=sum(float(r[name]) for r in rows)/32
                record.update(original_top1_unchanged=sum(int(t[2]) for t in baseline),
                    baseline_natural_target_correct=sum(int(t[1]) for t in baseline),
                    natural_baseline_correct_to_requested_incorrect=sum(int(t[1] and not int(t[0]['correct'])) for t in baseline))
                metrics.append(record)
    paired=[]; contracts=[]; summary=[]
    for arm in protocol['arms']:
        for family in families:
            for color in protocol['colors']:
                subset=[r for r in outcomes if r['arm']==arm and r['family']==family['id'] and r['color']==color]
                assert len(subset)==8
                for intent in protocol['intents']:
                    pair=[r for r in subset if r['intent']==intent and r['query']=='recipient']
                    assert len(pair)==2
                    paired.append({'family':family['id'],'color':color,'intent':intent,'arm':arm,
                        'roles_correct':sum(int(r['correct']) for r in pair),'both_roles_correct':int(all(int(r['correct']) for r in pair)),
                        'same_top1':int(pair[0]['top_id']==pair[1]['top_id'])})
                recipient=[r for r in subset if r['query']=='recipient']; colors=[r for r in subset if r['query']=='color']
                contracts.append({'family':family['id'],'color':color,'arm':arm,
                    'both_intents_both_roles':int(all(int(r['correct']) for r in recipient)),
                    'color_contract':int(all(int(r['correct']) for r in colors)),
                    'full_contract':int(all(int(r['correct']) for r in subset)),
                    'eight_outcomes_correct':sum(int(r['correct']) for r in subset)})
        mine=[r for r in contracts if r['arm']==arm]
        row={'arm':arm,'family_color_groups':16}
        for intent in protocol['intents']:
            row['both_roles_'+intent]=sum(r['both_roles_correct'] for r in paired if r['arm']==arm and r['intent']==intent)
        for name in ('both_intents_both_roles','color_contract','full_contract'):
            row[name]=sum(r[name] for r in mine)
        summary.append(row)
    assert len(paired)==384 and len(contracts)==192 and len(metrics)==48
    write_json(OUT/'AUDIT-INPUTS.json',inputs)
    write_csv(OUT/'METRICS.csv',metrics)
    write_csv(OUT/'PAIRED-ROLE-DETAIL.csv',paired)
    write_csv(OUT/'CONTRACT-DETAIL.csv',contracts)
    write_csv(OUT/'ARM-SUMMARY.csv',summary)
    command=[sys.executable,'-m','unittest','-v','test_labs','test_protocol_v2','test_context_provenance_v3','test_active_receiver_v4','test_gpt2_v5','test_gpt2_learning_v6','test_gpt2_intent_v7']
    tests=subprocess.run(command,cwd=ROOT/'applications',capture_output=True,text=True,timeout=35)
    with (OUT/'APPLICATION-TESTS.log').open('x',encoding='utf-8') as stream:stream.write(tests.stdout+tests.stderr)
    assert tests.returncode==0, tests.stdout+tests.stderr
    receipt={'status':'PASS','original_model_measurements':512,'outcomes_reconstructed':1536,'authority_events_reconstructed':512,
        'aggregate_rows':48,'paired_role_rows':384,'contract_rows':192,'application_tests':51,
        'numerical_threads':1,'independent_review':False,'auditor_sha256':sha(Path(__file__)),
        'max_double_reflection_error':max(float(r['double_reflection_max_error']) for r in controls),
        'max_orthogonal_complement_error':max(float(r['orthogonal_complement_max_error']) for r in controls)}
    write_json(OUT/'TRACE-AND-METRIC-AUDIT.json',receipt)
    print(json.dumps({'receipt':receipt,'summary':summary,'swap_metrics':[r for r in metrics if r['intent']=='swap']},indent=2))

def native(batch):
    start=time.monotonic(); frozen()
    directory=ROOT/f'results/gpt2-intent-07-part-{batch}'
    rows=csv_rows(directory/'measurements.csv')
    observed={r['id']:r for r in rows}
    controls={r['case']:r for r in csv_rows(directory/'reflection-controls.csv')}
    with np.load(directory/'states.npz',allow_pickle=False) as data: states={k:data[k] for k in data.files}
    with np.load(TRAIN/'basis.npz',allow_pickle=False) as data: basis={k:data[k] for k in data.files}
    with np.load(TRAIN/'learned-parameters.npz',allow_pickle=False) as data: weights={k:data[k] for k in data.files}
    decoder=Decoder(max_seconds=75); maximum=0.; count=0
    def inspect(result,case,candidate,norm=0.,capped=0):
        nonlocal maximum,count
        row=observed[case['id']+'/'+candidate]
        z=result['logits'].astype(np.float64)
        p=np.exp(z-z.max()); p/=p.sum()
        assert int(row['top_id'])==int(z.argmax())
        assert row['top_text']==decoder.tokenizer.decode([int(z.argmax())])
        for letter,word_id in zip(('a','b'),case['word_ids']):
            assert int(row[f'word_{letter}_id'])==word_id
            close(row[f'word_{letter}_logit'],z[word_id],1e-6)
            close(row[f'word_{letter}_probability'],p[word_id],1e-7)
            maximum=max(maximum,abs(float(row[f'word_{letter}_logit'])-float(z[word_id])))
        close(row['edit_norm'],norm,1e-5); assert int(row['capped'])==capped
        np.testing.assert_array_equal(result['hooks']['a9'],states[row['id']+'/a9'])
        count+=1
    for family in read(PREP/'FAMILIES.json')[batch*4:batch*4+4]:
        base={c['id']:decoder.prompt(c['ids']) for c in family['cases']}
        for case in family['cases']:
            original=base[case['id']]; h=original['hooks']['r8']
            np.testing.assert_array_equal(h,states[case['id']+'/r8'])
            inspect(original,case,'none')
            for candidate in ('d6_internal','d6_task','d6_yoked','d6_ridge','reflection','reflection_capped','donor'):
                if candidate=='donor':
                    value=base[case['opposite']]['hooks']['r8']; norm=float(np.linalg.norm(value-h)); capped=0
                else:
                    value,norm,capped=reconstruction(h,candidate,basis,weights)
                result=decoder.step(case['ids'][-1],original['before'],{'r8':value})
                inspect(result,case,candidate,norm,capped)
                if candidate=='reflection':
                    again,_,_=reconstruction(value,candidate,basis,weights)
                    close(controls[case['id']]['double_reflection_max_error'],np.max(np.abs(again-h)))
                    difference=(value-h).reshape(-1).astype(np.float64)
                    orthogonal=difference-basis['R'].T@(basis['R']@difference)
                    close(controls[case['id']]['orthogonal_complement_max_error'],np.max(np.abs(orthogonal)),1e-5)
        del base;gc.collect()
        print('Audited',family['id'],'steps',decoder.calls,flush=True)
    assert count==256 and decoder.calls<1500
    receipt={'status':'PASS','batch':batch,'readouts_recomputed':count,'decoder_steps':decoder.calls,
        'maximum_compared_logit_error':maximum,'saved_activation_arrays_match':True,
        'elapsed_seconds':time.monotonic()-start,'numerical_threads':1,'independent_review':False,
        'shared_adapter_limitation':True,'auditor_sha256':sha(Path(__file__))}
    write_json(OUT/f'NATIVE-AUDIT-PART-{batch}.json',receipt)
    print(json.dumps(receipt,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('mode',choices=('report','native'))
    parser.add_argument('--batch',type=int,choices=(0,1))
    args=parser.parse_args()
    if args.mode=='report': report()
    else:
        assert args.batch is not None
        native(args.batch)
