"""Apply exact Rainward-only UTF-8 line edits; verify all files before writing."""
import hashlib,json
from pathlib import Path
TOOLS=Path(__file__).resolve().parent
ROOT=TOOLS.parents[1]
sha=lambda text:hashlib.sha256(text.encode('utf-8')).hexdigest()
updates={}
for entry in json.loads((TOOLS/'field-ready-patches.json').read_text(encoding='utf-8')):
    name=entry['path']
    if not name.startswith('rainward/') or '..' in Path(name).parts or name in updates:
        raise ValueError('Invalid or repeated path: '+name)
    source=(ROOT/name).read_text(encoding='utf-8')
    if sha(source)==entry['after']:
        continue
    if sha(source)!=entry['before']:
        raise ValueError('Source changed; reconcile before applying: '+name)
    lines=source.splitlines(keepends=True)
    boundary=len(lines)+1
    for start,end,text in reversed(entry['changes']):
        if not (0<=start<=end<=len(lines) and end<=boundary):
            raise ValueError('Invalid edit range: '+name)
        lines[start:end]=[text]
        boundary=start
    result=''.join(lines)
    if sha(result)!=entry['after']:
        raise ValueError('Output hash mismatch: '+name)
    updates[name]=result
for name,text in updates.items():
    (ROOT/name).write_text(text,encoding='utf-8')
    print('Verified and integrated '+name,flush=True)
old=ROOT/'rainward/roadmap.html'
archive=ROOT/'rainward/roadmap-legacy-v06.html'
if not archive.exists():
    archive.write_bytes(old.read_bytes())
old.write_bytes((TOOLS/'roadmap.html.template').read_bytes())
print('Integrated',len(updates),'source files and archived the older roadmap.')
