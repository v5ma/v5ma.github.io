"""Apply the inspected homepage regression test and a source-grounded textual clarification."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tests/browser.py';s=p.read_text()
old="        check('Home includes a connecting introduction and all other developed articles', page.locator('.depth-article-index a').count()==16 and page.locator('.depth-route-banner a[data-page=\"guide-to-the-inquiry\"]').count()==1)"
new="""        expected_articles=set(page.evaluate("TheologyReader.pages().filter(p=>p.kind==='Developed article').map(p=>p.slug)"))
        featured_articles=page.locator('.depth-featured a[data-page]').evaluate_all('(links)=>links.map(a=>a.dataset.page)')
        indexed_articles=page.locator('.depth-article-index a[data-page]').evaluate_all('(links)=>links.map(a=>a.dataset.page)')
        check('Home includes the connecting introduction and every developed article exactly once', len(expected_articles)==20 and len(featured_articles)==3 and len(indexed_articles)==len(expected_articles)-3 and len(set(featured_articles+indexed_articles))==len(expected_articles) and set(featured_articles+indexed_articles)==expected_articles and page.locator('.depth-route-banner a[data-page="guide-to-the-inquiry"]').count()==1)"""
assert s.count(old)==1,'Homepage fixture differs from inspected source'
p.write_text(s.replace(old,new))
p=root/'editorial/roadmap.cjs';s=p.read_text()
needle="const references=[\n"
addition=" ref('melch-kim2018','Dong-Hyuk Kim (2018), The Messiah of Aaron and Israel: Do We See Single or Double?, Korean Journal of Old Testament Studies 24(1), 190-213','https://journal.kci.go.kr/ksots/archive/articleView?artiId=ART002331289','Journal metadata, English abstract and bibliography consulted. DOI 10.24333/jkots.2018.24.1.190. The abstract establishes the dispute about the singular Damascus Document expression and states the author\'s argument for two figures. The full Korean article and the cited critical editions were not collated. This is current editorial research, not a recovered author acknowledgment.'),\n"
assert s.count(needle)==1
p.write_text(s.replace(needle,needle+addition))
p=root/'editorial/roadmap-articles/melchizedek-priesthood-and-transmission.md';s=p.read_text()
needle='## Four different connections, with different burdens\n'
addition='''## The two-messiah question must not become a single formula

The distinction raised in author turn 84 concerns two different axes: how many messianic figures a text anticipates, and what qualifies each figure to exercise authority. Answering the first does not automatically settle the second. A royal office, a priestly descent claim and an interpretive model of enduring priesthood are not three interchangeable family names. The question is about their relationship, not simply a choice of label.

The AI reply in turn 85 compresses the Community Rule and Damascus Document into a repeated plural formula. The Damascus Document requires a more precise treatment. Its expression "the messiah of Aaron and Israel" is the subject of a scholarly dispute about one figure or two. Dong-Hyuk Kim's 2018 study argues for two through grammar, context and patterns of leadership; its abstract also identifies scholars who challenge that interpretation. The singular wording is therefore neither an automatic refutation of a two-figure reading nor permission to pretend the wording itself is plural. The journal's abstract and bibliographic record, rather than a new collation of the manuscript, are the access basis for this clarification.

This is a correction of an archived AI answer, not a retreat from the author's question. The distinction the question requests is precisely what the compressed answer obscures. A more faithful investigation can ask whether a given text distributes royal and priestly functions between agents, combines functions in one agent, or locates their ultimate authorization elsewhere. Each possibility gives a different account of how a community understands leadership. Neither the number of agents nor a title by itself identifies a particular historical teacher.

Hebrews 7:11-17 supplies a concrete example of why the second axis matters. It does not solve a missing Aaronic qualification by supplying another ordinary Aaronic pedigree for Jesus. It acknowledges Judah and argues for a different basis of priestly authority through Melchizedek. For the broader reconstruction, the useful comparison is not merely whether a priestly image survives. It is whether a later interpretation preserves a valued function while changing the qualification that authorizes it. That is a transformation to explain, not an identity to assume.

A counterfactual helps distinguish the claims. Suppose a community preserves an expectation of priestly and royal leadership but later concentrates both functions in a single figure. Its institutional arrangement would have changed even if its vocabulary of authority remained recognizable. Conversely, two communities could preserve two offices while disagreeing over which lineage or interpretation legitimately fills them. Either pattern could be relevant to transmission, but neither pattern alone establishes that one community descended from the other. A proposed historical route needs evidence of its carriers in addition to a description of what might have traveled.

This gives the Teacher/Thomas/Gnostic inquiry a more discriminating question: which combinations of functions and qualifications persist, and which are deliberately revised? The answer can connect a priestly genealogy, a scriptural interpretation, an exalted figure and a community practice without collapsing them into a single claim. It also prevents a flat account of all Jewish messianic expectation from replacing the particular texts under examination. Kim is credited here as scholarship consulted for this edition, not as an author Micah is newly said to have cited.

'''
assert s.count(needle)==1
p.write_text(s.replace(needle,addition+needle))
p=root/'tests/roadmap.test.cjs';s=p.read_text()
s+='''\ntest('Messianic-number clarification preserves the author question and identifies the AI compression',()=>{const a=R.articles[0];assert(a.body.includes('author turn 84'));assert(a.body.includes('AI reply in turn 85'));assert(a.body.includes('neither an automatic refutation'));assert(a.body.includes('two different axes'));const ref=R.references.find(r=>r.id==='melch-kim2018');assert(ref.scope.includes('abstract'));assert(ref.scope.includes('not a recovered author acknowledgment'));assert(a.externalSources.includes(ref.id));});
test('Release tree contains developed roadmap sources, not transfer placeholders',()=>{for(const f of ['editorial/roadmap.cjs','data/roadmap.json','planning/Theology-Research-Plan.xlsx'])assert(fs.existsSync(path.join(ROOT,f)));for(const f of fs.readdirSync(ROOT))assert(!/^(roadmap-transfer-|resume-foundation-|foundation-transfer-)/.test(f));assert(!fs.existsSync(path.join(ROOT,'tools/roadmap-review-fix.py')));});
'''
p.write_text(s)
p=root/'README.md';s=p.read_text();s+='''\n## Roadmap continuation: actual deployment gates\n\nThe continued roadmap pass corrects the workbook transfer digest to the preserved workbook manifest and replaces stale test selectors with assertions against the actual reader. Homepage coverage now checks that all developed article destinations occur exactly once across featured and remaining articles. Missing-page tests await the real error state rather than a fixed delay. Workbook download checks require nine sheets and the published SHA-256 digest. A release-tree test rejects leftover transfer placeholders and temporary patch scripts.\n\nThe Melchizedek article now separately treats the number of messianic agents and the qualification of their authority. It identifies the compression in the archived AI reply to the author's turn-84 question and credits Dong-Hyuk Kim's 2018 study at the actual abstract-level access scope. The workbook remains the same verified planning snapshot; no task is marked author-approved by this textual clarification.\n'''
p.write_text(s)
Path(__file__).unlink()
print('Homepage destination coverage and textual distinctions updated; release-tree checks added.')
