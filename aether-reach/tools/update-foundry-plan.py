"""Reconcile the public production plan with verified source; preserve task IDs."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'roadmap.json';plan=json.loads(p.read_text());tasks={t['id']:t for t in plan['tasks']}
plan.update(updated='2026-09-12',release='0.8.0 Foundry Finish',notice='AAA-quality is a production target, not a certification or a percentage inferred from task counts. Software implementation, browser validation, publication, player approval and physical hardware acceptance are separate. Local board edits never publish the game.')
def revise(id,status,evidence,next,depends=None):
 t=tasks[id];t.update(status=status,evidence=evidence,next=next)
 if depends is not None:t['depends']=depends
revise('I04','Implemented','v0.6 introduced safe binding swaps and stored comfort settings. v0.8 labels match the revised combat layout.','Run the physical Xbox USB and Bluetooth matrix; retain fixed A/B/Menu navigation.')
revise('W01','Implemented','v0.5/v0.6 source contains 12 districts, five enterable rooms, rooftop ladders, puzzles and 13 side adventures. This is not a completed campaign.','Finish and playtest one authored interior-to-rooftop exploration loop.',['A01'])
revise('W02','In review','Licensed Quay assets and original procedural audio are in the source. v0.8 adds textured combat cover, visible Tavi and tactical art. Full asset production remains unfinished.','Use P01-P05 acceptance gates instead of treating a material pass as finished AAA art.',['A01'])
revise('C02','In review','v0.7 has humanoid arena encounters. v0.8 fixes missing arena home/patrol initialization and adds all-three-arena simulation checks.','Review combat fairness, readable silhouettes, cover and ammunition balance with a player.',['B01','B04'])
revise('C03','In review','Authored cover rifts have timed collision and occupied-placement rejection; v0.8 visibly distinguishes dormant and active state.','Test every rift beside doors, rail arrivals and player/enemy collision.',['C02'])
revise('M02','Implemented','Foldwing steering and charge remain; v0.8 restores B as fold/drop while airborne or climbing.','Physical headset comfort and player route quality remain unverified.',['A01'])
revise('M04','In review','15 actual rail routes are present. v0.7 tuning has 48 m/s cruise and 96 m/s boost with arrival slowdown.','Test sightline readability and transfers at real speed on target hardware.')
revise('B01','In review','v0.8 uses one desktop optic mask and correct tangent-based projection for 4x/8x; no tracked XR magnification claim.','Verify scope framing, recoil and hit feedback with real Xbox and mouse input.')
revise('T06','In review','v0.7 charged traps use energy and bounded placement; v0.8 renders active trap and dropped-weapon pools.','Test legibility, costs, trigger range and accessibility in longer encounters.')
revise('R01','In review','roadmap.json and planning/AAA-ROADMAP.md are the current committed plan. The eight-sheet v0.3 XLSX remains an explicitly archived snapshot.','Update evidence at each release and keep publication distinct from player acceptance.')
new=json.loads((root/'tools/foundry-plan-tasks.json').read_text())
for id,phase,title,priority,status,depends,acceptance,evidence,next in new:
 if id not in tasks:
  t=dict(id=id,phase=phase,title=title,priority=priority,status=status,depends=depends,acceptance=acceptance,evidence=evidence,next=next);plan['tasks'].append(t);tasks[id]=t
plan['milestones']=[
 dict(id='G0',title='Reliable playable foundation',tasks=['A01','I04','F02','Q03'],exit='No launch or arena crashes; working saves and controller interfaces.'),
 dict(id='G1',title='Approved polished vertical slice',tasks=['P01','B06','F01','P04'],exit='A player-approved complete district loop, not just individually passing features.'),
 dict(id='G2',title='Production-quality assets',tasks=['P02','P03'],exit='Original/cleared assets and coherent characters, architecture, animation and lighting.'),
 dict(id='G3',title='Campaign content complete',tasks=['P05'],exit='Distinct districts, interiors, objectives and endings accepted as a complete campaign.'),
 dict(id='G4',title='Performance and accessibility',tasks=['Q01','Q02','I03'],exit='Recorded physical-device budgets and full controller/accessibility acceptance.'),
 dict(id='G5',title='Release candidate and deployment',tasks=['Q04','R04'],exit='No known blocking defects; tested restore and matching live-file hashes.'),
 dict(id='GX',title='Separate optional platform gates',tasks=['X04','X05','X07','N01','N02','N03'],exit='Quest and multiplayer require their own measured hardware/server work. Desktop release does not imply either.')
]
p.write_text(json.dumps(plan,indent=2)+'\n')
lines=['# Aether Reach: current AAA-quality production checklist','',
'Current plan: v0.8.0 Foundry Finish. Updated 2026-09-12.','',
'This is a production target, not a claim that the game is AAA-quality now. A completed task is not a percentage of commercial quality. Keep software checks, player approval, hardware acceptance and publication evidence separate.','',
'Canonical machine-readable plan: ../roadmap.json. Searchable board: ../roadmap.html. The eight-sheet Aether-Reach-Development-Roadmap-v0.3.xlsx is retained unchanged as a historical snapshot, not the current plan.','',
'## Release gates','']
for g in plan['milestones']:lines += [f"### {g['id']} - {g['title']}",g['exit'],'Tasks: '+', '.join(g['tasks'])+'.','']
lines+=['## Acceptance register','']
for t in plan['tasks']:lines += [f"### {t['id']} - {t['title']}",f"State: {t['status']}. Priority: {t['priority']}. Dependencies: {', '.join(t['depends']) or 'None'}.",'Acceptance: '+t['acceptance'],'Evidence: '+t['evidence'],'Next: '+t['next'],'']
lines+=['## Sources and verification','Repository source: https://github.com/v5ma/v5ma.github.io/tree/master/aether-reach','Published v0.7 receipt workflow: https://github.com/v5ma/v5ma.github.io/actions/runs/34672870930','Current upgrade tests and evidence: ../tests/foundry.test.mjs and ../tests/foundry-browser.py. GitHub Actions artifacts are test evidence; a passing simulation is not a physical-controller or listening test.','']
(root/'planning/AAA-ROADMAP.md').write_text('\n'.join(lines))
