"""Finalize committed Cloudview art. Idempotent; no simulation or route edits.
The geometry and textures are source files, not regenerated build-only assets.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
g=root/'mario-maker-clone/svgn-paper-route'
assets=(g/'cloudview-assets.js').read_text()
assert 'function smallSphere()' in assets and 'const uv=new Float32Array' in assets
p=g/'cloudview-world.js';s=p.read_text()
assert 'function cloudBank(' in s and 'function cliffTexture(' in s
# Game Y points down; the art model's local up points up. Use the inverse angle
# to keep its wheels against the rail all the way around the loop.
s=s.replace('angle=track?p.drawA:', 'angle=track?-(p.drawA||0):')
s=s.replace('__gameRefs.T.STEEL,__gameRefs.T.GOAL].includes(id)', '__gameRefs.T.STEEL,__gameRefs.T.GOAL,__gameRefs.T.EUCDOCK].includes(id)')
# A compressed sky gradient and luminous weather preserve depth without
# desaturating the cloud banks into the sky's background color.
s=s.replace('course.width*36+9000),8500)', 'course.width*36+9000),2600)')
s=s.replace("color:night?'#dbe7fa':'#ffffff',side:T.DoubleSide}", "color:night?'#dbe7fa':'#ffffff',side:T.DoubleSide,fog:false}")
old="glow.tri(q(-4,5),q(3,0),q(-4,-5),goldSector?'#fff5ac':'#ffda69');glow.tri(q(-7,5),q(-4,5),q(-4,-5),'#ffe283');"
new="const chevron=goldSector?'#fff5ac':'#ffdc72';glow.tri(q(-6,6),q(-1,6),q(6,0),chevron);glow.tri(q(-6,6),q(6,0),q(1,0),chevron);glow.tri(q(1,0),q(6,0),q(-1,-6),chevron);glow.tri(q(1,0),q(-1,-6),q(-6,-6),chevron);"
s=s.replace(old,new)
# Normalize any repeated migration statements left by older integration runs.
fog="m.scene.fog=new T.Fog(night?'#9ebbd6':'#b5dff6',1050,2450);"
s=re.sub('(?:'+re.escape(fog)+')+',lambda _:fog,s)
clear="if(!__sky.active()&&!__delivery.state.menu)engine.scene.fog=null;"
s=re.sub('(?:'+re.escape(clear)+r'\s*)+',lambda _:clear+'\n  ',s)
p.write_text(s)
p=g/'sky-game.js';s=p.read_text()
s=s.replace('zoom+=(desired-zoom)*.045;', 'if(cx===null)zoom=desired;else zoom+=(desired-zoom)*.045;') if 'if(cx===null)zoom=desired;else' not in s else s
prefix='if(cx===null)zoom=desired;else '
s=re.sub('(?:'+re.escape(prefix)+')+',lambda _:prefix,s)
p.write_text(s)
p=g/'index.html';s=p.read_text()
if 'WebGPURenderer,Fog,Group,' not in s:s=s.replace('WebGPURenderer,Group,','WebGPURenderer,Fog,Group,')
p.write_text(s,newline='\r\n')
p=root/'tests/cloudview_browser.py';s=p.read_text()
s=s.replace("page.locator('[data-course=\"0\"]').click();", "page.locator('[data-course=\"0\"]').click(timeout=90000);")
s=s.replace('recorded=False;frames=[]', 'recorded=False;orientation_checked=False;frames=[]')
if 'The rider remains correctly oriented' not in s:
 s=s.replace("   if s['transfers']>=1:break", """   if s['transfers']>=1:break
   if not orientation_checked and .15<s['phase']<.48:
    alignment=page.evaluate('''()=>{const p=player,q=trackPoint(p.track,p.trackS,p._bside),a=__cloudview.hero.group.rotation.z;return -Math.sin(a)*q.bx-Math.cos(a)*q.by;}''')
    check(alignment>.99,'The rider remains correctly oriented against the loop surface')
    page.screenshot(path=str(OUT/'07-rider-on-loop.png'),timeout=45000)
    orientation_checked=True""")
p.write_text(s)
p=root/'tests/sky_browser.py';s=p.read_text()
# Preserve all end-to-end assertions and ordinary controls. Allow the richer
# fixed-quality scene time to render on a CPU-only CI GPU backend.
s=s.replace('time.monotonic()-start<150:', 'time.monotonic()-start<300:')
s=s.replace("page.locator(f'[data-course=\"{route}\"]').click();", "page.locator(f'[data-course=\"{route}\"]').click(timeout=90000);")
s=s.replace("timeout=50000);page.keyboard.up('KeyD')", "timeout=90000);page.keyboard.up('KeyD')")
if "'last_state':" not in s:
 s=s.replace("'error':str(e),'checks':checks", "'error':str(e),'last_state':status(page) if page else None,'checks':checks")
p.write_text(s)
print('Finalized loop-normal rider pose, chevrons, bright clouds, and read-only replay checks.')
