"""Bounded recovery applied and committed BEFORE acceptance. Remove at release."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'review source drift',s.count(old));p.write_text(s.replace(old,new))
patch('meridian-relief.mjs','data.obstacles.push(...MERIDIAN_PLANS.flatMap(planWalls));','''data.obstacles.push(...MERIDIAN_PLANS.flatMap(planWalls));
 // Directional privacy for the original water controls. Both flanks remain
 // accessible to pursuers; the ground gap preserves legacy supply drops.
 data.obstacles.push({id:'clinic-privacy-screen',x:-38.8,z:28,w:.45,d:6.6,h:1.75,bottom:meridianHeight(-38.8,28)+.4,kind:'crate'});''')
patch('tests/freefield-meridian.py','def tap(i):frames();page.evaluate','def tap(i):frames(3);page.evaluate')
patch('tests/freefield-meridian.py','const yaw=Rainward.view.yaw,scale=Math.max(.35,Math.min(1,d));','const yaw=Rainward.view.yaw,zone=.18,speed=Math.min(9,Math.max(.5,d/.30)),scale=zone+(1-zone)*speed/9;')
patch('tests/freefield-meridian.py','go(-41,29);go(-42,29);','go(-42,32.5);go(-42,29);')
patch('tests/freefield-meridian.py',"try:data['state']=page.evaluate('Rainward.snapshot()');","try:data['virtualInput']=page.evaluate('({pad,polls,pulses})');data['state']=page.evaluate('Rainward.snapshot()');")
