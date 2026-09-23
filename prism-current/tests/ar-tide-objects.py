"""Real bundled-Three data, integration and ownership checks; not GPU acceptance."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/ar-tide';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    b=pw.chromium.launch(**opts)
    try:
        p=b.new_page();p.on('pageerror',lambda e:print('PAGE ERROR:',e));p.goto('about:blank')
        for f in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/fire.js','modules/environment/trees.js','modules/environment/toon.js','modules/environment/cloudlets.js','modules/environment/islands.js','modules/environment/grass.js','modules/environment/water-optics.js','river/difficulty.js','river/core.js','river/art.js','river/bank-trees.js','river/ar-islands.js','tests/ar-tide-objects.js','tests/environment-grass-objects.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/f).read_text())
        r=p.evaluate('window.arTideObjectReport');assert r;extra=p.evaluate('window.grassObjectReport');assert extra;r['passed']+=extra['passed'];r['checks']+=extra['checks'];(OUT/'objects.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
    finally:b.close()
