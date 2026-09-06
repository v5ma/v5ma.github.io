"""Update the two release-count assertions without dropping timeline checks."""
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tests/foundation_checks.py'
s=p.read_text()
changes={
"check('Timeline shows nineteen records on four explicit layers',page.locator('.foundation-time-record').count()==19 and page.locator('.foundation-layer-controls input').count()==4)":"check('Timeline shows twenty-three records on four explicit layers',page.locator('.foundation-time-record').count()==23 and page.locator('.foundation-layer-controls input').count()==4)",
"check('Undated constraints are preserved rather than assigned coordinates',page.locator('.foundation-time-record').count()==9)":"check('Thirteen undated constraints are preserved rather than assigned coordinates',page.locator('.foundation-time-record').count()==13)"
}
for old,new in changes.items():
    assert s.count(old)==1,old
    s=s.replace(old,new)
p.write_text(s)
Path(__file__).unlink()
print('Native timeline assertions now include the four added undated constraints.')
