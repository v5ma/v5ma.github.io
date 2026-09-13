"""Idempotent, scoped integration of the Clear Water UI into the v0.13 baseline.
This is not an Undertow recovery script. No sibling paths or saves are touched.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def replace(name,old,new):
 p=root/name;s=p.read_text()
 if old in s:
  assert s.count(old)==1,(name,'ambiguous patch')
  p.write_text(s.replace(old,new))
 else:assert new in s,(name,'source diverged; inspect before integrating')
replace('app.mjs','createAquaticUI({get state(){return state;},get mode(){return mode;},get pad(){return pad;}})','createAquaticUI({settings,get state(){return state;},get mode(){return mode;},get pad(){return pad;}})')
replace('aquatic.mjs','Underwater. Watch your air. A surfaces.','Underwater. Watch your air; surface to refill it.')
replace('aquatic.mjs','Deep water. B dives. A surfaces.','Deep water. Gear is stowed. Check the water controls to dive or surface.')
p=root/'aquatic.css';s=p.read_text()
if '#aquatic-hud.low-air' not in s:p.write_text(s+'\n#aquatic-hud.low-air{border-style:double;border-width:3px;padding:8px 11px}#water-warning:empty{display:none}#aquatic-hud #water-warning{font-weight:bold;letter-spacing:.3px;margin-top:5px}@media(max-width:700px){#aquatic-hud.low-air{padding:6px}}\n')
