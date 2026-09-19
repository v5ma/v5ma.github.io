"""Bound the actual changed paths and verify all new static internal references."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, parse_qs
import subprocess,json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BASE=json.loads((HERE/'manifest.json').read_text())['base_commit']
PARENT='theology-wiki/comparative-religion/egypt-emanation/'
PREFIX=PARENT+'moses-jesus-mammon/'
report=json.loads((HERE.parent/'build-report.json').read_text())
allowed={PARENT+'build.cjs',PARENT+'README.md',PARENT+'build-report.json','.github/workflows/theology-egypt-emanation-integration.yml','.github/workflows/theology-egypt-emanation-validation.yml'}
allowed.update(PARENT+f['path'] for f in report['files'] if f['path'].endswith('.html'))
changed=subprocess.check_output(['git','diff','--name-only',BASE,'--'],cwd=ROOT,text=True).splitlines()
assert changed,'Expected an actual edition diff'
assert not subprocess.check_output(['git','diff','--name-only','--diff-filter=D',BASE,'--'],cwd=ROOT,text=True).strip(),'No deletions are authorized'
for p in changed:assert p.startswith(PREFIX) or p in allowed,p
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.ids=set();self.links=[];self.stack=[];self.h1=0;self.lang=False;self.viewport=False;self.feed(text);assert not self.stack,self.stack
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang')=='en'
  if tag=='meta' and a.get('name')=='viewport':self.viewport=True
  if tag=='h1':self.h1+=1
  if 'id' in a:assert a['id'] not in self.ids,a['id'];self.ids.add(a['id'])
  for key in ('href','src'):
   if key in a:self.links.append(a[key])
  if tag not in {'meta','link','input','br','hr','img','source','area','base','col','embed','param','track','wbr'}:self.stack.append(tag)
 def handle_endtag(self,tag):
  assert self.stack and self.stack[-1]==tag,(tag,self.stack[-5:]);self.stack.pop()
cache={}
def parse(p):
 if p not in cache:cache[p]=Page(p.read_text())
 return cache[p]
files=list(HERE.glob('*.html'));assert len(files)==6
routes={r['slug'] for r in json.loads((ROOT/'theology-wiki/data/page-index.json').read_text())}
links=0
for file in files:
 page=parse(file);assert page.h1==1 and page.lang and page.viewport,file
 for raw in page.links:
  u=urlsplit(raw)
  if u.scheme or u.netloc:assert u.scheme=='https',raw;continue
  target=(ROOT/u.path.lstrip('/') if u.path.startswith('/') else file.parent/unquote(u.path)).resolve() if u.path else file
  assert target.is_relative_to(ROOT.resolve()),raw
  assert target.exists(),(file.name,raw)
  if target.name=='san-reader.html':assert parse_qs(u.query).get('page',[''])[0] in routes,raw
  if u.fragment and target.suffix=='.html':assert unquote(u.fragment) in parse(target).ids,(file.name,raw)
  links+=1
print(json.dumps({'status':'passed','base_commit':BASE,'changed_paths':len(changed),'pages':len(files),'internal_links_checked':links,'scope':'Only the new module, declared parent navigation derivatives and two existing workflow files. This checks delivery structure, not historical conclusions.'},indent=2))
