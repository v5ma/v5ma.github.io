from pathlib import Path
import hashlib,json,re,subprocess
root=Path(__file__).resolve().parents[1];app=root/'vesperfall'
vendor=json.loads((app/'vendor/manifest.json').read_text())
assert hashlib.sha256((app/'vendor/aframe-1.8.0.min.js').read_bytes()).hexdigest()==vendor['sha256']
files=sorted(str(p.relative_to(root)) for p in app.iterdir() if p.is_file() and p.suffix in ('.html','.js','.css','.json','.svg','.md'))
files += sorted(str(p.relative_to(root)) for folder in ['assets','vendor'] for p in (app/folder).rglob('*') if p.is_file())
registry=json.loads((app/'assets/cathedral/ASSET-REGISTER.json').read_text())
for asset in registry['assets']:
 assert hashlib.sha256((app/'assets/cathedral'/asset['file']).read_bytes()).hexdigest()==asset['sha256'],asset['file']
for name in files:
 p=root/name;assert p.is_file(),name
 if '/vendor/' not in name and p.suffix in ('.html','.js','.css','.json','.svg','.md'):
  assert not re.search(r'v5ma2026|NerveGear|sk-proj-|service_role|SUPABASE_SERVICE',p.read_text(),re.I),name
html=(app/'index.html').read_text()
assert 'vendor/aframe-1.8.0.min.js' in html and '<a-scene' in html
assert not re.search(r'<script[^>]+src=["\']https?:',html)
assert './vesperfall/index.html' in (root/'index.html').read_text()
for source in re.findall(r'<script[^>]+src=["\']([^"\']+)',html):
 assert (app/source.split('?')[0]).is_file(),source
manifest={'version':json.loads((app/'release.json').read_text())['version'],'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'files':{name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in files}}
(root/'test-output').mkdir(exist_ok=True)
(root/'test-output/vesperfall-manifest.json').write_text(json.dumps(manifest,indent=2))
print('Public Vesperfall build:',len(files),'files; complete runtime, vendor integrity, local dependencies and privacy boundary checks passed.')
