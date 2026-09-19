"""Presentation and harness review after successful full VR/AR progression.
No gameplay geometry, objectives, input permissions or reward rules change.
"""
from pathlib import Path
import hashlib

def patch(name,sha,edits):
 p=Path('vesperfall')/name;s=p.read_text()
 if all(new in s for old,new in edits):return
 b=p.read_bytes();assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==sha,name
 for old,new in edits:
  assert s.count(old)==1,(name,old)
  s=s.replace(old,new)
 p.write_text(s)

patch('wayfinder.js','b1374d6892a8966518ef951b0fdaa0ae5f21deb3',[
 ('// Attach guidance below the visible palm panel, never to the tracked camera.','// Put guidance above/beyond the visible palm, still hand-anchored, not a fixed camera HUD.'),
 ('new T.Vector3(0,-.19,0).applyQuaternion(base.quaternion)',"new T.Vector3(other==='right'?-.12:.12,.24,-.32).applyQuaternion(base.quaternion)")])
patch('wayfinder-model.js','c0dcb616d7aacfdc40a28482c87b2be8ff3a3032',[("if(c.kind==='exit'&&!s.portalReady)return s.targets.size","if(s.pilgrimage&&c.kind==='exit'&&!s.portalReady)return s.targets.size")])
p=Path('vesperfall/tests/wayfinder.test.cjs');s=p.read_text()
extra="""
test('Older Endless exit keeps its warden requirement, not a relay requirement',()=>{
 const s=C.create('BELL-01',1);
 const c={kind:'exit',label:'Defeat the remaining wardens to open this exit'};
 a.equal(W.status(s,c),c.label);
});
"""
if extra not in s:p.write_text(s+extra)
p=Path('vesperfall/WAYFINDER.md');s=p.read_text().replace('Four targeted model tests','Five targeted model tests').replace('locked exits and next-stage rewards;','locked exits, next-stage rewards and the original Endless warden requirement;')
extra='\nVisual review of the initial passing VR/AR journey caught the added wrist card clipping at the default controller pose. The card now sits above and beyond the visible palm, still following the hand. Final acceptance projects all four corners through both eye cameras and exports the actual objective texture in addition to the reduced-resolution full-scene screenshots. Screenshot and geometry checks do not certify physical-headset readability.\n'
if extra not in s:s+=extra
p.write_text(s)
old="  page.screenshot(path=str(OUT/'wrist-objectives.png'));page.evaluate(\"TestXR.orientation('right',[0,0,0,1])\")"
new='''  bounds=page.evaluate("""()=>{const g=Vesperfall.component,T=g.T,m=g.wayfinder.wrist.mesh;m.updateMatrixWorld(true);const w=m.geometry.parameters.width/2,h=m.geometry.parameters.height/2;return g.scene.renderer.xr.getCamera().cameras.map(c=>[[-w,-h],[w,-h],[-w,h],[w,h]].map(([x,y])=>m.localToWorld(new T.Vector3(x,y,0)).project(c).toArray()));}""")
  (OUT/'wrist-eye-bounds.json').write_text(json.dumps(bounds,indent=2))
  check(len(bounds)==2 and all(abs(p[0])<.97 and abs(p[1])<.97 and -1<p[2]<1 for eye in bounds for p in eye),'The whole objective card fits both eyes at the unchanged default hand pose')
  texture=page.evaluate('Vesperfall.component.wayfinder.wrist.canvas.toDataURL()')
  (OUT/'objective-texture.png').write_bytes(base64.b64decode(texture.split(',')[1]))
  page.screenshot(path=str(OUT/'wrist-objectives.png'));page.evaluate("TestXR.orientation('right',[0,0,0,1])")
  if os.getenv('WAYFINDER_VIEW_ONLY')=='1':
   check(not errors and not console,'No runtime or console errors in view review')
   (OUT/'view-review.json').write_text(json.dumps({'base':BASE,'mode':MODE,'passed':len(checks),'checks':checks,'scope':'View-only review, not a complete chapter journey. Production texture and eye geometry at unchanged simulated hand poses. Not physical hardware.'},indent=2))
   raise SystemExit(0)'''
exit_old="  page.screenshot(path=str(OUT/'ready-exit.png'));grip('right');wait('Vesperfall.state.phase===\"reward\"')"
exit_new="  texture=page.evaluate('Vesperfall.component.wayfinder.panel.canvas.toDataURL()')\n  (OUT/'exit-texture.png').write_bytes(base64.b64decode(texture.split(',')[1]))\n"+exit_old
patch('tests/wayfinder-browser.py','0478159b328fb56157fc2d24845492023a7a5ae2',[
 ('import os,json','import os,json,base64'),(old,new),(exit_old,exit_new),
 ("return await new Promise((resolve,reject)=>{\n   TestXR.state.inputFrame", "return await new Promise((resolve,reject)=>{\n   const watchdog=setTimeout(()=>{TestXR.axes('left',0,0);TestXR.state.inputFrame=null;reject(Error('XR frame watchdog expired'));},155000);\n   TestXR.state.inputFrame"),
 ("TestXR.state.inputFrame=null;d<.20?resolve","TestXR.state.inputFrame=null;clearTimeout(watchdog);d<.20?resolve")])
compile(Path('vesperfall/tests/wayfinder-browser.py').read_text(),'wayfinder-browser.py','exec')
print('Clipped card repositioned; final full test retains all action outcomes and adds stereo bounds.')
