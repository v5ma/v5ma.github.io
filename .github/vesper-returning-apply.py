"""Materialize only exact, hash-verified Vesperfall source on an isolated branch."""
from pathlib import Path
import base64,hashlib,json,zlib
parts=sorted(Path('.github').glob('vesper-returning.part[0-9][0-9]'))
if not parts: raise SystemExit(0)
assert len(parts)==6
raw=zlib.decompress(base64.b64decode(''.join(p.read_text().strip() for p in parts)))
assert hashlib.sha256(raw).hexdigest()=='b35adcc7dbb0024b3e48c44aa01f1e0d872ad1fea93ac46e69bd290b5063bcc8'
pending=[]
for r in json.loads(raw):
 p=Path(r['path']);assert not p.is_absolute() and '..' not in p.parts and p.parts[0]=='vesperfall'
 current=p.read_bytes() if p.exists() else None
 digest=hashlib.sha256(current).hexdigest() if current is not None else None
 if digest==r['new']:continue
 assert digest==r['old'],(str(p),'base changed')
 if 'text' in r:s=r['text']
 else:
  s=current.decode('utf-8')
  for start,n,replacement in reversed(r['edits']):s=s[:start]+replacement+s[start+n:]
 data=s.encode('utf-8');assert hashlib.sha256(data).hexdigest()==r['new'],str(p)
 pending.append((p,data))
for p,data in pending:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);print('Verified',p)
for p in parts:p.unlink()
