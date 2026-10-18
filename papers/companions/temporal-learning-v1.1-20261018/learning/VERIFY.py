from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
manifest=json.loads((root/'SOURCE-MANIFEST.json').read_text(encoding='utf-8'))
for row in manifest['files']:
    p=root/row['path']
    if not p.is_file() or p.stat().st_size!=row['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:
        raise SystemExit('Hash mismatch: '+row['path'])
print(json.dumps({'passed':True,'files':len(manifest['files']),'scope':'File integrity only; no model, data download or scientific validation'}))
