"""Read-only proof that the public site serves this checkout's owned files."""
import hashlib, json, os, time, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files=['flight-deck.js','flight-deck-core.mjs','flight-deck.css','release-status.js','release.json','sw.js','development/AAA-ROADMAP.md','development/FLIGHT-DECK-0.16.md']
base='https://v5ma.github.io/mario-maker-clone/svgn-paper-route/'
sha=os.getenv('GITHUB_SHA','unknown');out=Path('/tmp/sky-cycle-flight-deck');out.mkdir(parents=True,exist_ok=True)
expected={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in files}
report={'commit':sha,'verified':False,'attempts':[]}
for attempt in range(40):
    rows=[]
    for name in files:
        row={'path':name,'expected':expected[name]}
        try:
            req=urllib.request.Request(base+name+'?flight-deck='+sha+'&attempt='+str(attempt),headers={'Cache-Control':'no-cache'})
            with urllib.request.urlopen(req,timeout=20) as response:
                row.update(status=response.status,actual=hashlib.sha256(response.read()).hexdigest())
            row['match']=row['actual']==row['expected']
        except Exception as error:row.update(match=False,error=str(error))
        rows.append(row)
    report['attempts'].append(rows);report['verified']=all(row['match'] for row in rows)
    (out/'publication.json').write_text(json.dumps(report,indent=2))
    print('Attempt',attempt+1,':',sum(row['match'] for row in rows),'/',len(files),'public files match',flush=True)
    if report['verified']:break
    time.sleep(10)
if not report['verified']:raise SystemExit('Public bytes do not match this commit; publication is not verified.')
print('VERIFIED public Sky Cycle Flight Deck:',sha,flush=True)
