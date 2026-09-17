"""Do not let the receiving Classic input owner replay a consumed weapon edge."""
from pathlib import Path
p=Path('vesperfall/goldwind-xr.js');s=p.read_text()
a="   if(edge('bow',3)){g.arsenal.equip();return;}"
b="   if(edge('bow',3)){g.arsenal.equip();g.prevButtons=Object.fromEntries(Object.entries(g.hands).map(([k,v])=>[k,[...v.buttons]]));return;}"
if a in s:
 assert s.count(a)==1;p.write_text(s.replace(a,b))
else:assert b in s
p=Path('vesperfall/index.html');s=p.read_text();a='./goldwind-xr.js?v=0.16.0';b='./goldwind-xr.js?v=0.16.0-handover'
if b not in s:
 assert s.count(a)==1;p.write_text(s.replace(a,b))
p=Path('vesperfall/tests/goldwind-browser.py');s=p.read_text()
anchor="  button('right',3,True);wait('Vesperfall.component.paused');button('right',3,False);xrmenu('Exit VR');wait('!Vesperfall.component.xr')"
block="""  # A held weapon-switch click belongs to one owner, not both owners.
  neutral();button('left',3,True);frame();frame()
  check(page.evaluate(\"Vesperfall.state.weapon==='crossbow'\"),'Holding the bow-stick click switches to Classic crossbow exactly once')
  button('left',3,False);frame();frame()
  cross_shots=page.evaluate('Vesperfall.state.shots')
  button('left',0,True);wait('n=>Vesperfall.state.shots===n+1',cross_shots);frame();frame()
  check(page.evaluate('n=>Vesperfall.state.shots===n+1&&!Vesperfall.state.crossbow.loaded',cross_shots),'The inherited crossbow fires exactly one loaded bolt from its weapon trigger')
  button('left',0,False);button('right',3,True);frame();button('right',3,False)
  wait('Vesperfall.state.crossbow.loaded')
  check(page.evaluate('!Vesperfall.component.paused'),'The Classic draw-stick reload remains reload, not Goldwind pause')
  button('left',3,True);frame();frame()
  check(page.evaluate(\"Vesperfall.state.weapon==='bow'&&!Vesperfall.component.goldwind.state.ready\"),'Returning from crossbow to Goldwind waits for neutral instead of replaying the held click')
  button('left',3,False);neutral()
"""
if 'Holding the bow-stick click switches to Classic crossbow exactly once' not in s:
 assert s.count(anchor)==1;s=s.replace(anchor,block+anchor);compile(s,str(p),'exec');p.write_text(s)
print('One consumed-edge handover, one cache key and four actual-input crossbow assertions updated.')
