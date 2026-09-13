"""Small follow-up edits after Undertow integration. Every anchor is unique and
must match the generated v0.13 source exactly; rerunning is idempotent."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
changes={
 'natatorium.mjs':[("task('nat-circulation',-32,-62","task('nat-circulation',-33,-56"),("task('nat-lift-signal',0,-74","task('nat-lift-signal',0,-64")],
 'tests/reclaimed.test.mjs':[("Twenty-nine additional enemies and twenty-four authored tasks","Twenty-nine large-map enemies and thirty authored tasks"),("Object.values(W.LEVELS).reduce((n,d)=>n+d.tasks.length,0),24","Object.values(W.LEVELS).reduce((n,d)=>n+d.tasks.length,0),30")],
 'tests/field-ready.test.mjs':[("assert.equal(restore(second.latest(),false).level,'whiteout')","assert.equal(restore(second.latest(),false).level,'natatorium')"),("preserves the other five byte-for-byte","preserves the other six byte-for-byte")],
 'tests/aquatic.test.mjs':[("bank.active='whiteout';disk.set('svgn.rainward.v2.chapter-checkpoints',JSON.stringify(bank));const old=createCheckpointStore(read,write);","bank.active='whiteout';disk.set('svgn.rainward.v2.chapter-checkpoints',JSON.stringify(bank));disk.delete('svgn.rainward.v1.checkpoint');const old=createCheckpointStore(read,write);")],
 'tests/scanned.test.mjs':[("const before=JSON.stringify(c),points=fernPlacements(c);assert.deepEqual(points,fernPlacements(c));assert.ok(points.length>0&&points.length<90);","const before=JSON.stringify(c),points=fernPlacements(c);assert.deepEqual(points,fernPlacements(c));if(!c.grass.length){assert.deepEqual(points,[]);assert.equal(JSON.stringify(c),before);continue;}assert.ok(points.length>0&&points.length<90);")],
 'audio-design.mjs':[("whiteout:{name:'Footprints After Midnight',root:54,bpm:62,air:'wind',tone:'glass',motif:[0,2,7,10,5,3,2,0],chords:[0,8,5,3]}});","whiteout:{name:'Footprints After Midnight',root:54,bpm:62,air:'wind',tone:'glass',motif:[0,2,7,10,5,3,2,0],chords:[0,8,5,3]},natatorium:{name:'Tiles Below the Surface',root:43,bpm:64,air:'water',tone:'glass',motif:[0,5,7,12,10,5,3,2],chords:[0,5,10,3]}});")],
 'tests/survival-sound.test.mjs':[("assert.equal(new Set(Object.values(THEMES).map(t=>t.name)).size,6)","assert.equal(new Set(Object.values(THEMES).map(t=>t.name)).size,7)"),("Six chapter scores have distinct names","Seven chapter scores have distinct names")],
 'supplies.mjs':[("s.status!=='playing'||p.submerged||!r||p.craft","s.status!=='playing'||p.waterMode==='swim'||!r||p.craft"),("s.status!=='playing'||p.submerged||!p.medkit","s.status!=='playing'||p.waterMode==='swim'||!p.medkit"),("s.status!=='playing'||p.submerged||!p.smoke","s.status!=='playing'||p.waterMode==='swim'||!p.smoke"),("s.status!=='playing'||p.submerged||p.reload","s.status!=='playing'||p.waterMode==='swim'||p.reload")],
 'combat.mjs':[("s.status!=='playing'||p.submerged||!p.bottles","s.status!=='playing'||p.waterMode==='swim'||!p.bottles"),("s.status!=='playing'||p.submerged||p.reload||p.shotCD","s.status!=='playing'||p.waterMode==='swim'||p.reload||p.shotCD")],
 'survival.mjs':[("s.status!=='playing'||p.submerged||p.hp>=100","s.status!=='playing'||p.waterMode==='swim'||p.hp>=100"),("s.player.submerged||s.player.healing","s.player.waterMode==='swim'||s.player.healing"),("s.status!=='playing'||p.submerged||!p.smoke","s.status!=='playing'||p.waterMode==='swim'||!p.smoke")],
 'UNDERTOW.md':[("Weapons, melee, reload, healing, smoke and crafting remain unavailable while fully submerged.","Weapons, melee, reload, healing, smoke and crafting remain unavailable throughout deep-water swimming, including at the surface."),("The natatorium contains four water volumes with different behavior.","The natatorium contains four water volumes with different behavior. Its original chapter score, Tiles Below the Surface, uses glass-like tones and water ambience that intensify with danger.")]
}
for name,edits in changes.items():
 p=R/name;s=p.read_text()
 for old,new in edits:
  if new in s:continue
  assert s.count(old)==1,(name,old,s.count(old));s=s.replace(old,new)
 p.write_text(s);print('Refined',name)
