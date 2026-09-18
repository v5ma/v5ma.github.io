"""Device-input correction only; camera, actors, clocks and outcomes untouched."""
from pathlib import Path
p=Path('vesperfall/tests/pilgrimage-browser.py');s=p.read_text()
a='TestPad.pad.axes=[0,0,Math.abs(a)>.012?Math.max(-1,Math.min(1,-a*7)):0,Math.abs(q)>.012?Math.max(-1,Math.min(1,-q*7)):0];'
b='const stick=e=>Math.abs(e)<=.012?0:-Math.sign(e)*(.18+.82*Math.min(1,Math.abs(e)*7));TestPad.pad.axes=[0,0,stick(a),stick(q)];'
if a in s:
 assert s.count(a)==1;s=s.replace(a,b)
else:assert b in s
start=s.index(' def aim(target):');end=s.index(' def shoot(target):',start);part=s[start:end]
a='  page.evaluate("""async target=>{const start=performance.now();await new Promise'
b='  result=page.evaluate("""async target=>{const start=performance.now();return await new Promise'
if a in part:
 part=part.replace(a,b,1)
 a="resolve();else reject(Error('Aim did not converge'));"
 b="resolve({target,yawError:a,pitchError:q,wallMilliseconds:performance.now()-start,health:g.game.health});else reject(Error('Aim did not converge '+JSON.stringify({target,yawError:a,pitchError:q,phase:g.game.phase})));"
 assert part.count(a)==1;part=part.replace(a,b)
 part+="  observations.append({'aim':result});(OUT/'input-observations.json').write_text(json.dumps(observations,indent=2))\n"
 s=s[:start]+part+s[end:]
compile(s,str(p),'exec');p.write_text(s)
print('The fixture now maps intended stick velocity through the real .18 deadzone. Original shot/relay and full-save assertions are unchanged.')
