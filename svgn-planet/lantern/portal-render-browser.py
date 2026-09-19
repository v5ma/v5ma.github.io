"""Pixel assertions against the production aperture, with actual stereo cameras.
Geometric fixture only: not a full game tour or physical-headset certification."""
import asyncio,base64,json,os,traceback
from pathlib import Path
from urllib.parse import urljoin
from playwright.async_api import async_playwright
OUT=Path(os.getenv('PORTAL_OUT','portal-render-results'));OUT.mkdir(parents=True,exist_ok=True)
BASE=urljoin(os.getenv('WARD_BASE','http://127.0.0.1:8765/svgn-planet/'),'lantern/portal-render.html')
async def main():
 report={'checks':[],'errors':[],'physicalHardwareTested':False,'fixture':'Production material adapter with far/near oversized planes and actual ArrayCamera eyes'}
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=await b.new_page()
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['errors'].append(m.text) if m.type=='error' else None)
  try:
   await page.goto(BASE);await page.wait_for_function('window.fixtureReady',timeout=90000)
   for i,(direction,roll) in enumerate([([0,.5,3],0),([0,2.5,3],.4),([3,.5,.1],-.3),([-3,.5,.1],.2),([0,.5,-3],0),([0,.5,.05],.3)]):
    r=await page.evaluate('(a)=>runPortalFixture(...a)',[direction,roll]);image=r.pop('image');(OUT/f'eyes-{i}.png').write_bytes(base64.b64decode(image));report['checks'].append(r)
    assert r['inside']>100 and min(r['perEye'])>0,r
    assert r['leaks']==0 and r['missing']==0 and r['foreground']==0 and r['glError']==0,r
    assert all(c[0]>210 and c[1]<55 for c in r['centers']),r
   assert not report['errors'],report['errors'];report['success']=True
  except Exception as e:report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await b.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
