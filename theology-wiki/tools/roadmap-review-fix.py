"""Focused native-browser review corrections, applied once on the review branch."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tests/browser.py'
s=p.read_text()
old="""        go(page,'page-that-does-not-exist')
        check('Unknown article gives a readable failure',page.evaluate('TheologyReader.current()===null') and 'page index does not contain' in page.locator('#article-body').inner_text().lower())"""
new="""        go(page,'page-that-does-not-exist')
        page.wait_for_function(\"TheologyReader.current()===null && document.querySelector('#article-body').textContent.toLowerCase().includes('page index does not contain')\", timeout=15000)
        check('Unknown article gives a readable failure',page.evaluate('TheologyReader.current()===null') and 'page index does not contain' in page.locator('#article-body').inner_text().lower())"""
assert s.count(old)==1
p.write_text(s.replace(old,new))
p=root/'tests/roadmap_checks.py';s=p.read_text()
s=s.replace('import json,zipfile','import json,zipfile,hashlib')
old="""    with zipfile.ZipFile(download.value.path()) as z:
        check('Excel download contains an actual multi-sheet workbook',len([x for x in z.namelist() if x.startswith('xl/worksheets/sheet') and x.endswith('.xml')])>=7)"""
new="""    workbook_path=Path(download.value.path())
    with zipfile.ZipFile(workbook_path) as z:
        check('Excel download contains the nine-sheet planning workbook',len([x for x in z.namelist() if x.startswith('xl/worksheets/sheet') and x.endswith('.xml')])==9)
    manifest_url=page.locator('#roadmap-checklist a[href$=\".xlsx\"]').evaluate('(e)=>new URL(\"workbook-manifest.json\",e.href).href')
    manifest_response=page.request.get(manifest_url)
    check('Downloaded workbook matches its published SHA-256 record',manifest_response.ok and hashlib.sha256(workbook_path.read_bytes()).hexdigest()==manifest_response.json()['sha256'])"""
assert s.count(old)==1
p.write_text(s.replace(old,new))
Path(__file__).unlink()
print('Native navigation check waits for its result; Excel delivery now compares exact hashes.')
