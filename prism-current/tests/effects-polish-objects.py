"""Real bundled Three resources with controlled prewarm collaborators, not GPU."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/clear-shoals';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    try:
        p=b.new_page();p.goto('about:blank');errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/water-detail.js','modules/environment/water-optics.js','modules/environment/fire.js','tests/effects-polish-objects.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        p.evaluate('effectsPolishComplete');report=p.evaluate('effectsPolishReport');assert not errors,errors
        (OUT/'effects-polish-objects.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:b.close()
