"""Produce a release manifest and verify additive public-host integration."""
from pathlib import Path
import hashlib,json,subprocess,re
ROOT=Path(__file__).resolve().parents[2];APP=ROOT/'prism-current';out=ROOT/'test-output';out.mkdir(exist_ok=True)
files=['index.html','projects.css','project-shortcuts.css']+['prism-current/'+p.name for p in APP.iterdir() if p.is_file() and p.suffix in ['.html','.js','.css','.svg','.json','.md']]+['prism-current/vendor/'+p.name for p in (APP/'vendor').iterdir() if p.is_file()]
files += [str(p.relative_to(ROOT)) for p in (APP/'graphics').glob('*') if p.is_file()]
for n in files:
 p=ROOT/n;assert p.is_file(),n
 if p.suffix in ['.js','.html','.css','.md'] and 'vendor' not in p.parts:
  s=p.read_text();assert not re.search(r'(sk-proj-|service_role|SUPABASE_SERVICE_ROLE|BEGIN PRIVATE KEY)',s),n
home=(ROOT/'index.html').read_text();assert home.count('id="prism-launch"')==1
assert 'href="./prism-current/index.html"' in home
manifest=json.loads((APP/'vendor/manifest.json').read_text());assert hashlib.sha256((APP/'vendor/aframe-1.8.0.min.js').read_bytes()).hexdigest()==manifest['sha256']
for ref in re.findall(r'(?:src|href)="\.\/([^"?#]+)',(APP/'index.html').read_text()):assert (APP/ref).is_file(),ref
info={'version':'0.2.0','source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'files':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in sorted(files)}}
(out/'prism-manifest.json').write_text(json.dumps(info,indent=2))
print('Verified',len(files),'public files, dependency integrity and homepage card.')
