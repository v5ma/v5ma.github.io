# Temporary, hash-guarded source transport for the isolated Undertow branch.
# Removed with its write-enabled staging workflow before release.
from pathlib import Path
import hashlib,json
EXPECTED={
'prism-current/music.js':('59b5c4d7ac92b53ed0a2d6ac9f3f903b2c952c6cce5e63c9cccfd9879b3b63ff','6c21009cc3982b6ddd8d9ecb9ad2738dec9e683c4ac7325aeaf795bc9cc1d507'),
'prism-current/AAA_CHECKLIST.md':('83d1941a248e393872976885d735420e6fedccc1bb327e771bcd6afbb08568a6','e55cec98f37714a8c3862260a26525e8e64905dc7d87f138c920a76b3309a5cf'),
'prism-current/art.js':('9b64188490e7baa030340b6060f7c9d99b6b8fae38b298c47111386a28210d43','3273498e46fcbd5bcbf541f0e64435dc6c07bb2a2147960dad6829353be55f2a'),
'prism-current/app.js':('fb302d7c34be62de3ac75c6cb84e7b3a12bb6359dc954714a8debe323139dac2','b28e648d42b38faa45967ec0efcf410022cc3ad4ce442e017c64fe12525f1420'),
'prism-current/index.html':('70bcbe98c799288279e495164520e74e215a5482f8f2b951b70c601b2769da08','bf09164efcb91a1e733657db07097ca28ebc07b1b026754c8109128e5093a672'),
'prism-current/xr.js':('4da661f107328b01d8ac7d7558fbe88e32b3142602280e8de98514707ea742ce','2c39b71ce43c2feec253e600432033d275c8ffdb18a201f3313f2f3c5bd295e6'),
'prism-current/core.js':('106fab9296f404a24bcf2de0fd183ee9721435efe1c081a1e0676e52e3df67af','7351687f711f5ecb0589196ac5740f0c170a1d8db7c80901dd6c56c9546dcaa5'),
'prism-current/release.json':('c822b594d2e1606491fe85203b8b17436e3ae0c89710972181def486f8d80586','349a9d2b8935461d6a29608152b333f570926d7a12453b4a2920d5da205b4e3c'),
'prism-current/RELEASE_NOTES.md':('7dee31eb0bd5d652febc21b713700e2ff6988cf446cd5cfcf4c3d275f045a160','e6f18416197820b337afd32a8a0eff356951f4722fa1680621de6629ca500bee'),
'prism-current/music-worker.js':('973cacec1027e8a80a86f4bbaea51a9a5eaac45477911666ea04d5c275af3d06','1f2008576144adcf26fbe85ac451578bbae210c077c8ec31a0c8e82aae23ab61'),
'prism-current/audio.js':('86fb1da5b70119fe155562294baf08b2196ffc6bf244400ecb3f51ec099b9f3d','2224e450bb9abf0fd1141f6053722ca5ffac249e1f143cbe859faf8ad9e4d822'),
'prism-current/tests/spectral-browser.py':('e35a77b22945865e25b11fcf2003cd2fbab0a1ddca30e4ecd9fdbca905397281','7e44774b746c66e3e6905b0c955cb84d31bfcf68c9883607babff93ee1fa2715'),
'prism-current/tests/practice-browser.py':('b2a7d18f6efbe5db2b0f718091258cb74aeea0ee707f78880c06434a72dc3877','c1972b66679b4ee04f0eee16bcf9157159e2d8c3bfbffeeac933341bdeb2ae6a'),
'prism-current/tests/jewel-browser.py':('f87c02be43d5f4b8f605a7a14421d1733904e56fe590b266e7d9b214675d0cb0','ff94a5513f242a6fc5593cb15de78760567871ca2dafc99058ab0a2553cbb2c3'),
'prism-current/tests/tidal-browser.py':('98e82bbf059490fbea8988753c3a8b41a5ac7950548e1bad2105fbcdc3520cdc','fcdb0c17d8fda747149fd68d4db89d637f95c3964956f292462ed5b84ffd92f9'),
'prism-current/tests/core.test.cjs':('b329225effe3e346578b8c613de24bd2d168bc0d631e44d8c4c81daaddb0da23','d94d03ac806e06c7537cb87293e60031a7bb4f86e1ef0851e30114da27d6b394'),
'prism-current/tests/pointer.py':('a25ec84e2353a0005c89e8f790d5173a2301f6f4345a14f72febd77150b1230c','847176fe906ac5b70791d134608a5f4606e6bf0bfd0a52689c7e9e8374044259'),
'prism-current/tests/browser.py':('b24ba5cb8a97d98f1e05f255f294690ea0114257dfd6831a28facf073e1c372d','94f94368722bf0966ab305d7ad8d98f49dc92f8e7b29f499ca5864bfe4d1f9b1')}
for name,h in EXPECTED.items():
 assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==h[0], 'Stale source: '+name
p=Path('prism-current')
def fix(name,pairs):
 f=p/name;s=f.read_text()
 for old,new in pairs:
  if old not in s:raise RuntimeError('Missing expected source in '+name+': '+old[:90])
  s=s.replace(old,new)
 f.write_text(s)
fix('core.js',[(" const VERSION='0.4.0'"," const Undertow=root.PrismUndertow||(typeof require==='function'?require('./undertow.js'):null);\n const VERSION='0.9.0'"),('[0,0]];','[0,0],[.707,.707],[-.707,.707]];'),('if(Tidal)TRACKS.push(Tidal.TRACK);','if(Tidal)TRACKS.push(Tidal.TRACK);if(Undertow)TRACKS.push(Undertow.TRACK);'),("if(id==='tidal-bloom')return Tidal.chart(difficulty);","if(id==='undertow')return Undertow.chart(difficulty);if(id==='tidal-bloom')return Tidal.chart(difficulty);")])
fix('music.js',[("function events(song){","function events(song){if(song.id==='undertow')return (root.PrismUndertow||(typeof require==='function'?require('./undertow.js'):null)).events();"),("function render(song,rate=24000){","function render(song,rate=24000){if(song.id==='undertow')return (root.PrismUndertow||(typeof require==='function'?require('./undertow.js'):null)).render(song,rate);")])
fix('music-worker.js',[("importScripts(","importScripts('./undertow.js?v=0.9.0',"),('core.js?v=0.4.0','core.js?v=0.9.0'),('music.js?v=0.4.0','music.js?v=0.9.0')])
fix('audio.js',[('music-worker.js?v=0.4.0','music-worker.js?v=0.9.0')])
fix('app.js',[("this.track='first-light';this.difficulty='flow'","this.track='undertow';this.difficulty='pulse'"),("version:'0.8.0'","version:'0.9.0'"),("this.phase==='paused'?'Resume session':'Play in browser'","this.phase==='paused'?'Resume session':'Play '+PrismCore.TRACKS.find(s=>s.id===this.track).name")])
fix('art.js',[('Array.from({length:7}','Array.from({length:PrismCore.dirs.length}'),('art.spectral=root.PrismSpectral?.install(art,scene);return art;','art.spectral=root.PrismSpectral?.install(art,scene);art.poolStage=root.PrismPoolStage?.install(art,scene);return art;'),('0,0,.12,.255,.255,1','0,0,.12,.29,.29,1')])
fix('xr.js',[('Clear your reach. Keep your feet planted. Trigger selects.','A / X: switch Flow or Pulse. Grip / B: pause. Trigger selects.'),("if((buttonsState[5]","if(buttonsState[4]&&!previous[4]&&g.phase!=='playing'&&g.phase!=='loading'){g.abort();g.difficulty=g.difficulty==='flow'?'pulse':'flow';g.syncControls();lastUI='';}\n    if((buttonsState[5]")])
fix('index.html',[('Floodgate Recovery</title>','Undertow</title>'),('<script src="./core.js?v=0.4.0">','<script src="./undertow.js?v=0.9.0"></script><script src="./core.js?v=0.9.0">'),('audio.js?v=0.4.0','audio.js?v=0.9.0'),('<script src="./art.js?v=0.7.0">','<script src="./graphics/pool-stage.js?v=0.9.0"></script><script src="./art.js?v=0.9.0">'),('app.js?v=0.8.0','app.js?v=0.9.0'),('xr.js?v=0.4.0','xr.js?v=0.9.0'),('v0.8.0</span>','v0.9.0</span>'),('<h1>Find your<br><em>current.</em></h1>','<h1>Feel the<br><em>Undertow.</em></h1>'),('Sculpt the beat with light. A compact rhythm stage for your real space, with controller practice and a mix you control.','New default: 132 BPM breakbeat, a full synth arrangement and eight-direction cuts. Play the rhythm game in the pool hall; no detour required.'),('Flow / gentle / no fail','Flow / deliberate strokes'),('Pulse / directional / denser','Pulse / driving choreography'),('Four original locally synthesized scores.','Five original locally synthesized scores. Undertow is the new default and has no dot notes in either chart.'),('SPECTRAL OBSERVATORY / LIGHT IN MOTION','UNDERTOW / EIGHT DIRECTIONS / POOL STAGE'),('</head>','<link rel="stylesheet" href="./main-play.css?v=0.9.0"><script defer src="./main-play.js?v=0.9.0"></script></head>')])
fix('tests/core.test.cjs',[('n.time>=8*60/t.bpm','n.time>=(t.countInBeats||8)*60/t.bpm')])
fix('tests/browser.py',[("check(page.locator('#tracks button').count()==4,'Four original tracks are selectable')","check(page.locator('#tracks button').count()==5,'All five tracks are selectable')"),("page.screenshot(path=str(OUT/'title.png'))","page.screenshot(path=str(OUT/'title.png'))\n  page.locator('[data-track=\"first-light\"]').click();page.locator('#difficulty').select_option('flow')")])
fix('tests/pointer.py',[("p.evaluate((ROOT/'prism-current/tests/input-driver.js').read_text());p.locator('#start').click()","p.evaluate((ROOT/'prism-current/tests/input-driver.js').read_text());p.locator('[data-track=\"first-light\"]').click();p.locator('#difficulty').select_option('flow');p.locator('#start').click()")])
fix('tests/jewel-browser.py',[("p.goto(BASE+'/prism-current/',wait_until='domcontentloaded');ready(p);","p.goto(BASE+'/prism-current/',wait_until='domcontentloaded');ready(p);p.locator('[data-track=\"first-light\"]').click();p.locator('#difficulty').select_option('flow');")])
fix('tests/spectral-browser.py',[("check(status()['theme']=='opal'","p.locator('[data-track=\"first-light\"]').click();p.locator('#difficulty').select_option('flow')\n  check(status()['theme']=='opal'"),("v.locator('#settings').locator('summary').click()","v.locator('[data-track=\"first-light\"]').click();v.locator('#settings').locator('summary').click()")])
for name in ['tidal-browser.py','practice-browser.py']:
 f=p/'tests'/name;s=f.read_text().replace("p.locator('#tracks button').count()==4","p.locator('#tracks button').count()==5").replace('contains four original tracks','contains five original tracks')
 s=s.replace("for _ in range(4):press(13)","for _ in range(35):\n   if p.locator('[data-track=\"tidal-bloom\"]').evaluate('(e)=>e===document.activeElement'):break\n   press(13)")
 s=s.replace("p.locator('#scene-wrap').focus()","p.locator('#difficulty').select_option('flow');p.locator('#scene-wrap').focus()");f.write_text(s)
f=p/'release.json';v=json.loads(f.read_text());v.update(version='0.9.0',date='2026-09-18',edition='Undertow',scope='Main rhythm rework: new default 132 BPM track, 286-note Pulse and 164-note Flow, eight directions without dots, playable pool rhythm venue in browser and VR, chart shortcut in headset, immediate Play above the catalog. Original songs and all saves retained.');f.write_text(json.dumps(v,indent=2)+'\n')
f=p/'AAA_CHECKLIST.md';s=f.read_text();f.write_text('# Owner-rejected core experience: main rhythm takes priority\n\nCurrent repair: Undertow 0.9.0. See [UNDERTOW.md](UNDERTOW.md). New default music, zero-dot eight-direction charts, immediate Play, and a rhythm pool venue in browser/VR address the actual complaint. User enjoyment, physical comfort and ordinary-resolution performance remain unaccepted. Do not substitute old test counts for those judgments or prioritize another side mode over the main song. The historical board below is retained, not evidence of creative approval.\n\n'+s)
f=p/'RELEASE_NOTES.md';s=f.read_text();f.write_text('# Prism Current 0.9.0 / Undertow\n\nThe main Play button now starts Undertow: a new 132 BPM electronic arrangement and 286-note Pulse chart. Flow has 164 notes; neither new chart contains dots. Both use eight directions, including newly implemented upward diagonals. The default no longer launches First Light/Flow.\n\nThe rhythm runway now sits inside a tiled pool hall in browser and VR. Water reacts to successful cuts. AR retains transparent passthrough. A/X changes the chart while idle in the headset. Play and XR entry appear before the song catalog.\n\nThe older songs, practice, lessons, expedition, controls and saved records remain. This is a main-game correction, not another optional mode. See UNDERTOW.md for diagnosis, exact scope, test boundaries and unresolved owner listening/play acceptance.\n\n'+s)
for name,h in EXPECTED.items():
 assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==h[1], 'Wrong result: '+name
Path('/tmp/prism-undertow-paths.json').write_text(json.dumps(list(EXPECTED)))
print('Applied exact scoped files:',len(EXPECTED))
