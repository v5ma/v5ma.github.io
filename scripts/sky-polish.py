"""Small idempotent corrections applied to the owned sky extension only."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
g=root/'mario-maker-clone/svgn-paper-route'
p=g/'delivery-upgrade.js';s=p.read_text()
s=s.replace('toEdit();loadCode(state.code);packPlaying=null;', 'toEdit();loadCode(state.code);state.code=levelCode();packPlaying=null;')
s=s.replace('if(window.SkyVisual){destroyEnvironment();env=SkyVisual.build(m);return;}', 'if(window.SkyVisual && (window.__sky?.active() || window.__delivery?.state.menu || customTracks.some(p=>p.sky))){destroyEnvironment();env=SkyVisual.build(m);return;}')
p.write_text(s)
p=g/'sky-visual.js';s=p.read_text()
s=s.replace("const paths=mode==='play'?tracks.filter(t=>t.sky).map(t=>({pts:t.pts,sky:t.sky})):course.ct.map(p=>({pts:p,sky:p.sky}));", "const paths=mode==='play'?tracks.filter(t=>t.sky).map(t=>({pts:t.pts,sky:t.sky})):(window.__delivery?.state.menu?course.ct.map(p=>({pts:p,sky:p.sky})):[]);")
p.write_text(s)
p=g/'sky-routes.js';s=p.read_text()
start="routes:specs.map((s,i)=>({...s,mail:Array(s.radii.length).fill(0),description:`${s.radii.length} connected launch loops above the clouds. No street-level shortcut.`,tip:'Accelerate. Time the gold launch sector. Catch the next rail.',stages:s.radii.length}))"
replace="routes:specs.map((s,i)=>{const {cells,ct,...meta}=build(i,{});return meta;})"
s=s.replace(start,replace);p.write_text(s)
p=g/'sky-game.js';s=p.read_text()
s=s.replace('if(!active()||!tr.sky)return onTrack(p);', 'if(!tr)return;if(!active()||!tr.sky)return onTrack(p);')
s=s.replace("if(p.track){if(p.trackCD>0)p.trackCD--;fireGun(p);stepOnTrack(p);interactTiles(p);if(p.inv>0)p.inv--;return;}", "if(p.trackCD>0)p.trackCD--;fireNitro(p);fireGun(p);\n    if(p.peg){stepSwing(p);interactTiles(p);if(p.inv>0)p.inv--;return;}\n    if(p.track){stepOnTrack(p);interactTiles(p);if(p.inv>0)p.inv--;return;}")
s=s.replace('const ox=p.x,oy=p.y;if(p.trackCD>0)p.trackCD--;fireGun(p);state.airFrames++;', 'const ox=p.x,oy=p.y;state.airFrames++;')
p.write_text(s)
p=root/'tests/sky_browser.py';s=p.read_text()
s=s.replace("events=page.evaluate('__sky.state.events');runs.append", "check(page.evaluate('!!JSON.parse(localStorage.getItem(\"svgn_delivery_records_v1\")||\"{}\")[SkyRoutes.specs[__delivery.state.route].id]'),'Completed sky route saves its medal')\n   events=page.evaluate('__sky.state.events');runs.append")
p.write_text(s)
print('Canonical sky saves, editor overlays and retained grapple/nitro handling corrected.')
