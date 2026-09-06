"""Add source-pinned native recording resume and focused regression coverage."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/js/products-tools.js';s=p.read_text()
def replace(old,new):
    global s
    assert s.count(old)==1,old[:100]
    s=s.replace(old,new)
replace('stored={version:1,positions:{},rate:1}','stored={version:1,positions:{},recordings:{},rate:1}')
replace("stored.voiceId=typeof x.voiceId", "stored.recordings=Object.fromEntries(Object.entries(x.recordings||{}).filter(([k,v])=>/^(article|episode)\\/[a-z0-9-]+$/.test(k)&&/^[a-f0-9]{64}$/.test(v?.hash)&&Number.isFinite(v.seconds)&&v.seconds>=0&&v.seconds<86400).slice(0,100));stored.voiceId=typeof x.voiceId")
helper='''  function attachRecording(el,record){
    const key=record.kind+'/'+record.id;let last=-1;
    const save=()=>{if(!Number.isFinite(el.currentTime)||el.readyState===0)return;stored.recordings[key]={hash:record.sourceSha256,seconds:el.ended?0:Math.min(el.currentTime,record.durationSeconds)};store();};
    el.playbackRate=stored.rate;
    el.addEventListener('loadedmetadata',()=>{const r=stored.recordings[key];if(r?.hash===record.sourceSha256&&Number.isFinite(r.seconds)&&r.seconds>0&&r.seconds<Math.min(el.duration,record.durationSeconds)-1){el.currentTime=r.seconds;const note=$('#recorded-resume-note');if(note)note.textContent='Resumed recording at '+Math.floor(r.seconds)+' seconds. Playback starts only when you press Play.';}});
    el.addEventListener('timeupdate',()=>{const now=Math.floor(el.currentTime);if(now!==last){last=now;save();}});
    for(const event of ['pause','seeked','ended'])el.addEventListener(event,save);
    el.addEventListener('play',()=>{speaker?.stop();document.querySelectorAll('#product-workspace audio,#product-workspace video').forEach(other=>{if(other!==el)other.pause();});});
  }
'''
replace(' function showRecording(item)',helper+' function showRecording(item)')
replace('<h3>Recorded full-study draft</h3>','<h3>Recorded full-study draft</h3><p id="recorded-resume-note" class="product-small">Recorded progress is saved separately from the device-reading paragraph.</p>')
replace("audio=$('#listen-recording');audio.onplay=()=>speaker?.stop();", "audio=$('#listen-recording');attachRecording(audio,record);")
replace("speaker?.setRate(stored.rate);store();", "speaker?.setRate(stored.rate);if(audio)audio.playbackRate=stored.rate;store();")
replace("}store();status('Restored '+n+' matching article positions.","}let recordings=0;for(const a of config.media.assets){const key=a.kind+'/'+a.id,r=x.recordings?.[key];if(r?.hash===a.sourceSha256&&Number.isFinite(r.seconds)&&r.seconds>=0&&r.seconds<a.durationSeconds){stored.recordings[key]={hash:r.hash,seconds:r.seconds};recordings++;}}if([.6,.8,1,1.2,1.4,1.6].includes(x.rate))stored.rate=x.rate;store();status('Restored '+n+' matching article positions and '+recordings+' recording positions.")
replace("const play=$('#episode-play');if(play)play.onclick=", "const record=config.media.assets.find(a=>a.kind==='episode'&&a.id===e.id);if(record)document.querySelectorAll('#episode-detail audio,#episode-detail video').forEach(el=>attachRecording(el,record));const play=$('#episode-play');if(play)play.onclick=")
p.write_text(s)
p=root/'assets/js/listening-core.js';s=p.read_text()
replace("const u=new this.Utterance(this.parts[this.index].text);", "if(!this.voice){this.stop();this.emit('unavailable','The selected voice is no longer available. Choose another voice or use the recording.');return;}\n   const u=new this.Utterance(this.parts[this.index].text);")
replace("clearTimeout(this.timer);this.emit('playing');};", "clearTimeout(this.timer);if(this.state!=='paused')this.emit('playing');};")
replace("clearTimeout(this.timer);this.emit('error','Speech stopped:","clearTimeout(this.timer);++this.generation;this.utterance=null;this.synth.cancel();this.emit('error','Speech stopped:")
p.write_text(s)
p=root/'tests/products.test.cjs';s=p.read_text()
replace("()=>{for(const a of products.media.assets)","()=>{assert.equal(products.media.assets.length,2);assert.deepEqual(products.media.assets.map(a=>a.kind).sort(),['article','episode']);assert.equal(products.media.production.engine,'Kokoro 0.9.4');for(const a of products.media.assets)")
s+='''
test('Speech failure cannot advance on a late completion callback',()=>{const {speaker,synth}=fixture();speaker.play();const u=synth.queue[0];u.onerror({error:'network'});u.onend();assert.equal(speaker.state,'error');assert.equal(speaker.index,0);assert.equal(synth.queue.length,1);speaker.stop();});
test('Voice disappearance at a boundary retains position instead of throwing',()=>{const {speaker,synth}=fixture();speaker.play();speaker.voice=null;synth.queue[0].onend();assert.equal(speaker.state,'unavailable');assert.equal(speaker.index,1);speaker.stop();});
''';p.write_text(s)
p=root/'tests/products_checks.py';s=p.read_text()
needle="    page.locator('#listen-recording').evaluate('(a)=>a.pause()')\n"
replace(needle,needle+'''    check('Reading speed also applies to the real recorded study',page.locator('#listen-recording').evaluate('(a)=>Math.abs(a.playbackRate-1.2)<.001'))
    saved_time=page.locator('#listen-recording').evaluate('(a)=>a.currentTime')
    ready(extra='&listen='+slug)
    page.locator('#listen-recording').evaluate('(a)=>a.load()')
    page.wait_for_function('document.querySelector("#listen-recording").readyState>0 && document.querySelector("#listen-recording").currentTime>0')
    check('Recorded time resumes after reload without autoplay',page.locator('#listen-recording').evaluate('(a,t)=>a.paused&&Math.abs(a.currentTime-t)<.15',saved_time))
''')
replace("    open_page(page,slug)\n",'''    # A separate real browser context denies only localStorage; no media or voices are faked.
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
''')
p.write_text(s)
p=root/'README.md';s=p.read_text();s+='\nRecorded media progress is saved separately from device-reading paragraphs, pinned to the same source hash. Native audio and video stop competing players when started; seek/pause/end update the local recording position. Reload does not autoplay. Both audio recording and device reading use the selected reading speed. Backups restore only known, current-source positions; denied browser storage keeps the controls usable with an explicit session-only notice. This is not a guarantee of physical-device background or lock-screen playback.\n';p.write_text(s)
Path(__file__).unlink()
