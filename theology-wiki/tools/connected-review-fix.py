"""Align release assertions with independently validated source records."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
f=json.loads((root/'data/foundations.json').read_text())
a=json.loads((root/'data/source-atlas.json').read_text())
assert len(f['timeline'])==19
assert sum(x['start'] is None for x in f['timeline'])==9
assert sum(x['kind']=='translation' for x in a['records'])==7
p=root/'tests/foundation_checks.py';s=p.read_text()
changes={
"check('Timeline shows seventeen records on four explicit layers',page.locator('.foundation-time-record').count()==17":"check('Timeline shows nineteen records on four explicit layers',page.locator('.foundation-time-record').count()==19",
"check('Undated constraints are preserved rather than assigned coordinates',page.locator('.foundation-time-record').count()==8)":"check('Undated constraints are preserved rather than assigned coordinates',page.locator('.foundation-time-record').count()==9)"
}
for old,new in changes.items():
    assert s.count(old)==1,old
    s=s.replace(old,new)
p.write_text(s)
p=root/'tests/atlas_checks.py';s=p.read_text()
old="check('Translation filter isolates six access records', page.locator('#atlas-list a').count() == 6)"
assert s.count(old)==1
p.write_text(s.replace(old,"check('Translation filter isolates seven access records', page.locator('#atlas-list a').count() == 7)"))
p=root/'README.md';s=p.read_text()
s=s.replace('The current collection indexes all 354 already-public AI chats and contains 22 developed articles.','The current collection indexes all 354 already-public AI chats and contains 25 developed articles.',1)
p.write_text(s)
Path(__file__).unlink()
print('Nineteen timeline records, nine undated entries and seven translation records verified before updating the assertions.')
