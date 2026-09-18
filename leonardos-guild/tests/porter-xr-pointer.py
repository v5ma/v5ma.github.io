"""Synthetic hand hardware only. Existing XR panels, DOM handlers and WebGL run normally."""
import base64

def hand_ui(page):
 def read():return page.evaluate('LeonardoGuild.inspect()')
 def frames(n=4):
  target=read()['xr']['frames']+n
  page.wait_for_function('(n)=>!LeonardoGuild.inspect().xr.presenting||LeonardoGuild.inspect().xr.frames>=n',arg=target)
 def pinch(down):page.evaluate('(d)=>__xr.sources[1].pinch=d?.014:.06',down)
 def point(u,v):
  page.evaluate('''async ({u,v})=>{const T=await import('/leonardos-guild/vendor/three.module.js'),s=__xr.sources[1],o=LeonardoGuild.inspect().xr.theatreOrigin;
   const info=LeonardoGuild.inspect().xr.hud.panel;
   const p=new T.Vector3((u-.5)*1.10,(v-.5)*1.65,0).applyMatrix4(new T.Matrix4().fromArray(info.matrix));
   const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.sub(new T.Vector3().copy(s.position)).normalize());s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',{'u':u,'v':v});frames(3)

 def ensure_hud():
  if read()['xr'].get('hud',{}).get('panelVisible',True):return
  page.evaluate("""async()=>{const T=await import('/leonardos-guild/vendor/three.module.js'),s=__xr.sources[1],r=LeonardoGuild.inspect().xr,o=r.theatreOrigin,p=new T.Vector3(...r.hud.toggle).applyAxisAngle(new T.Vector3(0,1,0),o.yaw).add(new T.Vector3(o.x,o.y,o.z)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.sub(new T.Vector3().copy(s.position)).normalize());s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}""")
  pinch(False);frames(3);pinch(True);frames(3);pinch(False);frames(3)
  assert read()['xr']['hud']['panelVisible'],'Physical pointer did not open the on-demand panel'
 def panel(key):
  ensure_hud()
  for _ in range(25):
   keys=read()['xr']['panel']['buttons']
   if key in keys:break
   if key=='page-next':raise AssertionError('Missing page control')
   panel('page-next')
  else:raise AssertionError('XR control missing: '+key)
  coords={'page-next':(545/1024,1-1388/1536),'back':(870/1024,1-1388/1536),'exit':(.5,1-1480/1536)}
  u,v=coords.get(key,(.5,1-(735+keys.index(key)*76+33)/1536));point(u,v);pinch(False);frames(3);pinch(True);frames(3);pinch(False);frames(3)
 def dom(selector):
  index=page.evaluate('''selector=>{const e=document.querySelector(selector),r=e?.closest('dialog[open]')||document.getElementById('menu');return [...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]')&&e.type!=='hidden').indexOf(e);}''',selector)
  assert index>=0,selector
  panel('dom'+str(index))
 def capture(path):
  page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
  path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
 return frames,panel,dom,capture
