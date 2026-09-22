"""Compare actual public atlas and parent links with this checkout."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,os,time,urllib.request
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--report',default='/tmp/abrahamic-atlas-hosted.json');p.add_argument('--wait-seconds',type=int,default=480);args=p.parse_args()
prefix='theology-wiki/comparative-religion/abrahamic-inheritance/'
files=[prefix+x['path'] for x in json.loads((HERE/'build-report.json').read_text())['files']]
files += [prefix+x for x in ['groups.json','build.cjs','reader.js','atlas.css','README.md','manifest.json']]
files += ['theology-wiki/comparative-religion/index.html','theology-wiki/comparative-religion/directory.html','theology-wiki/comparative-religion/build.cjs']
files=sorted(set(files));expected={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in files};results={};deadline=time.monotonic()+args.wait_seconds;attempt=0
def get(f):
 url='https://v5ma.github.io/'+f+'?verification='+os.environ.get('GITHUB_SHA','current')
 try:
  req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'TheologyWikiPublicationCheck/1.0'})
  with urllib.request.urlopen(req,timeout=20) as r: body=r.read();status=r.status
  h=hashlib.sha256(body).hexdigest();return f,{'url':url,'status':status,'sha256':h,'expected_sha256':expected[f],'matches_checkout':h==expected[f]}
 except Exception as e:return f,{'url':url,'matches_checkout':False,'error':str(e)}
while True:
 attempt+=1
 pending=[f for f in files if not results.get(f,{}).get('matches_checkout')]
 with ThreadPoolExecutor(max_workers=8) as pool: results.update(pool.map(get,pending))
 if all(x.get('matches_checkout') for x in results.values()) or time.monotonic()>=deadline: break
 time.sleep(5)
report={'status':'passed' if all(x.get('matches_checkout') for x in results.values()) else 'failed','checkout':os.environ.get('GITHUB_SHA'),'attempts':attempt,'file_count':len(files),'files':results}
Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if report['status']!='passed': raise SystemExit(1)
