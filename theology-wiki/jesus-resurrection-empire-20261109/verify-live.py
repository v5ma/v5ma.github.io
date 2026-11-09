"""Verify generated public bytes; this checks publication, not historical claims."""
import hashlib, json, os, pathlib, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
ORIGIN = os.environ.get('THEOLOGY_ORIGIN', 'https://v5ma.github.io').rstrip('/')
REVISION = os.environ.get('GITHUB_SHA', '20261109')
FILES = ['index.html', 'series.css', 'search.js', 'search-data.js', 'search-index.json']
FILES += [p['slug'] + '.html' for p in json.loads((ROOT / 'manifest.json').read_text())['pages']]
FILES += ['../latest/index.html', '../latest/manifest.json']

def check():
    result = []
    for name in FILES:
        relative = (ROOT / name).resolve().relative_to(ROOT.parent.parent)
        url = ORIGIN + '/' + str(relative) + '?release=' + REVISION
        request = urllib.request.Request(url, headers={'User-Agent': 'TheologyWiki-PublicationCheck/1.0', 'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=25) as response:
            body = response.read()
            assert response.status == 200
        expected = (ROOT / name).read_bytes()
        if body != expected:
            raise AssertionError('Hosted bytes differ: ' + str(relative))
        result.append({'path': str(relative), 'status': 200, 'sha256': hashlib.sha256(body).hexdigest()})
    return result

if __name__ == '__main__':
    for attempt in range(30):
        try:
            print(json.dumps({'revision': REVISION, 'origin': ORIGIN, 'files': check()}, indent=2))
            break
        except Exception as exc:
            if attempt == 29:
                raise
            print('Publication not yet matched:', exc, flush=True)
            time.sleep(10)
