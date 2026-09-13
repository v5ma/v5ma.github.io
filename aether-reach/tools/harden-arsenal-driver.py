from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tests/arsenal_browser.py'
s=p.read_text()
old="""  if abs(dy)<.02 and abs(dp)<.02:return
  scale=.004*(.35 if state['scoped'] else 1)
  dx=max(-260,min(260,dy/scale));dv=max(-180,min(180,-dp/scale));cx=box['x']+box['width']*.5;cy=box['y']+box['height']*.5
  page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx+dx,cy+dv,steps=2);page.mouse.up();page.wait_for_timeout(30)
"""
new="""  if abs(dy)<.03 and abs(dp)<.03:return
  # Scoped drag-look is deliberately conservative on software WebGL: a larger
  # scale yields smaller native mouse corrections and avoids crossing the aim
  # point back and forth as individual frames take longer.
  scale=.004*(.65 if state['scoped'] else 1)
  dx=max(-180,min(180,dy/scale));dv=max(-130,min(130,-dp/scale));cx=box['x']+box['width']*.5;cy=box['y']+box['height']*.5
  page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx+dx,cy+dv,steps=4);page.mouse.up();page.wait_for_timeout(35)
"""
assert old in s
s=s.replace(old,new,1)
old2="""   walk(page,[(78,-25)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().owned.includes(\"carbine\")');check(True,'The garden supply cache unlocks a weapon after actual exploration');page.screenshot(path=str(OUT/'glasshouse-diversity.png'))
"""
new2="""   # Depending on which end of Gale was caught, the physical ride can finish
   # at the quay or garden. Use the real foot/bridge route when it finishes at
   # the quay instead of assuming a straight unobstructed line through buildings.
   end=snap(page)['position']
   if end['x']<40:
    walk(page,[(0,-15),(0,-36),(8,-42),(49,-28),(65,-26)])
   walk(page,[(78,-25)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().owned.includes(\"carbine\")');check(True,'The garden supply cache unlocks a weapon after actual exploration');page.screenshot(path=str(OUT/'glasshouse-diversity.png'))
"""
assert old2 in s
s=s.replace(old2,new2,1)
p.write_text(s)
print('Hardened native scoped drag-look and the real post-transfer garden route.')
