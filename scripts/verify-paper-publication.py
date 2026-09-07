"""Compare the public homepage and runtime bytes with this checked-out release.
No repository write credentials, account calls or runtime source modifications.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,json,time,urllib.request
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
source=json.loads((OUT/'rail-source-manifest.json').read_text())
prefix='mario-maker-clone/svgn-paper-route/'
expected={prefix+name:digest for name,digest in source['files'].items()}
for name in ['index.html','projects.css','project-shortcuts.css']:
    expected[name]=hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
results={}
def check(name):
    try:
        request=urllib.request.Request('https://v5ma.github.io/'+name+'?release='+source['source'][:12],headers={'Cache-Control':'no-cache','User-Agent':'PaperDelivery-Release-Verification'})
        with urllib.request.urlopen(request,timeout=12) as response:
            digest=hashlib.sha256(response.read()).hexdigest()
            return name,{'status':response.status,'sha256':digest,'expected':expected[name],'match':digest==expected[name]}
    except Exception as error:return name,{'error':str(error),'match':False}
deadline=time.monotonic()+330
while time.monotonic()<deadline:
    pending=[name for name in expected if not results.get(name,{}).get('match')]
    with ThreadPoolExecutor(max_workers=6) as pool:
        results.update(pool.map(check,pending))
    if len(results)==len(expected) and all(r.get('match') for r in results.values()):break
    time.sleep(6)
proof={'version':source['version'],'build':source['build'],'source':source['source'],'files':results,'all_match':len(results)==len(expected) and all(r.get('match') for r in results.values())}
(OUT/'paper-publication.json').write_text(json.dumps(proof,indent=2))
assert proof['all_match'],{k:v for k,v in results.items() if not v.get('match')}
print('PASS:',len(results),'public homepage and runtime files match',source['version'],source['source'])
