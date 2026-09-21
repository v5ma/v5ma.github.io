"""Construct real Three objects in Chromium, even when WebGL is unavailable.
Separate from actual rendered gameplay acceptance. Writes only a test report.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/environment-water';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    try:
        p.goto('about:blank')
        for rel in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/fire.js','river/core.js','river/art.js','tests/environment-water-objects.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/rel).read_text())
        report=p.evaluate('window.waterObjectReport');assert report and not errors,errors
        (OUT/'object-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:b.close()
