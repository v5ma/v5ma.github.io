"""Apply a hash-checked, Vesperfall-only source transport, never a fuzzy patch."""
from pathlib import Path
import base64, hashlib, json, zlib
parts=sorted(Path('.github').glob('vesperfall-surestep.part[1-4]'))
if not parts:
 print('Source is already materialized.')
 raise SystemExit(0)
assert len(parts)==4
raw=zlib.decompress(base64.b64decode(''.join(p.read_text().strip() for p in parts)))
assert hashlib.sha256(raw).hexdigest()=='e247c414653b3c9e1f22c27fa84567d3356bb004292a5df42369b2c9212a38a2'
pending=[]
for r in json.loads(raw):
 p=Path(r['path']);assert not p.is_absolute() and '..' not in p.parts and p.parts[0]=='vesperfall'
 current=p.read_bytes() if p.exists() else None
 digest=hashlib.sha256(current).hexdigest() if current is not None else None
 if digest==r['new']:continue
 assert digest==r['old'],(str(p),'base content changed')
 if 'text' in r:new=r['text']
 else:
  new=current.decode('utf-8')
  for start,n,replacement in reversed(r['edits']):new=new[:start]+replacement+new[start+n:]
 data=new.encode('utf-8');assert hashlib.sha256(data).hexdigest()==r['new'],str(p)
 pending.append((p,data))
for p,data in pending:
 p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);print('Applied',p)
for p in parts:p.unlink()
