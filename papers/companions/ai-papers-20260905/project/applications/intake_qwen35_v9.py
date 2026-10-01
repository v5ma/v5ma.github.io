"""Pinned, allowlisted two-phase text-only intake. Never downloads vision or a repository."""
import argparse
import collections
import hashlib
import json
import shutil
import sys
import time
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
PLAN=ROOT/'applications/INTAKE-QWEN35-TEXT-09.json'
def sha(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def write(path,obj):
    with path.open('x',encoding='utf-8') as stream:
        json.dump(obj,stream,indent=2);stream.write('\n')
def main(phase):
    plan=json.loads(PLAN.read_text(encoding='utf-8'))
    out=(ROOT/plan['destination']).resolve()
    assert out.is_relative_to((ROOT/'model-dependencies').resolve())
    out.mkdir(exist_ok=True)
    receipt_path=out/(phase.upper()+'-INTAKE-RECEIPT.json')
    assert not receipt_path.exists(),'Certified phase must not be overwritten.'
    if phase=='weights':
        gate=json.loads((out/'WEIGHT-INTAKE-GATE.json').read_text())
        assert gate['approved_for_this_local_run'] and gate['plan_sha256']==sha(PLAN)
    assert shutil.disk_usage(out).free>5_000_000_000
    selected=[r for r in plan['files'] if r['phase']==phase]
    bound=sum(r.get('bytes',r.get('max_bytes',0)) for r in plan['files'])
    assert bound<plan['resource_limits']['max_total_download_bytes']
    rows=[];started=time.monotonic()
    partial=out/'GRAPH-PARTIAL-ATTEMPT-01.json'
    previously={r['path']:r for r in json.loads(partial.read_text())['files']} if phase=='graph' and partial.exists() else {}
    for row in selected:
        path=(out/row['path']).resolve();assert path.is_relative_to(out)
        path.parent.mkdir(exist_ok=True)
        remote=row.get('remote',row['path'])
        url='https://huggingface.co/'+row.get('repo',plan['repo'])+'/resolve/'+row.get('revision',plan['revision'])+'/'+remote
        if path.exists():
            known=previously.get(row['path'])
            assert known and known['url']==url and sha(path)==known['sha256'] and path.stat().st_size==known['bytes']
            rows.append(dict(known,seconds=0,reused_verified_partial=True))
            continue
        cap=row.get('bytes',row.get('max_bytes'))
        part=path.with_name(path.name+'.part')
        begin=time.monotonic();n=0;digest=hashlib.sha256()
        request=urllib.request.Request(url+'?download=true',headers={'User-Agent':'SAN-paper-bounded-intake/09'})
        with urllib.request.urlopen(request,timeout=20) as response,part.open('xb') as stream:
            length=response.headers.get('Content-Length')
            if length:assert int(length)<=cap
            while True:
                block=response.read(min(1_048_576,cap-n+1))
                if not block:break
                n+=len(block);assert n<=cap
                assert time.monotonic()-begin<plan['resource_limits']['max_download_seconds_per_file']
                stream.write(block);digest.update(block)
        if 'bytes' in row:assert n==row['bytes']
        if 'sha256' in row:assert digest.hexdigest()==row['sha256']
        assert path.parent==part.parent and path.is_relative_to(out) and not path.exists()
        part.rename(path)
        rows.append({'path':row['path'],'url':url,'bytes':n,'sha256':digest.hexdigest(),
            'seconds':time.monotonic()-begin})
        print('Fetched',row['path'],n,'bytes',flush=True)
    receipt={'phase':phase,'status':'DOWNLOADED_HASHED_NOT_INFERENCE','plan_sha256':sha(PLAN),
        'script_sha256':sha(Path(__file__)),'files':rows,'bytes':sum(r['bytes'] for r in rows),
        'elapsed_seconds':time.monotonic()-started,'vision_downloaded':False,'model_inference_executed':False}
    write(receipt_path,receipt)
    if phase=='graph':
        sys.path.insert(0,str(ROOT/'runtime-dependencies/onnx-1.19.1'))
        import onnx
        graphs=[]
        def visit(graph):
            for node in graph.node:
                yield node
                for attr in node.attribute:
                    if attr.type==onnx.AttributeProto.GRAPH:yield from visit(attr.g)
                    elif attr.type==onnx.AttributeProto.GRAPHS:
                        for child in attr.graphs:yield from visit(child)
        def value(v):
            t=v.type.tensor_type
            return {'name':v.name,'element_type':t.elem_type,
                'shape':[d.dim_value if d.HasField('dim_value') else d.dim_param for d in t.shape.dim]}
        for filename in ('onnx/decoder_model_merged_q4.onnx','onnx/embed_tokens_q4.onnx'):
            model=onnx.load_model(str(out/filename),load_external_data=False)
            nodes=list(visit(model.graph));assert len(nodes)<10000
            ops=collections.Counter(n.domain+'::'+n.op_type for n in nodes)
            graphs.append({'file':filename,'ir_version':model.ir_version,
                'opsets':{o.domain:o.version for o in model.opset_import},
                'nodes':len(nodes),'operators':dict(sorted(ops.items())),
                'inputs':[value(v) for v in model.graph.input],'outputs':[value(v) for v in model.graph.output],
                'external_files':sorted({p.value for t in model.graph.initializer for p in t.external_data if p.key=='location'})})
        write(out/'GRAPH-INSPECTION.json',{'status':'INSPECTED_NOT_INFERRED','graphs':graphs})
        print(json.dumps({'graphs':graphs},indent=2))
    print(json.dumps(receipt,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('phase',choices=['graph','weights']);a=p.parse_args();main(a.phase)
