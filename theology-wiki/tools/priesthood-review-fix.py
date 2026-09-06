"""Open the existing source-note disclosure in the new article acceptance checks."""
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tests/priestly_checks.py'
s=p.read_text()
old="        check('New study exposes sourced reading and full-listening entry: '+slug,'External sources' in body and page.locator('a[href*=\"listen='+slug+'\"]').count()>0)"
new="""        listening=page.locator('a[href*=\"listen='+slug+'\"]')
        listening.wait_for()
        page.locator('.depth-source-notes > summary').click()
        check('New study exposes sourced reading and full-listening entry: '+slug,'External sources and access notes' in page.locator('#article-body').inner_text() and listening.count()==1)
        page.locator('.depth-source-notes > summary').click()"""
assert s.count(old)==1
p.write_text(s.replace(old,new))
Path(__file__).unlink()
