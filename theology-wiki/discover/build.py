#!/usr/bin/env python3
"""Metadata-only discovery. Run after static registry generation. No transcripts read."""
import argparse,json,html,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,quote
HERE=Path(__file__).resolve().parent
class Headings(HTMLParser):
 def __init__(self): super().__init__();self.depth=0;self.tag=None;self.buf=[];self.title='';self.headings=[]
 def handle_starttag(self,t,a):
  if t in ('nav','footer','script','style'):self.depth+=1
  if t in ('h1','h2','h3') and not self.depth:self.tag=t;self.buf=[]
 def handle_data(self,d):
  if self.tag:self.buf.append(d)
 def handle_endtag(self,t):
  if self.tag==t:
   s=' '.join(' '.join(self.buf).split())
   if t=='h1' and not self.title:self.title=s
   elif s:self.headings.append(s)
   self.tag=None
  if t in ('nav','footer','script','style') and self.depth:self.depth-=1

def build(root):
 root=Path(root);load=lambda p:json.loads((root/p).read_text());pages=[]
 for p in load('data/page-index.json'):
  kind='discussion' if p.get('sourceFile') else ('guide' if p.get('category')=='context' or p['slug'].startswith('topic-') else 'study')
  pages.append(dict(id=p['slug'],title=p['title'],url='san-reader.html?page='+quote(p['slug']),type=kind,topic=p.get('topic',''),terms=p.get('tags',[]),headings=[]))
 aliases=load('connections/canonical-aliases.json')
 for path in load('connections/static-paths.json'):
  if 'static:'+path in aliases or path=='discover/index.html':continue
  assert not urlsplit(path).scheme and not path.startswith('/') and '..' not in path.split('/')
  parser=Headings();parser.feed((root/path).read_text());assert parser.title,path
  kind='guide' if Path(path).name in ('index.html','sources.html','directory.html','comparisons.html','claim-audit.html') else 'study'
  pages.append(dict(id='static:'+path,title=parser.title,url=path,type=kind,topic='Standalone studies',terms=[],headings=parser.headings))
 assert len({p['url'] for p in pages})==len(pages)
 pages.sort(key=lambda p:p['title'].casefold());known={p['url'] for p in pages};routes=json.loads((HERE/'routes.json').read_text());e=html.escape
 for route in routes:
  for title,url in route['steps']:
   path=url.split('#')[0];assert path in known or path=='connections/index.html',url
   assert (root/path).is_file(),url
   if '#' in url:assert re.search(r'id=[\"\']'+re.escape(url.split('#')[1])+r'[\"\']',(root/path).read_text()),url
 rows=''.join('<li><a href="../'+e(p['url'],quote=True)+'">'+e(p['title'])+'</a> <small>'+e(p['type'])+'</small></li>' for p in pages)
 routehtml=''.join('<section><h3>'+e(r['title'])+'</h3><p>'+e(r['purpose'])+'</p><ol>'+''.join('<li><a href="../'+e(u,quote=True)+'">'+e(t)+'</a></li>' for t,u in r['steps'])+'</ol></section>' for r in routes)
 data=dict(version=1,pages=pages);encoded=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
 (HERE/'data.js').write_text('window.THEOLOGY_DISCOVERY='+encoded+';\n');(HERE/'index.html').write_text((HERE/'template.html').read_text().replace('{{CATALOGUE}}',rows).replace('{{ROUTES}}',routehtml).replace('{{COUNT}}',str(len(pages))))
 report=dict(pages=len(pages),counts={k:sum(p['type']==k for p in pages) for k in ['study','guide','discussion']},routes=len(routes),scope='Titles, topics, tags and study section headings; not full-text search of archived conversations.')
 (HERE/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--root',type=Path,default=HERE.parent);build(a.parse_args().root)
