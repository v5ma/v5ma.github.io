"""Render the committed checklist from roadmap.json, without changing task states."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
plan=json.loads((root/'roadmap.json').read_text())
lines=['# Aether Reach: current AAA-quality production checklist','',f"Current plan: {plan['release']}. Updated {plan['updated']}.",'',plan['notice'],'',
'Canonical machine-readable plan: ../roadmap.json. Searchable board: ../roadmap.html. The eight-sheet v0.3 Excel workbook remains an archived snapshot; it is not the current plan.','','## Release gates','']
for g in plan['milestones']:lines += [f"### {g['id']} - {g['title']}",g['exit'],'Tasks: '+', '.join(g['tasks'])+'.','']
lines += ['## Acceptance register','']
for t in plan['tasks']:lines += [f"### {t['id']} - {t['title']}",f"State: {t['status']}. Priority: {t['priority']}. Dependencies: {', '.join(t['depends']) or 'None'}.",'Acceptance: '+t['acceptance'],'Evidence: '+t['evidence'],'Next: '+t['next'],'']
lines += ['## Release evidence','v0.8.0 Foundry Finish: PR #116; deployed source 878fc4923226c0fce2b5e7d90042bc2f1cbafc06; publication run 34702682332 matched 78 files.','v0.9.0 Bellwether Blackout: see BELLWETHER-BLACKOUT.md, the Bellwether browser review, and the post-merge public-file verification workflow. Implementation and publication are not substitutes for player or physical-hardware acceptance.','']
(root/'planning/AAA-ROADMAP.md').write_text('\n'.join(lines))
