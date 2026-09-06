"""Native HTTP product checks; speech engines are not simulated in this suite.
Isolated source-corruption and storage-denial cases are explicitly identified.
"""
import hashlib, json
from pathlib import Path

def run_products_checks(page, ctx, open_page, navigate, check, screenshot, OUT, BASE):
    slug='exodus-to-temple-competing-chronologies'
    def ready(which='listening-room',extra=''):
        open_page(page,which,extra)
        page.wait_for_function('(s)=>document.querySelector("#product-workspace")?.dataset.ready===s',arg=which)
    page.set_viewport_size({'width':1440,'height':1000})
    ready(extra='&listen='+slug)
    page.wait_for_function('(s)=>document.querySelector("#product-workspace")?.dataset.articleReady===s',arg=slug)
    check('Listening app exposes all 27 complete articles and 17 chapter routes',page.locator('#listen-article option').count()==27 and page.locator('#listen-chapter option').count()==18)
    check('Listening app verifies both narration and original source bytes','hashes match' in page.locator('#listen-version').inner_text())
    check('Listening transcript includes the complete main study, not an episode summary',page.locator('.listen-paragraph').count()>25 and '1062' in page.locator('#listen-text').inner_text())
    check('Remote device voices are opt-in and playback does not auto-start',not page.locator('#listen-remote').is_checked() and 'Ready' in page.locator('#listen-counter').inner_text())
    if page.evaluate('speechSynthesis.getVoices().filter(v=>v.localService).length===0'):
        check('A browser without local voices shows the honest unavailable fallback',page.locator('#listen-play').is_disabled() and 'not exposed' in page.locator('#listen-voice-help').inner_text())
    for selector in ['.listen-deck label','.listen-deck h2','#listen-source a','.listen-deck .product-small']:
        ratio=page.locator(selector).first.evaluate(r"""(el)=>{
          const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
          const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
          const fg=rgb(getComputedStyle(el).color);let node=el,bg=[255,255,255];
          while(node){const c=rgb(getComputedStyle(node).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}node=node.parentElement;}
          const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }""")
        check('Core listening text contrast is at least 4.5:1: '+selector,ratio>=4.5)
    page.locator('#listen-next').click();page.locator('#listen-next').click()
    check('Paragraph controls move to an actual transcript paragraph',page.locator('#listen-position').input_value()=='2' and page.locator('.listen-paragraph[aria-current=true]').get_attribute('data-segment')=='2')
    page.locator('#listen-rate').select_option('1.2')
    with page.expect_download() as ev:page.locator('summary',has_text='Source version and listening backup').click();page.locator('#listen-export').click()
    backup=json.loads(Path(ev.value.path()).read_text())
    check('Listening backup retains a source-pinned paragraph and speed',backup['positions'][slug]['index']==2 and backup['rate']==1.2 and len(backup['positions'][slug]['hash'])==64)
    ready(extra='&listen='+slug)
    check('Listening position and speed persist over a real reload without autoplay',page.locator('#listen-position').input_value()=='2' and page.locator('#listen-rate').input_value()=='1.2' and 'Ready' in page.locator('#listen-counter').inner_text())
    before=page.locator('.listen-paragraph').count();page.locator('#listen-notes').check()
    check('Source notes can be included without replacing the article body',page.locator('.listen-paragraph').count()>before and 'External sources and access notes' in page.locator('#listen-text').inner_text())
    page.locator('#listen-notes').uncheck();page.locator('#listen-section').select_option(index=2)
    check('Section selector moves to a real heading boundary',int(page.locator('#listen-position').input_value())>2)
    page.locator('#listen-search').fill('zzzz-no-article')
    check('Listening search gives a recoverable empty state',page.locator('#listen-article option').count()==0 and page.locator('#listen-load').is_disabled())
    page.locator('#listen-search').fill('');page.locator('#listen-chapter').select_option('thomas')
    check('Listening chapter selection filters without duplicating article routes',0<page.locator('#listen-article option').count()<25)
    page.locator('#listen-chapter').select_option('')
    # Real media must exist in the completed release, not empty or generated silent fixtures.
    page.locator('#recorded-play').click()
    page.wait_for_function('document.querySelector("#listen-recording").currentTime>0.4')
    check('A real prerecorded full study advances through native audio playback',page.locator('#listen-recording').evaluate('(a)=>a.duration>300&&!a.paused'))
    page.locator('#listen-recording').evaluate('(a)=>a.pause()')
    check('Reading speed also applies to the real recorded study',page.locator('#listen-recording').evaluate('(a)=>Math.abs(a.playbackRate-1.2)<.001'))
    saved_time=page.locator('#listen-recording').evaluate('(a)=>a.currentTime')
    (OUT/'recording-before-reload.json').write_text(json.dumps(page.evaluate('({stored:localStorage.getItem("theology:listening:v1"),time:document.querySelector("#listen-recording").currentTime})'),indent=2))
    ready(extra='&listen='+slug)
    page.locator('#listen-recording').evaluate('(a)=>a.load()')
    try:
        page.wait_for_function('document.querySelector("#listen-recording").readyState>1 && !document.querySelector("#listen-recording").seeking && document.querySelector("#listen-recording").currentTime>0')
    finally:
        (OUT/'recording-after-reload.json').write_text(json.dumps(page.evaluate('({stored:localStorage.getItem("theology:listening:v1"),time:document.querySelector("#listen-recording").currentTime,ready:document.querySelector("#listen-recording").readyState,ranges:Array.from({length:document.querySelector("#listen-recording").seekable.length},(_,i)=>[document.querySelector("#listen-recording").seekable.start(i),document.querySelector("#listen-recording").seekable.end(i)]),duration:document.querySelector("#listen-recording").duration,note:document.querySelector("#recorded-resume-note").textContent})'),indent=2))
    check('Recorded time resumes after reload without autoplay',page.locator('#listen-recording').evaluate('(a,t)=>a.paused&&Math.abs(a.currentTime-t)<.15',saved_time))
    check('Resumed recording remains playable with a nonempty seekable range',page.locator('#listen-recording').evaluate('(a)=>a.seekable.length>0&&a.seekable.end(a.seekable.length-1)>a.currentTime'))
    page.locator('#listen-title').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'listening-player-desktop.png'))
    with page.expect_download() as ev:page.locator('#listen-recorded a[download]').click()
    mp3=Path(ev.value.path()).read_bytes();cfg=page.request.get(BASE.rsplit('/',1)[0]+'/data/products.json').json();asset=next(a for a in cfg['media']['assets'] if a['kind']=='article');file=next(f for f in asset['files'] if f['role']=='audio')
    check('Downloaded study MP3 matches its production manifest',len(mp3)>100000 and hashlib.sha256(mp3).hexdigest()==file['sha256'])
    ready('production-studio')
    check('Studio contains three source-linked editorial episodes',page.locator('#episode-select option').count()==3 and page.locator('.product-scene').count()==10)
    page.locator('#episode-play').click()
    page.wait_for_function('document.querySelector("#episode-video").currentTime>0.4')
    check('Recorded video has a real duration and plays through native controls',page.locator('#episode-video').evaluate('(v)=>v.duration>60&&!v.paused&&v.videoWidth===1280'))
    page.wait_for_function('document.querySelector("#episode-video").textTracks[0].cues?.length>0')
    check('Video captions load actual measured scene cues',page.locator('#episode-video').evaluate('(v)=>v.textTracks[0].cues.length===10'))
    page.locator('#episode-video').evaluate('(v)=>v.pause()')
    page.locator('#episode-video').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'theology-video-player.png'))
    page.locator('#episode-select').select_option('teacher-copy-community')
    check('Teacher episode retains successors, institutions and the stronger founding claim',all(t in page.locator('#episode-detail').inner_text() for t in ['successors','institutional','earlier founder']))
    check('Unrecorded episodes are labeled rather than assigned invented audio','No recording is claimed' in page.locator('#episode-detail').inner_text() and page.locator('#episode-video').count()==0)
    with page.expect_download() as ev:page.locator('a[download]',has_text='script and sources').click()
    text=Path(ev.value.path()).read_text();check('Episode script download includes the narrative and its full-source references','successors' in text and 'SHA-256:' in text)
    ready('product-pathways')
    check('Product roadmap distinguishes six formats and ten bounded delivery tasks',page.locator('.product-cards .product-panel').count()==6 and page.locator('.product-task').count()==10)
    check('Product roadmap retains separate author and XR implementation decisions','Needs author decision' in page.locator('#product-workspace').inner_text() and 'separate' in page.locator('#product-workspace').inner_text())
    for view in ['listening-room','production-studio','product-pathways']:
        page.set_viewport_size({'width':390,'height':844});ready(view,'&listen='+slug if view=='listening-room' else '')
        check('Product view fits a 390px viewport: '+view,page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        screenshot(page,view+'-mobile.png')
    page.set_viewport_size({'width':1440,'height':1000})
    # Deliberately corrupt only the narration response; the real hash check must refuse it.
    route='**/data/listening/'+slug+'.json'
    def corrupt(r):
        response=r.fetch();data=response.json();data['title']='Corrupted fixture';r.fulfill(response=response,json=data)
    page.route(route,corrupt)
    ready(extra='&listen='+slug)
    check('Corrupt narration fails closed without starting a device voice','mismatch' in page.locator('#listen-status').inner_text() and page.locator('#listen-play').is_disabled())
    page.unroute(route,corrupt)
    ready(extra='&listen='+slug)
    # Invalid user backup is displayed safely; it cannot mutate the shared research plan.
    page.locator('summary',has_text='Source version and listening backup').click()
    page.locator('#listen-import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"version":0}'})
    page.wait_for_function('document.querySelector("#listen-status").textContent.includes("not restored")')
    check('Invalid listening backup shows a visible error','Unrecognized' in page.locator('#listen-status').inner_text())
    # A separate real browser context denies only localStorage; no media or voices are faked.
    denied=ctx.browser.new_context(viewport={'width':1440,'height':1000})
    denied.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}})")
    denied_page=denied.new_page();denied_errors=[]
    denied_page.on('pageerror',lambda e:denied_errors.append(str(e)))
    try:
        open_page(denied_page,'listening-room','&listen='+slug)
        denied_page.wait_for_function('(s)=>document.querySelector("#product-workspace")?.dataset.articleReady===s',arg=slug)
        denied_page.locator('#listen-next').click()
        check('Storage denial retains session controls and explains backup export','session-only' in denied_page.locator('#listen-storage').inner_text() and denied_page.locator('#listen-position').input_value()=='1' and not denied_errors)
    finally:
        denied.close()
    open_page(page,slug)
    page.locator('[data-listen-link]').click()
    page.wait_for_function('(s)=>document.querySelector("#product-workspace")?.dataset.articleReady===s',arg=slug)
    check('Ordinary article Listen link opens the same full study',page.locator('#listen-article').input_value()==slug)
