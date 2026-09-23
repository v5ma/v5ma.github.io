import argparse
from fractions import Fraction as F
import hashlib
import itertools
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PAPER=ROOT.parents[1]
def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        while True:
            chunk=f.read(1024*1024)
            if not chunk:break
            h.update(chunk)
    return h.hexdigest()

def run():
    ledgerpath=PAPER/'application/results/CELL7-FIELD-AUDIT-20260922.json'
    old=json.loads(ledgerpath.read_text(encoding='utf-8'))
    headers,checks={},[]
    for name in ('151203.txt','151203_4ii.txt'):
        p=PAPER/'sources/btsp-cell7-intake-20260922'/name
        if p.stat().st_size>24*1024*1024:raise SystemExit('Source size cap')
        digest=sha(p)
        checks.append(digest.upper()==old['source_hashes_sha256'][name])
        with p.open(encoding='utf-8-sig') as f:
            cols=f.readline().strip().split('\t')
        headers[name]={'bytes':p.stat().st_size,'sha256':digest,'columns':cols}
    rows=[]
    for c,u,noise,e,p in itertools.product((F(0),F(1,2),F(1)),(F(-1),F(0),F(1)),(F(-1,10),F(0),F(1,10)),(F(0),F(1)),(F(0),F(1))):
        d=c+u
        g=e*p
        ya=g*(F(3,10)*c+F(7,10)*d)+noise
        yb=g*(c+F(7,10)*u)+noise
        da=g*(F(3,10)*c+F(7,10)*(d+F(1,4)))+noise-ya
        db=F(0)
        checks.extend([ya==yb,da==F(7,40)*g,db==0])
        rows.append({k:str(v) for k,v in {'C':c,'U':u,'N':noise,'E':e,'P':p,'D':d,'Y_A':ya,'Y_B':yb,'ideal_delta_Y_A':da,'ideal_delta_Y_B':db}.items()})
    return {'scope':'Exact constructed causal nonidentification; no animal effect estimate','protocol_sha256':sha(ROOT/'PROTOCOL.md'),'code_sha256':sha(Path(__file__)),'previous_field_receipt_sha256':sha(ledgerpath),'source_headers':headers,'cases':rows,'summary':{'states':len(rows),'observationally_equal':sum(r['Y_A']==r['Y_B'] for r in rows),'ideal_interventions_differ':sum(r['ideal_delta_Y_A']!=r['ideal_delta_Y_B'] for r in rows),'checks_passed':sum(checks),'checks_total':len(checks)}}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--output',required=True,choices=('run','replay'))
    args=p.parse_args()
    dest=ROOT/args.output
    dest.mkdir(exist_ok=False)
    r=run()
    (dest/'RESULT.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(r['summary']))
