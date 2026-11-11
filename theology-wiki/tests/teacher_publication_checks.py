"""Read-only Teacher publication proof against the same local or hosted reader."""
import hashlib
import json
import os
import re
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'theology-test-output'
ORIGIN = os.environ.get('SITE_ORIGIN', 'http://127.0.0.1:4174').rstrip('/')
REVISION = os.environ.get('GITHUB_SHA', 'local')
SLUG = 'jesus-teacher-of-righteousness-hypothesis'
ARTICLE = f'theology-wiki/content/developed/{SLUG}.md'
PROJECTION = f'theology-wiki/public-corpus/pages/{SLUG}.md'
NARRATION = f'theology-wiki/data/listening/{SLUG}.json'
INDEX = 'theology-wiki/data/page-index.json'
PHRASES = ['one founder, several generations of memory', '34 candidate parallels',
           'ten diagnostic non-equivalences',
           'The proposed Judea–Egypt route and its successor generations',
           'Daniel, the Damascus Document, and the clocks within the model']


def main():
    OUT.mkdir(exist_ok=True)
    mode = 'hosted' if ORIGIN.startswith('https://') else 'local'
    report = {'origin': ORIGIN, 'commit': REVISION, 'files': {}, 'targets': {}, 'passed': False}
    digest = lambda data: hashlib.sha256(data).hexdigest()
    receipt_bytes = (ROOT / 'theology-wiki/editorial/displaced-biography-20261024.json').read_bytes()
    assert digest(receipt_bytes) == '1bbb5446558e401e119e28e1d54be6d397af7ec85d742fd860564541a4a62ba1', 'Recorded appendix receipt changed'
    receipt = json.loads(receipt_bytes)
    amendment = next(row['canonical'] for row in receipt['articles'] if row['slug'] == SLUG)
    assert amendment['path'] == f'editorial/authorial-articles/{SLUG}.md'
    canonical = (ROOT / 'theology-wiki' / amendment['path']).read_bytes()
    assert digest(canonical) == amendment['after'], 'Recorded canonical appendix changed'
    original = canonical[:amendment['beforeBytes']]
    assert digest(original) == amendment['before'], 'Original canonical prefix changed'
    original_targets = set(re.findall(r'\[\[([^\]|#]+)', original.decode('utf-8')))
    targets = set(re.findall(r'\[\[([^\]|#]+)', canonical.decode('utf-8')))
    assert len(original_targets) == 20, original_targets
    assert targets == original_targets | {'sacred-inheritance-and-rival-continuations'}, targets
    try:
        with sync_playwright() as tool:
            options = {'headless': True}
            if os.environ.get('CHROMIUM'):
                options['executable_path'] = os.environ['CHROMIUM']
            browser = tool.chromium.launch(**options)
            try:
                context = browser.new_context(viewport={'width': 1440, 'height': 1000})

                def fetch(path, records, key):
                    assert not Path(path).is_absolute() and '..' not in Path(path).parts
                    url = ORIGIN + '/' + quote(path, safe='/') + '?review=' + quote(REVISION)
                    response = context.request.get(url, timeout=15000)
                    data = response.body()
                    matches = digest(data) == digest((ROOT / path).read_bytes())
                    records[key] = {'url': url, 'status': response.status, 'sha256': digest(data), 'matches_commit': matches}
                    assert response.ok and matches, records[key]
                    return data

                files = {path: fetch(path, report['files'], path) for path in [ARTICLE, PROJECTION, NARRATION, INDEX]}
                article = files[ARTICLE].decode('utf-8')
                narration = json.loads(files[NARRATION])
                assert files[PROJECTION] == files[ARTICLE]
                assert narration['sourceSha256'] == digest(files[ARTICLE])
                spoken = ' '.join(segment['text'] for segment in narration['segments'])
                assert all(phrase in article and phrase in spoken for phrase in PHRASES)
                known = {page['slug']: page for page in json.loads(files[INDEX])}
                assert targets <= known.keys()
                page = context.new_page()
                report['readerUrl'] = ORIGIN + '/theology-wiki/san-reader.html?page=' + SLUG + '&review=' + quote(REVISION)
                page.goto(report['readerUrl'], wait_until='domcontentloaded')
                page.wait_for_function('(slug)=>window.TheologyReader?.current()?.slug===slug && document.querySelector("#article-body")?.dataset.foundationReady===slug', arg=SLUG, timeout=20000)
                body = page.locator('#article-body').inner_text()
                assert all(phrase in body for phrase in PHRASES)
                links = set(page.locator('#article-body a[data-page]').evaluate_all('(links)=>links.map(a=>a.dataset.page)'))
                assert targets <= links, sorted(targets - links)
                for target in sorted(targets):
                    fetch('theology-wiki/content/' + known[target]['path'], report['targets'], target)
                report.update({'passed': True, 'phrases': PHRASES, 'canonicalLinkTargets': len(targets), 'preservedCanonicalLinkTargets': len(original_targets), 'renderedContentAndLinks': True})
                page.screenshot(path=str(OUT / f'teacher-{mode}.png'), full_page=True)
            finally:
                browser.close()
    finally:
        (OUT / f'teacher-{mode}.json').write_text(json.dumps(report, indent=2) + '\n')
    print('PASS Teacher source, backup, listening, rendered argument and', len(targets), 'linked targets (20 preserved plus one recorded appendix target):', ORIGIN)


if __name__ == '__main__':
    main()
