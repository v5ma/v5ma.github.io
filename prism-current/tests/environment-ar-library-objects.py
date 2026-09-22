"""Actual Three.js resource checks. Runs without a WebGL or headset claim."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/ar-library';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    b=pw.chromium.launch(**opts)
    try:
        p=b.new_page();p.goto('about:blank');errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/toon.js','modules/environment/cloudlets.js','tests/environment-ar-library-objects.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        report=p.evaluate('window.arLibraryReport');assert report and not errors,errors
        (OUT/'object-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
        print('WebGL2 probe:',p.evaluate('!!document.createElement("canvas").getContext("webgl2")'))
    finally:b.close()
