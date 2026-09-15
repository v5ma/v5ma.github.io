"""Temporary corrections from actual native image review; remove before merge."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def rep(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'reviewed source diverged',s.count(old));p.write_text(s.replace(old,new))
rep('scene.mjs',"chapter.id==='natatorium'&&p.submerged&&!xr.isDiorama?.()","chapter.id==='natatorium'&&p.submerged&&!(xr.isActive()&&xr.isDiorama?.())")
rep('quest-xr.mjs','This is immersive VR, not passthrough AR.','Choose FIRST PERSON / VR, VR DIORAMA or AR DIORAMA before entering. Diorama controls choose top/front openings, scale, follow and recenter. AR requires a transparent compositor; changing between AR and VR requires leaving the current session.')
rep('quest-xr.mjs','view.yaw+=angle;recenter(false);sample.move=[0,0];','view.yaw+=angle;recenter(false);sample.move=[0,0];sample.fire=false;')
rep('floodgate-recut.mjs','export const RECUT_TASK={id:RETURN_TASK,','export const RECUT_TASK={id:RETURN_TASK,customArt:true,')
rep('task-art.mjs','for(const t of CURRENT.tasks||[]){const group=','for(const t of CURRENT.tasks||[]){if(t.customArt){stations.push({t,lamp:null});continue;}const group=')
rep('task-art.mjs','for(const {t,lamp}of stations){const done=','for(const {t,lamp}of stations){if(!lamp)continue;const done=')
rep('floodgate-recut-art.mjs','amber.position.set(-26.1,1.3,5.8)','amber.position.set(-27.3,1.3,4.65)')
rep('floodgate-recut-art.mjs','-26.1,1.65,5.48,1.55,.5,','-27.1,1.5,4.48,1.35,.4,')
rep('floodgate-recut-art.mjs','-15,3.5,-11.95,3.5,.85,','-15,2.9,-11.95,2.7,.45,')
rep('floodgate-recut-art.mjs','-22,3.6,-8.22,3.8,.85,','-22,2.9,-8.22,3,.45,')
rep('floodgate-recut-art.mjs','marker.position.set(-26.1,.96,5.8)','marker.position.set(-27.3,.96,4.65)')
rep('floodgate-recut-art.mjs','gate.position.y=open?3.6:0;','gate.position.y=open?3.45:0;gate.scale.y=open?.08:1;')
p=R/'quest-xr.css';s=p.read_text()
if '#xr-view-title' not in s:p.write_text(s+'\n#xr-view-title,#xr-view-pause{max-width:100%;box-sizing:border-box}\n')
rep('tests/diorama-browser.py',"   p.screenshot(path=str(OUT/(shell+'.png')))","""   check(d['cutaway']['top']==top and d['cutaway']['front']==front,'World presentation cutaways match the selected shell openings')
   p.screenshot(path=str(OUT/(shell+'-neutral.png')))
   head=p.evaluate('({...questDevice.head})');pitch=p.evaluate('questDevice.headPitch')
   if shell=='top-open':p.evaluate('questDevice.head.y+=.35;questDevice.head.z-=.65;questDevice.headPitch=-.65')
   elif shell=='front-open':p.evaluate('questDevice.head.y-=.45;questDevice.headPitch=-.05')
   else:p.evaluate('questDevice.headPitch=-.30')
   frames(6);p.screenshot(path=str(OUT/(shell+'.png')))
   p.evaluate('({head,pitch})=>{questDevice.head=head;questDevice.headPitch=pitch}',{'head':head,'pitch':pitch});frames(4)""")
COMBAT="""  if KIND=='hands':select('hand-fire')
  away();frames(6);wait('Rainward.snapshot().xr.armed')
  p.evaluate('''async ()=>{const T=await import('./vendor/three.module.js'),x=Rainward.snapshot().xr,p=Rainward.state.player,scale=1/x.diorama.scale,matrix=new T.Matrix4().compose(new T.Vector3(x.rig.x,x.rig.y,x.rig.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),x.rig.yaw),new T.Vector3(scale,scale,scale)),target=new T.Vector3(p.x+2,1.2,p.z-6).applyMatrix4(matrix.invert()),source=questDevice.sources.find(s=>s.handedness==='right'),direction=target.sub(new T.Vector3(source.position.x,source.position.y,source.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),direction);source.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''')
  frames(4);before=p.evaluate('({mag:Rainward.state.player.mag,reserve:Rainward.state.player.reserve,x:Rainward.state.player.x,z:Rainward.state.player.z,shots:Rainward.state.stats.shots})')
  trigger(True);p.wait_for_function('(mag)=>Rainward.state.player.mag<mag',arg=before['mag']);trigger(False);frames(4)
  after=p.evaluate('({mag:Rainward.state.player.mag,reserve:Rainward.state.player.reserve,shots:Rainward.state.stats.shots,last:Rainward.state.events.filter(e=>e.type===\"shot\").at(-1)})')
  check(after['reserve']==before['reserve'] and after['shots']-before['shots']==before['mag']-after['mag'],'Diorama trigger or hand pinch firing spends exactly the actual finite magazine')
  check(abs(after['last']['from']['x']-before['x'])<.2 and abs(after['last']['from']['z']-before['z'])<.2,'Miniature firearm traces begin at the survivor, never at the spectator controller')
  select('reload');wait('Rainward.state.player.reload===0&&Rainward.state.player.mag===6')
  check(p.evaluate('Rainward.state.player.reserve')==before['reserve']-(6-after['mag']),'Diorama reload uses exactly the missing reserve rounds')
  if KIND=='hands':select('hand-fire')
"""
p=R/'tests/diorama-browser.py';s=p.read_text();needle="  select('pack');wait('Rainward.mode===\"pack\"');select('equip-rifle');"
if 'Diorama trigger or hand pinch firing' not in s:
 assert needle in s;p.write_text(s.replace(needle,COMBAT+needle))
p=R/'DIORAMA.md';s=p.read_text();addition='''\n## Native image-review correction\n\nAn open display face also cuts away the world presentation in that direction. Top-open views remove roofs and upper walls above the local survivor clearance; front-open views remove foreground facade sections that would otherwise hide the character. Visible targeting ignores those removed presentation fragments, but firearm traces still start at the survivor and obey the real level walls. These views deliberately provide different information from first-person play; they do not make barriers traversable. The vertical window adjusts to zoom and the focused diver so the survivor is not clipped at the top of a high-zoom display.\n\nThe first all-green candidate still had poor camera-matched images: roofs hid the miniature, and large new clinic signs occluded the over-shoulder view. The subsequent visual pass adds these cutaways, lowers the terrace signs, replaces the duplicate generic gate marker with its authored latch, and folds the raised shutter into its lintel. Passing model/browser checks alone was not treated as final art approval.\n'''
if '## Native image-review correction' not in s:p.write_text(s+addition)
