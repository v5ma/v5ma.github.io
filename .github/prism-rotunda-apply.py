# Temporary hash-guarded transport for nine specific Prism files.
# Both this helper and its write-enabled staging workflow are removed before release.
from pathlib import Path
import json,hashlib
patches=json.loads(Path('.github/prism-rotunda-edits.json').read_text())
assert len(patches)==9
changed=[]
for p in patches:
 name=p['path'];assert name.startswith('prism-current/') and '..' not in name.split('/')
 f=Path(name);s=f.read_text();h=hashlib.sha256(s.encode()).hexdigest()
 if h==p['after']:continue
 assert h==p['before'],'Stale source: '+name
 previous=len(s)+1
 for a,b,replacement in reversed(p['edits']):
  assert 0<=a<=b<previous
  s=s[:a]+replacement+s[b:];previous=a+1
 assert hashlib.sha256(s.encode()).hexdigest()==p['after'],'Unexpected output: '+name
 f.write_text(s);changed.append(name)
Path('/tmp/rotunda-paths.json').write_text(json.dumps(changed))
print('Prepared exact Prism files:',changed)
