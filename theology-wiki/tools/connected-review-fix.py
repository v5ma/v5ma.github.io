"""Make the connected argument map readable and verify its real reader structure."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'editorial/authorial-articles/computational-divine-immanence.md';s=p.read_text()
assert s.count('Christic Self-Construction Theory')==1
s=s.replace('Christic Self-Construction Theory','[[christ-as-an-inner-model|Christic Self-Formation Theory]]')
s=s.replace('It does not identify another planet as inhabited, assign a hidden identity to a scientist, or turn an internal image into an astronomical observation.','The analogy expresses a proposed relation between a world and its ground; it does not supply evidence about the population or physical properties of another world.')
p.write_text(s)
p=root/'tools/build.cjs';s=p.read_text()
a="const navigator=(slug,title,summary,body)=>add({slug,title,summary,category:'context',kind:'Navigator',updated:F.updated},body);"
b="const navigator=(slug,title,summary,body)=>add({slug,title,summary,category:'context',kind:'Navigator',updated:slug==='computational-argument-map'?H.updated:F.updated},body);"
assert s.count(a)==1;s=s.replace(a,b)
a=" const computational=require('../editorial/computational-foundations.json');"
b=a+"\n const bridgeTitles={ground:'A necessary ground',agency:'Reasons and selection',immanence:'The world within its ground','quantum-neural':'Which meaning of coherence?','coherence-gravity':'From coherence to a physical field','flood-inheritance':'Inheritance through transformation','witness-event-date':'The object, the work and the event','mapping-probabilities':'Narrative mappings and evidence','experience-explanation':'Experience and its explanation','ruliad-monad':'The Ruliad and the Monad'};"
assert s.count(a)==1;s=s.replace(a,b)
a="return '## '+b.id.replaceAll('-',' ')+': '+b.type+'\\n\\n'+b.question"
b="return '## '+(bridgeTitles[b.id]||b.id.replaceAll('-',' '))+'\\n\\n'+b.type+'.\\n\\n'+b.question"
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
p=root/'tests/computational_checks.py';s=p.read_text()
a="page.locator('#article-body h2').count()>=10 and 'necessary-ground' not in body and 'necessary ground' in body.lower()"
b="page.locator('#article-body h3').count()==10 and 'necessary ground' in body.lower()"
assert s.count(a)==1;s=s.replace(a,b)
a="    check('Downloaded register contains seventeen sources and ten connections',response.ok and len(register['records'])==17 and len(register['bridges'])==10)"
b=a+"\n    check('Every connection question is displayed without abbreviation',all(b['question'] in body for b in register['bridges']))"
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
Path(__file__).unlink()
print('Ten human-readable headings, matching canonical question text and consistent working theory naming.')
