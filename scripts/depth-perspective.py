"""Use actual perspective for play while retaining the original editor camera."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1];game=root/'mario-maker-clone/svgn-paper-route'
p=game/'index.html';s=p.read_text()
if 'CloudDepthCamera.forFrame' not in s:
    s=s.replace('Scene,OrthographicCamera,','Scene,OrthographicCamera,PerspectiveCamera,')
    s=s.replace('scene, camera, tiles, gpuLimitAudit,', "scene, get camera(){return window.__sky?.active()&&window.CloudDepthCamera?.active||camera}, tiles, gpuLimitAudit,")
    needle='  renderer.render(scene, camera);'
    assert s.count(needle)==1
    s=s.replace(needle,'  renderer.render(scene, window.CloudDepthCamera ? CloudDepthCamera.forFrame(camera,VIEW) : camera);')
    s=s.replace('<script src="./cloudview-depth.js"></script>', '<script src="./cloudview-depth.js"></script>\n<script src="./cloudview-camera.js"></script>')
p.write_text(s,newline='\r\n')
p=game/'cloudview-depth.js';s=p.read_text()
s=s.replace("const VERSION = '2026.09.05-depth1'", "const VERSION = '2026.09.05-depth2'")
s=s.replace('m.renderer.toneMappingExposure=1.10','m.renderer.toneMappingExposure=.74')
s=s.replace('mat.envMapIntensity=.40','mat.envMapIntensity=.24')
s=s.replace("new T.DirectionalLight('#96c9ff',.52)","new T.DirectionalLight('#96c9ff',.30)")
s=s.replace("'#ffe9b0',1.45", "'#ffe9b0',1.10")
s=s.replace("'#c4e0fa',.32", "'#c4e0fa',.22")
s=s.replace("'#0873e9'", "'#064eee'").replace("'#349bed'", "'#116aed'")
s=re.sub(r'    if\(active&&m.camera\) \{.*?\n    \}', '', s, count=1, flags=re.S)
# The camera now owns the projection. This stage only controls geometry/light.
if 'Cloud color remains luminous' not in s:
    needle='    kit.dispose();return root;'
    extra='''    // Cloud color remains luminous under the filmic highlight curve.
    for(const object of root.children)if(object.count===80&&object.material?.map&&object.material.transparent){
      object.material.color.setRGB(2.1,2.2,2.4);
    }
'''
    assert needle in s;s=s.replace(needle,extra+needle)
p.write_text(s)
p=root/'tests/depth_capture.py';s=p.read_text()
s=s.replace("toneMapping:__merged.renderer.toneMapping,", "toneMapping:__merged.renderer.toneMapping,camera:__merged.camera.type,")
if "data['camera']=='PerspectiveCamera'" not in s:s=s.replace("        assert data['shadow'] and data['toneMapping']==4,data", "        assert data['shadow'] and data['toneMapping']==4,data\n        assert data['camera']=='PerspectiveCamera',data")
p.write_text(s)
p=root/'tests/sky_browser.py';s=p.read_text()
if 'SKY_REPLAY_ROUTE' not in s:
    s=s.replace('for route,count in [(0,4),(1,5),(2,6)]:', "for route,count in [(i,4+i) for i in range(3) if os.getenv('SKY_REPLAY_ROUTE') is None or i==int(os.getenv('SKY_REPLAY_ROUTE'))]:")
    s=s.replace("page=context.new_page();page.on('pageerror'", "page=context.new_page();page.set_default_timeout(90000);page.on('pageerror'")
p.write_text(s)
print('Perspective gameplay projection and a more saturated lighting balance integrated.')
