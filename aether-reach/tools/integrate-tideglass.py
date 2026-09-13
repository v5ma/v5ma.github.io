"""Temporary exact integration. Validate all hashes before any target write."""
from pathlib import Path,PurePosixPath
import hashlib,json
root=Path(__file__).resolve().parents[2]
packs=[json.loads((root/f'aether-reach/tools/tideglass-patch-{i}.json').read_text())for i in range(2)]
sha=lambda b:hashlib.sha256(b).hexdigest()
def target(name):
 p=PurePosixPath(name)
 assert name.startswith('aether-reach/') and '..' not in p.parts and not p.is_absolute()
 dest=root/name
 assert dest.resolve().is_relative_to(root/'aether-reach') and not any(p.is_symlink() for p in [dest,*dest.parents])
 return dest
hashes=dict(packs[0]['new'])
for name,digest in hashes.items():assert sha(target(name).read_bytes())==digest,'New file mismatch: '+name
pending=[]
for pack in packs:
 for v in pack['edits']:
  p=target(v['path']);old=p.read_bytes()
  if sha(old)==v['after']:continue
  assert sha(old)==v['before'],'Baseline mismatch: '+v['path']
  text=old.decode('utf-8');last=len(text)
  for start,end,replacement in reversed(v['edits']):
   assert 0<=start<=end<=last
   text=text[:start]+replacement+text[end:];last=start
  data=text.encode('utf-8')
  assert sha(data)==v['after'],'Target mismatch: '+v['path']+' got '+sha(data)
  pending.append((p,data));hashes[v['path']]=v['after']
for p,data in pending:p.write_bytes(data)
out=root/'aether-reach/test-output';out.mkdir(exist_ok=True)
(out/'tideglass-integration.json').write_text(json.dumps(hashes,indent=2))
print('Verified all new modules and',len(pending),'existing-file changes before installation.')
