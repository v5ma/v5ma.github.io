"""One-time guarded source integration on the dedicated v0.4 candidate branch.
Removed before release. Changes only Prism Current source and documentation.
"""
from pathlib import Path
import json
r=Path('prism-current')
assert json.loads((r/'release.json').read_text())['version']=='0.3.0', 'Unexpected release base'
def edit(p,a,b):
 s=(r/p).read_text();assert a in s,(p,a);(r/p).write_text(s.replace(a,b))
edit('core.js',"const VERSION='0.2.0'", "const Tidal=root.PrismTidal||(typeof require==='function'?require('./tidal-bloom.js'):null);\n const VERSION='0.4.0'")
edit('core.js'," function chart(id='first-light'", " if(Tidal)TRACKS.push(Tidal.TRACK);\n function chart(id='first-light'")
edit('core.js',"const notes=[];", "if(id==='tidal-bloom')return Tidal.chart(difficulty);const notes=[];")
edit('core.js','time:0,judged:{},hits:0','time:0,judged:{},judgmentDetails:{},hits:0')
edit('core.js','function finish(s,n,type,quality=0){','function finish(s,n,type,quality=0,hitTime=null){')
edit('core.js',"s.judged[n.id]=type;s.last=", "s.judged[n.id]=type;s.judgmentDetails[n.id]={type,quality,offsetMs:Number.isFinite(hitTime)?(hitTime-n.time)*1000:null};s.last=")
edit('core.js',"finish(s,n,'hit',quality)", "finish(s,n,'hit',quality,hitTime)")
edit('core.js',"WINDOW*.55,.45,1));}", "WINDOW*.55,.45,1),time);}")
edit('music.js',"function events(song){const notes=[]", "function events(song){if(song.id==='tidal-bloom')return (root.PrismTidal||(typeof require==='function'?require('./tidal-bloom.js'):null)).events();const notes=[]")
edit('music.js',"else if(part==='pad')", "else if(part==='felt')v=(Math.sin(TAU*f*t)*Math.exp(-t*1.6)+.16*Math.sin(TAU*f*2*t)*Math.exp(-t*5)+.07*Math.sin(TAU*f*3*t)*Math.exp(-t*9))*.72;\n   else if(part==='glass')v=(Math.sin(TAU*f*t)*Math.exp(-t*3)+.18*Math.sin(TAU*f*2.006*t)*Math.exp(-t*7))*.5;\n   else if(part==='string')v=(Math.sin(TAU*f*.998*t)+Math.sin(TAU*f*1.002*t)+.18*Math.sin(TAU*f*2*t))*.24*Math.min(1,t/.22);\n   else if(part==='pad')")
edit('music.js',"for(const [d,g]of[[.087,.09],[.167,.06]])", "for(const [d,g]of(song.id==='tidal-bloom'?[[beat*.75,.075],[beat,.05]]:[[.087,.09],[.167,.06]]))")
edit('music.js','  let peak=0,sum=0;', "  if(song.id==='tidal-bloom')for(let i=Math.max(0,length-Math.ceil(rate*1.3));i<length;i++){const f=(length-1-i)/(rate*1.3);left[i]*=f;right[i]*=f;}\n  let peak=0,sum=0;")
edit('music-worker.js',"importScripts('./core.js','./music.js');", "importScripts('./tidal-bloom.js?v=0.4.0','./core.js?v=0.4.0','./music.js?v=0.4.0');")
edit('audio.js',"new Worker('./music-worker.js')", "new Worker('./music-worker.js?v=0.4.0')")
edit('app.js',"version:'0.3.0'", "version:'0.4.0'")
edit('app.js','this.control=globalThis.PrismControl?.install(this);this.syncControls();','this.control=globalThis.PrismControl?.install(this);this.phrases=globalThis.PrismPhrases?.install(this);this.syncControls();')
edit('app.js','this.control?.sync();},','this.control?.sync();this.phrases?.sync();},')
edit('app.js','this.control?.tick(time);','this.control?.tick(time);this.phrases?.tick(time);')
edit('app.js',"Math.floor(left/60)+':'+String(Math.ceil(left%60)).padStart(2,'0')", "Math.floor(Math.ceil(left)/60)+':'+String(Math.ceil(left)%60).padStart(2,'0')")
edit('xr.js',"+1)%3].id", "+1)%PrismCore.TRACKS.length].id")
edit('xr.js',"${Math.round(g.state.time)}s`", "${root.PrismPhrases?.current(g.state.song,g.state.time).name||Math.round(g.state.time)+'s'}`")
s=(r/'index.html').read_text()
s=s.replace('./core.js?v=0.2.0','./core.js?v=0.4.0').replace('<script src="./core.js','<script src="./tidal-bloom.js?v=0.4.0"></script><script src="./core.js')
s=s.replace('./app.js?v=0.3.0','./app.js?v=0.4.0').replace('<script src="./app.js','<script src="./phrases.js?v=0.4.0"></script><script src="./app.js')
s=s.replace('./audio.js?v=0.3.0','./audio.js?v=0.4.0').replace('./xr.js?v=0.2.0','./xr.js?v=0.4.0')
s=s.replace('</head>','<link rel="stylesheet" href="./phrases.css?v=0.4.0"></head>')
s=s.replace('Prism Current - Control Room','Prism Current - Tidal Bloom').replace('v0.3.0</span>','v0.4.0</span>')
s=s.replace('<p id="track-copy"></p>','<p id="track-copy"></p><p id="song-stats"></p><div id="song-journey" aria-label="Song sections"></div>')
s=s.replace('Three original locally synthesized scores.', 'Four original locally synthesized scores. Tidal Bloom includes eight authored sections and two phrase charts.')
s=s.replace('CONTROL ROOM / YOUR HANDS / YOUR MIX','TIDAL BLOOM / EIGHT CHAPTERS / ONE CURRENT')
s=s.replace('<div id="countdown"', '<div id="phrase-hud" hidden><strong id="phrase-name"></strong><span id="phrase-next"></span><p id="phrase-cue"></p></div>\n<div id="countdown"')
s=s.replace('<button class="primary" onclick="Prism.component.start()">Play again</button><button onclick="Prism.component.abort()">Choose a track</button></section>', '<button class="primary" onclick="Prism.component.start()">Play again</button><button onclick="Prism.component.abort()">Choose a track</button><p id="practice-tip"></p><p id="timing-detail"></p><div id="section-results" aria-label="Section quality"></div></section>')
(r/'index.html').write_text(s)
(r/'release.json').write_text(json.dumps({'version':'0.4.0','name':'Prism Current','date':'2026-09-12','engine':'A-Frame 1.8.0','edition':'Tidal Bloom','scope':'Fourth original soundtrack with eight musical sections, authored Flow/Pulse charts, phrase guidance and section/timing feedback. Existing charts and score keys preserved. Physical hardware and creative playtest acceptance remain open.','checklist':'AAA_CHECKLIST.md'},indent=2)+'\n')
edit('tests/browser.py',"page.locator('#tracks button').count()==3,'Three original tracks are selectable'", "page.locator('#tracks button').count()==4,'Four original tracks are selectable'")
edit('tests/jewel-browser.py',"p.evaluate('PrismCore.VERSION')=='0.2.0','The unchanged scoring core loads with the Jewelbox renderer'", "p.evaluate('PrismCore.VERSION')==json.loads((ROOT/'prism-current/release.json').read_text())['version'],'The declared scoring release loads with the Jewelbox renderer'")
p=r/'AAA_CHECKLIST.md';s=p.read_text().replace('Updated for Control Room v0.3.0, 2026-09-11.','Updated for Tidal Bloom v0.4.0, 2026-09-12.')
s=s.replace('## Current upgrade: Control Room','''## Current upgrade: Tidal Bloom v0.4.0

- [x] TB-01 / P1 / Development / M. Implement the fourth original track with eight named sections, new oscillator voices, a returning melody, a percussion-free passage and a final fade. See MUSIC_NOTES.md. Creative listening approval remains open under B-01.
- [x] TB-02 / P1 / Development / M. Author 92-note Flow and 170-note Pulse charts, phrase-end gaps and a target-free breathing passage. Automated geometry/spacing checks exist; physical comfort acceptance remains open under B-02.
- [x] TB-03 / P1 / Development / M. Add the song journey, live section cues, per-section quality, measured timing bins and a weakest-section practice target. These diagnostics are not hardware latency calibration.
- [x] TB-04 / P0 / Development / M. Preserve legacy chart hashes, synthesized-audio hashes, scoring results and saved-record keys. New content uses separate tidal-bloom record categories.
- [x] TB-05 / P0 / Development / S. Store a repeatable sample-peak/RMS and conservative full-mix amplitude audit beside the game. Perceptual mixing approval is still open under B-06.
- [ ] TB-06 / P1 / Micah + physical tester / M. Review the music by listening and playing both charts on real controls before using this arrangement as the catalog-wide creative bar.

## Previous upgrade: Control Room''')
s=s.replace('## Gate B: music and authored rhythm identity -- next content upgrade','## Gate B: music and authored rhythm identity')
s=s.replace('Judge it by uninterrupted listening and playtests, not the number of simultaneous sounds.','Implementation delivered in v0.4.0 as Tidal Bloom. Uninterrupted human listening/playtest approval remains OPEN; judge it by enjoyment, not the number of simultaneous sounds.')
s=s.replace('Verify no unintended unreachable or self-colliding sequences.','The v0.4.0 authored charts pass numeric lane/row and recovery-spacing checks. Physical reach, self-collision and comfort review remain OPEN.')
s=s.replace('- [ ] B-03 /','- [x] B-03 /').replace('timing error distribution, miss locations and section improvement targets.','timing error distribution, miss counts by section and section improvement targets. Implemented in v0.4.0; diagnostics do not change scoring.')
s=s.replace('Acceptance: clean output and no overlapping soundtrack instances on rapid restart.','Numeric sample-peak/RMS and worst-case hit-envelope headroom passed in v0.4.0; single-source transport regression remains covered. Human listening for masking and perceived level consistency is OPEN.')
s=s.replace('First resolve any P0 regression found in Control Room. Then implement B-01 and B-02 as the next substantial content release, with B-06 as its audio acceptance gate.','First resolve any P0 regression. Tidal Bloom now implements the B-01/B-02 content and B-03 feedback; complete its human creative review and the remaining B-06 listening checks. The next implementation priorities are A-06, an interactive first-run lesson, and B-04, section practice with separate practice records.')
p.write_text(s)
for name,text in {
 'README.md':'''# Current release: Tidal Bloom v0.4.0

Four original tracks are available. Tidal Bloom is an approximately two-minute, eight-section arrangement with 92-note Flow and 170-note Pulse charts, live phrase guidance and measured section/timing results. Existing songs, scoring, controller menus, mixer preferences and score categories remain intact.

The working production path is [AAA_CHECKLIST.md](AAA_CHECKLIST.md). [MUSIC_NOTES.md](MUSIC_NOTES.md) documents composition and numeric mix checks. [QA.md](QA.md) distinguishes automated acceptance from physical-device and human listening approval. Previous release documentation follows for history.

''',
 'RELEASE_NOTES.md':'''# Prism Current v0.4.0 / Tidal Bloom

Select Tidal Bloom from the four-track catalog. Eight musical sections move from a quiet arrival through answering melodies and a fuller rhythm, into a percussion-free breathing passage, a return, a final bloom and a gentle release. Flow has 92 targets; Pulse has 170. All music is synthesized locally from original composition code.

The song menu previews the section journey and note count. The phrase HUD names the current and next sections. Results show quality per section, early/centered/late hit counts, average absolute timing error and a weakest-section practice suggestion. These are measured run diagnostics, not hardware latency calibration or permanent progression unlocks.

Existing music, charts, scoring, records, Xbox controls and the independent mixer remain. New scores use separate track keys. Headset track cycling now covers the full catalog, with compact section names during play. Human musical and physical-device acceptance remain open. See MUSIC_NOTES.md and AAA_CHECKLIST.md.

''',
 'QA.md':'''# Tidal Bloom v0.4.0 verification

The new content adds a fourth original track, authored phrases, section guidance and read-only timing feedback. Golden chart/scoring and 12 kHz synthesized-audio fixtures come from published v0.3.0. Core version 0.4.0 adds content and diagnostics without changing legacy scoring equations or timing windows.

Run `node --test prism-current/tests/*.test.cjs` and `node prism-current/tests/audio-audit.cjs` from repository root. The new tidal-browser.py plays a full unaccelerated song through emulated controller input, checks phrase changes and results, and verifies old and new records across reload. Existing desktop, pointer, XR, controller/mixer and full-resolution art suites remain. A written test is not itself a passing receipt; exact source/public outcomes belong in the release PR and workflow artifacts.

Local Node tests are available, but local Chromium HTTP navigation is blocked by the development environment. Native production-renderer tests run in GitHub Actions rather than a substituted renderer or silent worker. Functional software-rendered tests use reduced pixel ratios; visual review captures full-resolution menus separately. None establishes physical-device frame rate, latency or comfort.

The checked-in qa/tidal-v040-audio.json covers sample peaks, RMS and conservative four-hit-envelope headroom at full gains. It is not a LUFS, inter-sample true-peak or subjective listening approval. Musical direction and physical chart comfort remain open in the checklist.

Rollback must revert only this release on current master, retaining other game upgrades. New-track score entries can remain during rollback; original categories are not migrated or deleted. The v0.3.0 record follows for history.

'''
}.items():
 p=r/name;p.write_text(text+p.read_text())
p=r/'ROADMAP.md';p.write_text(p.read_text()+'''\n## Tidal Bloom / authored music and feedback v0.4

A fourth original track shares eight musical sections across its soundtrack, authored Flow/Pulse charts and phrase HUD. Results add per-section quality, measured hit timing and a weakest-section practice target. XR cycling uses the full catalog. Legacy chart/audio hashes, scoring results and record categories are preserved. See MUSIC_NOTES.md, qa/tidal-v040-audio.json and AAA_CHECKLIST.md. Human creative and physical-device acceptance remain open. Next implementation priorities are the first-run lesson and section practice.
''')
print('Integrated Tidal Bloom source and checklist; source tests must pass before commit.')
