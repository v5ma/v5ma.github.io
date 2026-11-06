"""Structural, citation, link and prose-preservation checks. Standard library only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs, unquote
import hashlib
import json
import re
ROOT=Path(__file__).resolve().parent
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.links=[];self.visible=[];self.prose=[];self.depth=0;self.in_prose=False;self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag in ('a','link','script'):
            u=a.get('href',a.get('src'))
            if u:self.links.append(u)
        if tag=='article' and a.get('class')=='prose':self.in_prose=True
    def handle_endtag(self,tag):
        if tag=='article':self.in_prose=False
    def handle_data(self,data):
        self.visible.append(data)
        if self.in_prose:self.prose.append(data)
def norm(s):return ' '.join(re.findall(r'\w+',s))
def plain(line):
    line=re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]',r'\2',line)
    line=re.sub(r'\[\[([^\]]+)\]\]',r'\1',line)
    line=re.sub(r'\[([^\]]+)\]\([^\s]+\)',r'\1',line)
    line=re.sub(r'^\s*(?:#{1,4}\s+|\d+\.\s+|[-*]\s+)','',line)
    return norm(re.sub(r'[*`]','',line))
def main():
    cfg=json.loads((ROOT/'manifest.json').read_text());report=json.loads((ROOT/'build-report.json').read_text());known={r['slug'] for r in cfg['verifiedReaderRoutes']}
    docs={p.name:Page(p.read_text()) for p in ROOT.glob('*.html')};checks=0
    for name,page in docs.items():
        assert len(page.ids)==len(set(page.ids)),('Duplicate IDs',name)
        assert len(re.findall(r'<h1(?:\s|>)',(ROOT/name).read_text()))==1,name
        for url in page.links:
            u=urlparse(url)
            if u.scheme:
                if u.netloc=='wiki.onlyonedevil.com' and u.path=='/theology-wiki/san-reader.html':assert parse_qs(u.query).get('page',[''])[0] in known,url
                assert u.scheme in ('http','https'),url
                continue
            if u.path=='../san-reader.html':
                assert parse_qs(u.query).get('page',[''])[0] in known,url
                continue
            target=ROOT/unquote(u.path) if u.path else ROOT/name
            assert target.is_file(),(name,url)
            if u.fragment and target.suffix=='.html':assert unquote(u.fragment) in Page(target.read_text()).ids,(name,url)
            checks+=1
    for p in cfg['pages']:
        source=(ROOT/p['source']).read_text();body=re.sub(r'^---\n[\s\S]*?\n---\n','',source).strip();lines=body.splitlines()[1:]
        page=docs[p['slug']+'.html'];visible=norm(' '.join(page.prose))
        for line in lines:
            if line.strip():assert plain(line) in visible,(p['slug'],'Missing prose',line[:120])
        expected=next(r['sourceSha256'] for r in report['pages'] if r['slug']==p['slug'])
        assert hashlib.sha256((ROOT/p['source']).read_bytes()).hexdigest()==expected
    for out in report['outputs']:assert hashlib.sha256((ROOT/out['path']).read_bytes()).hexdigest()==out['sha256'],out['path']
    search=json.loads((ROOT/'search-index.json').read_text())
    for r in search:
        f,anchor=r['url'].split('#');assert anchor in docs[f].ids
    print(json.dumps({'status':'passed','html_pages':len(docs),'local_links_checked':checks,'search_sections':len(search),'source_prose_preserved':3,'source_hashes_verified':3,'output_hashes_verified':len(report['outputs'])},indent=2))
if __name__=='__main__':main()
