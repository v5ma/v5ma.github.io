"""Restore recorded media only after the target time is seekable."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/js/products-tools.js';s=p.read_text()
start=s.index('  function attachRecording(');end=s.index(' function showRecording',start)
s=s[:start]+'''  function attachRecording(el,record){
    const key=record.kind+'/'+record.id,prior=stored.recordings[key];
    let target=prior?.hash===record.sourceSha256&&Number.isFinite(prior.seconds)&&prior.seconds>0&&prior.seconds<record.durationSeconds-1?prior.seconds:null;
    let initialized=false,active=false,restoring=false,last=-1;
    const note=text=>{const n=$('#recorded-resume-note');if(n)n.textContent=text;};
    const save=()=>{if(target!==null||!initialized||!active||!Number.isFinite(el.currentTime)||el.readyState===0)return;stored.recordings[key]={hash:record.sourceSha256,seconds:el.ended?0:Math.min(el.currentTime,record.durationSeconds)};store();};
    const restore=()=>{if(target===null||el.readyState<2||el.seeking||restoring)return;for(let i=0;i<el.seekable.length;i++){if(target>=el.seekable.start(i)&&target<el.seekable.end(i)){restoring=true;el.currentTime=target;return;}}};
    mediaSavers.set(el,save);el.playbackRate=stored.rate;
    el.addEventListener('loadedmetadata',()=>{initialized=true;if(target!==null)note('Preparing the saved position at '+target.toFixed(1)+' seconds. Playback starts only when you press Play.');});
    for(const event of ['loadeddata','canplay','canplaythrough','progress'])el.addEventListener(event,restore);
    el.addEventListener('timeupdate',()=>{const now=Math.floor(el.currentTime);if(now!==last){last=now;save();}});
    el.addEventListener('seeked',()=>{if(restoring){restoring=false;if(Math.abs(el.currentTime-target)>.15)return;note('Resumed recording at '+target.toFixed(1)+' seconds. Playback starts only when you press Play.');target=null;}active=true;save();});
    for(const event of ['pause','ended'])el.addEventListener(event,save);
    el.addEventListener('play',()=>{active=true;speaker?.stop();document.querySelectorAll('#product-workspace audio,#product-workspace video').forEach(other=>{if(other!==el)pauseMedia(other);});restore();});
  }
''' +s[end:]
p.write_text(s)
p=root/'tests/products_checks.py';s=p.read_text()
s=s.replace('readyState>0 && document.querySelector("#listen-recording").currentTime>0','readyState>1 && !document.querySelector("#listen-recording").seeking && document.querySelector("#listen-recording").currentTime>0')
s=s.replace('ratio=page.locator(selector).first.evaluate("""','ratio=page.locator(selector).first.evaluate(r"""')
s=s.replace('ready:document.querySelector("#listen-recording").readyState,duration:', 'ready:document.querySelector("#listen-recording").readyState,ranges:Array.from({length:document.querySelector("#listen-recording").seekable.length},(_,i)=>[document.querySelector("#listen-recording").seekable.start(i),document.querySelector("#listen-recording").seekable.end(i)]),duration:')
p.write_text(s)
Path(__file__).unlink()
