"""Extend exact attribution acceptance and keep the live introduction authorial."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tests/foundation_checks.py';s=p.read_text()
old="check('Debt register distinguishes four attribution categories',page.locator('.foundation-debt').count()==4)"
new="check('Debt register distinguishes five attribution categories',page.locator('.foundation-debt').count()==5)"
assert s.count(old)==1;s=s.replace(old,new)
old="check('An AI-introduced author name is not presented as an author acknowledgment','AI-introduced research lead' in page.locator('.foundation-debt').last.inner_text() and 'Self Aware Networks GPT' in page.locator('.foundation-debt').last.inner_text())"
new="""lead=page.locator('.foundation-debt').filter(has_text='Gabriele Boccaccini')
    check('An AI-introduced author name is not presented as an author acknowledgment',lead.count()==1 and 'AI-introduced research lead' in lead.inner_text() and 'Self Aware Networks GPT' in lead.inner_text())
    owens=page.locator('.foundation-debt').filter(has_text='Lance S. Owens')
    check('Earlier comparative scholarship remains a newly consulted interpretation',owens.count()==1 and 'Newly consulted earlier interpretation' in owens.inner_text() and 'Not a recovered personal acknowledgment' in owens.inner_text())"""
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
p=root/'assets/js/foundation-tools.js';s=p.read_text()
old='This register separates acknowledgment by Micah, teachers discussed in a comparison, translation credit, and a lead introduced only by an AI. None automatically attributes every later hypothesis to the named person.'
new='I distinguish my earlier acknowledgments, teachers discussed in comparison, translations used here, AI-only leads, and newly consulted interpretations. These contributions do not automatically make every later hypothesis the conclusion of the named scholar.'
assert s.count(old)==1;p.write_text(s.replace(old,new))
Path(__file__).unlink()
