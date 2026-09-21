# Temporary hash-guarded Prism-only transport. Removed before release.
from pathlib import Path
import json,hashlib
base=json.loads(Path('.github/prism-rotunda-edits.json').read_text())
follow=json.loads(Path('.github/prism-rotunda-followup.json').read_text())
assert len(base)==9 and len(follow)==3
final={p['path']:p['after'] for p in follow};changed=set()
for p in base+follow:
 name=p['path'];assert name.startswith('prism-current/') and '..' not in name.split('/')
 f=Path(name);s=f.read_text();h=hashlib.sha256(s.encode()).hexdigest()
 if h in [p['after'],final.get(name)]:continue
 assert h==p['before'],'Stale source: '+name
 previous=len(s)+1
 for a,b,replacement in reversed(p['edits']):
  assert 0<=a<=b<previous
  s=s[:a]+replacement+s[b:];previous=a+1
 assert hashlib.sha256(s.encode()).hexdigest()==p['after'],'Unexpected output: '+name
 f.write_text(s);changed.add(name)
Path('/tmp/rotunda-paths.json').write_text(json.dumps(sorted(changed)))
print('Prepared exact Prism files:',sorted(changed))
