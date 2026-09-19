"""Apply the reviewed test-driver correction before CI. No runtime edits."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
p=R/'tests/xr-repair-browser.py';s=p.read_text()
if "await driver.driveTo(x,z)" not in s:
 start=s.index(' def go(x,z):');end=s.index(' def scope(label):',start)
 s=s[:start]+''' def go(x,z):
  aim();p.evaluate("questDevice.sources[0].gamepad.axes=[0,0,0,0]");frames(4)
  p.evaluate("async({x,z})=>{const driver=await import('./tests/xr-repair-steering.mjs');await driver.driveTo(x,z);}",{'x':x,'z':z});frames(3)
 def defend():
  p.evaluate("async()=>{const driver=await import('./tests/xr-repair-steering.mjs');await driver.clearPursuer();}");frames(4)
'''+s[end:]
 s=s.replace("Read-only steering with braking and synthetic defensive controller aiming use actual finite ammunition and damage", "Read-only frame-paced steering with braking and synthetic defensive controller aiming at the actual type-specific torso use finite ammunition and damage")
 s=s.replace("'layer':LAYER,'errors':errors", "'layer':LAYER,'defenseInputs':p.evaluate('questDevice.repairDefense||[]'),'errors':errors")
 p.write_text(s)
