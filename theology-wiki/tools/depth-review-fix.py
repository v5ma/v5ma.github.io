"""Apply focused native-browser review corrections once; never alter archive files."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def replace(file, old, new):
    p=ROOT/file
    text=p.read_text()
    assert text.count(old)==1,(file,text.count(old),old)
    p.write_text(text.replace(old,new))
replace('assets/js/depth-tools.js',"C.normalize(g.term+' '+g.text).includes(t)","C.tokens(g.term+' '+g.text).includes(t)")
replace('tests/browser.py', '#page-list a[data-page="cognitive-gnosticism-jesus-vs-gnostic-jesus"]', '#page-list .page-link[data-page="cognitive-gnosticism-jesus-vs-gnostic-jesus"]')
replace('tests/browser.py', '#catalogue-results a[data-page="cognitive-gnosticism-jesus-vs-gnostic-jesus"]', '#catalogue-results h3 a[data-page="cognitive-gnosticism-jesus-vs-gnostic-jesus"]')
replace('tests/browser.py', "CHECKS, ERRORS = [], []", "CHECKS, ERRORS, LAYOUTS = [], [], []")
replace('tests/browser.py', "            assert first['y']<600,(width,first)", "            LAYOUTS.append({'viewportWidth':width,'firstArticleTop':round(first['y'],2),'viewportHeight':844})\n            assert first['y']<600,(width,first)")
replace('tests/browser.py', "'origin':ORIGIN,'scope':", "'origin':ORIGIN,'mobileLayouts':LAYOUTS,'scope':")
Path(__file__).unlink()
