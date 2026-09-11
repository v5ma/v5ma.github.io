"""One-use, path-restricted transfer of the locally tested Dino Atlas upgrade."""
import base64
import hashlib
import json
import lzma
from pathlib import Path

root = Path(__file__).resolve().parent
parts = [root / f'.ranger-transfer-{i}' for i in range(8)]
raw = base64.b64decode(''.join(p.read_text(encoding='utf-8').strip() for p in parts), validate=True)
expected = 'bc0ad234b1841c33fc406e34a21442c54b77c117120ee831f0c5c86d2ba4c73d'
assert hashlib.sha256(raw).hexdigest() == expected, 'Source-transfer checksum mismatch; refusing all writes'
payload = json.loads(lzma.decompress(raw, memlimit=268435456))
allowed = {'index.html', 'walking.html', 'ranger.css', 'ranger.js', 'ranger-data.js', 'ranger-physics.js', 'ranger-art.js', 'ranger-world.js', 'ranger-audio.js', 'RANGER-README.md', 'tests/ranger.test.mjs', 'tests/ranger-browser.py'}
assert set(payload['files']) == allowed, 'Unexpected path in source transfer'
assert hashlib.sha256((root / 'index.html').read_bytes()).hexdigest() == payload['original_index_sha256'], 'The original entry point changed; refusing to overwrite it'
assert payload['files']['walking.html'].encode('utf-8') == (root / 'index.html').read_bytes(), 'Walking mode must be preserved byte for byte'
for name, content in payload['files'].items():
    target = root / name
    assert target.resolve().is_relative_to(root), 'Out-of-project path'
    assert isinstance(content, str)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')
for part in parts:
    part.unlink()
Path(__file__).unlink()
print('Installed 12 scoped source files; preserved the walking entry point and every pre-existing journal module.')
