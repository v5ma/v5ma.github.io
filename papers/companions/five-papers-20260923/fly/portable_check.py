"""Public, bounded relocation check. Frozen experiment sources remain unchanged.

Requires Python >=3.11 and NumPy for fly, AI and temporal. One CPU thread.
Writes only to a new explicitly requested output directory, never frozen results.
"""
import os
for n in ('OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS'):os.environ[n]='1'
import argparse
import contextlib
import ctypes
from fractions import Fraction as F
import importlib.util
import io
import itertools
import json
from pathlib import Path
import shutil
import sys
sys.dont_write_bytecode=True
KEY='fly'
PRIMARY='application/receiving-action-v01'
TOP=Path(__file__).resolve().parent
ROOT=TOP/'paper'/PRIMARY
def load(name):
    path=ROOT/name
    spec=importlib.util.spec_from_file_location('frozen_'+KEY,path)
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    return m
def read(path):return json.loads(path.read_text('utf-8'))
def run(out):
    if KEY=='ai':
        m=load('experiment.py')
        scratch=out/'application';scratch.mkdir()
        for name in ('PROTOCOL.md','MATHEMATICAL-BOUNDARY.md'):
            shutil.copyfile(ROOT/name,scratch/name)
        for directory in ('development','evaluation'):
            (scratch/directory).mkdir()
            paths=list((ROOT/directory).iterdir())
            if len(paths)>75:raise ValueError('Fixed evaluation file cap')
            for p in paths:
                if p.suffix=='.json':shutil.copyfile(p,scratch/directory/p.name)
        m.ROOT=scratch
        m.CONCEPT=TOP/'paper/sources/SAN-Selective-Dissipation-Continual-Learning-Concept.txt'
        with contextlib.redirect_stdout(io.StringIO()):m.evaluate(replay=True)
        assert read(scratch/'replay/REPLAY-CHECK.json')['result_and_all_64_event_files_byte_identical']
        return {'scope':'Fresh evaluation of frozen trained receiver/gates, not retraining or biological validation','byte_identical_files':65,'passed':True}
    if KEY in ('composition','temporal'):
        m=load('check.py' if KEY=='composition' else 'model.py')
        result=m.run();old=read(ROOT/'run/RESULT.json')
        assert result==old,'Relocated mathematical result differs from frozen result'
        (out/'RESULT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
        return {'scope':'Fresh full finite diagnostic, not a new independent experiment','passed':True,'summary':result['summary']}
    if KEY=='fly':
        m=load('run.py');old=read(ROOT/'run/RESULT.json');checks=0
        for row in old['cases']:
            a,b,p=m.observers(row['received'],row['prototype_codes'])
            assert (a if row['observer']=='set' else b)==row['decision'];checks+=1
            assert str(p)==row['posterior_plus'];checks+=1
            for r in row['movements']:
                d=row['decision'];g=r['true_gain']
                assert r['first_movement']==g*d;checks+=1
                assert abs(r['second_movement']-g*d/r['new_estimate'])<1e-14;checks+=1
        for summary in old['summary']:
            rows=[r for r in old['cases'] if all(r[k]==summary[k] for k in ('witness','condition','observer'))]
            assert sum(F(r['weight']) for r in rows)==1;checks+=1
            assert str(sum(F(r['weight'])*F(r['loss']) for r in rows))==summary['expected_loss'];checks+=1
        return {'scope':'Observer and returned-action arithmetic reconstructed from published synthetic cases. External connectome input NOT reacquired or rerun.','passed':True,'cases':len(old['cases']),'checks':checks}
    if KEY=='plasticity':
        rows=[]
        for c,u,n,e,p in itertools.product((F(0),F(1,2),F(1)),(F(-1),F(0),F(1)),(F(-1,10),F(0),F(1,10)),(F(0),F(1)),(F(0),F(1))):
            d=c+u;g=e*p;ya=g*(F(3,10)*c+F(7,10)*d)+n;yb=g*(c+F(7,10)*u)+n
            da=g*F(7,40)
            assert ya==yb
            rows.append({k:str(v) for k,v in {'C':c,'U':u,'N':n,'E':e,'P':p,'D':d,'Y_A':ya,'Y_B':yb,'ideal_delta_Y_A':da,'ideal_delta_Y_B':F(0)}.items()})
        assert rows==read(ROOT/'run/RESULT.json')['cases']
        return {'scope':'Fresh exact rational causal construction. Two third-party raw field checks NOT rerun or substituted.','passed':True,'states':len(rows),'observationally_equal':108,'ideal_interventions_differ':27}
    raise ValueError('Unknown fixed paper')
if __name__=='__main__':
    if os.name=='nt':ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
    p=argparse.ArgumentParser();p.add_argument('--output',required=True,type=Path);args=p.parse_args()
    out=args.output.resolve()
    if out.is_relative_to(TOP):raise ValueError('Choose a fresh output outside the public companion')
    out.mkdir(parents=True,exist_ok=False)
    result=run(out)
    (out/'PORTABLE-CHECK.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
