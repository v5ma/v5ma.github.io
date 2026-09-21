"""Idempotent feature-only integration, with exact source preconditions."""
from pathlib import Path
import hashlib,json,re
root=Path('vesperfall');sha=lambda b:hashlib.sha256(b).hexdigest()
def replace(name,pairs):
 p=root/name;s=p.read_text()
 for old,new in pairs:
  if new in s:continue
  assert s.count(old)==1,(name,old,s.count(old));s=s.replace(old,new)
 p.write_text(s)
edits={
 'app.js':('abe6d22c80089c9f36ec4d175672e4bcceb1ffc0550cf3ba943f4a215e704be7',[('this.wayfinder=Wayfinder.install(this);','this.wayfinder=Wayfinder.install(this);this.threshold=VesperThreshold.install(this);')]),
 'index.html':('4032ad9a319650d57a3e73533e4a81a1238ec2048c5f503bb060adc5844bb773',[('<script src="./app.js?v=0.17.0-wayfinder"></script>','<script src="./threshold-model.js?v=0.17.0-threshold"></script><script src="./threshold.js?v=0.17.0-threshold"></script><script src="./app.js?v=0.17.0-threshold"></script>'),('./dominion-controls.js?v=0.17.0-fieldwork','./dominion-controls.js?v=0.17.0-threshold')]),
 'dominion-controls.js':('d76606711542d128e672f3c1b8ee692b038aeebd4213bc2175e96694e023fb0b',[("if(state.xrScreen==='settings')return pageRows([...settings","if(state.xrScreen==='settings')return pageRows([['Spatial desk / walking doorway',()=>g.threshold?.screen('spatial')],...settings")])
}
for name,(digest,pairs) in edits.items():
 s=(root/name).read_text()
 if all(new in s for old,new in pairs):continue
 assert sha((root/name).read_bytes())==digest,name
 replace(name,pairs)
replace('quest-hands.js',[('return {state, reset};','return {state, reset, rays, dots};')])
p=root/'index.html';s=p.read_text();s,n=re.subn(r'\./quest-hands.js\?v=[^"\s]+','./quest-hands.js?v=0.17.0-threshold',s);assert n==1;p.write_text(s)
replace('threshold.js',[
 ('state.ending=true;restore();g.setPaused(true);','state.ending=true;if(state.walking)stopWalking();g.setPaused(true);'),
 ('menuNeutral:false,hidden:new Map()', 'menuNeutral:false,walkingPinches:new Map(),hidden:new Map()'),
 ('crossing.reset();state.moveReady=false;state.previous={};signText();','crossing.reset();state.walkingPinches.clear();state.moveReady=false;state.previous={};floor.material.transparent=!!g.arExpedition;floor.material.opacity=g.arExpedition?.15:1;floor.material.depthWrite=!g.arExpedition;floor.material.needsUpdate=true;signText();'),
 ("if(hands.length<2||[...(session?.inputSources||[])].some(s=>s.hand)){stopWalking();oldProcess(dt,head);return;}","""const optical=[...(session?.inputSources||[])].filter(s=>s.hand);
   if(optical.length){
    for(const source of optical){
     if(!state.walkingPinches.has(source))state.walkingPinches.set(source,new VesperSurestep.Pinch());
     let distance=NaN;
     try{const a=g.scene.frame.getJointPose(source.hand.get('thumb-tip'),ref)?.transform.position,b=g.scene.frame.getJointPose(source.hand.get('index-finger-tip'),ref)?.transform.position;if(a&&b)distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}catch{}
     if(state.walkingPinches.get(source).update(distance)){for(const p of g.questHands.state.sources.values())p.pinch.reset();stopWalking();return oldProcess(dt,head);}
    }
   }else if(hands.length<2){stopWalking();oldProcess(dt,head);return;}"""),
 ('if(state.moveReady){const h=g.hands[bow]', 'if(state.moveReady&&hands.length===2&&!optical.length){const h=g.hands[bow]'),
 ('if(Math.abs(local.x)<3&&Math.abs(local.z)<3)', 'if(local.x*local.x+local.z*local.z<9)'),
 ("ctx.fillText('Walk through, or use the movement stick.',384,98,710);", "ctx.fillText('Walk through, or use the '+($('handedness').value==='left'?'left':'right')+' stick.',384,98,710);"),
 ("ctx.fillText('Free-hand stick click: menu / seated return',384,132,710);", "ctx.fillText('Free-hand stick click or fresh hand pinch: menu',384,132,710);")
])
# Keep the stronger recovered tests, but not the now-superseded runtime patch.
for r in json.loads(Path('.github/threshold-review.json').read_text()):
 if r['path']!='vesperfall/tests/threshold-browser.py':continue
 p=Path(r['path']);b=p.read_bytes()
 if sha(b)!=r['new']:
  assert sha(b)==r['old'],str(p)
  s=b.decode()
  for pos,n,text in reversed(r['edits']):s=s[:pos]+text+s[pos+n:]
  assert sha(s.encode())==r['new'];p.write_text(s)
replace('tests/threshold-browser.py',[("def button(h,i,on):page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[h,i,on]);frame()", "def button(h,i,on):\n  if not page.evaluate('Vesperfall.component.xr'):return\n  page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[h,i,on]);frame()")])
p=root/'DEVELOPMENT-HANDOFF.md';s=p.read_text()
if not s.startswith('Threshold spatial interface'):
 assert sha(p.read_bytes())=='951235522d6ffc10bfad610328fb3cde8ec7a2c7d7b8d59f0d9495253356df38'
 p.write_text('Threshold spatial interface / September 21, 2026.\n\nRead THRESHOLD.md. The XR pause panel is an adjustable world-anchored floor desk. Settings / Spatial desk opens a checkpoint-protected local Vesperfall walking round trip, with viewer crossing, hand menus, seated return and actual session exit. No private hub integration or assets are included. Preserve Goldwind, Wayfinder, all five layout readers, the current game object and save namespaces. Physical-device gates and the larger-adventure request remain open. The canonical workbook is unchanged; work maps to V41/V42/V65/V68. Read the exact publication receipt before calling the candidate live.\n\n'+s)
p=root/'release.json';d=json.loads(p.read_text());d['threshold']={'name':'Threshold','date':'2026-09-21','scope':'World-anchored adjustable XR desk and a checkpoint-protected walking round trip to a local Vesperfall foyer. No private hub integration, cross-site travel, sphere portals, altered saved geometry or desktop UI replacement. See THRESHOLD.md and its separate publication receipt.'};p.write_text(json.dumps(d,indent=2)+'\n')
p=root/'THRESHOLD.md';s=p.read_text();note='\nRecovery pass: desk edits keep their horizontal anchor when the user looks aside; explicit recentering moves it. The inspection panel resets its scale. Controller and hand rays remain visible in the foyer; travel yields to menus only after neutral input. AR foyer flooring is translucent and virtual movement stays within its circular platform. Optical-hand pinch can open the travel menu; the viewer, never a controller reach, triggers doorway crossing. Tracking loss and reference-space reset disarm crossings. XR exit restores a usable desktop camera. Recovered tests retain stereo bounds, a full panel texture and continuous simulated room-scale traversal. These remain software checks, not hardware approval.\n'
if note not in s:p.write_text(s+note)
compile((root/'tests/threshold-browser.py').read_text(),'threshold-browser.py','exec')
print('Integrated source and recovered assertions; runtime state is never assigned by browser tests.')
