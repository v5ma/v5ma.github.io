"""Isolated rendering fixture, NOT a gameplay or physical headset acceptance."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);p=b.new_page(viewport={'width':600,'height':450});p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/tests/portal-render.html');p.wait_for_function('!!window.portalResult',timeout=120000)
 result=p.evaluate('portalResult');(OUT/'portal-render.json').write_text(json.dumps(result,indent=2));p.screenshot(path=str(OUT/'portal-render.png'));b.close();assert not result.get('error'),result;assert result['passed']==12,result
 print('PASS twelve ray-aperture GPU fixtures, including scaled stereo viewports, rolled head, custom shader and sprite',flush=True)
