"""Wait for actual hosted bytes to match this checkout; never substitute local files."""
from pathlib import Path
import argparse, hashlib, json, os, time, urllib.request
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
p=argparse.ArgumentParser();p.add_argument('--origin',default='https://v5ma.github.io');p.add_argument('--report',default='/tmp/identity-agency-hosted.json');p.add_argument('--wait-seconds',type=int,default=480);args=p.parse_args()
if args.origin!='https://v5ma.github.io':raise ValueError('This publication check is scoped to the public GitHub Pages origin.')
paths=['theology-wiki/san-reader.html','theology-wiki/data/build-report.json','theology-wiki/research-expansion-20260918/index.html','theology-wiki/research-expansion-20260918/notebook.json','theology-wiki/research-expansion-20260918/reader.js']
manifest=json.loads((HERE/'manifest.json').read_text())
paths += ['theology-wiki/content/developed/'+r['slug']+'.md' for r in manifest['articles']]
paths += ['theology-wiki/research-expansion-20260918/board-peace-followup/'+f for f in ['index.html','reader.js','register.json']]
expected={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in paths}
observed={};deadline=time.monotonic()+args.wait_seconds;attempt=0
while True:
 attempt+=1
 for path in paths:
  if observed.get(path,{}).get('matches_checkout'):continue
  url=args.origin+'/'+path+'?verification='+os.environ.get('GITHUB_SHA','current')
  try:
   request=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'TheologyWikiPublicationCheck/1.0'})
   with urllib.request.urlopen(request,timeout=15) as response:body=response.read();status=response.status
   digest=hashlib.sha256(body).hexdigest();observed[path]={'status':status,'sha256':digest,'expected_sha256':expected[path],'matches_checkout':digest==expected[path],'url':url}
  except Exception as exc:observed[path]={'matches_checkout':False,'error':str(exc),'url':url}
 if all(r.get('matches_checkout') for r in observed.values()):break
 if time.monotonic()>=deadline:break
 time.sleep(5)
report={'status':'passed' if all(r.get('matches_checkout') for r in observed.values()) else 'failed','checkout':os.environ.get('GITHUB_SHA'),'attempts':attempt,'files':observed,'scope':'Actual served files compared to checkout hashes, including the three follow-up assets. Browser behavior is checked in a separate step.'}
Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if report['status']!='passed':raise SystemExit(1)
