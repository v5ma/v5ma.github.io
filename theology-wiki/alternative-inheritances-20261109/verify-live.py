#!/usr/bin/env python3
"""Bounded verification of exact published bridge and preserved runtime bytes."""
import hashlib, json, time, urllib.request
from pathlib import Path
section = Path(__file__).resolve().parent
root = section.parent.parent
names = ['theology-wiki/alternative-inheritances-20261109/' + p.name
         for p in section.iterdir() if p.suffix in ['.html', '.js', '.css', '.json']]
names += [
 'theology-wiki/index.html', 'theology-wiki/san-reader.html',
 'theology-wiki/assets/js/research-tools.js',
 'theology-wiki/evidence-review-20261109/reader-guide.js',
 'theology-wiki/evidence-review-20261109/dead-sea-scrolls-dating.html',
 'theology-wiki/jesus-resurrection-empire-20261109/dead-sea-scrolls-jewish-diversity-and-empire.html',
 'theology-wiki/jesus-resurrection-empire-20261109/laughing-jesus-apocalypse-of-peter.html',
 'theology-wiki/jesus-resurrection-empire-20261109/search-index.json',
 'theology-wiki/jesus-resurrection-empire-20261109/search-data.js',
 'theology-wiki/latest/index.html', 'theology-wiki/latest/manifest.json',
 'theology-wiki/purpose/index.html', 'theology-wiki/purpose/reading-map.json',
]
expected = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in names}
remaining = dict(expected)
end = time.monotonic() + 720
while remaining and time.monotonic() < end:
 for name, digest in list(remaining.items()):
  try:
   request = urllib.request.Request('https://v5ma.github.io/' + name + '?inheritance=' + digest[:16],
       headers={'Cache-Control': 'no-cache', 'User-Agent': 'TheologyInheritanceVerification/1.0'})
   with urllib.request.urlopen(request, timeout=20) as r:
    data = r.read()
   if hashlib.sha256(data).hexdigest() == digest:
    remaining.pop(name)
  except Exception as e:
   print(name, type(e).__name__, flush=True)
 print('Pending exact bytes:', len(remaining), flush=True)
 if remaining:
  time.sleep(15)
if remaining:
 raise SystemExit('Published bytes not verified: ' + ', '.join(remaining))
report = {'status': 'PASS', 'proofLevel': 'live exact public bytes', 'files': expected}
out = section / 'qa/live'
out.mkdir(parents=True, exist_ok=True)
(out / 'byte-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'proofLevel': report['proofLevel'], 'files': len(expected)}))
