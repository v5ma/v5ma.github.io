"""Apply small, auditable integration edits to existing public applications.
Never touch wiki content, accounts, credentials, or unrelated applications.
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
    GAME.write_text(s)
SW=GAME.with_name('sw.js')
s=SW.read_text().replace("const CACHE = 'svgn-paper-route-v1';","const CACHE = 'svgn-paper-route-delivery-20260904';")
# Cache names share an origin. Do not delete another project's caches.
s=s.replace("ks.filter(k => k !== CACHE)","ks.filter(k => k.startsWith('svgn-paper-route-') && k !== CACHE)")
SW.write_text(s)

# Adapt the actual SAN shell rather than substituting a new generic reader.
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
s=s.replace('<a href="./index.html?page=home">Shell home</a>','<a href="../index.html">All projects</a>')
s=s.replace('<a href="../theology-wiki/index.html?page=home">Theology Wiki</a>','<a href="./index.html?page=home">Original reader</a>')
s=s.replace('<a href="../mario-maker-clone/home.html">Mario Maker Clone</a>','<a href="../mario-maker-clone/svgn-paper-route/index.html">Paper Delivery</a><a href="../dino-atlas/index.html">Dino Atlas</a>')
s=s.replace('aria-label="SAN wiki reader"','aria-label="Theology wiki reader"')
assert '"internalRouting": true' in s
assert '../san-wiki-shell/assets' in s
(ROOT/'theology-wiki/san-reader.html').write_text(s)

# Keep the old field guide and the new expedition consistent on reset.
p=ROOT/'dino-atlas/app.js';s=p.read_text()
s=s.replace('storage?.removeItem(STORAGE_KEY);','storage?.removeItem(STORAGE_KEY);storage?.removeItem("dino-atlas.clues.v1");') if 'storage?.removeItem("dino-atlas.clues.v1")' not in s else s
s=s.replace('third-party scripts, or network APIs','remote scripts, or network APIs')
p.write_text(s)
p=ROOT/'dino-atlas/expedition.js';s=p.read_text()
old="state.near=null;lastNearId='';buttons();"
new="state.near=null;lastNearId='';$('inspect').disabled=true;$('inspect').textContent='Explore the landscape';$('interaction-hint').textContent='Approach an animal or an amber evidence marker.';buttons();"
s=s.replace(old,new)
p.write_text(s)
print('Integrated Paper Delivery and Theology SAN reader; existing content preserved.')
