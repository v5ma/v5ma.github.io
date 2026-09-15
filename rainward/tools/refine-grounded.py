"""Temporary scoped correction of observed candidate issues. Remove before merge.
The first downhill browser run is retained, not relabeled as accepted evidence.
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def edit(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert old in s,(name,'unexpected source; inspect before patching')
 p.write_text(s.replace(old,new))
def append(name,marker,text):
 p=R/name;s=p.read_text()
 if marker not in s:p.write_text(s+text)
edit('character-proportions.mjs','[1.52,1],[2,1]','[1.52,1],[1.60,1.06],[1.80,1.08],[2,1.08]')
edit('character-proportions.mjs','const depths=','const neckOffset=[[0,0],[1.48,0],[1.59,-.04],[1.66,-.02],[1.80,0],[2,0]];\nconst depths=')
edit('character-proportions.mjs','y+curve(y,kneeOffset),','y+curve(y,kneeOffset)+curve(y,neckOffset),')
append('character-proportions.mjs','export function fitHumanParts','''
export function fitHumanParts(parts){
 // glTF material primitives can share BufferAttributes. Clone ALL geometry first
 // so the common rest-space calibration is applied once, never once per material.
 const original=new Set(parts.map(part=>part.geometry));
 for(const part of parts)part.geometry=part.geometry.clone();
 for(const part of parts)fitProportions(part.geometry);
 original.forEach(geometry=>geometry.dispose());
}
''')
edit('rainworn-humans.mjs','import {fitProportions}', 'import {fitHumanParts}')
edit('rainworn-humans.mjs','for(const part of parts)fitProportions(part.geometry);','fitHumanParts(parts);')
edit('grounded-motion.mjs','  a.bones[0].position.y=.94-', '''  const radius=stride*stanceFraction/2,center=heightAt(p.x,p.z);
  const ahead=heightAt(p.x+m.direction.x*radius,p.z+m.direction.z*radius),behind=heightAt(p.x-m.direction.x*radius,p.z-m.direction.z*radius);
  const terrainDrop=Number.isFinite(ahead)&&Number.isFinite(behind)?clamp(center-Math.min(ahead,behind),0,.18):0;
  a.bones[0].position.y=.94-terrainDrop-''')
edit('tests/grounded-motion.test.mjs','{fitProportions,proportionPoint}', '{fitProportions,proportionPoint,fitHumanParts}')
edit('tests/grounded-motion.test.mjs',"assert.deepEqual(proportionPoint(0,1.798,0),[0,1.798,0]);", "assert.deepEqual(proportionPoint(0,1.8,0),[0,1.8,0]);assert.ok(proportionPoint(0,1.59,0)[1]<1.56);assert.ok(proportionPoint(.08,1.70,0)[0]>.08);")
edit('tests/grounded-motion.test.mjs','for(const slope of [-.3,.3])','for(const slope of [-.57,-.3,.3,.57])')
edit('tests/grounded-motion.test.mjs','if(f.locked&&f.age>.11){measured++','if(i>30&&f.locked&&f.age>.11){measured++')
append('tests/grounded-motion.test.mjs','Shared glTF material attributes','''
test('Shared glTF material attributes receive the body fit once, with independent cloned buffers',()=>{
 const positions=new T.Float32BufferAttribute([.08,1.6,0,.2,1.35,0,.1,.49,0],3),normals=new T.Float32BufferAttribute([1,0,0,1,0,0,1,0,0],3);
 const parts=Array.from({length:4},()=>({geometry:new T.BufferGeometry().setAttribute('position',positions).setAttribute('normal',normals)}));
 const before=Array.from(positions.array);fitHumanParts(parts);assert.deepEqual(Array.from(positions.array),before);
 for(const part of parts){const p=part.geometry.attributes.position;assert.notEqual(p,positions);assert.ok(Math.abs(p.getX(0)-proportionPoint(before[0],before[1],before[2])[0])<1e-6);}
 assert.notEqual(parts[0].geometry.attributes.position,parts[1].geometry.attributes.position);
});
''')
p=R/'tests/rainworn-connections.test.mjs';s=p.read_text()
if 'import {proportionPoint}' not in s:p.write_text("import {proportionPoint} from '../character-proportions.mjs';\n"+s)
edit('tests/rainworn-connections.test.mjs','Math.min(...neck)<=1.475&&Math.max(...neck)>=1.585','Math.min(...neck)<=proportionPoint(0,1.475,0)[1]&&Math.max(...neck)>=proportionPoint(0,1.585,0)[1]')
edit('tests/grounded-harness.html','function draw(){const root=current.root.position;camera.position.set','function draw(){const root=current.root.position,wet=p.waterMode===\'swim\';camera.position.set')
edit('tests/grounded-harness.html','ground(root.x,root.z)+1.12','ground(root.x,root.z)+(wet?.15:1.12)')
edit('tests/grounded-harness.html','ground(root.x,root.z)+.9','ground(root.x,root.z)+(wet?-.35:.9)')
edit('tests/grounded-harness.html','floor.rotation.x=-Math.PI/2-Math.atan(slope);','floor.position.y=wet?-2:-.01;grid.position.y=wet?-2:0;floor.rotation.x=-Math.PI/2-Math.atan(slope);')
edit('tests/grounded-harness.html',"current=hero;slope=grade;mode='walk';", "current=hero;hero.root.visible=true;for(const a of enemies.values())a.root.visible=false;slope=grade;mode='walk';")
edit('tests/grounded-harness.html','window.MotionFixture.scenario();','''window.MotionFixture.scenario();
// Exact-time image sequences, sampled in this fixture, not a frame-rate claim.
window.MotionFixture.sequenceFrame=({kind='walk',time=0}={})=>{
 current=hero;side=true;slope=0;mode=kind;const speed=kind==='swim'?2:kind==='tread'?0:2;
 step({x:0,z:-speed*time,yaw:0,hp:100,stance:'stand',speed,aim:false,waterMode:kind==='swim'||kind==='tread'?'swim':'dry',swimDepth:kind==='swim'||kind==='tread'?.64:0,submerged:false},time);return window.MotionFixture.metrics();
};''')
edit('tests/grounded.py','import json, os, subprocess, shutil','import json, os, subprocess, shutil\nfrom PIL import Image')
edit('tests/grounded.py','   measures=[','''   for kind in ['walk','swim','tread']:
    frames=[];page.evaluate('(kind)=>MotionFixture.scenario({kind,view:"side",time:0})',kind)
    for index in range(25):
     page.evaluate('(x)=>MotionFixture.sequenceFrame(x)',{'kind':kind,'time':index/12})
     path=OUT/f'{variant}-{kind}-frame-{index:02}.png';page.screenshot(path=str(path));frames.append(Image.open(path).convert('RGB'))
    frames[0].save(OUT/f'{variant}-{kind}.gif',save_all=True,append_images=frames[1:],duration=83,loop=0)
   measures=[''')
edit('GROUNDED.md','and terrain-aligned feet.', 'and terrain-aligned feet. Bounded visual pelvis lowering maintains reachable contacts on downhill grades.')
edit('GROUNDED.md','Overall standing height and head dimensions remain.', 'An overly long visible neck is shortened while modestly enlarging the head in the same rest-space map; the crown landmark remains at 1.80 game meters.')
edit('GROUNDED.md','Normals are transformed consistently,','Shared glTF material buffers are cloned before fitting to prevent repeated distortion. Normals are transformed consistently,')
