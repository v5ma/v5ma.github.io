"""One-time scoped package. Validate all source before replacing any file."""
from pathlib import Path
import json,hashlib,shutil
root=Path('svgn-planet');p=root/'lantern'
recipe=json.loads(Path('.github/upgrades/lantern-recipe.json').read_text())
for name,sha in recipe['before'].items():
 assert hashlib.sha256((p/name).read_bytes()).hexdigest()==sha,'Unexpected source: '+name
old=(root/'index.html').read_bytes()
assert hashlib.sha256(old).hexdigest()=='561e5cf886905544d765f65db9416051e4be72ee8507a340ce639b162df7c31e','Unexpected legacy entry'
assert not (root/'legacy.html').exists()
(root/'legacy.html').write_bytes(old)
(root/'legacy-release.json').write_bytes((root/'release.json').read_bytes())
for name,a,b in recipe['edits']:
 f=p/name;s=f.read_text();assert s.count(a)==1,(name,a,s.count(a));f.write_text(s.replace(a,b))
f=p/'core.test.mjs';f.write_text(f.read_text()+recipe['testExtra'])
f=p/'style.css';f.write_text(f.read_text()+recipe['cssExtra'])
f=root/'lantern-ward.html';s=f.read_text();s=s.replace('value="0.047"','value="0.04"').replace('value="-0.6"','value="-0.9"').replace('value="1.75"','value="1.55"');f.write_text(s)
for name,content in recipe['newFiles'].items():
 assert name.startswith('svgn-planet/') or name=='.github/workflows/neighborhood-lantern.yml'
 f=Path(name);f.parent.mkdir(parents=True,exist_ok=True);f.write_text(content)
files=list(root.glob('*.mjs'))+list(root.glob('*.css'))+[root/'legacy.html',root/'legacy-release.json']
for directory in ['assets','vendor']:
 files += [f for f in (root/directory).rglob('*') if f.is_file()]
manifest={'layout':'prototype-0.11.0','sourceRuntime':'83965798b63974232e82b7678e5bdd2fb8ea34a2','entry':'legacy.html','primarySaveKey':'svgn.paper-delivery-3d.v1','policy':'Frozen geometry/runtime, not a coordinate migration. New chapters use distinct layout identities.','files':[{'path':f.relative_to(root).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(set(files))]}
(root/'legacy-layout.json').write_text(json.dumps(manifest,indent=2)+'\n')
for name in ['coastal_browser_release','homecoming_browser','atmosphere-browser','tidewater-browser','grounded-browser']:
 f=root/'tests'/f'{name}.py';s=f.read_text();a="'http://127.0.0.1:8765/svgn-planet/'";assert s.count(a)==1;f.write_text(s.replace(a,"'http://127.0.0.1:8765/svgn-planet/legacy.html'"))
f=Path('.github/workflows/neighborhood-grounded-published.yml');s=f.read_text();a='GROUNDED_BASE: https://v5ma.github.io/svgn-planet/';assert s.count(a)==1;f.write_text(s.replace(a,a+'legacy.html'))
release={'version':'0.12.0','name':'Neighborhood Missions','edition':'Lantern Ward: The Broken Delivery Loop','date':'2026-09-15','entry':'lantern-ward.html','legacyEntry':'legacy.html','legacyRelease':'legacy-release.json','legacyLayout':'legacy-layout.json','quality':'Playable authored graybox; production art and fresh-player review remain open.','changes':['Three actual traversal approaches: market street, print-shop roof route, canal skiffs','Persistent far-side blue-door shortcut and repairable open-shaft goods hoist','Reversible sluice changes boat access into a maintenance walking route','Native first-person stereo VR and actual-geometry diorama VR/AR','Top, front or both openings; display cutaways never remove character collision','Direct Xbox actions and tracked-controller/joint-pinch XR panels','Separate chapter/layout save, guarded backups and original game retained byte-for-byte'],'acceptance':'Candidate; awaiting exact-source and published browser verification','evidence':'lantern/acceptance.json','validation':{'physicalQuest3Tested':False,'physicalXboxTested':False,'hardwareFrameTargetCertified':False,'humanLevelApproval':False}}
(root/'release.json').write_text(json.dumps(release,indent=2)+'\n')
(p/'acceptance.json').write_text(json.dumps({'version':'0.12.0','status':'candidate','published':False,'physicalHardwareTested':False,'legacyFilesPinned':len(manifest['files'])},indent=2)+'\n')
old=(root/'DEVELOPMENT-HANDOFF.md').read_text()
(root/'DEVELOPMENT-HANDOFF.md').write_text('# Lantern Ward playable candidate / v0.12.0\n\nRead lantern/README.md and lantern/acceptance.json first. The authored chapter and native spatial XR are now implemented. Do not infer publication from implementation: the exact source, nine browser suites and live byte/render gates must pass before the candidate becomes the default public entry. Physical Xbox/Quest and fresh-player level comprehension remain open.\n\nThe new default entry targets lantern-ward.html; legacy.html is a byte-identical archive of the prior entry. legacy-layout.json pins its runtime and assets. Never reinterpret old globe coordinates or write the old save from the new chapter.\n\nNext: verify all delivery approaches, open-shaft hoist and save recovery; obtain native XR controller/hand captures and human first-visit/replay feedback. Performance work supports this bounded authored chapter, not further map expansion.\n\n## Historical handoff\n\n'+old)
roadmap=json.loads((root/'production/roadmap.json').read_text());roadmap['version']='0.12.0';roadmap['reviewed']='2026-09-15';roadmap['releaseEvidence']='../lantern/acceptance.json'
for m in roadmap['milestones']:
 if m['id']=='M1':m['exitCriterion']='An authored Lantern Ward chapter with meaningful routes, state changes and a recognizable return shortcut before further map expansion.'
for ident,title,acceptance,nxt in [
 ('LEVEL-01','Authored Lantern Ward replacement chapter','Real street, roof, canal, sluice, hoist and far-side shortcut paths with persistent outcome handling.','Pass exact-source browser tours, then test unfamiliar-player understanding and replay agency.'),
 ('XR-02','Native first-person and actual-geometry VR/AR dioramas','Actual per-eye world geometry, tracked inputs, safe openings and display-only cutaways.','Pass native synthetic session tests; then measure actual Quest 3 comfort, Touch Plus, hand tracking and performance.'),
 ('LEGACY-01','Versioned original-world preservation','Freeze the prior entry and runtime/asset hashes; keep old save keys and geometry separate.','Keep legacy hash checks and all five legacy browser regressions passing.')]:
 assert not any(i['id']==ident for i in roadmap['items'])
 roadmap['items'].append({'id':ident,'milestone':'M1','priority':'P0','status':'implemented','title':title,'acceptance':acceptance,'next':nxt,'dependencies':[],'evidence':['../lantern/README.md','../lantern/acceptance.json'],'owner':'Level design / Engineering / QA','lastReviewed':'2026-09-15'})
(root/'production/roadmap.json').write_text(json.dumps(roadmap,indent=2)+'\n')
import subprocess
subprocess.run(['python','svgn-planet/production/render-roadmap.py'],check=True)
for name in ['.github/upgrades/finalize-lantern.py','.github/upgrades/lantern-recipe.json','.github/upgrades/package-lantern.py']:
 f=Path(name)
 if f.exists():f.unlink()
print('Prepared Lantern Ward and pinned',len(manifest['files']),'legacy files. No original save is migrated.')
