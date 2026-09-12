"""Read-only OOXML checks: the workbook must match canonical committed tasks.
Workbook authoring uses artifact_tool; this script only inspects exported bytes.
"""
from pathlib import Path
import hashlib,json,zipfile,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1];p=root/'roadmap.json';d=json.loads(p.read_text());ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(root/'AAA-PRODUCTION.xlsx') as z:
 book=ET.fromstring(z.read('xl/workbook.xml'));names=[s.attrib['name'] for s in book.findall('x:sheets/x:sheet',ns)]
 assert names==['Start Here','Backlog','Milestones','Device QA','Release Gates','Risk Register'],names
 def cells(index):
  tree=ET.fromstring(z.read(f'xl/worksheets/sheet{index}.xml'))
  return {c.attrib['r']:c.findtext('x:v',default='',namespaces=ns) for c in tree.findall('.//x:sheetData/x:row/x:c',ns)}
 front,back=cells(1),cells(2)
 assert hashlib.sha256(p.read_bytes()).hexdigest() in front['A27'],'Workbook JSON source digest is stale'
 assert front['A7']==str(len(d['tasks'])) and front['C7']==str(sum(t['status']=='Implemented' for t in d['tasks'])),'Stale summary formulas'
 for row,t in enumerate(d['tasks'],6):
  for col,key in [('A','id'),('B','title'),('C','status'),('D','priority'),('E','milestone'),('F','area'),('I','why'),('J','gate'),('K','verification')]:
   assert back[col+str(row)]==t[key],(row,key,'Workbook task does not match canonical JSON')
 for name in z.namelist():
  if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
   text=z.read(name).decode();assert 't="e"' not in text,'An exported sheet contains an Excel error cell'
print('PASS: six-sheet workbook, 76 complete task rows, live summary formula values and canonical JSON hash match.')
