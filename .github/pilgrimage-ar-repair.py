"""Restore the suspended view before paused checkpoint capture; no save exemptions."""
from pathlib import Path
import hashlib
p=Path('vesperfall/dominion-ar.js');s=p.read_text()
a='g.rig.position.copy(old.rig);g.rig.rotation.copy(old.rotation);if(g.jewelglass)'
b="g.rig.position.copy(old.rig);g.rig.rotation.copy(old.rotation);g.head.components['look-controls'].yawObject.rotation.y=old.yaw;g.head.components['look-controls'].pitchObject.rotation.x=old.pitch;g.scene.object3D.updateMatrixWorld(true);if(g.jewelglass)"
if a in s:
 assert s.count(a)==1;p.write_text(s.replace(a,b))
else:assert b in s
p=Path('vesperfall/tests/pilgrimage-browser.py');s=p.read_text()
a="  check(saved['checkpoint']==restored['checkpoint'] and saved['profile']==restored['profile'],'AR hand inspection preserves the complete checkpoint and profile')"
b="  (OUT/'ar-save-observations.json').write_text(json.dumps({'before':saved,'after':restored},indent=2))\n  check(saved['checkpoint']==restored['checkpoint'] and saved['profile']==restored['profile'],'AR hand inspection preserves the complete checkpoint, view direction and profile')"
if a in s:
 assert s.count(a)==1;s=s.replace(a,b);compile(s,str(p),'exec');p.write_text(s)
else:assert b in s
print('Restored suspended look-controller angles and matrices before the real paused save. Full checkpoint equality remains required.')
