"""Temporary exact-hash source transport. Remove with its manifest before release.
The local code was edited/reviewed against the published v0.16.1 archive. This
applies only those reviewed text edits and never builds from arbitrary URLs.
"""
from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads(Path(__file__).with_name('field-desk-stage.json').read_text())
ready=[]
for record in manifest:
 path=ROOT/record['path']
 assert path.is_relative_to(ROOT/'rainward') and '..' not in Path(record['path']).parts
 original=path.read_text();digest=lambda text:hashlib.sha256(text.encode()).hexdigest()
 if digest(original)==record['after']:continue
 assert digest(original)==record['before'],('Source drift',record['path'])
 last=len(original);result=original
 for start,end,value in reversed(record['edits']):
  assert 0<=start<=end<=last
  result=result[:start]+value+result[end:];last=start
 assert digest(result)==record['after'],('Transport integrity',record['path'])
 ready.append((path,result))
for path,result in ready:path.write_text(result)
subprocess.run(['python','rainward/tools/build-production-plan.py'],cwd=ROOT,check=True)
print('Integrated exact source for',len(ready),'files')
