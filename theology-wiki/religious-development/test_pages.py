"""Validate this static supplement without altering the main wiki build."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import json

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / 'sources.json').read_text(encoding='utf-8'))
WIKI_SLUGS = {
    'el-in-ancient-egypt', 'gnosticism-and-temple-trauma', 'source-atlas',
    'christ-as-an-inner-model', 'antichrist-as-a-pattern-of-conduct',
    'apocalyptic-repair-theology', 'religion-for-conscious-robots',
    'rival-continuations-and-restoration', 'connected-arguments',
    'samaritan-texts-and-sacred-authority', 'argument-challenges'
}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.hrefs = []
        self.headings = 0
        self.active = []
        self.lang = None
        self.viewport = False
        self.title = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html': self.lang = a.get('lang')
        if tag == 'h1': self.headings += 1
        if tag == 'title': self.title = True
        if tag == 'meta' and a.get('name') == 'viewport': self.viewport = True
        if 'id' in a: self.ids.append(a['id'])
        if 'href' in a: self.hrefs.append(a['href'])
        if tag in {'script', 'iframe', 'object', 'embed', 'form'}:
            self.active.append(tag)
        if any(k.startswith('on') for k in a): self.active.append('event-handler')

expected = {p['path'] for p in MANIFEST['pages']}
assert len(expected) == 8
assert {p.name for p in ROOT.glob('*.html')} == expected
source_urls = {s['url'] for s in MANIFEST['sources'].values()}
links_checked = 0
for name in sorted(expected):
    text = (ROOT / name).read_text(encoding='utf-8')
    page = Page()
    page.feed(text)
    assert page.lang == 'en' and page.viewport and page.title, name
    assert page.headings == 1, name
    assert len(page.ids) == len(set(page.ids)), name
    assert {'main', 'sources'} <= set(page.ids), name
    assert not page.active, (name, page.active)
    for href in page.hrefs:
        u = urlsplit(href)
        if u.scheme:
            assert u.scheme == 'https' and not u.username and not u.password, href
            assert href in source_urls or href.startswith(
                'https://v5ma.github.io/theology-wiki/religious-development/'), href
        elif u.path == '../san-reader.html':
            if u.query:
                assert parse_qs(u.query).get('page', [''])[0] in WIKI_SLUGS, href
        elif not u.path:
            assert u.fragment in page.ids, href
        else:
            dest = (ROOT / u.path).resolve()
            assert dest.parent == ROOT and dest.is_file(), href
        links_checked += 1
    assert 'claim-audit.html' in page.hrefs and 'index.html' in page.hrefs, name
entrance = ROOT.parent / 'index.html'
if entrance.exists():
    assert './religious-development/index.html' in entrance.read_text(), 'Missing entrance link'
print(json.dumps({'html_pages': len(expected), 'links_checked': links_checked,
    'sources': len(source_urls), 'active_content': 0, 'result': 'passed'}, indent=2))
