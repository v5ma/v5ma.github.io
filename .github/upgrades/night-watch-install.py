"""One-time source import; runtime payload and all preimages are pinned."""
import base64, hashlib, json, lzma, pathlib, re, subprocess, os
ROOT=pathlib.Path('.')
EXPECTED='e3005358173544595ffd9251c86a3622d4a1258488a5cc7589320aea18245607'
BRANCH='neighborhood-missions/night-watch-recovery-20260917'
MARKER=ROOT/'svgn-planet/production/evidence/night-watch-0.14.0/recovery.json'
def sha(b): return hashlib.sha256(b).hexdigest()
def dump(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,indent=2)+'\n')
def checked_legacy():
 rows=json.loads(pathlib.Path('svgn-planet/legacy-layout.json').read_text())['files']
 for row in rows: assert sha(pathlib.Path('svgn-planet',row['path']).read_bytes())==row['sha256'],row['path']
 return len(rows)
if not MARKER.exists():
 chunks=[pathlib.Path(f'.github/upgrades/night-watch-{n}.b64').read_text().strip() for n in range(1,9)]
 raw=lzma.decompress(base64.b64decode(''.join(chunks),validate=True))
 assert sha(raw)==EXPECTED,'Payload checksum failed; no source applied'
 payload=json.loads(raw);legacy_count=checked_legacy()
 paths=sorted(payload['baseHashes'])
 for name,expected in payload['baseHashes'].items():
  p=pathlib.Path(name)
  assert name.startswith('svgn-planet/') and '..' not in p.parts
  assert (not p.exists()) if expected is None else sha(p.read_bytes())==expected,('Preimage mismatch',name)
 patch=payload['runtimePatch'].encode()
 found=sorted(re.findall(r'^diff --git a/(\S+) b/\S+$',patch.decode(),re.M))
 assert found==paths,('Unexpected patch paths',found)
 subprocess.run(['git','apply','--check','-'],input=patch,check=True)
 archive=pathlib.Path('svgn-planet/production/handoffs/before-night-watch-recovery-20260917')
 for name in ['DEVELOPMENT-HANDOFF.md','release.json','production/roadmap.json','AAA_ROADMAP.md','README.md']:
  source=pathlib.Path('svgn-planet',name);out=archive/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(source.read_bytes())
 subprocess.run(['git','apply','-'],input=patch,check=True)
 for name,expected in payload['expectedRuntimeHashes'].items(): assert sha(pathlib.Path(name).read_bytes())==expected,name
 for row in payload['files']:
  p=pathlib.Path(row['path']);assert '..' not in p.parts
  assert row['path'].startswith('svgn-planet/') or row['path']=='level-design-library/applied/NEIGHBORHOOD-MISSIONS-NIGHT-WATCH.md'
  if row.get('requireAbsent'): assert not p.exists(),row['path']
  data=row['content'].encode();assert sha(data)==row['sha256'],row['path']
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 # Retain current prepared-release metadata. Apply only the named item delta;
 # evidence lists are merged rather than dropping the Living Portal record.
 path=pathlib.Path('svgn-planet/production/roadmap.json');roadmap=json.loads(path.read_text());notes=[]
 original_ids=[x['id'] for x in roadmap['items']]
 roadmap.update(payload['roadmapRootDelta']);roadmap['edition']='Lantern Ward: Night Watch (candidate)'
 for delta in payload['roadmapItems']:
  item=next((x for x in roadmap['items'] if x['id']==delta['id']),None)
  before=delta['before'] or {};after=delta['after']
  if not before:
   assert item is None,delta['id'];roadmap['items'].append(after);continue
  assert item is not None,delta['id']
  for key,value in after.items():
   if value==before.get(key):continue
   if key=='evidence': item[key]=list(dict.fromkeys(item.get(key,[])+value));continue
   if item.get(key)!=before.get(key) and item.get(key)!=value:
    notes.append({'id':item['id'],'field':key,'preparedValue':item.get(key),'candidateValue':value})
    if isinstance(value,str) and key in ('next','acceptance'):
     value=item[key]+' Night Watch continuation: '+value
    else:raise AssertionError(('Conflicting roadmap field',item['id'],key))
   item[key]=value
 assert set(original_ids).issubset(x['id'] for x in roadmap['items'])
 dump(path,roadmap)
 subprocess.run(['python','svgn-planet/production/render-roadmap.py'],check=True)
 release_path=pathlib.Path('svgn-planet/release.json');release=json.loads(release_path.read_text())
 release['evidence']='production/evidence/night-watch-0.14.0/recovery.json'
 release['validation']['remoteCommitted']=True
 release['quality']='Recovered authored candidate; real browser, physical-device and publication acceptance remain open.'
 dump(release_path,release)
 dump(MARKER,{'version':'0.14.0','payloadSHA256':EXPECTED,'localCandidateCommit':payload['localCommit'],'foundationCommit':payload['preparedBaseline'],'branch':BRANCH,'status':'Remote source candidate; rendered acceptance and public verification pending','historicalEvidence':'local-acceptance.json','priorWriteAvailabilityClaim':'The earlier local receipt described a temporary tool state. Actual branch and source writes succeeded on retry.','legacyHashesUnchanged':legacy_count,'runtimeHashes':payload['expectedRuntimeHashes'],'roadmapReconciliation':notes,'physicalDevicesTested':False,'published':False})
 assert checked_legacy()==legacy_count
else:
 assert json.loads(MARKER.read_text())['payloadSHA256']==EXPECTED
 # A rerun must still test the exact immutable imported runtime, not edited code.
 for name,value in json.loads(MARKER.read_text())['runtimeHashes'].items(): assert sha(pathlib.Path(name).read_bytes())==value,name
command='node --test svgn-planet/tests/*.test.mjs svgn-planet/design/chapter-contract.test.mjs svgn-planet/lantern/*.test.mjs'
run=subprocess.run(command,shell=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
pathlib.Path('night-watch-model.txt').write_text(run.stdout)
print(run.stdout[-1200:],flush=True)
assert run.returncode==0,'Model tests failed; source was not committed'
for name in pathlib.Path('svgn-planet/lantern').glob('*.mjs'): subprocess.run(['node','--check',str(name)],check=True)
for name in pathlib.Path('svgn-planet/lantern').glob('*.py'): compile(name.read_text(),str(name),'exec')
if os.environ.get('NIGHT_WATCH_DRY_RUN')!='1':
 changed=subprocess.check_output(['git','diff','--name-only'],text=True).splitlines()
 added=subprocess.check_output(['git','ls-files','--others','--exclude-standard','svgn-planet','level-design-library/applied'],text=True).splitlines()
 assert all(p.startswith('svgn-planet/') or p=='level-design-library/applied/NEIGHBORHOOD-MISSIONS-NIGHT-WATCH.md' for p in changed+added),changed+added
 subprocess.run(['git','config','user.name','github-actions[bot]'],check=True)
 subprocess.run(['git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com'],check=True)
 subprocess.run(['git','add','svgn-planet','level-design-library/applied/NEIGHBORHOOD-MISSIONS-NIGHT-WATCH.md'],check=True)
 if subprocess.run(['git','diff','--cached','--quiet']).returncode:
  subprocess.run(['git','commit','-m','feat(neighborhood): recover Night Watch hidden XR UI and optional signal case'],check=True)
  subprocess.run(['git','push','origin','HEAD:'+BRANCH],check=True)
 commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
 with open(os.environ['GITHUB_OUTPUT'],'a') as out:out.write('commit='+commit+'\n')
 pathlib.Path('SOURCE-COMMIT.txt').write_text(commit+'\n')
