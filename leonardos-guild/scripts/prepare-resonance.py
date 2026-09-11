#!/usr/bin/env python3
"""One-time v0.7 -> Resonance integration, never part of native acceptance.

The JSON files contain ordinary source edit triples: character offset, old text,
new text. Whole-file SHA256 preconditions and output hashes are mandatory. This
recipe refuses later versions. Maintain the resulting committed runtime files.
"""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
patches=[]
for name in ['app','gamepad','other']:
 patches.extend(json.loads((root/'leonardos-guild/scripts'/('resonance-patch-'+name+'.json')).read_text()))
staged=[];seen=set()
for entry in patches:
 path=entry['path'];assert path.startswith('leonardos-guild/') and '..' not in Path(path).parts
 assert path not in seen;seen.add(path)
 p=root/path;original=p.read_bytes();assert sha(original)==entry['before'],('Baseline changed; refusing to overwrite',path,sha(original))
 text=original.decode('utf-8');last=len(text)+1
 for offset,old,new in reversed(entry['edits']):
  assert 0<=offset<last and text[offset:offset+len(old)]==old,('Unexpected edit context',path,offset)
  text=text[:offset]+new+text[offset+len(old):];last=offset
 output=text.encode('utf-8');assert sha(output)==entry['after'],('Output mismatch',path,sha(output))
 staged.append((p,output))
# No write occurs until every baseline, context and complete output is verified.
for p,output in staged:p.write_bytes(output)
receipt={'preparationSource':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'changedFiles':[{k:e[k] for k in ['path','before','after']} for e in patches],'method':'One-time whole-file-hash-checked source integration. Native acceptance must check the subsequently committed ordinary files without rewriting them.'}
(root/'leonardos-guild/RESONANCE-PREPARATION.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Prepared',len(staged),'verified source files. Commit them before native acceptance.')
