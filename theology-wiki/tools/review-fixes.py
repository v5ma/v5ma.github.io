"""Apply focused review fixes once, then retain only the corrected sources."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tests/browser.py';s=p.read_text()
old='page.wait_for_function(\'!!document.querySelector("#page-list a[data-page=\\"cognitive-gnosticism-jesus-vs-gnostic-jesus\\"]")\')'
new='page.locator(\'#page-list a[data-page="cognitive-gnosticism-jesus-vs-gnostic-jesus"]\').wait_for()'
assert old in s;s=s.replace(old,new)
s=s.replace('    except Exception:\n        screenshot',"    except Exception:\n        import traceback\n        (OUT/'failure-traceback.txt').write_text(traceback.format_exc())\n        screenshot")
s=s.replace("        screenshot(page,'home-desktop.png')","        check('Unrelated cross-project controls are not shown',not page.locator('#northstar-cluster-list').is_visible())\n        screenshot(page,'home-desktop.png')")
p.write_text(s)
p=root/'assets/css/research.css';p.write_text(p.read_text()+'\n.meta-list[hidden],.panel-label[hidden],#article-navigation[hidden]{display:none!important}\n')
p=root/'README.md';s=p.read_text();s=s.replace('The GitHub Actions workflow runs these tests on the feature branch before generated files are committed there.', 'The GitHub Actions workflow preserves the generated source on the isolated feature branch and runs native browser tests there before publication.');p.write_text(s)
Path(__file__).unlink()
