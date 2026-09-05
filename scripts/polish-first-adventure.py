"""Small presentation and acceptance-test corrections, never injected progress."""
from pathlib import Path
r=Path(__file__).resolve().parents[1];g=r/'mario-maker-clone/svgn-paper-route'
p=g/'adventure-game.js';s=p.read_text()
if 'const mailLabel=' not in s:
 s=s.replace("  if(!on()){panel.hidden=true;return;}\n", "  const mailLabel=document.querySelector('#cloud-hud .cloud-delivery .cloud-label'),retry=document.getElementById('sky-retry');\n  if(mailLabel)mailLabel.textContent=on()?'BONUS MAIL':'DELIVERIES';\n  if(retry)retry.textContent=on()?'Retry checkpoint':'Retry catch';\n  if(!on()){panel.hidden=true;return;}\n")
 s=s.replace("  const post=document.getElementById('delivery-count');if(post)post.textContent=deliveries+' bonus';", "  const post=document.getElementById('delivery-count');if(post)post.textContent=deliveries+' bonus';\n  const cloudMail=document.getElementById('cloud-deliveries');if(cloudMail)cloudMail.textContent=String(deliveries);")
p.write_text(s)
p=g/'adventure.css';s=p.read_text().replace(".ground-route-active #sky-retry{font-size:0}.ground-route-active #sky-retry::after{content:'Retry checkpoint';font-size:11px}",'');p.write_text(s)
p=r/'tests/adventure_browser.py';s=p.read_text()
s=s.replace("    page.wait_for_function('player.vx<0&&player.track?.sky.fullLoop',timeout=120000)\n    page.screenshot(path=str(OUT/'loop-in-motion.png'))\n    check(page.evaluate('player.y<1980'),'The rider follows the upper half of the actual loop')", "    proof=page.wait_for_function('()=>{const p=player;return p.vx<0&&p.y<1980&&p.track?.sky.fullLoop?{x:p.x,y:p.y,rail:p.track.sky.id}:false;}',timeout=120000).json_value()\n    check(proof['y']<1980,'The rider follows the upper half of the actual loop')\n    page.screenshot(path=str(OUT/'loop-in-motion.png'))")
if 'The visible HUD treats deliveries' not in s:
 s=s.replace("  page.screenshot(path=str(OUT/'post-office.png'))", "  check(page.locator('#cloud-deliveries').inner_text()=='0' and page.locator('#cloud-hud .cloud-delivery .cloud-label').inner_text()=='BONUS MAIL','The visible HUD treats deliveries as a bonus, not a zero quota')\n  page.screenshot(path=str(OUT/'post-office.png'))")
# The first software-GPU run reached the final district at x=6956, still moving
# at full speed, before the wall-clock timeout. Keep the same input and finish
# assertion, but allow the longer authored level to finish without speeding it up.
s=s.replace('timeout=480000','timeout=720000')
s=s.replace('({won,x:player.x,y:player.y,tries,','({won,x:player.x,y:player.y,vx:player.vx,vy:player.vy,steps:__ground.state.steps,tries,')
p.write_text(s)
print('Bonus-mail HUD corrected; loop proof captured atomically; long-level replay allowance expanded.')
