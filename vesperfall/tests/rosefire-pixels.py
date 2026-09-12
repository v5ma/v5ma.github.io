"""Require added stained-light color in actual native matching frames.
Removing the prior light pool is a pixel change, but not a passing new effect.
"""
from pathlib import Path
import json
from PIL import Image
out=Path(__file__).resolve().parents[2]/'test-output/rosefire'
def chroma(name):
    with Image.open(out/name) as source:
        im=source.convert('RGB');w,h=im.size
        pixels=im.crop((0,h//2,w,h)).getdata()
        return sum(max(p)-min(p) for p in pixels)/(w*(h-h//2))
before=chroma('choir-before.png');after=chroma('choir-rosefire.png')
result={'beforeFloorChroma':before,'rosefireFloorChroma':after,'gain':after-before,'pass':after-before>2,'scope':'Native matching-frame lower half. This check rejects removal-only changes; human art review remains separate.'}
(out/'stained-light-pixels.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result),flush=True)
assert result['pass'],'The new floor caustics must add visible color, not just remove the previous glow.'
