"""Regenerate Markdown from the existing canonical JSON; never reset task state.
The obsolete v0.10/six-chapter initializer is intentionally retired. A missing
plan is an error, not permission to silently recreate old statuses.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
file=ROOT/'production-plan.json'
plan=json.loads(file.read_text())
lines=['# Rainward: AAA-quality production checklist','','Release baseline: v'+plan['release']+' / '+plan.get('edition','Production')+'.','',plan['purpose'],'',plan['policy'],'','## Status legend','']
for k,v in plan['statusDefinitions'].items():lines.append(k+': '+v)
lines+=['','Canonical data: [production-plan.json](production-plan.json). Interactive board: [roadmap.html](roadmap.html).','Each checkbox remains open until human acceptance is recorded. Automated status is narrower than final approval.','']
if plan.get('continuation'):
 lines += ['## Resume from another chat','','Start with [DEVELOPMENT-HANDOFF.md](DEVELOPMENT-HANDOFF.md) and [CONTROLLER.md](CONTROLLER.md).','Historical baseline: [Undertow receipt](evidence/undertow-v0.13.0/summary.json). Current upgrade: [Reconciled Motion](MERGE-RECONCILIATION.md).','']
 for item in plan['continuation'].get('openChecks',[]):
  lines += ['- [ ] '+item['id']+' / '+item['status']+' / '+', '.join(item['tasks'])+' / '+item['action'],'  Acceptance: '+item['acceptance'],'']
for phase in plan['phases']:
 lines+=['## '+phase['id']+' / '+phase['name'],'',phase['goal'],'','Gate: '+phase['gate'],'']
 for t in plan['items']:
  if t['phase']!=phase['id']:continue
  lines += [f"- [{'x' if t['status']=='Approved' else ' '}] {t['id']} / {t['priority']} / {t['title']} / {t['status']}",f"  Owner role: {t['owner']}. Assigned reviewer: {t['reviewer']}. Effort: {t['estimate']}.",f"  Acceptance: {t['acceptance']}","  Dependencies: "+(', '.join(t['depends']) or 'None')+'.',"  Evidence: "+(t['evidence'] or 'Not recorded yet')+'.','']
  if t.get('resumeNote'):lines += ['  Continuation: '+t['resumeNote']]
  if t.get('nextAction'):lines += ['  Next action: '+t['nextAction'],'']
(ROOT/'AAA_CHECKLIST.md').write_text('\n'.join(lines)+'\n')
print('Built',len(plan['items']),'production tasks and the Markdown checklist.')
