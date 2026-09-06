"""Fix native recording resume and align product panels with the reader theme."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/js/products-tools.js';s=p.read_text()
s=s.replace(" const safePath=", " const mediaSavers=new WeakMap();\n function pauseMedia(el){if(el){el.pause();mediaSavers.get(el)?.();}}\n const safePath=")
s=s.replace('audio.pause()', 'pauseMedia(audio)').replace('audio?.pause()', 'pauseMedia(audio)').replace('e=>e.pause()', 'e=>pauseMedia(e)').replace('other.pause()', 'pauseMedia(other)')
start=s.index('  function attachRecording(');end=s.index(' function showRecording',start)
s=s[:start]+'''  function attachRecording(el,record){
    const key=record.kind+'/'+record.id;
    const prior=stored.recordings[key];let initialized=false,active=false,last=-1;
    const save=()=>{if(!initialized||!active||!Number.isFinite(el.currentTime)||el.readyState===0)return;stored.recordings[key]={hash:record.sourceSha256,seconds:el.ended?0:Math.min(el.currentTime,record.durationSeconds)};store();};
    mediaSavers.set(el,save);el.playbackRate=stored.rate;
    el.addEventListener('loadedmetadata',()=>{if(prior?.hash===record.sourceSha256&&Number.isFinite(prior.seconds)&&prior.seconds>0&&prior.seconds<Math.min(el.duration,record.durationSeconds)-1){el.currentTime=prior.seconds;const note=$('#recorded-resume-note');if(note)note.textContent='Resumed recording at '+Math.floor(prior.seconds)+' seconds. Playback starts only when you press Play.';}initialized=true;});
    el.addEventListener('timeupdate',()=>{const now=Math.floor(el.currentTime);if(now!==last){last=now;save();}});
    el.addEventListener('seeked',()=>{active=true;save();});
    for(const event of ['pause','ended'])el.addEventListener(event,save);
    el.addEventListener('play',()=>{active=true;speaker?.stop();document.querySelectorAll('#product-workspace audio,#product-workspace video').forEach(other=>{if(other!==el)pauseMedia(other);});});
  }
''' +s[end:]
assert 'audio.pause()' not in s and 'mediaSavers.get(el)?.()' in s
p.write_text(s)
p=root/'assets/css/products.css';s=p.read_text();s+='''
/* Use an explicit light reading surface; inherited SAN text remains legible. */
#product-workspace{color:#10213f;font-family:"Segoe UI",Arial,sans-serif}
#product-workspace .product-panel,#product-workspace .listen-deck,#product-workspace .product-scene,#product-workspace .product-task{background:#f1f5f7;border-color:#c5d3de;color:#10213f}
#product-workspace p,#product-workspace label,#product-workspace summary{color:inherit}
#product-workspace h2,#product-workspace h3,#product-workspace h4{color:#153b54}
#product-workspace .product-small{color:#52657c}
#product-workspace .product-kicker{color:#955734}
#product-workspace .product-panel a{color:#185571}
#product-workspace input:not([type=checkbox]),#product-workspace select{background:#fff;color:#10213f;border-color:#708398}
#product-workspace .product-actions a,#product-workspace .product-actions button,#product-workspace .listen-paragraph button{background:#12344f;color:#fff;border-color:#47697e}
#product-workspace .product-actions a:hover,#product-workspace .product-actions button:hover{background:#1b4c6c;color:#fff}
#product-workspace .listen-paragraph[aria-current=true]{background:#e2eef1;border-left-color:#247086}
#product-workspace :focus-visible{outline-color:#b44b25}
''';p.write_text(s)
p=root/'tests/products_checks.py';s=p.read_text()
anchor="    page.locator('#listen-next').click();page.locator('#listen-next').click()"
assert s.count(anchor)==1
s=s.replace(anchor,'''    for selector in ['.listen-deck label','.listen-deck h2','#listen-source a','.listen-deck .product-small']:
        ratio=page.locator(selector).first.evaluate("""(el)=>{
          const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
          const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
          const fg=rgb(getComputedStyle(el).color);let node=el,bg=[255,255,255];
          while(node){const c=rgb(getComputedStyle(node).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}node=node.parentElement;}
          const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }""")
        check('Core listening text contrast is at least 4.5:1: '+selector,ratio>=4.5)
''' +anchor)
s=s.replace("    saved_time=page.locator('#listen-recording').evaluate('(a)=>a.currentTime')", "    saved_time=page.locator('#listen-recording').evaluate('(a)=>a.currentTime')\n    (OUT/'recording-before-reload.json').write_text(json.dumps(page.evaluate('({stored:localStorage.getItem(\"theology:listening:v1\"),time:document.querySelector(\"#listen-recording\").currentTime})'),indent=2))")
s=s.replace("    page.wait_for_function('document.querySelector(\"#listen-recording\").readyState>0 && document.querySelector(\"#listen-recording\").currentTime>0')", "    try:\n        page.wait_for_function('document.querySelector(\"#listen-recording\").readyState>0 && document.querySelector(\"#listen-recording\").currentTime>0')\n    finally:\n        (OUT/'recording-after-reload.json').write_text(json.dumps(page.evaluate('({stored:localStorage.getItem(\"theology:listening:v1\"),time:document.querySelector(\"#listen-recording\").currentTime,ready:document.querySelector(\"#listen-recording\").readyState,duration:document.querySelector(\"#listen-recording\").duration,note:document.querySelector(\"#recorded-resume-note\").textContent})'),indent=2))")
s=s.replace("page.locator('#product-workspace').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'listening-player-desktop.png'))", "page.locator('#listen-title').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'listening-player-desktop.png'))")
p.write_text(s)
Path(__file__).unlink()
print('Native progress flush, initialization guard and four measured contrast checks added.')
