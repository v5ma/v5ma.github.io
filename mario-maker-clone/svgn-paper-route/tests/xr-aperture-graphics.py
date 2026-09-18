"""Isolated rendered aperture fixture; not a native game or physical headset test."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import os,json,threading,functools,subprocess
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-aperture'));OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(SimpleHTTPRequestHandler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(f'http://127.0.0.1:{server.server_port}/mario-maker-clone/svgn-paper-route/tests/xr-aperture-graphics.html',wait_until='domcontentloaded');page.wait_for_function('window.fixture?.done',timeout=120000)
  report=page.evaluate('fixture');report.update(commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),pageErrors=errors,coverage='Isolated actual Three WebGL fragment-mask fixture. Ten perspective/eye poses and unmasked restoration; not game acceptance or hardware.')
  page.screenshot(path=str(OUT/'fixture.png'));(OUT/'report.json').write_text(json.dumps(report,indent=2));assert report['passed'] and not errors,report
 finally:browser.close();server.shutdown()
