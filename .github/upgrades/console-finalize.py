"""Scoped release preparation for the console work branch; never edits saves or sibling games."""
from pathlib import Path
import json,re,subprocess
root=Path('svgn-planet');release=json.loads((root/'release.json').read_text())
if release['version']=='0.16.1':
 print('Release records already prepared.');raise SystemExit(0)
assert release['version']=='0.16.0'
notes='''# Neighborhood Missions 0.16.1 / Spatial Console

This upgrade stays inside Neighborhood Missions. No private hub source, cross-site travel, walking/sphere portals or A-Frame wrapper is included. The existing native WebXR renderer and eight views remain. Desktop HTML accessibility controls and historical recovery entries remain; this is the unified main game's spatial UI, not a claim that every desktop control has been converted to canvas.

## Use

Open the usual Menu: Y in the default right-handed Action profile, B with left-handed primary controls, or the deliberate raised-pinch gesture. A floor disc is discoverable when looking down; point and select to summon it. The console rises from a flat floor position, stays fixed as you look or lean, and stows on resume. Changing pages does not reposition it. Place console here deliberately relocates it.

Spatial UI / floor and controller is available from the main menu, district menu and AR/VR options. Adjust height, distance and scale; choose floor or free-controller mounting; select raised-hand, floor or off for the compact objective/map card; disable rise animation. System reduced-motion preference also disables the animation. Local-floor tracking is used when available; otherwise height is estimated and identified as such. This is not room scanning, real obstacle detection or persistent room anchoring.

Buttons have real raised scene geometry, a contact dot and hover/press feedback. Controller trigger and hand pinch use those hit surfaces. Neither menu nor HUD is attached to the headset camera. When the free controller is raised, the compact card shows the current objective, next-step distance, active ride/tool and existing mission map. Lower it to clear the view. The floor-card alternative is revealed by looking down. Mission selection changes the tracked target, not completion or credits.

Action profile offers explicit primary-trigger vehicle speed. Hold to accelerate and release to stop; off-hand grip brakes. On foot the existing aim/strike/tool mapping remains. Disable the preference for prior stick-click driving. Xbox and Courier profile mappings are retained. Presentation preferences use only svgn.neighborhood-spatial-console.v1, separate from every gameplay save and reward ledger.

## Evidence and limits

All 333 integrated model/input tests passed, including 18 new presentation tests. The new mesh tests use real Three mathematics with fake canvas, not physical devices. console-browser.py runs each of the eight modes on the main URL and checkpoints evidence after every step. It covers menu stability, transforms, stow, controller HUD, speed release, floor summon, mission selection, maps, cancel-first save restore, hands, tracking loss and exit.

The first browser attempt rendered the console and passed fixed-transform assertions, then timed out capturing the HTML mirror. Its failed artifacts are retained. The retry reads actual WebGL pixels after a rendered frame and suppresses the obsolete HTML-dialog mirror during XR. It does not assign gameplay state or remove interaction assertions. Actual final outcomes belong in the external release receipt; a test file alone is not a pass.

Physical Quest/Touch Plus/hand tracking, reach, comfort, sustained performance, human readability and mission comprehension remain unverified. Earlier incomplete campaign acceptance remains separate. Next work is owner review of console reach and current-goal clarity in both neighborhoods, followed by focused mission-source/entrance/return guidance rather than more unrelated systems.
'''
(root/'SPATIAL-CONSOLE.md').write_text(notes)
release.update(version='0.16.1',edition='Unified Neighborhoods / Spatial Console',date='2026-09-20',publicationEvidence='../release-receipts/neighborhood-missions-spatial-console-0.16.1.json',previousPublicationEvidence='../release-receipts/neighborhood-missions-unified-0.16.0.json',runtimeCheckpoint='2c888c231b40800c87676fa9a0d5fab256c5c398',sourceAcceptanceRuns=[35551197282])
release['changes']=['Summonable floor rotunda or free-controller menu, saved height/distance/scale, raised raycast buttons and native pinch interaction.','Compact free-hand or floor objective/map card, never attached to the headset.','Explicit Action-profile primary-trigger vehicle speed with on-foot, Courier and Xbox controls preserved.','Existing city, Lantern Ward, eight native modes, legacy saves and independent reward ledgers retained.']
release['validation'].update(localModelTestsPassed=333,newPresentationTests=18)
(root/'release.json').write_text(json.dumps(release,indent=2)+'\n')
r=json.loads((root/'production/roadmap.json').read_text());r.update(version='0.16.1',edition=release['edition'],reviewed='2026-09-20',releaseEvidence='../../../release-receipts/neighborhood-missions-spatial-console-0.16.1.json')
nexts={'ACCESS-01':'Validate owner reach, text size, controller/hand selection and all menu paths with the new console. Desktop HTML fallback remains accessible; a screen-canvas rewrite is not claimed.','XR-02':'Physically test stable floor placement, free-hand mounting, hand pinch, portal sightlines and seated reach in all eight modes. No framework migration or external hub integration.','LEVEL-01':'Use the current objective/map card to evaluate unfamiliar-player next-step comprehension in both neighborhoods. Improve mission source, relevant entrance and return-route clarity before adding geography.'}
for i in r['items']:
 if i['id'] in nexts:
  i['next']=nexts[i['id']];i['lastReviewed']='2026-09-20';i['evidence']+=['../SPATIAL-CONSOLE.md','../console-browser.py']
(root/'production/roadmap.json').write_text(json.dumps(r,indent=2)+'\n')
subprocess.run(['python','svgn-planet/production/render-roadmap.py'],check=True)
p=root/'DEVELOPMENT-HANDOFF.md';p.write_text('# Neighborhood Missions 0.16.1 spatial-console handoff\n\nRead release.json, SPATIAL-CONSOLE.md and the external receipt first. This is only the native in-game floor/controller UI and explicit vehicle-trigger preference. No private hub implementation, external portals or framework migration. Presentation preferences are separate from all saves. All 333 model/input tests passed; consult exact rendered and public reports rather than treating source counts as physical approval. Preserve all 102 legacy files and concurrent sibling work. The earlier handoff follows as historical context.\n\n'+p.read_text())
p=root/'index.html';text=p.read_text();m=re.search(r'<script type="importmap">(.*?)</script>',text,re.S);assert m
mapping=json.loads(m.group(1))
for name in ['main-hub','unified-xr','console-state','spatial-console','console-settings']:mapping['imports']['./'+name+'.mjs']='./'+name+'.mjs?v=0.16.1'
text=text[:m.start(1)]+json.dumps(mapping,separators=(',',':'))+text[m.end(1):]
text=text.replace('./main-app.mjs?v=0.16.0','./main-app.mjs?v=0.16.1').replace('/ v0.16.0','/ v0.16.1');p.write_text(text)
