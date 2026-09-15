"""Exact source and artifact-authored workbook transport on the feature branch.
ZIP reconstruction is lossless member-byte transfer, not spreadsheet editing.
"""
from pathlib import Path
import base64,hashlib,io,json,zipfile,zlib
parts=sorted(Path('.github').glob('vesper-meta.part[0-9][0-9]'))
if not parts:raise SystemExit(0)
assert len(parts)==6
h=lambda x:hashlib.sha256(x).hexdigest()
raw=zlib.decompress(base64.b64decode(''.join(p.read_text().strip() for p in parts)))
assert h(raw)=='21ea258064518d4963766400d2501c181b2c9a4b5f565852a09804c5db3d4862'
pending=[]
for r in json.loads(raw):
 p=Path(r['path']);assert not p.is_absolute() and '..' not in p.parts and p.parts[0]=='vesperfall'
 current=p.read_bytes() if p.exists() else None
 if current is not None and h(current)==r['new']:continue
 assert (h(current) if current is not None else None)==r['old'],str(p)
 if 'zipTransport' in r:
  src=zipfile.ZipFile(io.BytesIO(current));segments=[]
  for part in r['zipTransport']:
   if isinstance(part,str):segments.append(base64.b64decode(part));continue
   x=src.read(part['name'])
   if 'edits' in part:
    s=x.decode('utf-8')
    for start,n,replacement in reversed(part['edits']):s=s[:start]+replacement+s[start+n:]
    x=s.encode('utf-8')
   assert h(x)==part['rawSha']
   if part['method']==8:
    c=zlib.compressobj(part['level'],zlib.DEFLATED,-15);x=c.compress(x)+c.flush()
   else:assert part['method']==0
   assert h(x)==part['compressedSha'],part['name']
   segments.append(x)
  data=b''.join(segments)
 else:
  if 'text' in r:s=r['text']
  else:
   s=current.decode('utf-8')
   for start,n,replacement in reversed(r['edits']):s=s[:start]+replacement+s[start+n:]
  data=s.encode('utf-8')
 assert h(data)==r['new'],str(p)
 pending.append((p,data))
for p,data in pending:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);print('Verified',p)
for p in parts:p.unlink()
