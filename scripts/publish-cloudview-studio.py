"""Preserve the independently published Cloudview renderer and add Studio art.
The verified art code is copied from an immutable commit in this repository.
Only navigation is appended to the live UI; no live rendering/physics is replaced.
"""
from pathlib import Path
import hashlib,json,subprocess,re
ROOT=Path(__file__).resolve().parents[1]
ART='9038b9df97f11de2da2339235216038b164546e0'
GAME='mario-maker-clone/svgn-paper-route'
DEST=ROOT/GAME/'cloudview-studio';DEST.mkdir(parents=True,exist_ok=True)
def old(path):
    return subprocess.check_output(['git','show',ART+':'+path],cwd=ROOT)
def nav(identifier,label,relative):
    return '''\n// Cloudview Studio navigation: preserves the existing renderer and UI.\n(()=>{function add(){if(document.getElementById(%s))return;const host=document.querySelector('#delivery-header .actions');if(!host)return;const a=document.createElement('a');a.id=%s;a.className='delivery-btn';a.href=new URL(%s,location.href).href;a.textContent=%s;a.style.textDecoration='none';host.append(a);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();})();\n''' % (json.dumps(identifier),json.dumps(identifier),json.dumps(relative),json.dumps(label))
manifest={'source_commit':ART,'preserved_live_baseline':'20d0a4e1464c80c27bd16771606d6a22985ac615','files':{},'shared_assets_checked':[]}
for name in ['cloudview-world.js','cloudview-ui.js','cloudview.css','sky-game.js','delivery-upgrade.js']:
    raw=old(GAME+'/'+name)
    result=raw
    if name=='cloudview-ui.js':result+=nav('studio-live-link','Live art','../index.html').encode()
    (DEST/name).write_bytes(result)
    manifest['files'][name]={'source_sha256':hashlib.sha256(raw).hexdigest(),'published_sha256':hashlib.sha256(result).hexdigest(),'byte_identical':raw==result,'only_change':None if raw==result else 'Append a link back to the preserved live art version.'}
raw=old(GAME+'/index.html');html=raw.decode().replace('\r\n','\n')
assert '<base ' not in html
html=html.replace('<head>','<head>\n<base href="../">',1)
for name in ['cloudview-world.js','cloudview-ui.js','cloudview.css','sky-game.js','delivery-upgrade.js']:
    assert './'+name in html,name
    html=html.replace('./'+name,'./cloudview-studio/'+name)
(DEST/'index.html').write_text(html,newline='\r\n')
manifest['files']['index.html']={'source_sha256':hashlib.sha256(raw).hexdigest(),'published_sha256':hashlib.sha256((DEST/'index.html').read_bytes()).hexdigest(),'byte_identical':False,'only_change':'Set the original game directory as base URL and point five owned art/runtime files at the Studio subdirectory.'}
# Fail instead of silently running the tested code against changed dependencies.
for name in ['campaign.js','sky-routes.js','sky-visual.js','delivery-upgrade.css','sky-style.css','_voxelizer.js','voxel-assets.json']:
    now=(ROOT/GAME/name).read_bytes();before=old(GAME+'/'+name)
    assert now==before,'Shared game dependency changed: '+name
    manifest['shared_assets_checked'].append(name)
for path in sorted((ROOT/GAME/'vendor').glob('*.js')):
    name=path.relative_to(ROOT).as_posix()
    assert path.read_bytes()==old(name),'Pinned renderer dependency changed: '+name
    manifest['shared_assets_checked'].append(path.relative_to(ROOT/GAME).as_posix())
ui=ROOT/GAME/'cloudview-ui.js';data=ui.read_text()
if 'studio-art-link' not in data:
    data+=nav('studio-art-link','Studio art','./cloudview-studio/index.html')
    ui.write_text(data)
manifest['live_change']='Append one Studio art navigation link to the live cloudview-ui.js; its preexisting bytes and behavior are retained.'
(DEST/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(DEST/'README.md').write_text('''# Cloudview Studio\n\nThis is the separately verified art pass from PR #12, preserved alongside the independent Cloudview update that reached master while it was being developed. The main game remains unchanged apart from its Studio art navigation link. This entry is the same game and save format, not a mockup. Live art returns to the main version.\n\nThe Studio version provides gold track armor, original island cities, atmospheric scenery, red delivery targets, a helmeted motorcycle courier and its compact HUD. The original loop and flight rules are unchanged. The base URL reuses the existing pinned renderer and shared game assets without copying the entire repository.\n\nThe source manifest records hashes against immutable verified commit 9038b9df97f11de2da2339235216038b164546e0. Four owned runtime files are byte-identical; the UI only adds a return link, and the HTML only changes asset routing. That source passed 23 unit/data checks, 15 visual/editor checks and 35 full 3D input-replay checks in run 33935414614. The final Studio-path smoke test separately verifies the published routing, real 3D output, normal-input launch/catch/delivery, editable copies, and navigation back to the existing app.\n\nCloud and waterfall scenery use authored texture planes; the track, islands, city, targets and courier are geometry. This is an original stylized real-time interpretation, not pixel-for-pixel equality with the generated concept. Native WebGPU hardware, Safari and physical mobile performance are not asserted by software-rendered Chromium tests.\n\nNo existing live art, character orientation fix, theology work, dinosaur source or browser saves are replaced. The source branch and original test artifacts remain available.\n''')
# Retain the complete replay as a callable test of this URL without modifying
# the independently updated live game's own tests.
full=old('tests/sky_browser.py').decode().replace("OUT=ROOT/'test-output'/'sky'","OUT=ROOT/'test-output'/'cloudview-studio-routes'")
full=full.replace("/mario-maker-clone/svgn-paper-route/index.html","/mario-maker-clone/svgn-paper-route/cloudview-studio/index.html")
(ROOT/'tests/cloudview_studio_routes.py').write_text(full)
# This focused run tests the actual new navigation before the original 15 checks.
smoke=old('tests/cloudview_visual.py').decode().replace("Path('test-output/cloudview')","Path('test-output/cloudview-studio')")
needle="        page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')"
assert needle in smoke
replacement=needle+"\n        page.wait_for_selector('#studio-art-link',timeout=60000)\n        check(page.locator('#studio-art-link').get_attribute('href').endswith('/cloudview-studio/index.html'),'The preserved main game links to Studio art')\n        page.locator('#studio-art-link').click()\n        page.wait_for_url('**/cloudview-studio/index.html')\n        check(page.locator('base').get_attribute('href')=='../','Studio resolves shared assets through the original game directory')"
smoke=smoke.replace(needle,replacement,1)
smoke=smoke.replace("        check(not errors,'No uncaught JavaScript errors in the art and input flow')","        check(page.locator('#studio-live-link').get_attribute('href').endswith('/svgn-paper-route/index.html'),'Studio retains a return link to the independent live art')\n        check(not errors,'No uncaught JavaScript errors in the art and input flow')")
(ROOT/'tests/cloudview_studio_visual.py').write_text(smoke)
print('Studio art isolated; current live renderer, orientation fixes and other projects preserved.')
