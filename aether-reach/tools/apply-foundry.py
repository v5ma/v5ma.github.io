"""Temporary exact source integration; validate all targets before any write."""
import hashlib,json
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
new={
'aether-reach/foundry-kit.mjs':'65b2bd3d702ede2c2212e08fab89ac2c274649724b7034f1c50328f45b2c5aaf',
'aether-reach/foundry-art.mjs':'b9efadcaa10b1304dd358d544ec1015db965cfbacd381d1edf41018f64ee0dd7',
'aether-reach/tests/foundry.test.mjs':'5f11cb784d94638647b6d3661477c474b1c9c7db16b4eaba036cdedf7738d5d9',
'aether-reach/tests/foundry-browser.py':'3bdab0ba63cead7435c6cd64d9e7daa3b51824bcdd11251c9c16e95e7835246b',
'aether-reach/tools/foundry-plan-tasks.json':'7d17b8d217c59047c2a1e222ee0af34addd1c3773fa351d6691586513878a911',
'aether-reach/tools/update-foundry-plan.py':'1948de570a68e36c9124f5861967e0d99b4b60c119a32d9672e6d218541895af'}
for name,expected in new.items():assert sha((ROOT/name).read_bytes())==expected,'New source mismatch '+name
planned=[]
for v in json.loads((ROOT/'aether-reach/tools/foundry-patch.json').read_text()):
 name=v['path'];path=PurePosixPath(name)
 assert name.startswith('aether-reach/') and '..' not in path.parts and not path.is_absolute()
 p=ROOT/name;assert not p.is_symlink()
 old=p.read_bytes()
 if sha(old)==v['after']:continue
 assert sha(old)==v['before'],'Baseline mismatch '+name
 text=old.decode('utf-8');last=len(text)
 for start,end,value in reversed(v['edits']):
  assert 0<=start<=end<=last
  last=start
  # Correct only the identified whitespace transcription in the transport;
  # the unchanged expected target digest still requires the exact tested source.
  if name=='aether-reach/combat-ui.mjs' and start==5440:value=")+\u0027x"
  text=text[:start]+value+text[end:]
 data=text.encode('utf-8')
 assert sha(data)==v['after'],'Target mismatch '+name+' '+sha(data)
 planned.append((p,data));new[name]=v['after']
for p,data in planned:p.write_bytes(data)
out=ROOT/'aether-reach/test-output';out.mkdir(exist_ok=True)
(out/'foundry-integration.json').write_text(json.dumps(new,indent=2))
print('Verified new source and integrated',len(planned),'existing files.')
