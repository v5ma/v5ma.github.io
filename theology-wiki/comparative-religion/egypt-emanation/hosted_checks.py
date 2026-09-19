"""Compare actual public responses with the exact checkout, with a bounded deployment wait."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,os,time,urllib.request
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--report',default='/tmp/egypt-hosted.json');p.add_argument('--wait-seconds',type=int,default=480);args=p.parse_args()
prefix='theology-wiki/comparative-religion/egypt-emanation/'
report=json.loads((HERE/'build-report.json').read_text());manifest=json.loads((HERE/'manifest.json').read_text())
paths={prefix+r['path'] for r in report['files']}
paths.update(prefix+n for n in manifest['study_inputs']+manifest['source_inputs']+['manifest.json','profiles.json','relationships.json','reader.js','research.css','build-report.json','integration-receipt.json'])
parent=json.loads((HERE.parent/'build-report.json').read_text());paths.update('theology-wiki/comparative-religion/'+r['path'] for r in parent['files'] if r['path'].endswith('.html'))
paths.update(['theology-wiki/comparative-religion/build-report.json','theology-wiki/comparative-religion/series.css','theology-wiki/san-reader.html','theology-wiki/content/developed/apocalyptic-repair-theology.md'])
expected={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in sorted(paths)}
def fetch(n):
 url='https://v5ma.github.io/'+n+'?egypt-check='+expected[n][:16]
 try:
  req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'TheologyEgyptResearchVerification/1.0'})
  with urllib.request.urlopen(req,timeout=20) as response:body=response.read();status=response.status
  digest=hashlib.sha256(body).hexdigest();return n,{'url':url,'status':status,'sha256':digest,'expected_sha256':expected[n],'matches_checkout':status==200 and digest==expected[n]}
 except Exception as e:return n,{'url':url,'matches_checkout':False,'error':type(e).__name__+': '+str(e)}
observed={};deadline=time.monotonic()+args.wait_seconds;attempt=0
while True:
 attempt+=1;pending=[n for n in expected if not observed.get(n,{}).get('matches_checkout')]
 with ThreadPoolExecutor(max_workers=6) as pool:
  for n,value in pool.map(fetch,pending):observed[n]=value
 remaining=[n for n in expected if not observed.get(n,{}).get('matches_checkout')];print(json.dumps({'attempt':attempt,'remaining':remaining}),flush=True)
 if not remaining or time.monotonic()>=deadline:break
 time.sleep(6)
result={'status':'failed' if remaining else 'passed','checkout':os.environ.get('GITHUB_SHA'),'attempts':attempt,'expected_files':len(expected),'matched_files':len(expected)-len(remaining),'files':observed,'scope':'Actual production bytes. No local substitution or browser-response mocking.'}
Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if remaining:raise SystemExit(1)
