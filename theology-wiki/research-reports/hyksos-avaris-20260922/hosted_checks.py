"""Wait for actual public bytes to match this checkout; never substitute local data."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,os,time,urllib.request
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];PREFIX='theology-wiki/research-reports/hyksos-avaris-20260922/'
p=argparse.ArgumentParser();p.add_argument('--report',default='/tmp/hyksos-hosted.json');p.add_argument('--wait',type=int,default=480);a=p.parse_args()
files=[PREFIX+x['path'] for x in json.loads((HERE/'build-report.json').read_text())['files']]+[PREFIX+'build-report.json',PREFIX+'integration-receipt.json']
files+=['theology-wiki/content/developed/'+x['slug']+'.md' for x in json.loads((HERE/'integration-receipt.json').read_text())['articles']]
files+=['theology-wiki/data/page-index.json','theology-wiki/san-reader.html']
expected={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in files};results={};deadline=time.monotonic()+a.wait;attempt=0

def read(f):
 url='https://v5ma.github.io/'+f+'?hyksos-verification='+os.environ.get('GITHUB_SHA','current')
 try:
  req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'TheologyWikiReportVerification/1.0'})
  with urllib.request.urlopen(req,timeout=20) as r:body=r.read();status=r.status
  digest=hashlib.sha256(body).hexdigest();return f,{'url':url,'status':status,'sha256':digest,'expected_sha256':expected[f],'matches_checkout':digest==expected[f]}
 except Exception as e:return f,{'url':url,'matches_checkout':False,'error':str(e)}
while True:
 attempt+=1
 with ThreadPoolExecutor(max_workers=5) as pool:results.update(pool.map(read,[f for f in files if not results.get(f,{}).get('matches_checkout')]))
 if all(v.get('matches_checkout') for v in results.values()) or time.monotonic()>=deadline:break
 time.sleep(5)
passed=all(v.get('matches_checkout') for v in results.values());r={'status':'passed' if passed else 'failed','file_count':len(files),'attempts':attempt,'files':results};Path(a.report).parent.mkdir(parents=True,exist_ok=True);Path(a.report).write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
if not passed:raise SystemExit(1)
