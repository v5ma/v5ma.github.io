from pathlib import Path
# Exact, idempotent edits on the isolated feature branch, before testing.
edits=[('vesperfall/tidelight.js','<summary>Water / Tidelight','<summary id="tidelight-toggle">Water / Tidelight'),('vesperfall/tests/surestep-browser.py',"        nav_to('tidelight-quality'); old=", "        nav_to('tidelight-toggle'); press(0)\n        check(page.locator('#tidelight-settings').evaluate('(e)=>e.open'), 'Xbox opens the water settings disclosure')\n        nav_to('tidelight-quality'); old=")]
for path,old,new in edits:
 p=Path(path);s=p.read_text()
 if new in s:continue
 assert s.count(old)==1,path
 p.write_text(s.replace(old,new))
