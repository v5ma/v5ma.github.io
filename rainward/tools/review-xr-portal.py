"""Repair same-frame chapter/portal initialization observed on external XR layer."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,old[:65],s.count(old));p.write_text(s.replace(old,new))
patch('quest-xr.mjs','panel.clearDocument();headPose=null;renderContext=next;', 'panel.clearDocument();if(!active)headPose=null;renderContext=next;')
patch('portal-view.mjs','function render(renderer,scene,camera,rig,environmentRoots){', '''function render(renderer,scene,camera,rig,environmentRoots){
  // A scene can be rebound within the current controller frame. Until a valid
  // pose establishes the aperture, clear safely instead of dereferencing a
  // missing anchor or exposing an unmasked full-size world.
  if(!enabled||!anchor){const color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();try{renderer.setClearColor(0x101c24,config.view==='diorama-ar'?0:1);renderer.clear?.();}finally{renderer.setClearColor(color,alpha);}return false;}
''')
p=R/'tests/xr-repair.test.mjs';s=p.read_text()
if 'A reset portal waits' not in s:s+='''\nimport {createWorldPortal} from '../portal-view.mjs';
test('A reset portal waits safely for its pose before any world mutation or draw',()=>{const portal=createWorldPortal(),scene=new T.Scene(),rig=new T.Group(),camera=new T.PerspectiveCamera();scene.add(rig);let cleared=0,alpha=.4,color=new T.Color(0x123456);const renderer={getClearColor:c=>c.copy(color),getClearAlpha:()=>alpha,setClearColor(c,a){color.set(c);alpha=a;},clear(){cleared++;},render(){throw Error('Uninitialized portal must not draw');}};assert.equal(portal.render(renderer,scene,camera,rig),false);assert.equal(cleared,1);assert.equal(rig.parent,scene);assert.equal(alpha,.4);assert.equal(color.getHex(),0x123456);portal.update(rig,{position:new T.Vector3(0,1.65,0),orientation:new T.Quaternion()},{x:0,z:0,swimDepth:0},0,0,.016,{view:'diorama-ar'});portal.reset();assert.equal(portal.render(renderer,scene,camera,rig),false);assert.equal(cleared,2);portal.dispose();});
'''
p.write_text(s)
