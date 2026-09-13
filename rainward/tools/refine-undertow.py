"""Small follow-up edits after Undertow integration. Every anchor is unique and
must match the generated v0.13 source exactly; rerunning is idempotent."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
changes={
 'tests/reclaimed.test.mjs':[("Twenty-nine additional enemies and twenty-four authored tasks","Twenty-nine large-map enemies and thirty authored tasks"),("Object.values(W.LEVELS).reduce((n,d)=>n+d.tasks.length,0),24","Object.values(W.LEVELS).reduce((n,d)=>n+d.tasks.length,0),30")],
 'supplies.mjs':[("s.status!=='playing'||p.submerged||!r||p.craft","s.status!=='playing'||p.waterMode==='swim'||!r||p.craft"),("s.status!=='playing'||p.submerged||!p.medkit","s.status!=='playing'||p.waterMode==='swim'||!p.medkit"),("s.status!=='playing'||p.submerged||!p.smoke","s.status!=='playing'||p.waterMode==='swim'||!p.smoke"),("s.status!=='playing'||p.submerged||p.reload","s.status!=='playing'||p.waterMode==='swim'||p.reload")],
 'combat.mjs':[("s.status!=='playing'||p.submerged||!p.bottles","s.status!=='playing'||p.waterMode==='swim'||!p.bottles"),("s.status!=='playing'||p.submerged||p.reload||p.shotCD","s.status!=='playing'||p.waterMode==='swim'||p.reload||p.shotCD")],
 'survival.mjs':[("s.status!=='playing'||p.submerged||p.hp>=100","s.status!=='playing'||p.waterMode==='swim'||p.hp>=100"),("s.player.submerged||s.player.healing","s.player.waterMode==='swim'||s.player.healing"),("s.status!=='playing'||p.submerged||!p.smoke","s.status!=='playing'||p.waterMode==='swim'||!p.smoke")],
 'UNDERTOW.md':[("Weapons, melee, reload, healing, smoke and crafting remain unavailable while fully submerged.","Weapons, melee, reload, healing, smoke and crafting remain unavailable throughout deep-water swimming, including at the surface.")]
}
for name,edits in changes.items():
 p=R/name;s=p.read_text()
 for old,new in edits:
  if new in s:continue
  assert s.count(old)==1,(name,old,s.count(old));s=s.replace(old,new)
 p.write_text(s);print('Refined',name)
