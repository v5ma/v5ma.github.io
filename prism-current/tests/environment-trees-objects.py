"""Bundled-Three object checks; no WebGL context required."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/environment-trees';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    try:
        p=b.new_page();p.goto('about:blank')
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/trees.js','modules/environment/water.js','modules/environment/fire.js','river/core.js','river/art.js','river/bank-trees.js','tests/environment-trees-objects.js','tests/environment-trees-preparation.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        p.evaluate('window.treesPreparationComplete')
        report=p.evaluate('window.treesObjectReport');assert report
        extra=p.evaluate('window.treesPreparationReport');report['passed']+=extra['passed'];report['checks']+=extra['checks']
        (OUT/'object-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:b.close()
