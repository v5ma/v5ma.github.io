"""Recover source bytes only after verifying exact current publication enhancements.

No wildcard HTML stripping: expected blocks come from the same JavaScript decorator
and graph used to publish. Missing, changed, stale or duplicate blocks fail closed.
"""
from functools import lru_cache
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
MARKER = b'<!-- theology-connectivity:'

@lru_cache(maxsize=None)
def _blocks(relative_path):
    script = """
const fs=require('node:fs'),path=require('node:path');
const root=process.argv[1],file=process.argv[2];
const {createDecorator}=require(path.join(root,'scripts/theology-connectivity-artifact.cjs'));
const data=JSON.parse(fs.readFileSync(path.join(root,'theology-wiki/connections/data.json'),'utf8'));
process.stdout.write(JSON.stringify(createDecorator(data).blocks(file)));
"""
    result = subprocess.run(['node', '-e', script, str(ROOT), relative_path],
                            check=True, capture_output=True, text=True, timeout=60)
    blocks = json.loads(result.stdout)
    return tuple(blocks[key].encode('utf-8') for key in ('head', 'body') if blocks[key])

def strip_expected_blocks(body, blocks):
    """Remove each exact expected byte sequence once; preserve everything else."""
    for block in blocks:
        if body.count(block) != 1:
            raise ValueError('Missing, stale, changed or duplicate publication block')
        body = body.replace(block, b'', 1)
    if MARKER in body:
        raise ValueError('Unexpected publication block remains')
    return body

def source_bytes(body, relative_path):
    """Return verified source bytes for HTML; all other assets pass through unchanged."""
    relative_path = str(relative_path).replace('\\', '/')
    if not relative_path.endswith('.html'):
        return body
    if relative_path.startswith('/') or '..' in relative_path.split('/'):
        raise ValueError('Expected repository-relative publication path')
    return strip_expected_blocks(body, _blocks(relative_path))
