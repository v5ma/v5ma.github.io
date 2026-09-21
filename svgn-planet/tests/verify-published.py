"""Verify actual served game files, entry and cache-revision URLs against checkout.
This is separate from source tests and does not edit the repository or game saves.
"""
import argparse,concurrent.futures,hashlib,json,os,re,time
from pathlib import Path
from urllib.parse import quote,urlsplit
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
BASE='https://v5ma.github.io/'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('published-results/bytes.json'))
    parser.add_argument('--deadline-seconds',type=int,default=1500)
    args=parser.parse_args()
    paths=sorted(p for p in ROOT.rglob('*') if p.is_file() and not any(x.startswith('.') or x in ('tests','tools','node_modules','__pycache__') for x in p.relative_to(ROOT).parts) and p.suffix not in ('.py','.pyc'))
    paths.extend(REPO/'level-design-library/applied'/name for name in ['NEIGHBORHOOD-MISSIONS-WORKING-QUAY.md','NEIGHBORHOOD-MISSIONS-LIVING-PORTAL.md','NEIGHBORHOOD-MISSIONS-NIGHT-WATCH.md','NEIGHBORHOOD-MISSIONS-NIGHT-WATCH-CAMPAIGN.md'])
    expected={p.relative_to(REPO).as_posix():{'expected':hashlib.sha256(p.read_bytes()).hexdigest(),'sourcePath':p.relative_to(REPO).as_posix()} for p in paths}
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    imports=json.loads(re.search(r'<script type="importmap">(.*?)</script>',html,re.S).group(1))['imports']
    expected['svgn-planet/']={**expected['svgn-planet/index.html'],'alias':True}
    for target in imports.values():
        if 'rev=master-reconcile-1' not in target:continue
        name='svgn-planet/'+target.removeprefix('./');path=name.split('?',1)[0]
        expected[name]={**expected[path],'alias':True}
    rows={};homepage_link=False;release=json.loads((ROOT/'release.json').read_text());commit=os.getenv('COMMIT',os.getenv('GITHUB_SHA','local-check'))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    def check(name):
        spec=expected[name];row={'path':name,**spec,'matches':False,'checkedAtUTC':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
        try:
            # Keep the real revision query and independently bypass HTTP caches.
            sep='&' if '?' in name else '?';url=BASE+quote(name,safe='/?=&')+sep+'verify='+quote(commit)+'&stamp='+str(time.time_ns())
            with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=20) as response:
                assert response.status==200
                data=response.read();mime=response.headers.get_content_type()
            row.update(sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),contentType=mime)
            row['matches']=row['sha256']==spec['expected'] and (not spec['sourcePath'].endswith('.mjs') or mime in ('text/javascript','application/javascript'))
        except Exception as exc:row['error']=str(exc)
        return row
    def record(success=False,stable=False):
        payload={'commit':commit,'version':release['version'],'revision':release.get('revision'),'fileCount':len(paths),'aliasCount':len(expected)-len(paths),'files':[rows[k] for k in sorted(rows)],'scope':'Neighborhood game, preserved legacy, applied game designs and exact revisioned UI entry URLs. No sibling runtime writes.','success':success,'stableSecondPass':stable,'homepageGameLink':homepage_link}
        temp=args.output.with_suffix('.pending');temp.write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8');temp.replace(args.output)
    deadline=time.monotonic()+args.deadline_seconds
    stable=False
    while time.monotonic()<deadline:
        pending=[p for p in expected if not rows.get(p,{}).get('matches')]
        if not pending:
            # A final complete pass prevents accumulating old successes across
            # different in-flight deployments and calling that a coherent build.
            pending=list(expected);stable=True
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            for row in pool.map(check,pending):rows[row['path']]=row
        count=sum(r['matches'] for r in rows.values());ok=count==len(expected)
        if ok and stable:
            try:
                with urlopen(Request(BASE+'?verify='+quote(commit),headers={'Cache-Control':'no-cache'}),timeout=20) as response:
                    home=response.read().decode('utf-8')
                homepage_link=bool(re.search(r'''href=["'][^"']*svgn-planet/''',home))
            except Exception:homepage_link=False
            ok=ok and homepage_link
        record(ok and stable,stable and ok)
        print('Matched',count,'of',len(expected),'served requests; final pass',stable,flush=True)
        if ok and stable:return
        if not ok:stable=False
        time.sleep(5 if ok else 10)
    record();raise SystemExit('Public files or module MIME still differ; publication is not verified.')

if __name__=='__main__':main()
