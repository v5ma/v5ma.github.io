"""Apply the reviewed Rainward-only source delta, validating every input/output.
Character offsets address decoded UTF-8, not bytes. All files are verified before
any write, and an already applied output is idempotent. This does not publish.
"""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sha=lambda text:hashlib.sha256(text.encode('utf-8')).hexdigest()
updates={}
for packet in sorted(Path(__file__).parent.glob('patch-*.json')):
    for entry in json.loads(packet.read_text(encoding='utf-8')):
        path=entry['path']
        if not path.startswith('rainward/') or '..' in Path(path).parts or path in updates:
            raise ValueError('Invalid or repeated Rainward path: '+path)
        target=ROOT/path
        original=target.read_text(encoding='utf-8')
        if sha(original)==entry['after']:
            continue
        if sha(original)!=entry['before']:
            raise ValueError('Source changed; reconcile before applying: '+path)
        changed=original
        previous=len(original)+1
        for start,end,value in reversed(entry['changes']):
            if not (0<=start<=end<=len(original) and end<=previous):
                raise ValueError('Invalid edit range in '+path)
            changed=changed[:start]+value+changed[end:]
            previous=start
        if sha(changed)!=entry['after']:
            raise ValueError('Output hash mismatch: '+path)
        updates[path]=changed
for path,text in updates.items():
    (ROOT/path).write_text(text,encoding='utf-8')
    print('Verified and integrated '+path,flush=True)
print('Integrated files:',len(updates))
