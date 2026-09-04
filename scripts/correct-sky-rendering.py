"""Remove duplicate legacy rail passes and show the actual tubular sky rails."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'mario-maker-clone/svgn-paper-route/sky-game.js';s=p.read_text()
s=s.replace("  window.__skyView=function(camera,view){\n    if(!active()){", "  window.__skyView=function(camera,view){\n    const m=window.__merged;\n    if(m?.trackGroup)m.trackGroup.visible=mode==='play'&&!active();\n    if(m?.curveGroup)m.curveGroup.visible=mode==='edit'&&!window.__delivery?.state.menu;\n    if(!active()){camera.rotation.set(0,0,0);")
s=s.replace('camera.position.set(cx,cy,650);camera.updateMatrixWorld();','camera.position.set(cx+90,cy+60,650);camera.lookAt(cx,cy,0);camera.updateMatrixWorld();')
p.write_text(s)
p=root/'tests/sky_browser.py';s=p.read_text()
if 'from:s.from' not in s:s=s.replace('armed:s.armed,loops:', 'armed:s.armed,from:s.from,airFrames:s.airFrames,loops:')
s=s.replace('saved=False;start=time.monotonic();last={}', 'saved=False;braking=False;start=time.monotonic();last={}')
if 'should_brake=' not in s:
 s=s.replace("    if st['won']:break", "    if st['won']:break\n    should_brake=route==1 and st.get('from')=='loop-1' and st.get('airFrames',0)<55\n    if should_brake!=braking:\n     braking=should_brake\n     page.keyboard.up('KeyD' if braking else 'KeyA');page.keyboard.down('KeyA' if braking else 'KeyD')")
if "page.keyboard.up('KeyA');page.keyboard.up('KeyD');page.keyboard.up('KeyC')" not in s:s=s.replace("   page.keyboard.up('KeyD');page.keyboard.up('KeyC');", "   page.keyboard.up('KeyA');page.keyboard.up('KeyD');page.keyboard.up('KeyC');")
if 'Legacy duplicate rails' not in s:
 s=s.replace("   page.keyboard.down('KeyD');page.keyboard.down('KeyC')", "   check(page.evaluate('!__merged.trackGroup.visible&&!__merged.curveGroup.visible'),'Legacy duplicate rails do not cover the volumetric sky rails')\n   page.keyboard.down('KeyD');page.keyboard.down('KeyC')")
if 'The lower detour is traversed' not in s:
 s=s.replace("events=page.evaluate('__sky.state.events');runs.append", "events=page.evaluate('__sky.state.events')\n   if route==1:check(any(e.get('to')=='loop-2-low' for e in events),'The lower detour is traversed and reconnects during a complete 3D run')\n   runs.append")
p.write_text(s)
print('Removed redundant gold rail passes; applied depth-readable side camera and a full detour replay.')
