"""Exact feature-branch integration and reviewed source bytes, never a fuzzy patch."""
from pathlib import Path
import hashlib,json
root=Path('vesperfall')
sha=lambda b:hashlib.sha256(b).hexdigest()
edits={
 'app.js':('abe6d22c80089c9f36ec4d175672e4bcceb1ffc0550cf3ba943f4a215e704be7',[('this.wayfinder=Wayfinder.install(this);','this.wayfinder=Wayfinder.install(this);this.threshold=VesperThreshold.install(this);')]),
 'index.html':('4032ad9a319650d57a3e73533e4a81a1238ec2048c5f503bb060adc5844bb773',[('<script src="./app.js?v=0.17.0-wayfinder"></script>','<script src="./threshold-model.js?v=0.17.0-threshold"></script><script src="./threshold.js?v=0.17.0-threshold"></script><script src="./app.js?v=0.17.0-threshold"></script>'),('./dominion-controls.js?v=0.17.0-fieldwork','./dominion-controls.js?v=0.17.0-threshold')]),
 'dominion-controls.js':('d76606711542d128e672f3c1b8ee692b038aeebd4213bc2175e96694e023fb0b',[("if(state.xrScreen==='settings')return pageRows([...settings","if(state.xrScreen==='settings')return pageRows([['Spatial desk / walking doorway',()=>g.threshold?.screen('spatial')],...settings")])
}
for name,(digest,pairs) in edits.items():
 p=root/name;s=p.read_text()
 if all(new in s for old,new in pairs):continue
 assert sha(p.read_bytes())==digest,name
 for old,new in pairs:
  assert s.count(old)==1,(name,old)
  s=s.replace(old,new)
 p.write_text(s)
p=root/'DEVELOPMENT-HANDOFF.md';s=p.read_text()
if not s.startswith('Threshold spatial interface'):
 assert sha(p.read_bytes())=='951235522d6ffc10bfad610328fb3cde8ec7a2c7d7b8d59f0d9495253356df38'
 p.write_text('Threshold spatial interface / September 21, 2026.\n\nRead THRESHOLD.md before altering scene menus or walking transitions. The existing XR panel is now a bounded adjustable world-anchored floor desk. Settings / Spatial desk opens a saved, paused round trip through a local Vesperfall travel foyer, with controller or room-scale crossing, a seated return, hand-pinch menus and actual XR exit. This is not integration with the private SaaS launcher, and contains no external destination or private hub asset. Desktop UI remains available. Preserve the Goldwind and Wayfinder behavior, all five layout readers, current game object and save contracts. Exact native/public acceptance is recorded separately; do not credit physical-device approval or a larger chapter from this interface pass. Existing V41/V42/V65/V68 obligations and the canonical workbook remain.\n\n'+s)
p=root/'release.json';d=json.loads(p.read_text());d['threshold']={'name':'Threshold','date':'2026-09-21','scope':'World-anchored adjustable XR desk and a checkpoint-protected walking round trip to a local Vesperfall foyer. No private hub integration, cross-site travel, sphere portals, altered saved geometry or desktop UI replacement. See THRESHOLD.md and its separate publication receipt.'};p.write_text(json.dumps(d,indent=2)+'\n')
for r in json.loads(Path('.github/threshold-review.json').read_text()):
 p=Path(r['path']);assert str(p) in ['vesperfall/threshold.js','vesperfall/tests/threshold-browser.py']
 b=p.read_bytes()
 if sha(b)==r['new']:continue
 assert sha(b)==r['old'],str(p)
 s=b.decode()
 for pos,n,text in reversed(r['edits']):s=s[:pos]+text+s[pos+n:]
 assert sha(s.encode())==r['new'],str(p)
 p.write_text(s)
p=root/'THRESHOLD.md';s=p.read_text();note='\nSecond pass: height and size edits retain the existing horizontal desk pose even when looking aside; explicit move/recenter actions relocate it. The inspection table keeps its own unscaled panel. AR foyer flooring is translucent, stick travel stays within its circular stage, and handedness updates the doorway hints. A fresh optical-hand pinch opens the travel menu without becoming hand-only combat. Exiting after room-scale travel reconciles the desktop camera to the unchanged actor. Additional tests retain stereo bounds, the actual panel texture, optical-hand travel cancellation and a continuous simulated viewer crossing. These remain software tests, not hardware approval.\n'
if note not in s:p.write_text(s+note)
compile((root/'tests/threshold-browser.py').read_text(),'threshold-browser.py','exec')
print('Threshold source integrated and exact second-pass hashes verified.')
