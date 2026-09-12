"""Temporary hash-checked integration; restrict all targets to the public game."""
from pathlib import Path,PurePosixPath
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[2]
a=json.loads((root/'aether-reach/tools/blackout-patch-0.json').read_text())
b=json.loads((root/'aether-reach/tools/blackout-patch-1.json').read_text())
sha=lambda v:hashlib.sha256(v).hexdigest()
def target(name):
 p=PurePosixPath(name)
 assert name.startswith('aether-reach/') and not p.is_absolute() and '..' not in p.parts
 dest=root/name
 assert dest.resolve().is_relative_to(root/'aether-reach') and not any(v.is_symlink() for v in [dest,*dest.parents])
 return dest
for name,expected in a['new'].items():assert sha(target(name).read_bytes())==expected,'New source mismatch '+name
pending=[]
for e in a['edits']+b['edits']:
 p=target(e['path']);old=p.read_bytes()
 if sha(old)==e['after']:continue
 assert sha(old)==e['before'],'Baseline mismatch '+e['path']
 text=old.decode('utf-8');last=len(text)
 for start,end,value in reversed(e['edits']):
  assert 0<=start<=end<=last
  text=text[:start]+value+text[end:];last=start
 data=text.encode('utf-8');assert sha(data)==e['after'],'Target mismatch '+e['path']+' got '+sha(data)
 pending.append((p,data))
for p,data in pending:p.write_bytes(data)
subprocess.run(['python','aether-reach/tools/render-production-plan.py'],cwd=root,check=True)
assert sha(target('aether-reach/planning/AAA-ROADMAP.md').read_bytes())==a['checklist'],'Checklist differs from canonical plan'
out=root/'aether-reach/test-output';out.mkdir(exist_ok=True)
(out/'blackout-integration.json').write_text(json.dumps({'files':{**a['new'],**{e['path']:e['after'] for e in a['edits']+b['edits']},'checklist':a['checklist']},indent=2))
print('All new sources and',len(pending),'integrations match the locally tested candidate.')
