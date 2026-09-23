"""Real Three object/ray tests, not a GPU rendering test."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/flex-surface';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**opts)
    try:
        page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('about:blank')
        for rel in ['vendor/aframe-1.8.0.min.js','modules/environment/flex-surface.js','tests/environment-flex-surface-objects.js']:
            page.add_script_tag(content=(ROOT/'prism-current'/rel).read_text())
        report=page.evaluate('window.flexObjectReport');assert report and not errors,errors
        (OUT/'object-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:browser.close()
