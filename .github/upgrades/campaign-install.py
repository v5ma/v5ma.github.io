import base64,hashlib,json,lzma,pathlib,subprocess
BASE='0551b213b5dc1cf698464b18479731204a5dfad2'
B64_SHA='8252282c2395b31b90b6e604b3cb521fac57b56721025d7fc38be09939b50744'
RAW_SHA='04aa25c49b47b78e3d8c0725930ca0f1d6f6077d40457a704263a84612e3ffac'
root=pathlib.Path('.')
subprocess.run(['git','diff','--exit-code',BASE,'--','svgn-planet','level-design-library/applied/NEIGHBORHOOD-MISSIONS-NIGHT-WATCH-CAMPAIGN.md'],check=True)
expected=[f'campaign-canon-{i:02d}.b64' for i in range(1,14)]
parts=[pathlib.Path('.github/upgrades')/name for name in expected]
assert all(p.exists() for p in parts),[p.name for p in parts if not p.exists()]
encoded=''.join(p.read_text().strip() for p in parts)
assert hashlib.sha256(encoded.encode()).hexdigest()==B64_SHA,'Campaign transfer base64 checksum mismatch'
raw=lzma.decompress(base64.b64decode(encoded,validate=True))
assert hashlib.sha256(raw).hexdigest()==RAW_SHA,'Campaign payload checksum mismatch'
payload=json.loads(raw)
assert payload['version']==1 and payload['base']==BASE
files=payload['files']; assert len(files)==25
paths=[f['path'] for f in files]; assert len(paths)==len(set(paths))
for path in paths:
    assert path.startswith('svgn-planet/') or path=='level-design-library/applied/NEIGHBORHOOD-MISSIONS-NIGHT-WATCH-CAMPAIGN.md',path
    assert not path.startswith('svgn-planet/legacy'),path
for f in files:
    p=pathlib.Path(f['path']);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(f['content'])
legacy=json.loads(pathlib.Path('svgn-planet/legacy-layout.json').read_text())
for row in legacy['files']:
    p=pathlib.Path('svgn-planet')/row['path']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],row['path']
cmd=['node','--test']+[str(p) for p in sorted(pathlib.Path('svgn-planet/tests').glob('*.test.mjs'))]+['svgn-planet/design/chapter-contract.test.mjs']+[str(p) for p in sorted(pathlib.Path('svgn-planet/lantern').glob('*.test.mjs'))]
with open('campaign-model.txt','w') as out: subprocess.run(cmd,stdout=out,stderr=subprocess.STDOUT,check=True)
text=pathlib.Path('campaign-model.txt').read_text();assert '# tests 281' in text and '# pass 281' in text and '# fail 0' in text,text[-2000:]
for p in sorted(pathlib.Path('svgn-planet/lantern').glob('*.mjs')): subprocess.run(['node','--check',str(p)],check=True)
subprocess.run(['python3','-m','py_compile',*map(str,sorted(pathlib.Path('svgn-planet/lantern').glob('*.py'))),*map(str,sorted(pathlib.Path('svgn-planet/tests').glob('*.py')))],check=True)
subprocess.run(['git','config','user.name','github-actions[bot]'],check=True)
subprocess.run(['git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com'],check=True)
subprocess.run(['git','add',*paths],check=True)
changed=subprocess.check_output(['git','diff','--cached','--name-only'],text=True).splitlines();assert set(changed)==set(paths),(set(paths)-set(changed),set(changed)-set(paths))
subprocess.run(['git','commit','-m','feat(neighborhood): add Night Watch campaign traversal, stealth and freeflow systems'],check=True)
subprocess.run(['git','push','origin','HEAD:neighborhood-missions/night-watch-recovery-20260917'],check=True)
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();pathlib.Path('CAMPAIGN-SOURCE-COMMIT.txt').write_text(sha+'\n')
print('Campaign source committed',sha)
