from pathlib import Path
D=Path(__file__).resolve().parents[1]/'dino-atlas'
def edit(name,old,new):
 p=D/name;s=p.read_text()
 if new in s:return
 assert old in s,(name,old[:100]);p.write_text(s.replace(old,new))
# Four nearby lamps shade geometry; all luminous world props remain visible.
edit('ranch-world.js', 'let wi=0,ri=0,si=0,hornCount=0,shotCount=0,wake=0;', '''const lightSources=[];scene.traverse(o=>{if(o.isPointLight){o.visible=false;lightSources.push({light:o,p:new T.Vector3()});}});
 const lightPool=Array.from({length:4},()=>{const l=new T.PointLight(0xffffff,0,35,2);scene.add(l);return l;});
 let wi=0,ri=0,si=0,hornCount=0,shotCount=0,wake=0;''')
edit('ranch-world.js', 'for(const s of sites){const within=', '''const nearest=lightSources.map(s=>{s.light.getWorldPosition(s.p);s.d=Math.hypot(s.p.x-p.x,s.p.y-p.y,s.p.z-p.z);return s;}).sort((a,b)=>a.d-b.d);
  lightPool.forEach((l,i)=>{const s=nearest[i];if(s&&s.d<75){l.position.copy(s.p);l.color.copy(s.light.color);l.distance=s.light.distance;l.decay=s.light.decay;l.intensity=s.light.intensity;}else l.intensity=0;});
  for(const s of sites){s.inside.visible=distance(p,s.b)<240;const within=''')
edit('ranch-world.js', 's.roof.visible=!within;s.shell.visible=!within;', 's.roof.visible=!within&&distance(p,s.b)<260;s.shell.visible=!within&&distance(p,s.b)<260;')
edit('frontier-world-expanded.js', "const light=new T.PointLight(color,120,38,2);light.position.set(p.x,2.4,p.z);scene.add(light);setTimeout(()=>scene.remove(light),380);", "// Bright pooled rings carry the flash without changing the shader light count.")
edit('ranch-game.js', '#ranch-status{position:fixed;top:94px;right:20px;', '#ranch-status{position:fixed;top:315px;right:20px;')
edit('ranch-game.js', '#ranch-status{top:80px;right:9px;', '#ranch-status{top:220px;right:9px;')
edit('ranch-game.js', 'Your current assignment always appears at the upper left.', 'Your current assignment and controls always appear in the assignment panel.')
edit('ranch-game.js', "this.hornCool=0;this.baseline=", "this.hornCool=0;this.feedbackUntil=0;this.baseline=")
edit('ranch-game.js', 'horn(){if(this.hornCool>0)return;', 'horn(){if(this.hornCool>0)return;this.feedbackUntil=this.clock+5;')
edit('ranch-game.js', 'shot(t,origin,dir,length,direct){const', 'shot(t,origin,dir,length,direct){this.feedbackUntil=this.clock+3;const')
edit('ranch-game.js', '</strong>${this.lastHit}<small>', "</strong>${this.clock<this.feedbackUntil?this.lastHit:task?task.name:'Menu / Dispatch lists your available activities.'}<small>")
# Real native WebGL acceptance at fewer software-rendered pixels.
edit('tests/ranch-browser.py', "viewport={'width':1280,'height':800}", "viewport={'width':1024,'height':768}")
edit('tests/ranch-browser.py', "def snap(name):page.screenshot(path=str(OUT/name))", "def snap(name):page.screenshot(path=str(OUT/name),timeout=45000,animations='disabled')")
edit('tests/ranch-browser.py', 'try:wait(condition,45000)', "try:\n     wait(condition,90000)\n     print('CORRIDOR:',json.dumps(page.evaluate('__dinoRanger.state.position')),flush=True)")
edit('tests/ranch-browser.py', "(OUT/'failure.json').write_text(json.dumps({'error':str(exc),'errors':errors,'passed':checks},indent=2))", """diagnostic=None
   try:diagnostic=page.evaluate('({game:window.__dinoRanger?.state,ranch:window.__dinoRanch?.state,focus:document.activeElement?.outerHTML,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id)})')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'errors':errors,'passed':checks,'diagnostic':diagnostic},indent=2));print('FAILURE STATE:',json.dumps(diagnostic),flush=True)""")
edit('tests/ranch-browser.py', "check(page.evaluate('__dinoRanch.state.progress.tutorial')>=1,'Actual RT driving completes the first lesson')", """check(page.evaluate('__dinoRanch.state.progress.tutorial')>=1,'Actual RT driving completes the first lesson')
   check(page.evaluate('(()=>{const a=document.getElementById("ranch-status").getBoundingClientRect(),b=document.querySelector(".map-corner").getBoundingClientRect();return a.top>=b.bottom||a.right<=b.left||a.left>=b.right;})()'),'Herding feedback leaves the minimap unobstructed')""")
print('Bounded lighting, clear HUD and diagnostic acceptance applied.')
