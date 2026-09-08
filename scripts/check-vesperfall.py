from pathlib import Path
import hashlib,json,re,subprocess
root=Path(__file__).resolve().parents[1];app=root/'vesperfall';vendor=json.loads((app/'vendor/manifest.json').read_text());assert hashlib.sha256((app/'vendor/aframe-1.8.0.min.js').read_bytes()).hexdigest()==vendor['sha256']
files=['index.html','projects.css','gloamward/index.html']+['vesperfall/'+n for n in ['districts.js','cathedral-art.js','cathedral-ui.js','cathedral.css','index.html','style.css','unchained.css','hunt.css','hunt.js','encounters.js','chronicle.js','arsenal.js','architecture.js','gothic-art.js','core.js','input.js','art.js','app.js','cover.svg','roadmap.html','roadmap.json','README.md','release.json','vendor/aframe-1.8.0.min.js','vendor/AFRAME-LICENSE.txt','vendor/manifest.json']]
asset_root=app/'assets/cathedral'
registry=json.loads((asset_root/'ASSET-REGISTER.json').read_text())
for a in registry['assets']:
 assert hashlib.sha256((asset_root/a['file']).read_bytes()).hexdigest()==a['sha256'],a['file']
files += [str(p.relative_to(root)) for p in asset_root.iterdir() if p.is_file()]
for name in files:
 p=root/name;assert p.is_file(),name
 if name.startswith('vesperfall/') and '/vendor/' not in name and p.suffix not in ['.jpg','.glb']:
  s=p.read_text();assert not re.search(r'v5ma2026|NerveGear|sk-proj-|service_role|SUPABASE_SERVICE',s,re.I),name
html=(app/'index.html').read_text();assert 'vendor/aframe-1.8.0.min.js' in html and '<a-scene' in html
assert not re.search(r'<script[^>]+src=["\']https?:',html)
assert all(x in (root/'index.html').read_text() for x in ['./vesperfall/index.html','./rainward/index.html','./aether-reach/index.html','./dino-atlas/index.html','./theology-wiki/san-reader.html','./mario-maker-clone/svgn-paper-route/index.html','./leonardos-guild/index.html','./svgn-planet/index.html','./little-planet/'])
manifest={'version':json.loads((app/'release.json').read_text())['version'],'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'files':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in files}}
(root/'test-output').mkdir(exist_ok=True);(root/'test-output/vesperfall-manifest.json').write_text(json.dumps(manifest,indent=2));print('Public build:',len(files),'files; vendor integrity and boundary checks passed.')
