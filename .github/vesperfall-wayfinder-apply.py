"""Exact integration on a feature branch; no fuzzy patches or save mutation."""
from pathlib import Path
import hashlib,json
rows=[('vesperfall/app.js','d1b1500dd52b3d6207207ff316d7c850a20d8b77e6003c81c689aafeb1509560',[('this.fieldwork=Fieldwork.install(this);','this.fieldwork=Fieldwork.install(this);this.wayfinder=Wayfinder.install(this);')]),('vesperfall/index.html','216920a82d739ea04e04b5ce0a594a1a0780476ae6f4da108e4f103d78c14a18',[('<script src="./app.js?v=0.17.0-fieldwork"></script>','<script src="./wayfinder-model.js?v=0.17.0-wayfinder"></script><script src="./wayfinder.js?v=0.17.0-wayfinder"></script><script src="./app.js?v=0.17.0-wayfinder"></script>'),('./goldwind-xr.js?v=0.17.0-fieldwork','./goldwind-xr.js?v=0.17.0-wayfinder')]),('vesperfall/goldwind-xr.js','665feabc90c1ad9373ec6718dbcea0ca91fedc055e87635b000877f108b4bf58',[("   if(edge('bow',interactIndex)&&!g.latch.drawing)","   if(g.wayfinder?.input(dt,head,bow,hand,buttons,edge)){state.prev=buttons;return;}\n   if(edge('bow',interactIndex)&&!g.latch.drawing)")])]
pending=[]
for name,sha,edits in rows:
 p=Path(name);b=p.read_bytes();s=b.decode()
 if all(new in s for old,new in edits):continue
 assert hashlib.sha256(b).hexdigest()==sha,name
 for old,new in edits:assert s.count(old)==1,(name,old);s=s.replace(old,new)
 pending.append((p,s))
for p,s in pending:p.write_text(s)
p=Path('vesperfall/DEVELOPMENT-HANDOFF.md');s=p.read_text();note='Wayfinder interaction repair / September 19, 2026.\n\nRead WAYFINDER.md. The owner reports that pickups and combat work but mechanisms and chapter completion are not discoverable in headset play. The default palm setting hides the old objective HUD. This repair adds local mechanism/exit prompts, a palm objective card and a targeted free-hand grip path through the existing interaction owner. Golden arrows, geometry, objectives, saves and the canonical roadmap/workbook are unchanged. Larger/longer chapters remain an explicit next content priority, not a completed part of this repair.\n\n'
if not s.startswith(note):p.write_text(note+s)
p=Path('vesperfall/release.json');r=json.loads(p.read_text());r['hotfix']={'name':'Wayfinder','date':'2026-09-19','scope':'Visible mechanism and exit affordances, objective wrist card and grip progression. Existing world identities, chapter length, save and reward contracts unchanged. See WAYFINDER.md and the separate publication receipt.'};p.write_text(json.dumps(r,indent=2)+'\n')
