"""Temporary source transport: check all old/new hashes before any write."""
from pathlib import Path,PurePosixPath
import hashlib,json,subprocess,sys,zipfile
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'aether-reach/test-output'
sha=lambda b:hashlib.sha256(b).hexdigest()
def entries():
    values=[]
    for i in range(7):values.extend(json.loads((ROOT/f'aether-reach/tools/afterlight-package-{i}.json').read_text()))
    assert len(values)==24 and len({v['path'] for v in values})==24
    return values
def target(name):
    p=PurePosixPath(name)
    assert name.startswith('aether-reach/') and not p.is_absolute() and '..' not in p.parts and str(p)==name,name
    path=ROOT/name
    assert not any(p.is_symlink() for p in [path,*path.parents]),name
    return path
def apply():
    planned=[]
    for v in entries():
        p=target(v['path']);old=p.read_bytes() if p.exists() else None
        if old is not None and sha(old)==v['after']:planned.append((p,old));continue
        assert (sha(old) if old is not None else None)==v['before'],'Baseline mismatch '+v['path']
        if 'content' in v:data=v['content'].encode('utf-8')
        else:
            lines=old.decode('utf-8').splitlines(keepends=True);last=len(lines)
            for start,end,text in reversed(v['edits']):
                assert 0<=start<=end<=last,'Invalid range '+v['path']
                last=start;lines[start:end]=[text]
            data=''.join(lines).encode('utf-8')
        assert sha(data)==v['after'],'Target mismatch '+v['path']+' got '+sha(data)
        planned.append((p,data))
    for p,data in planned:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    OUT.mkdir(exist_ok=True)
    (OUT/'afterlight-source-hashes.json').write_text(json.dumps({v['path']:v['after'] for v in entries()},indent=2))
    print('Verified and installed all',len(planned),'episode source files.')
def stage():
    for v in entries():
        assert sha(target(v['path']).read_bytes())==v['after'],'Source changed after tests: '+v['path']
        subprocess.run(['git','add','--',v['path']],check=True,cwd=ROOT)
def archive():
    OUT.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUT/'afterlight-tested-source.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in (ROOT/'aether-reach').rglob('*'):
            if p.is_file() and 'test-output' not in p.relative_to(ROOT/'aether-reach').parts:z.write(p,p.relative_to(ROOT))
        for name in ['index.html','projects.css']:
            p=ROOT/name
            if p.exists():z.write(p,name)
    (OUT/'tested-commit.txt').write_text(subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True))
    (OUT/'uncommitted-diff.txt').write_text(subprocess.check_output(['git','diff','--stat'],cwd=ROOT,text=True))
if __name__=='__main__':{'apply':apply,'stage':stage,'archive':archive}[sys.argv[1]]()
