"""Native image and driver corrections. No game-state grants or altered enemies."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,old[:75],s.count(old));p.write_text(s.replace(old,new))
patch('xr-reading.mjs','width=58,linesPerPage=16','width=46,linesPerPage=13')
patch('xr-panel.mjs',"if(reading){c.fillStyle='#e5eeee';c.font='23px sans-serif';", "if(reading){c.fillStyle='#e5eeee';c.font=documentPages?'32px sans-serif':'23px sans-serif';")
patch('xr-panel.mjs','c.fillText(l,28,242+i*30)','c.fillText(l,28,242+i*(documentPages?42:30))')
patch('quest-xr.mjs','panel.mesh.visible=!playing||pinned;badge.visible=!playing||pinned;', 'panel.mesh.visible=!playing||pinned;badge.visible=!panel.document()&&(!playing||pinned);')
p=R/'tests/xr-repair-browser.py';s=p.read_text()
s=s.replace('yaw=Rainward.view.yaw,s=Math.max(.3,Math.min(1,len)),axes=questDevice.sources[0].gamepad.axes;axes[2]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/len*s;axes[3]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/len*s;', '''yaw=Rainward.view.yaw,axes=questDevice.sources[0].gamepad.axes;let vx=dx*4-(p.vx||0)*.25,vz=dz*4-(p.vz||0)*.25;const speed=Math.hypot(vx,vz);if(speed>9){vx*=9/speed;vz*=9/speed;}const raw=v=>Math.abs(v)<.001?0:Math.sign(v)*(.22+.78*Math.min(1,Math.abs(v)));axes[2]=raw((Math.cos(yaw)*vx-Math.sin(yaw)*vz)/9);axes[3]=raw((Math.sin(yaw)*vx+Math.cos(yaw)*vz)/9);''')
needle=' def scope(label):'
combat=''' def defend():
  # Read-only targeting drives the real controller pose and finite weapon.
  # Ignoring a pursuing guard killed the earlier unarmed test route.
  p.evaluate(\'''async()=>{const T=await import('./vendor/three.module.js'),W=await import('./world.mjs');await new Promise((resolve,reject)=>{const start=performance.now();const stop=()=>{clearInterval(timer);questDevice.button('right',0,false);questDevice.button('left',0,false);};const timer=setInterval(()=>{const s=Rainward.state,p=s.player,xr=Rainward.snapshot().xr,muzzle=new T.Vector3(...xr.weapon.muzzle),targets=s.enemies.filter(e=>e.hp>0&&e.state==='chase'&&e.seen&&W.dist(e,p)<18).sort((a,b)=>W.dist(a,p)-W.dist(b,p));const e=targets.find(e=>!W.obstruction(muzzle,{x:e.x,y:W.heightAt(e.x,e.z)+1.1,z:e.z}));if(Rainward.mode!=='play'){stop();reject(Error('Defense interrupted'));return;}if(!e){stop();resolve();return;}if(performance.now()-start>30000){stop();reject(Error('Defense timed out with real ammunition '+JSON.stringify({mag:p.mag,reserve:p.reserve,hp:p.hp})));return;}if(!p.mag&&!p.reload){if(!p.reserve){stop();reject(Error('Finite reserve exhausted'));return;}questDevice.pulse('right',5);}const d=new T.Vector3(e.x,W.heightAt(e.x,e.z)+1.1,e.z).sub(muzzle).normalize().applyAxisAngle(new T.Vector3(0,1,0),-xr.rig.yaw),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);questDevice.sources[1].orientation={x:q.x,y:q.y,z:q.z,w:q.w};questDevice.button('left',0,true);questDevice.button('right',0,p.mag>0&&!p.reload);},30);});}\''');frames(4)
'''
if ' def defend():' not in s:
 assert needle in s;s=s.replace(needle,combat+needle)
s=s.replace("capture('03-readable-puzzle');click('back');wait('Rainward.mode===\"play\"')", "capture('03-readable-puzzle');click('back');wait('Rainward.mode===\"play\"');defend()")
s=s.replace("    go(x,z)\n    for _ in range(count):tap('right',1)","    go(x,z);defend()\n    for _ in range(count):tap('right',1)")
s=s.replace('No game-state assignment, grants or enemy removal. Not physical Quest', 'Read-only steering with braking and synthetic defensive controller aiming use actual finite ammunition and damage; no game-state assignment, grants or enemy removal. Not physical Quest')
p.write_text(s)
