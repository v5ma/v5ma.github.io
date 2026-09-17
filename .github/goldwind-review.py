"""Correct device-fixture timing and exercise preset hand/menu lifecycle."""
from pathlib import Path
p=Path('vesperfall/tests/fake-xr.js');s=p.read_text();old='const head=transform(state.head,state.yaw),views=';assert s.count(old)==1
p.write_text(s.replace(old,'state.inputFrame?.(t);const head=transform(state.head,state.yaw),views='))
p=Path('vesperfall/tests/goldwind-browser.py');s=p.read_text()
start=s.index("  neutral();pose('right',[.25,1.25,-.43]);button('right',1,True)")
end=s.index("  check(page.evaluate('n=>Vesperfall.state.shardsUsed===n+1'",start)
s=s[:start]+'''  throw_trace=[]
  for attempt in range(3):
   neutral();pose('right',[.25,1.25,-.43]);button('right',1,True)
   samples=page.evaluate("""async()=>{let start=null;const trace=[];await new Promise(resolve=>{TestXR.state.inputFrame=()=>{const now=performance.now();start??=now;const t=Math.min(1,(now-start)/400),g=Vesperfall.component.goldwind.gesture;trace.push({now,samples:g.samples.map(s=>({t:s.t,p:s.p})),armed:g.ready,held:g.held});TestXR.pose('right',[.25,1.25,-.43+.55*t]);if(t>=1){TestXR.button('right',1,false);TestXR.state.inputFrame=null;resolve();}};});return trace;}""")
   frame();wait('!Vesperfall.component.goldwind.gesture.held&&!Vesperfall.component.goldwind.state.flight')
   throw_trace.append({'attempt':attempt,'samples':samples,'shardsUsed':page.evaluate('Vesperfall.state.shardsUsed')})
   (OUT/'throw-input-observations.json').write_text(json.dumps(throw_trace,indent=2))
   if page.evaluate('n=>Vesperfall.state.shardsUsed>n',uses):break
''' +s[end:]
anchor=' def drawshot(index,hand=\'right\',bow=\'left\',down=False):'
helper=''' def handaction(text):
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');index=next(i for i,r in enumerate(rows) if text.lower() in r.lower())
  page.evaluate("""index=>{const g=Vesperfall.component,T=g.T,panel=g.xrPanel.mesh;panel.updateMatrixWorld(true);g.rig.updateMatrixWorld(true);const y=195+index*75+30.5,target=panel.localToWorld(new T.Vector3(0,(.5-y/768)*panel.geometry.parameters.height,0)),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}""",index)
  before=page.evaluate('Vesperfall.component.questHands.state.selections');page.evaluate("TestHands.pinch('right',.05)");wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.pinch.armed)");page.evaluate("TestHands.pinch('right',.015)");wait('n=>Vesperfall.component.questHands.state.selections>n||!Vesperfall.component.xr',before)
  if page.evaluate('Vesperfall.component.xr'):page.evaluate("TestHands.pinch('right',.05)")
  check(True,'With Goldwind enabled, a tracked hand pinch selects '+text)
'''
assert s.count(anchor)==1;s=s.replace(anchor,helper+anchor)
old="  button('left',3,True);wait('Vesperfall.component.paused');button('left',3,False);xrmenu('Exit VR');wait('!Vesperfall.component.xr')"
new='''  pose('left',[.23,1.35,-.31]);button('left',4,True);pose('left',[.23,1.75,.18]);wait('Vesperfall.component.latch.drawing')
  before=page.evaluate('({blinks:Vesperfall.state.blinks,shots:Vesperfall.state.shots})')
  page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active&&Vesperfall.component.paused')
  check(page.evaluate('n=>!Vesperfall.component.latch.drawing&&!Vesperfall.component.goldwind.state.flight&&Vesperfall.state.blinks===n.blinks&&Vesperfall.state.shots===n.shots',before),'Bare-hand takeover cancels the Goldwind movement draw and pauses combat')
  handaction('Settings');handaction('Back');handaction('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#save-expedition').click();saved=page.evaluate('localStorage.getItem(PilgrimSave.KEY)')
  page.locator('#architect-table').click();wait('Vesperfall.component.xr&&Vesperfall.component.returningBell.state.table')
  check(page.evaluate('Vesperfall.component.arMode&&Vesperfall.component.paused&&!Vesperfall.component.goldwind.state.flight'),'Goldwind preserves paused, discovery-limited AR inspection')
  page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active')
  handaction('Layers:');handaction('Exit AR');wait('!Vesperfall.component.xr')
  check(page.evaluate('p=>localStorage.getItem(PilgrimSave.KEY)===p',saved),'AR hand inspection with Goldwind selected preserves exact saved expedition bytes')'''
assert s.count(old)==1;s=s.replace(old,new)
p.write_text(s);compile(s,str(p),'exec')
print('Only device input is updated before each emulated XR frame; game clocks and outcomes are untouched.')
