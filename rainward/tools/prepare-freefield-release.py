"""Transport helper, never called during acceptance; remove before final merge."""
from pathlib import Path
import subprocess
R=Path(__file__).resolve().parents[1]
subprocess.run(['python',str(R/'tools/finalize-freefield.py')],check=True)
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'review source drift',old[:60]);p.write_text(s.replace(old,new))
patch('world.mjs',"import {applyMeridianRelief,meridianHeight}","import {intersectHeightfield} from './terrain-ray.mjs';\nimport {applyMeridianRelief,meridianHeight}")
patch('world.mjs','export function obstruction(a,b){',"export function rayTerrain(origin,dir,max=60){if(CURRENT.id!=='meridian')return null;const endY=origin.y+dir.y*max;if(Math.min(origin.y,endY)>6.02)return null;return intersectHeightfield(origin,dir,max,meridianHeight);}\nexport function obstruction(a,b){")
patch('world.mjs','const dir={x:dx/len,y:dy/len,z:dz/len};let result=null;',"const dir={x:dx/len,y:dy/len,z:dz/len},ground=rayTerrain(a,dir,len);let result=ground!==null&&ground<len-.05?{t:ground,o:{id:'meridian-terrain',kind:'terrain'}}:null;")
patch('combat.mjs','solidAt,rayBox,obstruction,','solidAt,rayBox,rayTerrain,obstruction,')
patch('combat.mjs','for(const b of OBSTACLES){const hit=rayBox(o,d,b,nearest);','const ground=rayTerrain(o,d,nearest);if(ground!==null)nearest=Math.min(nearest,ground);\n for(const b of OBSTACLES){const hit=rayBox(o,d,b,nearest);')
patch('tests/freefield-meridian.py',"const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});if(!route.length", "const W=await import('./world.mjs'),raw=W.findPath(Rainward.state.player,{x,z}),route=raw.filter((p,i,a)=>i===0||i===a.length-1||(p.x-a[i-1].x)!==(a[i+1].x-p.x)||(p.z-a[i-1].z)!==(a[i+1].z-p.z));if(!route.length")
patch('tests/freefield-meridian.py',"go(42,-27);use('Rainward.state.objectives.crank');", "go(33,-24);use('Rainward.state.taken.has(\"library-cache\")');go(42,-27);use('Rainward.state.objectives.crank');")
patch('tests/freefield-meridian.py',"capture('03-reading-hall')", "capture('03-reading-hall');craft();craft();check(page.evaluate('Rainward.state.taken.has(\"library-cache\")&&Rainward.state.player.cloth===0&&Rainward.state.player.medkit>0'),'The existing librarian satchel funds real recovery before the northern commitment')")
patch('tests/freefield-meridian.py','go(0,-72);use(',"go(22,-23);go(0,-29);go(0,-50);go(0,-60);go(0,-72);use(")
p=R/'FREEFIELD.md';s=p.read_text()
if '## Northern approach recovery' not in s:p.write_text(s+'\n## Northern approach recovery\n\nThe clinic correction let the native journey reach the reading ridge, both components and the original opened gate; it then died on the exposed northern approach. The new terrain had not participated in sight/projectile obstruction. Meridian ground now uses the same relief function for obstruction and firearm endpoints, so a hill is not merely visual. Other chapters retain their prior rules. The route test also stops braking at every collinear one-metre navigation node, collects the existing librarian satchel for finite preparation, and returns to the learned lower drainage spine before the north commitment. No enemy statistics, grants or objective gates are changed. This is still assisted software evidence, not an unfamiliar-player pacing approval.\n')
