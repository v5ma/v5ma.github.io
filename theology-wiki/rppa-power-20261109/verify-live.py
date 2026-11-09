"""Verify changed public bytes before claiming publication. No writes to remote."""
# Compare original bytes only after validating the exact current publication blocks.
import sys
from pathlib import Path
sys.path.insert(0, str(next(p for p in Path(__file__).resolve().parents
    if (p / 'scripts/theology_publication_bytes.py').is_file()) / 'scripts'))
from theology_publication_bytes import source_bytes

from pathlib import Path
import hashlib,json,os,time,urllib.request
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
base=os.environ.get('RPPA_BASE','https://v5ma.github.io').rstrip('/')
records=json.loads((HERE/'publication-files.json').read_text());pending={r['path']:r['sha256'] for r in records};deadline=time.monotonic()+300;attempt=0
while pending and time.monotonic()<deadline:
 attempt+=1
 for path,expected in list(pending.items()):
  try:
   req=urllib.request.Request(base+'/'+path+'?rppa-check='+str(attempt),headers={'Cache-Control':'no-cache'})
   data=urllib.request.urlopen(req,timeout=20).read()
   if hashlib.sha256(source_bytes(data,path)).hexdigest()==expected:del pending[path]
  except Exception:pass
 if pending:time.sleep(10)
if pending:raise SystemExit('Hosted bytes not current: '+', '.join(pending))
print(json.dumps({'verifiedFiles':len(records),'base':base}))
