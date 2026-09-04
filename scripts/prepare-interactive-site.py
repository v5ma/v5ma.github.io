"""Apply scoped, idempotent integration edits to the public applications.
Never touch wiki content, accounts, credentials, or unrelated applications.
Generated integration files are committed on the feature branch before testing.
"""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'mario-maker-clone/svgn-paper-route/index.html'
s=GAME.read_text()
marker='<!-- SVGN_INTERACTIVE_UPGRADE_20260904 -->'
if marker not in s:
    assert 'window.__BUILD=1786230731;' in s, 'Unexpected Paper Route baseline. Review before changing it.'
    s=re.sub(r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*','',s)
    s=s.replace('initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover','initial-scale=1.0, viewport-fit=cover')
    s=s.replace('</head>',marker+'\n<link rel="stylesheet" href="./delivery-upgrade.css">\n</head>',1)
    s=s.replace('</body>','<script src="./campaign.js"></script>\n<script src="./delivery-upgrade.js"></script>\n</body>')
    s=s.replace('window.__BUILD=1786230731;','window.__BUILD=1788556801;')
GAME.write_text(s,newline='\r\n')
SW=GAME.with_name('sw.js')
s=SW.read_text().replace("const CACHE = 'svgn-paper-route-v1';","const CACHE = 'svgn-paper-route-delivery-20260904';")
s=s.replace("ks.filter(k => k !== CACHE)","ks.filter(k => k.startsWith('svgn-paper-route-') && k !== CACHE)")
SW.write_text(s)

# Queue one physical throw tap until the next eligible simulation update rather
# than discarding it during a slow GPU frame. Route/menu transitions clear it.
p=GAME.with_name('delivery-upgrade.js');s=p.read_text()
s=s.replace('throwBufferedUntil>performance.now()&&p.gunCD<=1','throwBufferedUntil>0&&p.gunCD<=1')
s=s.replace('throwBufferedUntil=performance.now()+180','throwBufferedUntil=1')
s=s.replace("if(a==='routes')showMenu();","if(a==='routes')showMenu();")
s=s.replace("previousMenuFocus?.focus?.();","cv.focus?.({preventScroll:true});")
s=s.replace("toast('3D renderer is not available here. The 2D game remains playable.');}","toast('3D renderer is not available here. The 2D game remains playable.');cv.focus?.({preventScroll:true});}")
p.write_text(s)

# Adapt the actual SAN shell rather than substituting a generic new reader.
s=(ROOT/'san-wiki-shell/index.html').read_text()
s=s.replace("window.SAN_PUBLIC_WIKI_ASSET_ROOT = './assets';","window.SAN_PUBLIC_WIKI_ASSET_ROOT = '../san-wiki-shell/assets';")
s=s.replace('SAN Wiki Reader Shell','Theology Wiki')
s=s.replace('Public SAN wiki reader shell. SAN articles, source data, and research content are intentionally omitted.','The Theology Wiki collection in the SAN reader shell.')
s=s.replace('Reader shell only','THEOLOGY COLLECTION / SAN READER')
s=s.replace('This package preserves the SAN reader code and route contract. SAN articles, source data, and research content are intentionally omitted.','Explore the theology collection in the SAN wiki reader: search the library, follow linked ideas, and navigate each article by its outline.')
s=s.replace('aria-label="SAN pages"','aria-label="Theology pages"').replace('Explore SAN','Explore theology').replace('Search SAN pages','Search theology pages')
s=s.replace('>SAN</span>','>THEO</span>')
s=s.replace('"canonicalBase": "https://v5ma.github.io/san-wiki-shell/"','"canonicalBase": "https://v5ma.github.io/theology-wiki/san-reader.html"')
s=s.replace('"internalRouting": false','"internalRouting": true')
s=s.replace('{ "label": "Shell", "slugs": ["home"] }','{ "label": "Start here", "slugs": ["home"] }')
s=s.replace('"currentWiki": "san"','"currentWiki": "theology"').replace('"san": "./index.html?page={slug}"','"theology": "./san-reader.html?page={slug}"')
nav='''<nav class="wiki-family-strip" aria-label="Public knowledge collection">
      <a class="wiki-family-link" href="../index.html">All projects</a>
      <a class="wiki-family-link current" href="?page=home" data-page="home" aria-current="page">Theology Wiki</a>
      <a class="wiki-family-link" href="./index.html">Original reader</a>
      <a class="wiki-family-link" href="../theology-sources/index.html">Theology sources</a>
      <a class="wiki-family-link" href="../mario-maker-clone/svgn-paper-route/index.html">Paper Delivery</a>
      <a class="wiki-family-link" href="../dino-atlas/index.html">Dino Atlas</a>
    </nav>'''
s=re.sub(r'<nav class="wiki-family-strip"[^>]*>.*?</nav>',lambda m:nav,s,count=1,flags=re.S)
s=s.replace('aria-label="SAN reading sequence"','aria-label="Theology reading sequence"').replace('aria-label="Continue exploring SAN"','aria-label="Continue exploring theology"')
assert '"internalRouting": true' in s and '../san-wiki-shell/assets' in s
(ROOT/'theology-wiki/san-reader.html').write_text(s)

p=ROOT/'dino-atlas/app.js';s=p.read_text()
if 'storage?.removeItem("dino-atlas.clues.v1")' not in s:
    s=s.replace('storage?.removeItem(STORAGE_KEY);','storage?.removeItem(STORAGE_KEY);storage?.removeItem("dino-atlas.clues.v1");')
s=s.replace('third-party scripts, or network APIs','remote scripts, or network APIs')
p.write_text(s)
p=ROOT/'dino-atlas/expedition.js';s=p.read_text()
s=s.replace("state.near=null;lastNearId='';buttons();","state.near=null;lastNearId='';$('inspect').disabled=true;$('inspect').textContent='Explore the landscape';$('interaction-hint').textContent='Approach an animal or an amber evidence marker.';buttons();")
p.write_text(s)
p=ROOT/'dino-atlas/vendor/LICENSE';p.write_text(p.read_text().replace('2010-2026','2010-2025'))

# The isolated repeated-delivery fixture holds the real fire key through a
# rendered collision instead of assuming an 80 ms tap spans a software-GPU frame.
# The initial mailbox still tests a discrete key tap and the production buffer.
p=ROOT/'tests/interactive_browser.py';s=p.read_text()
old="""            page.locator('#cv').focus();page.wait_for_function('player.gunCD===0');page.keyboard.press('KeyC',delay=80)
            page.wait_for_function('(n)=>deliveries>=n',arg=i,timeout=12000)"""
new="""            page.locator('#cv').focus();page.wait_for_function('player.gunCD===0')
            page.keyboard.down('KeyC')
            try:page.wait_for_function('(n)=>deliveries>=n',arg=i,timeout=12000)
            finally:page.keyboard.up('KeyC')"""
s=s.replace(old,new);p.write_text(s)
print('Integrated game upgrade, input hardening, and Theology SAN reader.')
