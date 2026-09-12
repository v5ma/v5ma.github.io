from pathlib import Path
D=Path(__file__).resolve().parents[1]/'dino-atlas'
def edit(name,old,new):
 p=D/name;s=p.read_text()
 if new in s:return
 assert old in s,(name,old[:120]);p.write_text(s.replace(old,new))
# Create roof collision bodies before initial physics settling of a saved player.
edit('ranger.js', "import {RanchGame,calibrateResident,scaleNote} from './ranch-game.js';", "import {RanchGame,calibrateResident,scaleNote} from './ranch-game.js';\nimport {buildRanchWorld} from './ranch-world.js';")
edit('ranger.js', 'frontier=buildFrontier(scene,physics,state),tools=new RangerTools(state);', 'frontier=buildFrontier(scene,physics,state),ranchWorld=buildRanchWorld(scene,physics),tools=new RangerTools(state);')
edit('ranger.js', 'ranch=new RanchGame({scene,physics,R,fleet,animals,state,storage,audio,input,frontier,', 'ranch=new RanchGame({scene,physics,R,fleet,animals,state,storage,audio,input,frontier,ranchWorld,')
edit('ranch-game.js', 'this.world=buildRanchWorld(ctx.scene,ctx.physics);', 'this.world=ctx.ranchWorld||buildRanchWorld(ctx.scene,ctx.physics);')
edit('tests/ranch-browser.py', "check(page.evaluate('__dinoRanger.state.position.y')<3,'Interior foot position survives reload')", """check(page.evaluate('__dinoRanger.state.position.y')<3,'Interior foot position survives reload')
   press(0);wait('__dinoRanger.state.started');page.evaluate('__dinoRanger.fleet.person.setActive(true,{x:-42,y:25.1,z:-362})')
   page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoRanger.state.position.y')>24,'Saved rooftop position survives boot and its initial physics settling pass')""")
p=D/'tests/ranch.test.mjs';s=p.read_text()
if "every building has a real walkable archive corridor" not in s:
 s+='''
test('every building has a real walkable archive corridor and blocks a jeep at its doorway',async()=>{
 const T=await import('../vendor/three.module.js'),{buildRanchWorld}=await import('../ranch-world.js');
 const previous=globalThis.document;
 // Canvas labels are not rendered in a physics test. Geometry and colliders are real.
 globalThis.document={createElement:()=>({width:1024,height:100,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 const p=new ParkPhysics(),f=new Fleet(p,emptyFrontier());buildRanchWorld(new T.Scene(),p);
 for(const b of BUILDINGS){
  f.active='foot';f.person.setActive(true,{x:b.x-12,y:1.1,z:b.z-9});
  for(const [v,goal] of [[{z:1},q=>q.z<b.z-b.hz+3.5],[{x:1},q=>q.x>b.x+12.7],[{z:-1},q=>q.z>b.z-10.5]]){
   let pass=false;for(let i=0;i<1500;i++){f.drive(v,1/60,0,0);p.world.step();f.afterStep(1/60);if(goal(f.position)){pass=true;break;}}
   assert.ok(pass,b.id+' accessible archive corridor');
  }
  f.person.setActive(true,{x:b.x-12,y:b.h+1.1,z:b.z-9});tick(p,f,120);assert.ok(f.position.y>b.h,b.id+' roof saved position remains supported');
  f.person.setActive(false);f.active='jeep';f.current.drive.reset({x:b.x,y:1,z:b.z+b.hz+12},Math.PI);tick(p,f,300,{throttle:1});assert.ok(f.position.z>b.z+b.hz-2,b.id+' narrow doorway excludes a jeep');
 }
 p.world.free();globalThis.document=previous;
});
'''
 p.write_text(s)
print('Rooftop save support and physical building traversal guarded.')
# Raise the mounted shoulder view above the rear seats and show the tool over the hood.
edit('ranger.js', "const p=fleet.position,dir={x:-Math.sin(yaw)*Math.cos(aimPitch),y:-Math.sin(aimPitch),z:-Math.cos(yaw)*Math.cos(aimPitch)},origin={x:p.x+dir.x*.6,y:p.y+(fleet.mode==='foot'?.35:1.15),z:p.z+dir.z*.6};", "const p=fleet.position,dir={x:-Math.sin(yaw)*Math.cos(aimPitch),y:-Math.sin(aimPitch),z:-Math.cos(yaw)*Math.cos(aimPitch)},reach=fleet.mode==='foot'?1.2:3.5,side=fleet.mode==='foot'?.35:.85,origin={x:p.x+dir.x*reach+Math.cos(yaw)*side,y:p.y+(fleet.mode==='foot'?.35:1.65)+dir.y*reach,z:p.z+dir.z*reach-Math.sin(yaw)*side};")
edit('ranger.js', "toolModel.position.set(p.x,p.y+(fleet.mode==='foot'?.38:1.2),p.z);toolModel.rotation.set(aimPitch,yaw+Math.PI,0,'YXZ');", "const reach=fleet.mode==='foot'?.4:2,side=fleet.mode==='foot'?.35:.85;toolModel.scale.setScalar(fleet.mode==='foot'?1:2);toolModel.position.set(p.x-Math.sin(yaw)*Math.cos(aimPitch)*reach+Math.cos(yaw)*side,p.y+(fleet.mode==='foot'?.35:1.65)-Math.sin(aimPitch)*reach,p.z-Math.cos(yaw)*Math.cos(aimPitch)*reach-Math.sin(yaw)*side);toolModel.rotation.set(aimPitch,yaw+Math.PI,0,'YXZ');")
edit('ranger.js', "const shoulder=new T.Vector3(p.x+Math.sin(yaw)*5.4+Math.cos(yaw)*.75,p.y+1.45,p.z+Math.cos(yaw)*5.4-Math.sin(yaw)*.75);", "const back=fleet.mode==='foot'?5.4:8,side=fleet.mode==='foot'?.75:2.2,height=fleet.mode==='foot'?1.45:3.8;const shoulder=new T.Vector3(p.x+Math.sin(yaw)*back+Math.cos(yaw)*side,p.y+height,p.z+Math.cos(yaw)*back-Math.sin(yaw)*side);")
edit('tests/ranch-browser.py', "__dinoRanger.teleport(-48,203)", "__dinoRanger.teleport(-44,203)")
edit('ranger.js', "const target=new T.Vector3(p.x,p.y+(fleet.mode==='foot'?.35:1.15),p.z).addScaledVector(dir,35);", "const toolReach=fleet.mode==='foot'?1.2:3.5,toolSide=fleet.mode==='foot'?.35:.85;const target=new T.Vector3(p.x+Math.cos(yaw)*toolSide,p.y+(fleet.mode==='foot'?.35:1.65),p.z-Math.sin(yaw)*toolSide).addScaledVector(dir,35+toolReach);")
print('Mounted aiming camera and tool muzzle remain visible in front of the vehicle.')
