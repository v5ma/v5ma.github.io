import argparse
from copy import deepcopy
import hashlib
import itertools
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def hashobj(x):
    return hashlib.sha256(json.dumps(x,sort_keys=True).encode()).hexdigest()

def assemble(e,fine,earlier):
    a={'C':['door0','door1','self'],'B':[], 'Pi':None,'H':[0], 'tokens':[], 'doors':e['doors'],'self':e['self']}
    if earlier:
        a['C']+=['voice0_token','voice1_token']
        a['B']=e['binding'].copy()
        a['Pi']='four' if fine else 'two'
        a['tokens']=e['tokens'].copy() if fine else [t//2 for t in e['tokens']]
        a['H']=[-3,-2,0]
    return a

def answer(a,actor):
    if not a['B'] or a['Pi']!='four':
        return .5
    return float((a['tokens'][a['B'][actor]]%2)^a['doors'][actor]^a['self'])

def readout_only(e,actor,fine,earlier,swap):
    if not earlier or not fine:
        return .5
    speaker=e['binding'][actor]
    if swap:
        speaker=1-speaker
    return float((e['tokens'][speaker]%2)^e['doors'][actor]^e['self'])

def run():
    rows,checks,balance=[],[],{}
    for high,low,assignment,actor,d0,d1,selfloc in itertools.product(range(2),repeat=7):
        e={'tokens':[2*high+low,2*high+(1-low)],'binding':[assignment,1-assignment],'doors':[d0,d1],'self':selfloc}
        truth=(e['tokens'][e['binding'][actor]]%2)^e['doors'][actor]^selfloc
        fixed_hash=hashobj(e)
        for fine,earlier in itertools.product((False,True),repeat=2):
            a=assemble(e,fine,earlier)
            initial=deepcopy(a)
            before=answer(a,actor)
            if a['B']:
                a['B'].reverse()
            after=answer(a,actor)
            for key in ('C','Pi','H','tokens','doors','self'):
                checks.append(a[key]==initial[key])
            if a['B']:
                a['B'].reverse()
            restored=answer(a,actor)
            frozen_before=readout_only(e,actor,fine,earlier,False)
            frozen_after=readout_only(e,actor,fine,earlier,True)
            checks.extend([before==frozen_before,after==frozen_after,restored==before,a==initial,hashobj(e)==fixed_hash])
            effect=abs(after-before)
            checks.append(effect==(1 if fine and earlier else 0))
            if fine and earlier:
                checks.append(before==truth)
            else:
                observation=json.dumps({'state':initial,'actor':actor},sort_keys=True)
                balance.setdefault(observation,[]).append(truth)
            rows.append({'episode':e,'actor':actor,'fine':fine,'earlier':earlier,'assembly':initial,'truth':truth,'before':before,'after_binding_swap':after,'restored':restored,'E_B':effect,'unchanged_record_before':frozen_before,'unchanged_record_after':frozen_after,'unchanged_record_hash':fixed_hash})
    checks.extend(sum(v)*2==len(v) for v in balance.values())
    means={f'{f}:{h}':sum(r['E_B'] for r in rows if r['fine']==f and r['earlier']==h)/128 for f,h in itertools.product((False,True),repeat=2)}
    return {'protocol_sha256':hashlib.sha256((ROOT/'PROTOCOL.md').read_bytes()).hexdigest(),'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'scope':'Exhaustive hand-constructed measurement/identification diagnostic, not learned joint-controller evaluation','summary':{'base_episodes':128,'snapshots':len(rows),'E_B':means,'J':means['True:True']-means['False:True']-means['True:False']+means['False:False'],'matched_incomplete_observables':len(balance),'checks_passed':sum(checks),'checks_total':len(checks)},'cases':rows}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--output',required=True,choices=('run','replay'))
    args=p.parse_args()
    dest=ROOT/args.output
    dest.mkdir(exist_ok=False)
    result=run()
    data=json.dumps(result,indent=2)+'\n'
    if len(data)>2*1024*1024:
        raise SystemExit('Size cap')
    (dest/'RESULT.json').write_text(data,encoding='utf-8')
    print(json.dumps(result['summary']))
