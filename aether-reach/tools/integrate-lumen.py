"""Temporary transport helper. Validate every old/new hash before any write."""
from pathlib import Path, PurePosixPath
import hashlib,json,subprocess,sys,zipfile
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'aether-reach/test-output'
sha=lambda data:hashlib.sha256(data).hexdigest()
def entries():
    values=[]
    for i in range(10):
        p=ROOT/f'aether-reach/tools/integrate-lumen-{i}.json'
        values.extend(json.loads(p.read_text()))
    assert len(values)==29,'Unexpected package size'
    assert len({v['path'] for v in values})==29,'Repeated target'
    return values
def target(name):
    p=PurePosixPath(name)
    assert not p.is_absolute() and '..' not in p.parts and str(p)==name,name
    assert name.startswith('aether-reach/') or name=='.github/workflows/aether-lumen-controller.yml',name
    value=ROOT/name
    assert not any(x.is_symlink() for x in [value,*value.parents]),name
    assert value.resolve().is_relative_to(ROOT),name
    return value
def apply():
    planned=[]
    for v in entries():
        p=target(v['path']);old=p.read_bytes() if p.exists() else None
        if old is not None and sha(old)==v['after']:
            planned.append((p,old));continue
        assert (sha(old) if old is not None else None)==v['before'],'Baseline mismatch '+v['path']
        if 'content' in v:
            data=v['content'].encode('utf-8')
        else:
            lines=old.decode('utf-8').splitlines(keepends=True)
            last=len(lines)
            for start,end,text in reversed(v['edits']):
                assert 0<=start<=end<=last,'Invalid patch range '+v['path']
                last=start
                # Restore an accidentally shortened comment in transport only.
                # The unchanged target SHA below still requires the exact tested source.
                if v['path']=='aether-reach/controllers.mjs' and start==0:
                    text=text.replace('Menus use fixed A/B-pad bindings','Menus use fixed A/B/D-pad bindings')
                lines[start:end]=[text]
            data=''.join(lines).encode('utf-8')
        assert sha(data)==v['after'],'Target mismatch '+v['path']+' got '+sha(data)
        planned.append((p,data))
    for p,data in planned:
        p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    OUT.mkdir(exist_ok=True)
    (OUT/'integration-hashes.json').write_text(json.dumps({v['path']:v['after'] for v in entries()},indent=2))
    print('Verified and installed all 29 source targets.')
def stage():
    for v in entries():
        p=target(v['path']);assert sha(p.read_bytes())==v['after'],'Post-test source changed '+v['path']
        if v['path'].startswith('aether-reach/'):
            subprocess.run(['git','add','--',v['path']],check=True,cwd=ROOT)
def archive():
    OUT.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUT/'lumen-tested-source.zip','w',zipfile.ZIP_DEFLATED) as z:
        for pattern in ['aether-reach/*.mjs','aether-reach/*.css','aether-reach/*.html','aether-reach/*.json','aether-reach/tests/*.py','aether-reach/tests/*.mjs','aether-reach/tools/integrate-lumen*','.github/workflows/aether-lumen*']:
            for p in ROOT.glob(pattern):
                if p.is_file():z.write(p,p.relative_to(ROOT).as_posix())
    (OUT/'tested-commit.txt').write_text(subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True))
if __name__=='__main__':
    {'apply':apply,'stage':stage,'archive':archive}[sys.argv[1] if len(sys.argv)>1 else 'apply']()
