"""Scoped corrections from native artifact 10523206038. Commit before testing.
Temporary assembly helper: remove before release. No gameplay state is assigned.
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def rep(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'review drift',s.count(old),old[:80]);p.write_text(s.replace(old,new))
rep('tests/freefield-browser.py',"   away();frames();pulse('right',4);wait('Rainward.state.taken.has(\"rations\")')",'''   away();frames();wait('Rainward.snapshot().xr.armed')
   page.evaluate("questDevice.sources[0].gamepad.axes[2]=.65;questDevice.sources[0].gamepad.axes[3]=-.75")
   wait('Math.hypot(Rainward.state.player.x-1.3,Rainward.state.player.z-25.5)<1.15')
   page.evaluate("questDevice.sources[0].gamepad.axes=[0,0,0,0]");frames(4)
   pulse('right',4);wait('Rainward.state.taken.has("rations")')''')
rep('tests/freefield-meridian.py',"go(-42,28);use('Rainward.state.puzzle.wheels[0]===1')","go(-41,29);go(-42,29);use('Rainward.state.puzzle.wheels[0]===1')")
rep('quest-xr.mjs','caster=new T.Raycaster(origin,direction,0,8*(isDiorama()?1/preferences.scale:1))','caster=new T.Raycaster(origin,direction,0,8)')
rep('quest-xr.mjs',"if(lastSources&&signature!==lastSources){E.pause();reset();handFire=false;handListen=false;handSprint=false;}","if(lastSources&&signature!==lastSources){E.pause();reset();handFire=false;handBlink=false;handListen=false;handSprint=false;}")
rep('quest-xr.mjs',"action('RELOAD','reload',()=>{E.back();E.act('reload');})]:[]","""action('RELOAD','reload',()=>{E.back();E.act('reload');}),
   action('TURN LEFT 30','turn-left',()=>{snap(Math.PI/6);E.back();}),action('TURN RIGHT 30','turn-right',()=>{snap(-Math.PI/6);E.back();}),
   action('SIDEARM','selectPistol',()=>{E.back();E.act('selectPistol');}),action('RIFLE','selectRifle',()=>{E.back();E.act('selectRifle');}),
   action('CYCLE MEDKIT / BOTTLE / SMOKE','selectTool',()=>{E.back();E.act('selectTool');}),
   action('PRONE / STAND','prone',()=>{E.back();E.act('prone');}),action('MELEE','melee',()=>{E.back();E.act('melee');}),
   action('DODGE','evade',()=>{E.back();E.act('evade');}),action(handListen?'HAND LISTEN: ON':'HAND LISTEN: OFF','hand-listen',()=>{handListen=!handListen;E.back();}),
   action(slow?'MOVE SPEED: COMFORT':'MOVE SPEED: NORMAL','comfort-speed',()=>{slow=!slow;E.back();})]:[]""")
rep('quest-xr.mjs',"'PAUSE / RECENTER MENU'","'WRIST STATUS / PAUSE'")
rep('quest-xr.mjs',"'LOW AIR: A OR FIELD SURFACE BUTTON'","(E.freefield?.xrLayout==='legacy'?'LOW AIR: A TO SURFACE':'LOW AIR: X TO SURFACE / Y SWIM BOOST')")
p=R/'quest-xr.css';s=p.read_text();rule='.immersive-rainward header{visibility:hidden!important}'
if rule not in s:p.write_text(s+'\n'+rule+'\n')
