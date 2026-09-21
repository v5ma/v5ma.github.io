"""Actual bundled-Three object/lifecycle checks, separate from rendered acceptance."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/environment-fire';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    try:
        p=b.new_page();p.goto('about:blank')
        for f in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/fire.js','river/core.js','river/art.js','tests/environment-fire-objects.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/f).read_text())
        result=p.evaluate('window.fireObjectReport');assert result
        (OUT/'object-report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
    finally:b.close()
