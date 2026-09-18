from pathlib import Path
p=Path('vesperfall/tests/pilgrimage-browser.py');s=p.read_text()
a="  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint')\n  page.reload"
b="""  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint')
  current=page.evaluate('PilgrimSave.capture(Vesperfall.state,{id:"comparison",banked:0,receipt:{},yaw:0,pitch:0,focus:1}).state')
  issue=page.evaluate('Vesperfall.component.checkpoint.state.issue')
  (OUT/('checkpoint-before-reload-'+str(len(observations))+'.json')).write_text(json.dumps({'saved':saved,'current':current,'issue':issue},indent=2))
  check(saved['state']==current,'The save contains the CURRENT expedition before reload, not a stale earlier checkpoint: '+issue)
  page.reload"""
if b not in s:
 assert s.count(a)==1;s=s.replace(a,b);compile(s,str(p),'exec');p.write_text(s)
