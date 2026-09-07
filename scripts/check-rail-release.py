"""Check the committed release without rewriting source or using write tokens."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'mario-maker-clone/svgn-paper-route'
FILES=['index.html','route-workshop.js','ground-runtime.js','bezier-core.js','bezier-editor.js','rail-editor.css','rail-grip-core.js','rail-runtime.js','rail-training.js','release-status.js','release.json','sw.js','ride-lab-core.js','ride-lab-editor.js','ride-lab-worker.js','ride-lab-loader.js','hookline-feedback.js','whip-visual.js','ride-lab.css','ride-guide.js','open-course.js','sky-network-layout.js','flow-route-tools.js','sky-network-art.js','sky-post-route.js','sky-post-core.js','sky-post-ui.js','sky-post.css']
for carrier in ['.rail-incoming','.rail-recovery']:
    assert not (ROOT/carrier).exists(),f'Incomplete transfer directory is not a release: {carrier}'
manifest=json.loads((GAME/'release.json').read_text())
status=(GAME/'release-status.js').read_text()
assert manifest['version'] in status and manifest['build'] in status,'Build labels disagree'
html=(GAME/'index.html').read_text()
scripts=re.findall(r'<script[^>]+src="\./([^"?]+)',html)
for name in ['bezier-core.js','bezier-editor.js','rail-grip-core.js','rail-runtime.js','rail-training.js','release-status.js']:
    assert scripts.count(name)==1,f'Missing or duplicate script: {name}'
assert scripts.index('grapple-core.js')<scripts.index('rail-grip-core.js')<scripts.index('rail-runtime.js')
assert scripts.index('workshop-core.js')<scripts.index('bezier-core.js')<scripts.index('bezier-editor.js')<scripts.index('route-workshop.js')
assert 'rail-editor.css' in html
assert status.count("import('./ride-lab-loader.js')")==1,'Ride Lab must have one optional entry'
loader=(GAME/'ride-lab-loader.js').read_text()
assert loader.index("import('./ride-lab-core.js')")<loader.index("import('./ride-lab-editor.js')")
assert "import('./ride-guide.js')" in loader and 'ride-lab.css' in loader
assert loader.count("import('./flow-route-tools.js')")==1,'The route tools must load once'
for name in ['sky-post-route.js','sky-post-core.js','sky-post-ui.js']:
    assert loader.count("import('./"+name+"')")==1,'Sky Post modules must load exactly once'
assert loader.index("import('./sky-post-route.js')")<loader.index("import('./sky-post-core.js')")<loader.index("import('./sky-post-ui.js')")
worker=(GAME/'ride-lab-worker.js').read_text()
assert worker.index('grapple-core.js')<worker.index('rail-grip-core.js')<worker.index('ride-lab-core.js')
for path in ['rail-editor-acceptance.yml','ride-lab-acceptance.yml','flow-route-review.yml','sky-post.yml']:
    flow=(ROOT/'.github/workflows'/path).read_text()
    assert 'contents: read' in flow and 'contents: write' not in flow,'Acceptance must not edit the repository'
    assert 'git push' not in flow and 'persist-credentials: false' in flow
out=ROOT/'test-output';out.mkdir(exist_ok=True)
record={'version':manifest['version'],'build':manifest['build'],'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'files':{name:hashlib.sha256((GAME/name).read_bytes()).hexdigest() for name in FILES}}
(out/'rail-source-manifest.json').write_text(json.dumps(record,indent=2))
print('PASS: complete source, single-loaded modules, private-worker dependencies, read-only CI and matching build metadata')
