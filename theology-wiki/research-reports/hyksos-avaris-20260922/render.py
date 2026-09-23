"""Render the supplied report, preserving prose and translating its citation metadata."""
from pathlib import Path
import hashlib, html, json, re, unicodedata
from urllib.parse import urlsplit
import mistune
HERE = Path(__file__).resolve().parent
report = json.loads((HERE/'report-source.json').read_text())
body = report['body']
assert hashlib.sha256(body.encode()).hexdigest() == report['original_body_sha256']
assert len(report['citations']) == 68 and len(report['sources']) == 26
sources = {s['id']:s for s in report['sources']}
for s in sources.values():
    assert urlsplit(s['url']).scheme == 'https'
# Offsets in the export are Unicode codepoint offsets, not UTF-16 indices.
for c in reversed(report['citations']):
    assert body[c['start']:c['end']] == c['marker']
    assert all(i in sources for i in c['source_ids'])
    links = ', '.join(f"[S{i}](#source-{i})" for i in c['source_ids'])
    body = body[:c['start']] + '(' + links + ')' + body[c['end']:]
assert '\ue200' not in body and '\ue201' not in body
normalized = body
body = re.sub(r'(?<!\n) (?=#{2,3} )', '\n\n', body)
headings = []
class Renderer(mistune.HTMLRenderer):
    def heading(self, text, level, **attrs):
        plain = html.unescape(re.sub('<[^>]+>', '', text))
        anchor = re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',plain).encode('ascii','ignore').decode().lower()).strip('-')
        assert anchor not in {x['id'] for x in headings}
        headings.append({'id':anchor,'level':level,'text':plain})
        if level == 1: return ''
        return f'<h{level} id="{anchor}">{text}</h{level}>\n'
    def block_code(self, code, info=None):
        if info and info.strip()=='mermaid':
            rows=[]; title=''
            for line in code.splitlines():
                line=line.strip()
                if line in ('','timeline'): continue
                if line.startswith('title '): title=line[6:]; continue
                if line.startswith(':'):
                    assert rows
                    rows[-1][1].append(line[1:].strip())
                else:
                    date,sep,event=line.partition(' : ')
                    assert sep, line
                    rows.append([date,[event]])
            return '<figure class="timeline"><figcaption>'+html.escape(title)+'</figcaption><ol>'+''.join('<li><strong>'+html.escape(date)+'</strong><p>'+'<br>'.join(map(html.escape,events))+'</p></li>' for date,events in rows)+'</ol></figure>\n'
        return super().block_code(code,info)
renderer=Renderer(escape=True)
markdown=mistune.create_markdown(renderer=renderer,plugins=['table'])
content=markdown(body)
content=content.replace('<table>','<div class="table-scroll" tabindex="0" role="region" aria-label="Report comparison table"><table>').replace('</table>','</table></div>')
assert content.count('<table>')==9
mainlinks=[('Moses, the volcano and Exodus chronology','moses-volcano-and-exodus-chronology'),('Exodus-to-Temple competing chronologies','exodus-to-temple-competing-chronologies'),('Kenite hypothesis and Yahweh origins','kenite-hypothesis-and-yahweh-origins')]
nav=''.join(f'<a href="../../san-reader.html?page={slug}">{html.escape(label)}</a>' for label,slug in mainlinks)
toc=''.join(f'<li><a href="#{h["id"]}">{html.escape(h["text"])}</a></li>' for h in headings if h['level']==2)
bibliography=''.join(f'<li id="source-{i}"><span class="source-label">S{i}.</span> <a href="{html.escape(s["url"],quote=True)}">{html.escape(s["title"])}</a></li>' for i,s in sources.items())
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+html.escape(report['title'])+''' | Theology Wiki</title><link rel="stylesheet" href="report.css"><meta name="description" content="The full supplied deep-research report on Avaris, Hyksos chronology, Moses candidates, royal women and the Seqenenre constraint, with its original citations restored."></head><body><a class="skip" href="#report">Skip to report</a><header><p class="eyebrow">THEOLOGY WIKI / ARCHIVED DEEP RESEARCH / 22 SEPTEMBER 2026</p><h1>'''+html.escape(report['title'])+'''</h1><p class="archive-note">Completed Deep Research report supplied by the author. Its text, assessments, tables and source links are preserved; this publication does not independently recheck or rewrite its historical findings. The chronology graphic is presented as an accessible list.</p><nav aria-label="Related Wiki investigations">'''+nav+'''</nav><p class="downloads"><a href="report.md">Report in Markdown</a> / <a href="report-original.md">Unaltered source text</a> / <a href="report-source.json">Report and citation metadata</a> / <a href="README.md">Archive and preservation notes</a></p></header><main><aside aria-labelledby="contents-title"><h2 id="contents-title">Report contents</h2><ol>'''+toc+'''<li><a href="#report-sources">Original report sources</a></li></ol></aside><article id="report">'''+content+'''</article><section id="report-sources"><h2>Original report sources</h2><p>The 26 source records below are the titles and URLs attached to the completed report. The 68 citation placements in the body link to these records. Repeated or differently tracked URLs are retained as supplied. No additional source has been substituted for an original citation.</p><ol class="bibliography">'''+bibliography+'''</ol></section></main><footer><p><a href="../../san-reader.html">Theology Wiki home</a> / <a href="#contents-title">Report contents</a></p><p>Original-text SHA-256: <code>'''+report['original_body_sha256']+'''</code>. The archival note and navigation are separate from the report. Earlier Wiki chronologies remain available on their existing pages.</p></footer></body></html>\n'''
(HERE/'index.html').write_text(page)
readable = normalized + '\n\n## Original report sources\n\n' + '\n\n'.join(f'<a id="source-{i}"></a>\n\nS{i}. [{s["title"]}]({s["url"]})' for i,s in sources.items())+'\n'
(HERE/'report.md').write_text(readable)
(HERE/'citation-map.json').write_text(json.dumps({'citation_placements':report['citations'],'sources':report['sources']},ensure_ascii=False,indent=2)+'\n')
files=['index.html','report.md','report-original.md','report-source.json','citation-map.json','report.css','README.md']
receipt={'schema_version':1,'archived_on':report['archived_on'],'title':report['title'],'original_body_sha256':report['original_body_sha256'],'counts':{'citation_placements':68,'source_records':26,'tables':9,'main_sections':6},'headings':headings,'files':[{'path':name,'sha256':hashlib.sha256((HERE/name).read_bytes()).hexdigest()} for name in files]}
(HERE/'build-report.json').write_text(json.dumps(receipt,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(receipt['counts']))
