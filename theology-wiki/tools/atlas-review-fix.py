"""Keep the native browser release assertions aligned with the expanded index."""
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tests/browser.py'
s=p.read_text()
changes={
"check('Native HTTP reader loads 411 indexed pages', page.evaluate('TheologyReader.pages().length') == 411)":"check('Native HTTP reader loads 416 indexed pages', page.evaluate('TheologyReader.pages().length') == 416)",
"len(expected_articles)==20 and len(featured_articles)==3":"len(expected_articles)==22 and len(featured_articles)==3"
}
for old,new in changes.items():
    assert s.count(old)==1,old
    s=s.replace(old,new)
p.write_text(s)
Path(__file__).unlink()
