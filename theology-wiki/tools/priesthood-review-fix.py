"""Keep export coverage exact after adding twelve typed source relationships."""
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tests/atlas_checks.py'
s=p.read_text()
old="check('Atlas export retains typed edges and explicit open leads', len(data['edges']) == 45 and len([r for r in data['records'] if r['kind'] == 'research-lead']) == 3)"
new="check('Atlas export retains all 57 typed edges and three explicit open leads', len(data['edges']) == 57 and len([r for r in data['records'] if r['kind'] == 'research-lead']) == 3)"
assert s.count(old)==1
p.write_text(s.replace(old,new))
Path(__file__).unlink()
