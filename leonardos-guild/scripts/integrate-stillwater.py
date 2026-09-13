#!/usr/bin/env python3
"""One-time exact-context source integration. Native acceptance runs on the
subsequently committed ordinary output without any source rewriting."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1]
entries=json.loads((root/'scripts/stillwater-edits.json').read_text());prepared=[]
sha=lambda b:hashlib.sha256(b).hexdigest()
for e in entries:
 assert '..' not in Path(e['path']).parts and not Path(e['path']).is_absolute()
 p=root/e['path'];assert sha(p.read_bytes())==e['before'],('Changed baseline',e['path'])
 text=p.read_text()
 for op in e['edits']:
  if op[0]=='prepend':text=op[1]+text
  elif op[0]=='release-update':
   d=json.loads(text);d.update(version='0.12.0',title="Leo's Guild - Stillwater Works",build='guild-stillwater-20260913');d['frontier']['contracts']=4;d['stillwater']={'mission':'The Drowned Workshop','controls':'Existing X interaction and controller menus','water':'dynamic level, actual ramp, shallow wading; not free swimming','rendering':'scene-colour refraction, procedural Fresnel environment and tile caustics','newSoundSources':0,'rewards':{'florins':80,'xp':180},'save':'additive frontier.cistern checkpoint'};text=json.dumps(d,indent=2)+'\n'
  elif op[0]=='replace-all':
   assert text.count(op[1])==2
   text=text.replace(op[1],op[2])
  else:
   assert text.count(op[0])==1,(e['path'],op[0][:60])
   text=text.replace(op[0],op[1])
 data=text.encode();assert sha(data)==e['after'],('Output mismatch',e['path']);prepared.append((p,data))
for p,data in prepared:p.write_bytes(data)
(root/'STILLWATER-INTEGRATED.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'files':[{k:e[k] for k in ['path','before','after']} for e in entries]},indent=2)+'\n')
print('Integrated',len(entries),'verified ordinary source files.')
