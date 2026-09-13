#!/usr/bin/env python3
"""One-time Cinder Hollow integration. Never run during native acceptance.
Every original and complete resulting file is validated before any write.
Subsequent fixes edit ordinary runtime files; do not rerun this recipe.
"""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1]
sha=lambda b:hashlib.sha256(b).hexdigest()
newfiles={'frontier-art.mjs':'47c3bd794d43e1c8bfe58299c7c8957c523cd65e2aa616b5a8e559a93db99345','frontier.css':'e6dbd66594ab0af3aad2dbcd0ce28af1385d8bc14a6e19a852e5ec632e3dfd72','tests/frontier.test.mjs':'75822cc1759fe34021e1fff26638dd3ff8a2b0bad138b844867fbf3dfb2733bd','tests/frontier-browser.py':'94d06bec438fad01db928ee2a2bf46a89ff8a4cf131bc4adeb2440e5e384e101'}
for name,digest in newfiles.items():assert sha((root/name).read_bytes())==digest,('New file mismatch',name)
entries=[]
for i in range(3):entries.extend(json.loads((root/'scripts'/f'hollow-patch-{i}.json').read_text()))
staged=[]
for entry in entries:
 name=entry['path'];assert '..' not in Path(name).parts and not Path(name).is_absolute()
 path=root/name;assert sha(path.read_bytes())==entry['before'],('Changed baseline',name)
 text=path.read_text()
 for old,new in entry['edits']:
  if old=='prepend':text=new+text
  elif old=='release':
   d=json.loads(text);d.update(title="Leo's Guild - Cinder Hollow",version='0.11.0',build='guild-cinder-hollow-20260912');d['resonance']['dispatchApps']=9
   d['frontier']={'regions':['safe town','Cinder Hollow badlands'],'farmlands':'planned; not implemented','monsterCount':7,'trailSegments':19,'contracts':3,'save':'additive frontier record; old namespace unchanged','combatMigration':'in-person peaceful restitution for old town rivals; Rocco evidence prerequisites retained','quietAudio':True}
   text=json.dumps(d,indent=2)+'\n'
  else:
   assert text.count(old)==1,('Missing or ambiguous edit',name,old[:100])
   text=text.replace(old,new)
 data=text.encode('utf-8');assert sha(data)==entry['after'],('Output mismatch',name,sha(data))
 staged.append((path,data))
for path,data in staged:path.write_bytes(data)
receipt={'version':'0.11.0','source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'method':'One-time exact-context/whole-file-hash checked source edits; tests read the subsequently committed ordinary modules.','files':[{k:e[k] for k in ['path','before','after']} for e in entries],'newFiles':newfiles}
(root/'HOLLOW-INTEGRATED.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Integrated',len(entries),'validated source files. Commit before native acceptance.')
