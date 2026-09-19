"""Check actual HTML references and the bounded edition diff."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs,unquote
import json,subprocess
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];BASE=json.loads((HERE/'manifest.json').read_text())['base_commit'];PREFIX='theology-wiki/event-forecast-register/authority-imagery/'
allowed={'theology-wiki/event-forecast-register/index.html','theology-wiki/event-forecast-register/README.md','.github/workflows/theology-authority-imagery-integration.yml','.github/workflows/theology-authority-imagery-validation.yml'}
changed=subprocess.check_output(['git','diff','--name-only',BASE,'--'],cwd=ROOT,text=True).splitlines()
assert changed
for p in changed:assert p.startswith(PREFIX) or p in allowed,p
assert not subprocess.check_output(['git','diff','--name-only','--diff-filter=D',BASE,'--'],cwd=ROOT,text=True).strip()
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.ids=set();self.links=[];self.stack=[];self.h1=0;self.lang=False;self.viewport=False;self.feed(text);assert not self.stack,self.stack
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='html':self.lang=a.get('lang')=='en'
  if t=='meta' and a.get('name')=='viewport':self.viewport=True
  if t=='h1':self.h1+=1
  if 'id' in a:assert a['id'] not in self.ids,a['id'];self.ids.add(a['id'])
  for k in ('href','src'):
   if k in a:self.links.append(a[k])
  if t not in {'meta','link','input','br','hr','img','source','area','base','col','embed','param','track','wbr'}:self.stack.append(t)
 def handle_endtag(self,t):assert self.stack and self.stack.pop()==t,t
cache={}
def parse(p):
 if p not in cache:cache[p]=Page(p.read_text())
 return cache[p]
files=list(HERE.glob('*.html'));assert len(files)==7
routes={x['slug'] for x in json.loads((ROOT/'theology-wiki/data/page-index.json').read_text())};count=0
for f in files:
 doc=parse(f);assert doc.lang and doc.viewport and doc.h1==1,f
 for raw in doc.links:
  u=urlsplit(raw)
  if u.scheme or u.netloc:assert u.scheme=='https',raw;continue
  dest=(ROOT/u.path.lstrip('/') if u.path.startswith('/') else f.parent/unquote(u.path)).resolve() if u.path else f
  assert dest.is_relative_to(ROOT.resolve()) and dest.exists(),(f.name,raw)
  if dest.name=='san-reader.html':assert parse_qs(u.query).get('page',[''])[0] in routes,raw
  if u.fragment and dest.suffix=='.html':assert unquote(u.fragment) in parse(dest).ids,(f.name,raw)
  count+=1
print(json.dumps({'status':'passed','pages':len(files),'internal_links':count,'changed_paths':len(changed),'base_commit':BASE,'scope':'New source module, two exact parent insertions and dedicated workflows only.'},indent=2))
