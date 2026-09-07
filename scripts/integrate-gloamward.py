"""Add only the new card and collection count to the inspected homepage."""
from pathlib import Path
import hashlib
p=Path('index.html');raw=p.read_bytes()
# This is the public homepage actually read before the branch was created.
assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()=='50b2db763c1640e0b8e80c44fc9a5ff77cc03cf7','Homepage moved; review concurrent edits before integrating.'
s=raw.decode();s=s.replace('FIVE WORLDS.','SIX WORLDS.').replace('Five interactive projects','Six interactive projects').replace('content="Explore Rainward','content="Play Gloamward archery, explore Rainward').replace('<p>Find shelter in the rain.','<p>Take up a bow. Find shelter in the rain.')
card='''<article class="project gloamward"><a class="art" href="./gloamward/index.html" tabindex="-1" aria-hidden="true" style="background:#263b52"><img src="./gloamward/cover.svg" width="640" height="320" alt="" style="display:block;width:100%;height:auto"><span class="art-label">DRAW. RELEASE. FIND YOUR WAY THROUGH.</span></a><div class="project-copy"><p class="eyebrow">NEW / A-FRAME ARCHERY + WEBXR PREVIEW</p><h2>Gloamward<br>The Three Courts</h2><p>Draw your bow, use cover, teleport between safe landings, and cross three seeded courtyards. Play in your browser or try the experimental Quest mode.</p><a class="primary-link" href="./gloamward/index.html">Play Gloamward <span aria-hidden="true">&rarr;</span></a><a class="secondary-link" href="./gloamward/roadmap.html">Roadmap and headset-testing limits</a></div></article>\n'''
needle='<article class="project rainward">';assert needle in s;s=s.replace(needle,card+needle,1)
s=s.replace('Rainward and Aether Reach require WebGL2.', 'Gloamward, Rainward and Aether Reach require WebGL2. Gloamward also has an experimental WebXR preview.')
p.write_bytes(s.encode())
