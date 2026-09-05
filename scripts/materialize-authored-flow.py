"""Bounded source transfer. No workflow or unrelated application is modified."""
from pathlib import Path
import base64, hashlib, json, zlib
root=Path(__file__).resolve().parents[1]
folder='mario-maker-clone/svgn-paper-route/'
allowed={folder+n for n in ['flow-core.js','phrase-geometry.js','phrase-data.js','phrase-layout.js','phrase-playback.js','phrase-runtime.js','phrase-coach.js','phrase.css','planning/AUTHORED-FLOW-NOTES.md']}|{'scripts/install-flow-phrases.py','tests/phrase_flow.test.cjs','tests/phrase_browser.py'}
incoming=root/'.phrase-incoming'
if incoming.exists():
    text=''.join((incoming/f'part-{i}.txt').read_text().strip() for i in range(5))
    data=base64.b64decode(text,validate=True)
    assert hashlib.sha256(data).hexdigest()=='33d79e2c5b94b6f262796e908b887c909d45819413f20d0c8564fd72679ce3b9','Incomplete authored source transfer'
    dec=zlib.decompressobj();raw=dec.decompress(data,1000000)
    assert dec.eof and not dec.unconsumed_tail and not dec.unused_data,'Invalid compressed source'
    files=json.loads(raw);assert set(files)==allowed,'Unexpected source file set'
    for name,value in files.items():
        assert isinstance(value,str) and len(value)<150000,name
        target=root/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(value)
    for i in range(5):(incoming/f'part-{i}.txt').unlink()
    incoming.rmdir()
assert all((root/p).exists() for p in allowed),'Required authored source missing'
import runpy
runpy.run_path(str(root/'scripts/install-flow-phrases.py'),run_name='__main__')
print('Verified readable authored-flow source is installed; temporary input removed.')
