"""Exact scoped release assembly; workbook members originate in artifact_tool."""
from pathlib import Path
import base64,hashlib,io,json,re,zipfile,zlib
app=Path('vesperfall')
p=app/'roadmap.json';r=json.loads(p.read_text());assert r['version']=='0.15.0'
r['version']='0.16.0';r['updated']='2026-09-17'
r['scope']='Goldwind adds an explicit physical bow preset to the existing Open Line cathedral: temporary golden teleport draws, tracked short-range disk throws, bow-hand directional shield and direct reach quiver. Classic, crossbow and Xbox controls and all saved layouts remain. No new campaign region or procedural generator is claimed.'
for t in r['tasks']:
 if t['id'] in ['V02','V04','V18','V19','V24','V41','V45','V49','V65','V68']:
  for e in ['GOLDWIND.md','goldwind-model.js','goldwind-xr.js','tests/goldwind.test.cjs','tests/goldwind-browser.py']:
   if e not in t['evidence']:t['evidence'].append(e)
  t['release']='0.16.0 Goldwind'
  t['verification']+=' Goldwind adds an opt-in physical bow preset; exact model, native input and publication outcomes belong in its versioned evidence receipt. Classic/crossbow and Xbox remain. Real-device ergonomics and human acceptance are not closed.'
 if t['id']=='V24':
  t['status']='Partial';t['verification']='Physical disk acquisition, recent-motion release recognition, swept flight and supported-ground relocation are implemented for the Goldwind bow preset. A drop, pose jump, missing tracking or blocked impact cannot teleport. Richer generated route families and physical-device approval remain open.'
 if t['id']=='V19':t['gate']="Retain supported-ground button steps in Classic/Xbox. Goldwind's thrown disk must resolve real flight before one charged relocation, with continuous support, footprint clearance and no cliff crossing or wall tunneling."
 if t['id']=='V04':t['gate']+=' Goldwind travel is a temporary physically nocked golden arrow, not an equipment toggle. Its default hides arc/ring; an optional drawing-only path cannot authorize invalid landings.'
 if t['id']=='V45':t['gate']+=' Classic retains six-arrow radial selection. Goldwind reveals five damage-arrow models near the bow; a fresh other-hand trigger at a stocked arrow selects it. Travel is a separate gesture.'
r['deviceQA'][0][3]='Classic and Goldwind bow, both handedness settings, near-nock face-button travel, deliberate disk release/drop, shield-binding alternatives, physical quiver and retained crossbow'
r['deviceQA'][0][4]='V02,V04,V18,V24,V25,V45,V61'
r['deviceQA'][4][3]='Suspend while drawing or holding/flying disk; hand/controller changes; held input acquisition; no stray release or save loss'
r['nextRelease']={'theme':'Validate Goldwind physical comfort and shot/travel/recovery decisions in Open Line before reusable encounter generation.','focus':['V24','V49','V52','V57','V61','V62','V65','V68','V75','V76','V50','V64','V41','V58','V74','V59'],'note':'Next technical extension: authored encounter modules with separate walking, shot and Blink relationships and deterministic independent streams. Begin only from the existing tested physical loop; retain all three layout IDs and real old-save fixtures. Real hardware, new-player understanding, final art/audio and second chapter remain open.'}
c=r['continuation'];c.update(updated='2026-09-17',gameVersion='0.16.0',auditedBase='acf522b290b051479c8d7868bee560635b0a9c8c')
c['designGaps'][0]='Goldwind bow now implements a physically thrown supported-ground disk; Classic/Xbox retain the earlier step. Richer procedural encounter families and real throw ergonomics remain open (V24).'
c['goldwind']={'basis':'User attachment Pasted markdown(20260917-220755).md, physical-interaction discussion and public studio level-design library.','hypothesis':'Independent physically acquired movement and combat arrows, a deliberate escape throw and reach quiver should reduce control friction while preserving consequential firing-position decisions.','primaryObservation':'Real input-driven firing, travel after impact, no persistent arc/ring, equipment/ammo preservation, deliberate throw versus drop, neutral recovery and unchanged old controls/saves.','boundary':'Opt-in bow preset. Classic remains default; crossbow uses its Classic bindings. No new regions, enemy roster or generator.','guardrails':['No actor/resource/progress assignments for native acceptance.','No saved layout changes.','No hidden remap of existing users.','Transient held/in-flight disk cancels on pause, loss or mode change before charge spend.','Real Quest/Xbox, comfort, performance and unfamiliar-player gates remain open.']}
c['firstActions'].insert(0,{'tasks':['V02','V04','V18','V24','V45','V49','V75'],'action':'Read GOLDWIND.md and exact publication evidence; validate the opt-in bow preset on physical Quest 3. Observe errors while moving between combat arrows, golden draws, shield, physical quiver and escape disk in the existing chapter. Retain Classic/crossbow and Xbox shortcuts; do not infer ergonomics from synthetic poses.'})
data=(json.dumps(r,indent=2,ensure_ascii=False)+'\n').encode();assert hashlib.sha256(data).hexdigest()=='0189dec4b3dbf791dd5ac6eb7c8f913c64280c5766dfb472cb8fe5166791dfb7';p.write_bytes(data)
release=json.loads((app/'release.json').read_text());release.update(version='0.16.0',name='goldwind',date='2026-09-17',scope='Goldwind opt-in physical bow controls: temporary golden travel draw, tracked thrown disk, bow-hand directional shield and reach quiver inside existing Open Line. No campaign or generator replacement.',saveCompatibility='All three existing layout identities, profile/envelope keys, rewards and Xbox shortcuts remain. Classic is default; crossbow retains Classic roles. Explicit physical preferences persist independently. Pause cancels uncommitted disk flight without spending a shard.')
(app/'release.json').write_text(json.dumps(release,indent=2)+'\n')
p=app/'core.js';s=p.read_text();assert s.count('0.15.0')==1;p.write_text(s.replace('0.15.0','0.16.0'))
p=app/'index.html';p.write_text(p.read_text().replace('0.15.0','0.16.0'))
intro='Goldwind / version 0.16.0 / September 17, 2026.\n\nRead GOLDWIND.md for the explicit physical bow preset. Enable it with Use Goldwind physical bow controls or Settings / Bow controls. Draw trigger fires the selected damage arrow; draw-hand A/B physically nocks a temporary golden travel arrow; draw grip holds a disk to throw; bow trigger shields (grip alternative); hold bow X/Y and reach/trigger-select an arrow. Draw-stick click pauses. Classic remains default, crossbow retains Classic roles, and Xbox shortcuts are unchanged. All existing saved layouts and chapter outcomes remain. This release adds no new generator, enemy roster or second authored chapter. Exact software/public results belong in tests/evidence/goldwind-0.16.0/; physical/human gates remain open.\n\n'
for name in ['README.md','DEVELOPMENT-HANDOFF.md','AAA-ROADMAP.md']:
 p=app/name;p.write_text(intro+p.read_text())
# Lossless transport of the checked artifact_tool export. No worksheet decisions here.
raw=zlib.decompress(base64.b64decode(Path('.github/goldwind-workbook.b64').read_text().strip()))
assert hashlib.sha256(raw).hexdigest()=='9e40c9320b2e274ec6a1ae674518b8d495103d4b39f2949c8c630b6438b6e4dc'
record=json.loads(raw);p=app/'AAA-PRODUCTION.xlsx';old=p.read_bytes();assert hashlib.sha256(old).hexdigest()==record['old'];src=zipfile.ZipFile(io.BytesIO(old));out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for member in record['members']:
  tokens=re.split(r'(?<=>)',src.read(member['name']).decode())
  for start,count,replacement in reversed(member.get('tokenEdits',[])):tokens[start:start+count]=replacement
  data=''.join(tokens).encode();assert hashlib.sha256(data).hexdigest()==member['rawSha']
  info=zipfile.ZipInfo(member['name'],(2026,9,17,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data,compresslevel=9)
assert hashlib.sha256(out.getvalue()).hexdigest()==record['new'];p.write_bytes(out.getvalue())
print('Exact canonical roadmap and artifact-authored workbook synchronized.')
