"""Test setup and navigation only; no gameplay or acceptance outcome changes.
Goldwind/contact are the new defaults, so old-mode regressions select their
preserved preferences through the shipped UI instead of assuming old defaults.
"""
from pathlib import Path
items={
 'dominions':"  # Inspect preserved legacy art, not the new chapter's smaller cast.",
 'pilgrim':"  page.goto(BASE+'/vesperfall/?acceptance=pilgrim',wait_until='domcontentloaded');ready();page.locator('#expedition-mode').select_option('endless')",
 'resonant':"  check(page.evaluate('VesperCore.VERSION')==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'Resonant Hunt is the actual loaded release')",
 'first-bell':"  check(page.evaluate('VesperCore.VERSION')==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'First Bell loads inside the maintained A-Frame renderer')"
}
for name,anchor in items.items():
 p=Path('vesperfall/tests')/(name+'-browser.py');s=p.read_text()
 setup="\n  # Explicit retained-mode fixture; new Goldwind/grip defaults have separate tests.\n  page.locator('#xr-bow-controls').select_option('classic')\n  page.locator('#pickup-mode').select_option('pull')"
 if setup not in s:
  assert s.count(anchor)==1,name
  s=s.replace(anchor,anchor+setup)
 fn='xract' if name=='first-bell' else 'xraction'
 old=fn+"('Expedition / practice')"
 new=fn+"('Missions');"+fn+"('More / page');"+fn+"('Expedition options')"
 if old in s:s=s.replace(old,new)
 compile(s,str(p),'exec');p.write_text(s)
 print('Updated explicit test configuration and navigation:',p)
