"""Temporary release integration. Validate every target before writing any file."""
from pathlib import Path,PurePosixPath
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[2]
plan=json.loads((root/'aether-reach/tools/aurora-integration.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
def target(name):
 path=PurePosixPath(name)
 assert name.startswith('aether-reach/') and not path.is_absolute() and '..' not in path.parts,name
 p=root/name
 assert p.resolve().is_relative_to(root/'aether-reach') and not any(v.is_symlink() for v in [p,*p.parents]),name
 return p
for name,digest in plan['new'].items():assert sha(target(name).read_bytes())==digest,'New source differs: '+name
pending=[]
for e in plan['entries']:
 p=target(e['path']);old=p.read_bytes()
 if sha(old)==e['after']:continue
 assert sha(old)==e['before'],'Baseline differs: '+e['path']
 text=old.decode('utf-8')
 for old,new in e.get('replace',[]):
  assert text.count(old)==1,('Replacement',e['path'],old)
  text=text.replace(old,new)
 last=len(text)
 for start,end,value in reversed(e.get('edits',[])):
  assert 0<=start<=end<=last,('Range',e['path'])
  text=text[:start]+value+text[end:];last=start
 data=text.encode('utf-8')
 assert sha(data)==e['after'],'Target differs: '+e['path']+' '+sha(data)
 pending.append((p,data))
for p,data in pending:p.write_bytes(data)
subprocess.run(['python','aether-reach/tools/render-production-plan.py'],cwd=root,check=True)
assert sha(target('aether-reach/planning/AAA-ROADMAP.md').read_bytes())==plan['checklist'],'Checklist differs'
out=root/'aether-reach/test-output';out.mkdir(exist_ok=True)
hashes={e['path']:e['after'] for e in plan['entries']}
hashes.update({name:sha(target(name).read_bytes()) for name in plan['new']})
(out/'aurora-integration.json').write_text(json.dumps({'files':hashes,'checklist':plan['checklist']},indent=2))
print('All',len(pending),'integration targets match the locally tested candidate.')
