"""Apply focused test corrections to the actual recovered reader sources."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tests/browser.py'
s=p.read_text()
old="""        page.goto(BASE+'?page=not-a-real-page',wait_until='domcontentloaded')
        page.wait_for_timeout(500)
        check('Unknown routes do not silently pretend to be home', page.evaluate('TheologyReader.current()===null') and 'page index does not contain' in page.locator('#article-body').inner_text().lower())"""
new="""        page.goto(BASE+'?page=not-a-real-page',wait_until='domcontentloaded')
        page.wait_for_function(\"window.TheologyReader && TheologyReader.current()===null && document.querySelector('#article-body').textContent.toLowerCase().includes('page index does not contain')\")
        check('Unknown routes do not silently pretend to be home', page.evaluate('TheologyReader.current()===null') and 'page index does not contain' in page.locator('#article-body').inner_text().lower())"""
assert s.count(old)==1,'Missing-route fixture differs from reviewed source'
s=s.replace(old,new)
old="        (OUT/'failure-traceback.txt').write_text(traceback.format_exc())"
new=old+"\n        (OUT/'failure-browser-state.json').write_text(json.dumps({'errors':ERRORS,'state':page.evaluate('({url:location.href,current:window.TheologyReader?.current()?.slug,title:document.querySelector(\"#article-title\")?.textContent,body:document.querySelector(\"#article-body\")?.textContent.slice(0,2000)})')},indent=2))"
assert s.count(old)==1
p.write_text(s.replace(old,new))
p=root/'tests/roadmap_checks.py';s=p.read_text()
s=s.replace('import zipfile\n','import zipfile\nimport hashlib\n')
old="""    with zipfile.ZipFile(ev.value.path()) as z:
        check('Excel download is a real workbook with multiple sheets','xl/workbook.xml' in z.namelist() and len([n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')])>=7)"""
new="""    workbook_path=Path(ev.value.path())
    with zipfile.ZipFile(workbook_path) as z:
        check('Excel download contains exactly nine worksheets','xl/workbook.xml' in z.namelist() and len([n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')])==9)
    manifest_url=page.locator('#roadmap-xlsx').evaluate('(e)=>new URL(\"workbook-manifest.json\",e.href).href')
    response=page.request.get(manifest_url)
    check('Downloaded workbook matches the published SHA-256 manifest',response.ok and hashlib.sha256(workbook_path.read_bytes()).hexdigest()==response.json()['sha256'])"""
assert s.count(old)==1,'Workbook fixture differs from reviewed source'
p.write_text(s.replace(old,new))
Path(__file__).unlink()
print('Actual missing-route and workbook fixtures updated; no runtime guard invented.')
