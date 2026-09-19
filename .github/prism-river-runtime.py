# Temporary exact-source runtime fixes. Removed before release.
from pathlib import Path
import hashlib,json
PATCHES={
'prism-current/river/app.js':{'before':'980727b8e0f8d26789803fed4d9f85410d7a0570145f588c87ba9622c4da0ea0','after':'496afaa20accb471b9ade1c736892a6ef343f207d4b04e0f8fab3f5495e4e084','replace':[
('this.keys=new Set();','this.keys=new Set();this.captures=new Map();'),
('clearInputs(){this.keys.clear();','clearInputs(){for(const [el,id]of this.captures||[])try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch{}this.captures?.clear();this.keys.clear();'),
('e.setPointerCapture(v.pointerId);this[field]=true;','this.captures.set(e,v.pointerId);e.setPointerCapture(v.pointerId);this[field]=true;'),
('e.addEventListener(kind,()=>this[field]=false);','e.addEventListener(kind,()=>{this[field]=false;this.captures.delete(e);});'),
('this.playerX=this.crouch=0;this.sync();','this.playerX=this.crouch=0;this.activeHand=0;this.sync();'),
('wrap.focus();wrap.setPointerCapture(e.pointerId);','wrap.focus();this.captures.set(wrap,e.pointerId);wrap.setPointerCapture(e.pointerId);'),
('this.mouse=null;this.mouseFire=false;});','this.mouse=null;this.mouseFire=false;this.captures.delete(wrap);});'),
('entities:this.state?.entities.map(','entities:this.state?.entities.filter(n=>!n.dead).map(')]},
'prism-current/river/art.js':{'before':'07336f8c2e3496a7ef5251f248e52db5dcb74b9de018e6d0949004590fe19f91','after':'5080ce724380ae94735da543ee57186be0c301ccd039bff9116dd79c0e6ce5c2','replace':[('for(const n of s?.entities||[]){ids.add(n.id);','for(const n of s?.entities||[]){if(n.dead)continue;ids.add(n.id);')]},
'prism-current/river/xr.js':{'before':'268141496d99e982f2e3b83e0f35fc6c4eb9ccd92fcb9d19e1e50f68aa4bc308','after':'8be5d6f94bdd67fdce58bb5f8758e7e87e4411e387a46f5f604e56a8e637adc0','replace':[
('const ap=aim?aimPose(aim):aimPose(pose),localO=stage.worldToLocal(ap.origin.clone()),localEnd=stage.worldToLocal(ap.origin.clone().add(ap.direction)),normal=localEnd.sub(localO).normalize();','const ap=aim?aimPose(aim):aimPose(pose),normal=b.clone().sub(a).normalize();'),
('origin:localO.toArray(),direction:normal.toArray()','origin:b.toArray(),direction:normal.toArray()')]},
'prism-current/tests/river-browser.py':{'before':'12b4a1fa86620c0069d3901b16acc0cdec39553876be5d13bc5557fccae99676','after':'a51ab6d03ce39bd86f60a7d450e48822bb6de99d4b9bd7104f3a10cfb66f22ad','replace':[
("p.locator('#resume').click();p.wait_for_function(\"River.snapshot().phase==='playing'\");p.mouse.up();p.mouse.move(640,500);p.mouse.down()","check(not p.locator('#scene-wrap').evaluate('(e)=>e.hasPointerCapture(1)'),'Pause releases the held canvas pointer before modal interaction')\n    p.mouse.up();p.locator('#resume').click();p.wait_for_function(\"River.snapshot().phase==='playing'\");p.mouse.move(640,500);p.mouse.down()")]} }
changed=json.loads(Path('/tmp/river-patched-paths.json').read_text())
for name,p in PATCHES.items():
 f=Path(name);s=f.read_text();h=hashlib.sha256(s.encode()).hexdigest()
 if h==p['after']:continue
 assert h==p['before'],'Stale runtime: '+name
 for old,new in p['replace']:
  assert old in s,(name,old)
  s=s.replace(old,new)
 assert hashlib.sha256(s.encode()).hexdigest()==p['after'],'Unexpected output: '+name
 f.write_text(s);changed.append(name)
Path('/tmp/river-patched-paths.json').write_text(json.dumps(changed))
print('Scoped files prepared:',len(changed))
