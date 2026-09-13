"""Bounded integration for the new Tideglass destination; fail on changed anchors."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
def edit(name,old,new):
 p=root/name;s=p.read_text()
 if s.count(old)!=1:raise RuntimeError(f'{name}: expected a unique integration anchor: {old[:70]}')
 p.write_text(s.replace(old,new,1))
edit('release-status.js',"const VERSION='0.19.0',BUILD='sky-cycle-luminous-2026.09.12';","const VERSION='0.20.0',BUILD='sky-cycle-tideglass-2026.09.13';")
edit('release-status.js',"import('./sky-relay.js').then(()=>import('./sunrise.js')).then(()=>{","import('./sky-relay.js').then(()=>import('./sunrise.js')).then(()=>import('./bathhouse.js')).then(()=>{")
edit('prismatic-renderer.js',"if(prefs.look==='classic'||!visible){if(live)cleanup();return;}","if(prefs.look==='classic'||!visible||active&&__sky.state.data?.gp?.bathhouse){if(live)cleanup();return;}")
edit('delivery-upgrade.js',"g2.save();g2.scale(z,z);g2.translate(-cam.x,-cam.y);","g2.save();g2.scale(z,z);g2.translate(-cam.x,-cam.y);\n      if(mode==='play'&&window.__ground?.meta?.bathhouse)window.Bathhouse2D?.draw(g2,cam.x,cam.y,W/z,H/z);")
edit('sunrise.js',"#sc-journal[open],#flight-deck[open],#flight-deck-guide[open],#score-dialog[open]","#sc-journal[open],#flight-deck[open],#flight-deck-guide[open],#score-dialog[open],#bathhouse-atlas[open]")
edit('sw.js','svgn-paper-route-sky-cycle-luminous-20260912','svgn-paper-route-sky-cycle-tideglass-20260913')
(root/'release.json').write_text(json.dumps({'version':'0.20.0','build':'sky-cycle-tideglass-2026.09.13','date':'2026-09-13','changes':['Tideglass Baths: a new playable tiled indoor water destination','Three luminous pools, chrome ladders, glazed tiles and animated caustic-style lighting','Operate the brass sluice to drain Mirror Pool and reveal a physical optional waterline rail','Dry promenade, four checkpoints, five bonus deliveries and a return portal','Controller-safe Water Portal atlas and E / D-pad Down world interactions','Bathhouse Keeper seal banked after an accepted authored finish; existing saves and routes preserved','Direct entry via ?destination=tideglass-baths']},indent=2)+'\n')
print('Integrated Tideglass Baths into the existing Sky Cycle.')
