"""Read-only desktop/mobile checks of the complete Gospel synthesis in the real reader."""
import hashlib
import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'theology-test-output'
ORIGIN = os.environ.get('SITE_ORIGIN', 'http://127.0.0.1:4174').rstrip('/')
SLUG = 'gnostic-canonical-gospels-telling-the-truth'
COMPARISON = 'living-jesus-thomas-john-and-synoptics'
READY = '''s => window.TheologyReader?.current()?.slug === s &&
    document.querySelector('#article-body')?.dataset.foundationReady === s &&
    document.querySelector('#publication-record a')?.href.includes(s)'''


def main():
    OUT.mkdir(exist_ok=True)
    report = {'origin': ORIGIN, 'article': SLUG, 'checks': [], 'passed': False}

    def check(name, condition):
        if not condition:
            raise AssertionError(name)
        report['checks'].append(name)

    def read(relative):
        return (ROOT / 'theology-wiki' / relative).read_bytes()

    def data(relative):
        return json.loads(read(relative))

    canonical_path = 'editorial/authorial-articles/' + SLUG + '.md'
    canonical = read(canonical_path).decode('utf-8')
    index = data('data/page-index.json')
    article = next(row for row in index if row['slug'] == SLUG)
    item = next(row for row in data('data/listening-library.json')['articles'] if row['slug'] == SLUG)
    narration = data(item['narration'])
    proof = article['publication']
    source_hash = hashlib.sha256(read(item['source'])).hexdigest()
    canonical_targets = set(re.findall(r'\[\[([^\]|#]+)', canonical))
    canonical_targets.update(re.findall(r'\[[^\]]+\]\((?:\./)?san-reader\.html\?page=([a-z0-9-]+)\)', canonical))
    external_urls = set(re.findall(r'\]\((https://[^)]+)\)', canonical))
    case_titles = re.findall(r'^## ([1-6]\. .+)$', canonical, re.M)

    with sync_playwright() as tool:
        options = {'headless': True}
        if os.environ.get('CHROMIUM'):
            options['executable_path'] = os.environ['CHROMIUM']
        browser = tool.chromium.launch(**options)
        try:
            for mode, viewport in [('desktop', {'width': 1440, 'height': 1000}),
                                   ('mobile', {'width': 390, 'height': 844})]:
                context = browser.new_context(viewport=viewport, is_mobile=mode == 'mobile', has_touch=mode == 'mobile')
                page = context.new_page()
                page.set_default_timeout(20000)
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))

                def verify(name, condition):
                    check(mode + ': ' + name, condition)

                def ready(slug):
                    page.wait_for_function(READY, arg=slug)

                def navigate(slug):
                    page.evaluate('(s) => TheologyReader.navigate(s, true)', slug)
                    ready(slug)

                def check_full_text():
                    # Compare every canonical block in order, not just word count or a few phrases.
                    # List numbering is supplied by the HTML list renderer, not text nodes.
                    expected = page.evaluate(r'''text => text.split(/\n\s*\n/)
                        .filter(block => !/^# /.test(block))
                        .map(block => TheologyListeningCore.plain(block.replace(/^\d+\. /gm, '')))
                        .filter(Boolean)''', canonical)
                    rendered = re.sub(r'\s+', ' ', page.locator('#article-body').inner_text()).strip()
                    position = 0
                    for block in expected:
                        found = rendered.find(block, position)
                        verify('Complete canonical block: ' + block[:70], found >= position)
                        position = found + len(block)
                    # The reader reserves h1 for its page title and renders Markdown ## as h3.
                    headings = page.locator('#article-body h3').all_text_contents()
                    rendered_cases = [title for title in headings if re.match(r'^[1-6]\. ', title)]
                    verify('All six detailed comparisons are visible', len(case_titles) == 6 and rendered_cases == case_titles and all(page.locator('#article-body').get_by_role('heading', name=title, exact=True, level=3).is_visible() for title in case_titles))
                    verify('Constructive proposal remains explicit', 'This is a constructive theological proposal to test against the texts.' in rendered)
                    verify('Final unresolved differences remain visible', 'allowing them to resist makes the inquiry more trustworthy' in rendered)

                page.goto(ORIGIN + '/theology-wiki/san-reader.html?page=' + SLUG, wait_until='domcontentloaded')
                ready(SLUG)
                verify('Deep link loads the requested synthesis', page.locator('#article-title').inner_text().strip() == article['title'])
                verify('Reader indexes 440 routes', page.evaluate('TheologyReader.pages().length') == 440)
                check_full_text()
                rendered_targets = set(page.locator('#article-body a[data-page]').evaluate_all('(links) => links.map(a => a.dataset.page)'))
                verify('Every internal canonical link is navigable', canonical_targets <= rendered_targets and COMPARISON in rendered_targets)
                rendered_sources = set(page.locator('#article-body a[href]').evaluate_all('(links) => links.map(a => a.href)'))
                verify('Every inline external source remains linked', external_urls <= rendered_sources)

                # Verify the exact bytes behind the reader and listening UI on this origin.
                for relative in [canonical_path, item['source'], 'public-corpus/pages/' + SLUG + '.md', item['narration'], item['transcript']]:
                    response = context.request.get(ORIGIN + '/theology-wiki/' + relative)
                    verify('Exact served bytes: ' + relative, response.ok and response.body() == read(relative))

                expected_links = {
                    'Markdown on GitHub': proof['sourceUrl'],
                    'Publication history': proof['historyUrl'],
                    'Exact source version': proof['exactUrl'],
                    'Markdown backup': proof['archiveUrl'],
                }
                for label, url in expected_links.items():
                    link = page.locator('#publication-record').get_by_role('link', name=label, exact=True)
                    verify('Source access: ' + label, link.is_visible() and link.get_attribute('href') == url)
                page.locator('#publication-record details > summary').click()
                for label, key in [('Canonical writing source', 'canonicalSourceUrl'), ('Canonical writing history', 'canonicalHistoryUrl')]:
                    link = page.locator('#publication-record').get_by_role('link', name=label, exact=True)
                    verify('Source access: ' + label, link.is_visible() and link.get_attribute('href') == proof[key])
                page.locator('#publication-record').get_by_role('button', name='Check source against archived hash').click()
                page.wait_for_function("document.querySelector('#publication-record .publication-status')?.textContent.startsWith('Verified:')")
                verify('Reader source verification succeeds against its archived SHA-256', True)
                verify('No horizontal overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'))
                page.screenshot(path=str(OUT / ('gospel-synthesis-' + mode + '.png')), full_page=True)

                # Exercise links and history instead of merely checking their existence.
                page.locator('#article-body a[data-page="' + COMPARISON + '"]').first.click()
                ready(COMPARISON)
                page.go_back()
                ready(SLUG)
                verify('Comparison link opens its article and Back restores the synthesis', True)
                page.go_forward()
                ready(COMPARISON)
                page.go_back()
                ready(SLUG)
                verify('Repeated Back and Forward retain correct article and source history', True)
                for landing in ['home', 'topic-jesus']:
                    navigate(landing)
                    target = page.locator('#article-body a[data-page="' + SLUG + '"]').first
                    target.click()
                    ready(SLUG)
                    verify('Actual discovery link works from ' + landing, True)

                navigate('home')
                if mode == 'mobile':
                    page.locator('#mobile-nav-toggle').click()
                    verify('Mobile page browser opens', page.locator('#mobile-nav-toggle').get_attribute('aria-expanded') == 'true')
                page.locator('#theology-kind').select_option('article')
                page.locator('#page-search').fill('bridal chamber')
                match = page.locator('#page-list a[data-page="' + SLUG + '"]')
                match.wait_for(state='visible')
                page.wait_for_function("document.querySelector('#search-scope')?.textContent.includes('complete source conversations and reader articles')")
                match.click()
                ready(SLUG)
                verify('Full-text search finds a detailed-body phrase and opens the study', True)
                if mode == 'mobile':
                    verify('Selecting a result closes the mobile page browser', page.locator('#mobile-nav-toggle').get_attribute('aria-expanded') == 'false')

                page.locator('#research-actions a[data-listen-link]').click()
                ready('listening-room')
                page.wait_for_function('(s) => document.querySelector("#product-workspace")?.dataset.articleReady === s', arg=SLUG)
                verify('Article Listen link opens this study without choosing another', page.locator('#listen-article').input_value() == SLUG)
                page.locator('#product-workspace details:has(#listen-hash) > summary').click()
                actual_hash = page.locator('#listen-hash').inner_text().strip()
                report.setdefault('listeningSourceHash', {})[mode] = {'expected': source_hash, 'actual': actual_hash}
                verify('Listening source hash equals complete served article', actual_hash == source_hash)
                verify('Listening reports verified article/narration consistency', 'hashes match' in page.locator('#listen-version').inner_text())
                page.locator('#listen-notes').check()
                expected_segments = [segment['text'] for segment in narration['segments']]
                actual_segments = page.locator('#listen-text .listen-paragraph p').all_text_contents()
                verify('All narration paragraphs and source notes render in exact order', actual_segments == expected_segments)
                sections = page.locator('#listen-section option').all_text_contents()
                verify('Listening exposes all six detailed cases as sections', all(title in sections for title in case_titles))
                transcript_url = page.locator('#listen-source a[download]').get_attribute('href')
                transcript_response = context.request.get(ORIGIN + '/theology-wiki/' + transcript_url.removeprefix('./'))
                verify('Transcript download contains every narration paragraph', transcript_response.ok and transcript_response.body() == ('\n\n'.join(expected_segments) + '\n').encode('utf-8'))
                verify('New text is not misrepresented as a prerecorded study', 'No prerecorded full study is listed' in page.locator('#listen-recorded').inner_text() and page.locator('#listen-recorded audio').count() == 0)
                page.locator('#listen-source a[data-page="' + SLUG + '"]').click()
                ready(SLUG)
                verify('Listening full-article link returns to the synthesis', True)

                page.evaluate('(s) => { TheologyReader.navigate("home", true); TheologyReader.navigate(s, true); }', SLUG)
                ready(SLUG)
                verify('Rapid route changes retain the synthesis source record', page.locator('#publication-record').get_by_role('link', name='Exact source version', exact=True).get_attribute('href') == proof['exactUrl'])
                verify('No horizontal overflow after navigation and listening', page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'))
                verify('No uncaught browser errors', not errors)
                context.close()
            report['passed'] = True
        except Exception as error:
            report['error'] = str(error)
            raise
        finally:
            (OUT / 'gospel-synthesis-browser.json').write_text(json.dumps(report, indent=2) + '\n')
            browser.close()
    print('PASS Gospel synthesis: complete source, six comparisons, desktop/mobile links, search, exact history and full listening/transcript')


if __name__ == '__main__':
    main()
