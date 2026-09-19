"""Verify actual published bytes with a bounded wait for GitHub Pages deployment."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,os,time,urllib.request
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
p=argparse.ArgumentParser();p.add_argument('--report',default='/tmp/comparative-hosted.json');p.add_argument('--wait-seconds',type=int,default=480);args=p.parse_args()
report=json.loads((HERE/'build-report.json').read_text());prefix='theology-wiki/comparative-religion/'
paths={prefix+r['path'] for r in report['files']}
paths.update(prefix+n for n in ['build-report.json','series.css','reader.js','sources.json','sources-more.json','studies-core.json','studies-bridges.json','directory.json','claim-audit.json','manifest.json','repair-supplement.md'])
paths.update(['theology-wiki/san-reader.html','theology-wiki/data/build-report.json','theology-wiki/content/developed/apocalyptic-repair-theology.md','theology-wiki/data/listening/apocalyptic-repair-theology.json','theology-wiki/products/transcripts/apocalyptic-repair-theology.txt'])
expected={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in sorted(paths)}
def fetch(name):
 url='https://v5ma.github.io/'+name+'?edition-check='+expected[name][:16]
 try:
  request=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'TheologyComparativePublication/1.0'})
  with urllib.request.urlopen(request,timeout=20) as r:body=r.read();status=r.status
  digest=hashlib.sha256(body).hexdigest();return name,{'url':url,'status':status,'sha256':digest,'expected_sha256':expected[name],'matches_checkout':status==200 and digest==expected[name]}
 except Exception as exc:return name,{'url':url,'error':type(exc).__name__+': '+str(exc),'matches_checkout':False}
observed={};deadline=time.monotonic()+args.wait_seconds;attempt=0
while True:
 attempt+=1;pending=[n for n in paths if not observed.get(n,{}).get('matches_checkout')]
 with ThreadPoolExecutor(max_workers=6) as pool:
  for name,value in pool.map(fetch,pending):observed[name]=value
 remaining=[n for n,v in observed.items() if not v.get('matches_checkout')]
 print(json.dumps({'attempt':attempt,'remaining':remaining}),flush=True)
 if not remaining or time.monotonic()>=deadline:break
 time.sleep(6)
result={'status':'passed' if not remaining else 'failed','checkout':os.environ.get('GITHUB_SHA'),'attempts':attempt,'matched_files':sum(v.get('matches_checkout',False) for v in observed.values()),'expected_files':len(expected),'files':observed,'scope':'Actual GitHub Pages file responses, not local replacements. Browser behavior is separately checked.'}
Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if remaining:raise SystemExit(1)
