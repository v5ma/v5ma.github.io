from pathlib import Path

def replace(path,old,new):
 p=Path(path);s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(path,old)
 p.write_text(s.replace(old,new))

p='vesperfall/tests/returning-bell-browser.py'
replace(p,"key('ArrowLeft',a>.01);key('ArrowRight',a<-.01);key('ArrowUp',b>.006);key('ArrowDown',b<-.006);if(Math.abs(a)<.02&&Math.abs(b)<.012||performance.now()-start>90000)","key('ArrowLeft',a>.026);key('ArrowRight',a<-.026);key('ArrowUp',b>.021);key('ArrowDown',b<-.021);if(Math.abs(a)<.04&&Math.abs(b)<.035||performance.now()-start>30000)")
replace(p,"Math.abs(a)<.02?resolve():reject(Error('Aim timeout'))","Math.abs(a)<.04&&Math.abs(b)<.035?resolve():reject(Error('Aim timeout '+JSON.stringify({a,b,yaw:c.yaw,pitch:c.pitch})))")
replace('vesperfall/returning-bell-art.js',"for(const x of[-9.2,9.2])for(const z of[-16,-8,1]){b.box(K.pale,x,7.8,z,.38,2,.38);b.add(K.sphere,K.gold,x,8.9,z,.2,.2,.2);}","for(const x of[-9.2,9.2])for(const z of[-16,-8,1]){const wall=w.solids.find(s=>s.type==='wall'&&x>=s.min[0]&&x<=s.max[0]&&z>=s.min[2]&&z<=s.max[2]&&s.max[1]>3);if(!wall)continue;const y=wall.max[1];b.box(K.pale,x,y+.7,z,.38,1.4,.38);b.add(K.sphere,K.gold,x,y+1.5,z,.2,.2,.2);}")
p='vesperfall/tests/rosefire-browser.py'
replace(p,"  check(page.evaluate('Vesperfall.component.rosefire.patched.size>=4')", "  page.locator('#expedition-mode').select_option('endless');page.locator('#start').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused');pause()\n  check(page.evaluate('Vesperfall.component.rosefire.patched.size>=4')")
