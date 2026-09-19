"""Read-only structural and link checks for the generated comparative series."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, unquote
import json
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent.parent
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.stack=[];self.ids=[];self.links=[];self.h1=0;self.lang=False;self.viewport=False;self.title=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag not in VOID:self.stack.append(tag)
  if tag=='h1':self.h1+=1
  if tag=='html':self.lang=a.get('lang')=='en'
  if tag=='meta' and a.get('name')=='viewport':self.viewport=True
  if tag=='title':self.title=True
  if 'id' in a:self.ids.append(a['id'])
  if 'href' in a:self.links.append(a['href'])
  if tag=='script':assert a.get('src')=='reader.js'
  assert tag not in {'iframe','object','embed','form'}
  assert not any(k.lower().startswith('on') for k in a)
 def handle_endtag(self,tag):
  assert self.stack and self.stack.pop()==tag,tag

def main():
 report=json.loads((ROOT/'build-report.json').read_text());names=[f['path'] for f in report['files'] if f['path'].endswith('.html')];assert len(names)==13
 assert set(names)=={p.name for p in ROOT.glob('*.html')}
 parsed={}
 for name in names:
  p=Page();p.feed((ROOT/name).read_text());p.close();assert not p.stack;assert p.h1==1 and p.lang and p.viewport and p.title;assert len(p.ids)==len(set(p.ids));assert 'main' in p.ids;parsed[name]=p
 sources=json.loads((ROOT/'sources.json').read_text())['sources']+json.loads((ROOT/'sources-more.json').read_text())['sources'];urls={s['url'] for s in sources}
 index=json.loads((ROOT.parent/'data/page-index.json').read_text(encoding='utf-8-sig'));slugs={r['slug'] for r in index};count=0
 for name,p in parsed.items():
  for href in p.links:
   u=urlsplit(href)
   if u.scheme or u.netloc:
    assert u.scheme=='https' and not u.username and not u.password;assert href in urls,href
   else:
    target=(ROOT/(unquote(u.path) or name)).resolve();assert target.is_relative_to(REPO) and target.is_file(),href
    if target.name=='san-reader.html':assert set(parse_qs(u.query))<= {'page'};assert parse_qs(u.query).get('page',[''])[0] in slugs
    else:
     assert not u.query,href
     if u.fragment:
      assert target.parent==ROOT and target.name in parsed;assert unquote(u.fragment) in parsed[target.name].ids,href
   count+=1
  assert 'index.html' in p.links
 assert all(s['slug']+'.html' in parsed['index.html'].links for s in json.loads((ROOT/'index.json').read_text())['studies'])
 result={'status':'passed','html_pages':len(parsed),'links_checked':count,'source_records':len(sources),'main_reader_destinations_checked':True,'scope':'Structure and link resolution, not scholarly truth or remote source availability.'}
 print(json.dumps(result,indent=2));return result
if __name__=='__main__':main()
