"""Verify report fidelity and the actual integrated links, not historical truth."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs,unquote
import hashlib,json,re,subprocess,unittest
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
BASE='c31dd6c56a101aec7c8a890768ae1f845494b294'
sha=lambda b:hashlib.sha256(b).hexdigest()
report=json.loads((HERE/'report-source.json').read_text())
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__(convert_charrefs=True);self.ids=[];self.links=[];self.text=[];self.tables=0;self.h1=0;self.feed(s)
 def handle_starttag(self,t,a):
  a=dict(a)
  if 'id' in a:self.ids.append(a['id'])
  if 'href' in a:self.links.append(a['href'])
  if 'src' in a:self.links.append(a['src'])
  self.tables+=t=='table';self.h1+=t=='h1'
 def handle_data(self,s):self.text.append(s)
page=Page((HERE/'index.html').read_text())
class ReportTests(unittest.TestCase):
 def test_exact_original(self):
  self.assertEqual(sha((HERE/'report-original.md').read_bytes()),'6e1b48f16d20d74eba348c288b280583a23768373356831a50a8ba40a70f096c')
  self.assertEqual((HERE/'report-original.md').read_text(),report['body'])
  self.assertEqual(sha((HERE/'report-source.json').read_bytes()),'e52494d3785e9c9a7640549c762884322f994cbe37bbccf277300cba36ca9945')
 def test_export_is_limited_to_final_report(self):
  self.assertEqual(set(report),{'schema_version','title','archived_on','provenance','original_body_sha256','body','citations','sources'})
  self.assertNotIn('activity_messages',report);self.assertNotIn('backing_conversation_id',report)
 def test_every_original_citation_is_restored(self):
  body=report['body'];self.assertEqual(len(report['citations']),68);self.assertEqual(len(report['sources']),26)
  for c in reversed(report['citations']):
   self.assertEqual(body[c['start']:c['end']],c['marker'])
   replacement='('+', '.join(f'[S{i}](#source-{i})' for i in c['source_ids'])+')'
   body=body[:c['start']]+replacement+body[c['end']:]
  self.assertEqual((HERE/'report.md').read_text().split('\n\n## Original report sources\n\n')[0],body)
  self.assertNotIn('\ue200',(HERE/'index.html').read_text())
  self.assertEqual(sum(1 for u in page.links if u.startswith('#source-')),sum(len(c['source_ids']) for c in report['citations']))
 def test_sources_and_tables_are_retained(self):
  self.assertEqual(page.tables,9);self.assertEqual(page.h1,1);self.assertEqual(len(page.ids),len(set(page.ids)))
  for s in report['sources']:
   self.assertIn('source-'+str(s['id']),page.ids);self.assertIn(s['url'],page.links)
  self.assertIn('The royal women',' '.join(page.text));self.assertIn('Yanassi',' '.join(page.text));self.assertIn('not positive evidence',' '.join(page.text))
 def test_internal_report_links(self):
  routes={x['slug'] for x in json.loads((ROOT/'theology-wiki/data/page-index.json').read_text())}
  for u in page.links:
   p=urlsplit(u)
   if p.scheme:self.assertEqual(p.scheme,'https');continue
   if not p.path:self.assertIn(unquote(p.fragment),page.ids);continue
   dest=(HERE/p.path).resolve();self.assertTrue(dest.is_relative_to(ROOT));self.assertTrue(dest.exists(),u)
   if dest.name=='san-reader.html' and p.query:self.assertIn(parse_qs(p.query)['page'][0],routes)
 def test_three_canonical_bodies_are_preserved(self):
  receipt=json.loads((HERE/'integration-receipt.json').read_text());self.assertEqual(len(receipt['articles']),3)
  for r in receipt['articles']:
   rel='theology-wiki/editorial/authorial-articles/'+r['slug']+'.md'
   original=subprocess.check_output(['git','show',BASE+':'+rel],cwd=ROOT)
   current=(ROOT/rel).read_bytes();self.assertEqual(current,original+r['added_text'].encode())
   compiled=(ROOT/'theology-wiki/content/developed'/str(r['slug']+'.md')).read_text()
   self.assertIn(r['added_text'].strip(),compiled)
   for link in re.findall(r'\]\((/theology-wiki/research-reports/[^)]+)\)',r['added_text']):
    parts=urlsplit(link);self.assertTrue((ROOT/parts.path.lstrip('/')).exists())
    if parts.fragment:self.assertIn(parts.fragment,page.ids)
 def test_unrelated_authored_content_is_unchanged(self):
  permitted={r['slug'] for r in json.loads((HERE/'integration-receipt.json').read_text())['articles']}
  names=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'theology-wiki/editorial/authorial-articles'],cwd=ROOT,text=True).splitlines()
  for rel in names:
   if Path(rel).stem not in permitted:self.assertEqual((ROOT/rel).read_bytes(),subprocess.check_output(['git','show',BASE+':'+rel],cwd=ROOT))
  changed=subprocess.check_output(['git','diff','--name-only',BASE,'--','theology-sources','theology-wiki/event-forecast-register','theology-wiki/data/forecast-ledger.json'],cwd=ROOT,text=True)
  self.assertEqual(changed,'')
 def test_generation_and_integration_are_idempotent(self):
  files=['report-source.json','report-original.md','index.html','report.md','citation-map.json','build-report.json','integration-receipt.json']
  before={n:sha((HERE/n).read_bytes()) for n in files}
  subprocess.check_call(['node',str(HERE/'decode.cjs')]);subprocess.check_call(['python',str(HERE/'render.py')]);subprocess.check_call(['node',str(HERE/'integrate.cjs')])
  self.assertEqual(before,{n:sha((HERE/n).read_bytes()) for n in files})
 def test_main_search_includes_the_new_context_links(self):
  script="const fs=require('fs'),C=require('./theology-wiki/assets/js/research-core.js');const pages=JSON.parse(fs.readFileSync('theology-wiki/data/page-index.json')),s=JSON.parse(fs.readFileSync('theology-wiki/data/search.json'));console.log(JSON.stringify(C.select(pages,'Hyksos Avaris',{kind:'article'},s).map(p=>p.slug)));"
  results=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT,text=True))
  for r in json.loads((HERE/'integration-receipt.json').read_text())['articles']:self.assertIn(r['slug'],results)
if __name__=='__main__':unittest.main(verbosity=2)
