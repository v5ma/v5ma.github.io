"""Wait for this exact checked-out release, then exercise its public reading view."""
# Compare original bytes only after validating the exact current publication blocks.
import sys
from pathlib import Path
sys.path.insert(0, str(next(p for p in Path(__file__).resolve().parents
    if (p / 'scripts/theology_publication_bytes.py').is_file()) / 'scripts'))
from theology_publication_bytes import source_bytes

import hashlib
import os
from pathlib import Path
import subprocess
import sys
import time
from urllib.request import urlopen

HERE = Path(__file__).resolve().parent
WIKI = HERE.parents[1]
BASE = 'https://v5ma.github.io/theology-wiki/'
files = [HERE / name for name in ['index.html','transcript.json','transcript.md','source-integrity.json','conversation.css']]
files += [WIKI / 'latest' / name for name in ['index.html','manifest.json']]
expected = {str(f.relative_to(WIKI)):hashlib.sha256(f.read_bytes()).digest() for f in files}
deadline = time.monotonic() + 300
while True:
    try:
        for name,digest in expected.items():
            url = BASE + name + '?release=' + os.environ.get('GITHUB_SHA','verification')
            with urlopen(url,timeout=15) as response:
                if response.status != 200 or hashlib.sha256(source_bytes(response.read(),"theology-wiki/"+name)).digest() != digest:
                    raise ValueError('Published bytes do not yet match: '+name)
        break
    except Exception as error:
        if time.monotonic() >= deadline:
            raise
        print(str(error),flush=True)
        time.sleep(10)
print('Seven published files exactly match the checked-out release.',flush=True)
subprocess.run([sys.executable,str(HERE/'browser-test.py')],check=True,env={**os.environ,'THEOLOGY_BASE_URL':BASE})
