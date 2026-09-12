#!/usr/bin/env python3
"""One-time Living Stories source integration, separate from native acceptance.

The adjacent JSON contains readable exact old/new source contexts, explicit
prepend/append operations and a release-manifest merge. There are no binary or
character-offset patches. Every existing whole-file baseline and resulting hash
must match before any write. Maintain the resulting ordinary committed source.
"""
from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
spec=json.loads((Path(__file__).parent/'living-stories-edits.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
prepared=[]
for name,operations in spec['edits'].items():
 assert name.startswith('leonardos-guild/') and '..' not in Path(name).parts
 p=ROOT/name;before=p.read_bytes()
 assert sha(before)==spec['baseline'][name],('Changed baseline; refusing overwrite',name,sha(before))
 text=before.decode('utf-8')
 for op in operations:
  if op[0]=='prepend':text=op[1]+text
  elif op[0]=='append':text+=op[1]
  elif op[0]=='json-update':
   value=json.loads(text);value.update(op[1]);text=json.dumps(value,indent=2)+'\n'
  else:
   old,new=op[:2];assert old in text,(name,old[:100])
   if len(op)==2:assert text.count(old)==1,(name,'ambiguous edit')
   text=text.replace(old,new)
 data=text.encode('utf-8')
 assert sha(data)==spec['result'][name],('Unexpected integration output',name,sha(data))
 prepared.append((p,data))
# No write occurs until every baseline, exact context and complete output passes.
for p,data in prepared:p.write_bytes(data)
receipt={'version':'0.9.0','source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'before':spec['baseline'],'after':spec['result'],'method':'One-time explicit source edits with whole-file preconditions. Native tests run on the committed result without rerunning integration.'}
(ROOT/'leonardos-guild/LIVING-STORIES-INTEGRATION.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Integrated',len(prepared),'source files. Commit ordinary runtime before native acceptance.')
