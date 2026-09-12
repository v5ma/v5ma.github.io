from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]
D=json.loads((P/'production/roadmap.json').read_text())
lines=['# Neighborhood Missions: AAA-quality production checklist','','This is the canonical production checklist, not a declaration of AAA quality. Build one exceptional authored neighborhood with measured performance before expanding scope again.','','Current release: '+D.get('edition','Neighborhood Missions')+' v'+D['version']+'. Focus: M0 foundations and M1 vertical slice. Updated '+D['reviewed']+'.','','## How to use this workbook','','Edit production/roadmap.json, then run python svgn-planet/production/render-roadmap.py. That JSON generates this Markdown and feeds roadmap.html and Menu / AAA production checklist. Each upgrade selects a small set of IDs, implements and tests them, records evidence, publishes, and states what remains.','','A checked item means only its stated acceptance has evidence. It does not certify the whole category. There is no global AAA percentage. Hardware, visual quality and fun require independent human approval.','','## Status definitions','']
for k,v in D['statusDefinitions'].items():lines.extend([k+': '+v,''])
for m in D['milestones']:
 lines.extend(['## '+m['id']+' / '+m['title'],'',m['exitCriterion'],'','Human exit gate: '+m['humanGate'],''])
 for i in D['items']:
  if i['milestone']!=m['id']:continue
  lines.extend(['- ['+('x' if i['status']=='verified' else ' ')+'] '+i['id']+' / '+i['priority']+' / '+i['status']+' / '+i['title'],'  Acceptance: '+i['acceptance'],'  Next: '+i['next'],'  Owner role: '+i['owner']+'. Dependencies: '+(', '.join(i['dependencies']) or 'None')+'.','  Evidence: '+(' ; '.join(i['evidence']) or 'Not recorded.'),''])
lines.extend(['## Evidence and scope','','Prior v0.7 acceptance: https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481. Those results do not cover later changes. Current evidence belongs in production/evidence/. Keep permanent text summaries even if CI screenshot artifacts expire.','','Real hardware matrix: production/hardware-matrix.md. Empty cells are untested, not zero failures. Numerical targets require explicit agreement and measurement.','','## Technical references',''])
for r in D['sources']:lines.extend([r['title']+' - '+r['url'],r['use'],''])
(P/'AAA_ROADMAP.md').write_text('\n'.join(lines)+'\n')
print('Generated AAA_ROADMAP.md from',len(D['items']),'canonical records.')
