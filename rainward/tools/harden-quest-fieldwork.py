"""Scoped post-failure fixes for the inspected XR candidate. Remove before merge."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def replace(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'divergent source',s.count(old));p.write_text(s.replace(old,new))
# Three's setAnimationLoop restarts window RAF even with an active XR session.
# A scene replacement must preserve its registered callback and only accept XR frames.
replace('app.mjs','scene.renderer.setAnimationLoop(tick);last=0;', 'if(!scene.renderer.xr.isPresenting)scene.renderer.setAnimationLoop(tick);last=0;')
replace('scene.mjs','renderer.setAnimationLoop(null);','if(!keepRenderer)renderer.setAnimationLoop(null);')
replace('app.mjs','function tick(now,xrFrame){if(!scene)return;', 'function tick(now,xrFrame){if(!scene||quest?.isActive()&&!xrFrame)return;')
replace('quest-xr.mjs',"rig.name='Rainward XR locomotion rig';rig.add(camera);", "rig.name='Rainward XR locomotion rig';rig.visible=false;rig.add(camera);")
replace('quest-xr.mjs',"session=null;active=false;safe=false;", "session=null;active=false;rig.visible=false;safe=false;")
replace('quest-xr.mjs',"active=true;calibration=null;", "active=true;rig.visible=true;calibration=null;")
replace('index.html','</head>','<link rel="stylesheet" href="quest-xr.css">\n</head>')
# Use both eyes' union frustum, never the third-person desktop camera frustum.
replace('scene.mjs','staticCulling.restore();scans.restoreInstances();renderer.render(scene,xr.camera);','renderer.xr.updateCamera(xr.camera);const stereoCamera=renderer.xr.getCamera();scans.cull(stereoCamera,false);staticCulling.update(stereoCamera,false);renderer.render(scene,xr.camera);')
replace('scanned-assets.mjs','function cull(camera){','function cull(camera,shadowsEnabled=true){')
replace('scanned-assets.mjs','compactVisibleInstances(m,instanceMatrices.get(m),frustum);','compactVisibleInstances(m,instanceMatrices.get(m),frustum,shadowsEnabled);')
# World safety fade must leave the recenter/exit interface visible.
replace('quest-xr.mjs','veil.renderOrder=20000;','veil.renderOrder=9900;')
replace('quest-xr.mjs','{map:badgeTexture,toneMapped:false,depthTest:false,depthWrite:false}', '{map:badgeTexture,transparent:true,toneMapped:false,depthTest:false,depthWrite:false}')
replace('quest-xr.mjs',"0xefdcad,depthTest:false}","0xefdcad,transparent:true,depthTest:false}")
replace('xr-panel.mjs','map:texture,transparent:false,','map:texture,transparent:true,')
replace('quest-xr.mjs','missing=false;headPose=v.transform;const h=headPose.position;','const recovered=missing;missing=false;headPose=v.transform;const h=headPose.position;if(recovered){previousHead=null;reset();recenter();}')
