"""Add one separate project to the existing homepage. Preserve every old card."""
from pathlib import Path
p=Path('index.html');s=p.read_text()
if './vesperfall/index.html' not in s:
 old_links=['./rainward/index.html','./aether-reach/index.html','./mario-maker-clone/svgn-paper-route/index.html','./theology-wiki/san-reader.html','./dino-atlas/index.html']
 assert all(x in s for x in old_links),'Review the live collection before changing the homepage.'
 card='<article class="project vesperfall"><a class="art" href="./vesperfall/index.html" tabindex="-1" aria-hidden="true" style="background:#25344a"><img src="./vesperfall/cover.svg" width="640" height="320" alt="" style="display:block;width:100%;height:auto"><span class="art-label">DRAW. RELEASE. ANSWER THE NEXT BELL.</span></a><div class="project-copy"><p class="eyebrow">NEW / A-FRAME ARCHERY + QUEST WEBXR PREVIEW</p><h2>Vesperfall<br>The Bellward Trials</h2><p>Draw a bow with two tracked hands, explore connected procedural cloisters, and face the stone wardens. An original roguelite prototype with desktop practice.</p><a class="primary-link" href="./vesperfall/index.html">Take up the bow <span aria-hidden="true">&rarr;</span></a><a class="secondary-link" href="./vesperfall/roadmap.html">Roadmap and headset-testing boundaries</a></div></article>\n'
 needle='<article class="project rainward">';assert needle in s
 s=s.replace(needle,card+needle,1).replace('FIVE WORLDS.','SIX WORLDS.').replace('aria-label="Five interactive projects"','aria-label="Six interactive projects"').replace('Explore Rainward and Aether Reach,','Explore Vesperfall, Rainward and Aether Reach,').replace('Find shelter in the rain.','Take up a bow. Find shelter in the rain.').replace('Rainward and Aether Reach require WebGL2.','Vesperfall, Rainward and Aether Reach require WebGL2. Vesperfall has an experimental Quest WebXR mode.')
 assert all(x in s for x in old_links);p.write_text(s)
print('Vesperfall added; existing game and wiki links retained.')
