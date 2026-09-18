"""Branch-only, hash-checked transfer of the reviewed local candidate.
Workbook member deltas reconstruct the exact artifact_tool export; they do not
calculate, author, or independently modify spreadsheet content.
"""
from pathlib import Path
import base64,hashlib,io,json,zipfile,zlib
sha=lambda b:hashlib.sha256(b).hexdigest()
blob=lambda b:hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
repairs=[('nrdVVmswDfp','nrdVmswDfp'),('TPucRucR3Rsm','TPucR3Rsm'),('LkzfHMMGdvLT','LkzfHMMmGdvLT'),('QSbuevbBJ/ZZP4K5vEX9kk/som8Vc2ib+ySfyVTeKvbBJ/ZZP4K5vEX9kk/som8Vc2ib+ySfyVTeKvbBJ/ZZP4K5vE/0+ySV','QSbuevbBJ/ZZP4K5vEX9kk/som8Vc2ib+ySfyVTeKvbBJ/ZZP4K5vE/0+ySV')]
def load(pattern,count,expected,fix=False):
 encoded=''.join(Path(pattern.format(i)).read_text().strip() for i in range(count))
 if fix:
  for a,b in repairs:encoded=encoded.replace(a,b)
 raw=zlib.decompress(base64.b64decode(encoded,validate=True))
 assert sha(raw)==expected,(pattern,sha(raw))
 return json.loads(raw)
candidate=load('.github/pilgrimage-candidate-{}.txt',4,'294038e2a802ee636a45f1754b9c4924b64a09a5251839f1849c5fec0c12b4d2',True)
metadata=load('.github/pilgrimage-meta-v2-{}.txt',10,'dd21da9f40c12a42450e3951cce9121813ebaa755e1098ae0ce6d73632814082')
final={r['path']:r['new'] for r in candidate+metadata}
def apply(records,allow_final=False):
 pending=[]
 for r in records:
  p=Path(r['path']);assert p.parts[0]=='vesperfall' and '..' not in p.parts
  old=p.read_bytes() if p.exists() else None
  if old is not None and (blob(old)==r['new'] or (allow_final and blob(old)==final[r['path']])):continue
  assert (blob(old) if old is not None else None)==r['old'],str(p)
  if 'zipTransport' in r:
   source=zipfile.ZipFile(io.BytesIO(old));parts=[]
   for part in r['zipTransport']:
    if isinstance(part,str):parts.append(base64.b64decode(part));continue
    if 'literal' in part:parts.append(base64.b64decode(part['literal']));continue
    try:b=source.read(part['name'])
    except KeyError:b=b''
    if 'textEdits' in part:
     s=b.decode()
     for start,n,replacement in reversed(part['textEdits']):s=s[:start]+replacement+s[start+n:]
     b=s.encode()
    assert sha(b)==part['rawSha'],part['name']
    if part['method']==8:
     c=zlib.compressobj(part['level'],zlib.DEFLATED,-15);b=c.compress(b)+c.flush()
    else:assert part['method']==0
    assert sha(b)==part['compressedSha'],part['name']
    parts.append(b)
   new=b''.join(parts)
  else:
   if 'text' in r:s=r['text']
   else:
    s=old.decode()
    for start,n,replacement in reversed(r['edits']):s=s[:start]+replacement+s[start+n:]
   new=s.encode()
  assert blob(new)==r['new'],str(p)
  pending.append((p,new))
 for p,b in pending:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);print('Verified bytes:',p)
apply(candidate,True)
apply(metadata)
for name,expected in final.items():assert blob(Path(name).read_bytes())==expected,name
print('All implementation and final release bytes verified.')
