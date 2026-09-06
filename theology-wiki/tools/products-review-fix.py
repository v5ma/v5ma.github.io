"""Provide a verified buffered copy for hosts that cannot seek recorded media."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/js/products-tools.js';s=p.read_text()
s=s.replace(' const mediaSavers=new WeakMap();',' const mediaSavers=new WeakMap(),mediaResources=new Map();\n function releaseMedia(el){const r=mediaResources.get(el);if(r){r.controller.abort();if(r.url)URL.revokeObjectURL(r.url);mediaResources.delete(el);}}')
a="document.querySelectorAll('#product-workspace audio,#product-workspace video').forEach(e=>pauseMedia(e));}"
b="document.querySelectorAll('#product-workspace audio,#product-workspace video').forEach(e=>pauseMedia(e));for(const el of mediaResources.keys())releaseMedia(el);}"
assert s.count(a)==1;s=s.replace(a,b)
a="if(audio)pauseMedia(audio);doc=null;"
b="if(audio){pauseMedia(audio);releaseMedia(audio);audio=null;}if($('#listen-recorded'))$('#listen-recorded').textContent='';doc=null;"
assert s.count(a)==1;s=s.replace(a,b)
a="document.querySelectorAll('#episode-detail audio,#episode-detail video').forEach(e=>pauseMedia(e));"
b="document.querySelectorAll('#episode-detail audio,#episode-detail video').forEach(e=>{pauseMedia(e);releaseMedia(e);});"
assert s.count(a)==1;s=s.replace(a,b)
s=s.replace('let initialized=false,active=false,restoring=false,last=-1;','let initialized=false,active=false,restoring=false,last=-1,buffering=false,bufferAttempted=false;')
a="    const restore=()=>{if(target===null||el.readyState<2||el.seeking||restoring)return;for(let i=0;i<el.seekable.length;i++){if(target>=el.seekable.start(i)&&target<el.seekable.end(i)){restoring=true;el.currentTime=target;return;}}};"
b='''    const bufferedCopy=async()=>{
      if(bufferAttempted)return;bufferAttempted=true;buffering=true;
      const f=record.files.find(f=>f.role===(el.tagName==='VIDEO'?'video':'audio'));
      const controller=new AbortController();mediaResources.set(el,{controller,url:null});
      note('Loading a verified recording copy because this host does not provide seekable media ranges. The saved position is retained.');
      try{
        if(!f||!safePath(f.path)||f.bytes>25165824)throw Error('Use the download for this recording.');
        const res=await fetch('./'+f.path,{signal:controller.signal});if(!res.ok)throw Error('Recording unavailable.');
        const bytes=await res.arrayBuffer();if(bytes.byteLength!==f.bytes||await hash(bytes)!==f.sha256)throw Error('Recording integrity check failed.');
        if(controller.signal.aborted||!el.isConnected)return;
        const resumePlaying=!el.paused,url=URL.createObjectURL(new Blob([bytes],{type:el.tagName==='VIDEO'?'video/mp4':'audio/mpeg'}));
        mediaResources.set(el,{controller,url});initialized=false;el.src=url;el.load();buffering=false;
        if(resumePlaying)el.play().catch(()=>note('Recording ready. Press Play to continue from your saved position.'));
      }catch(e){buffering=false;if(!controller.signal.aborted)note(e.message+' The saved position has not been overwritten.');}
    };
    const restore=()=>{if(target===null||el.readyState<2||el.seeking||restoring||buffering)return;for(let i=0;i<el.seekable.length;i++){if(target>=el.seekable.start(i)&&target<el.seekable.end(i)){restoring=true;el.currentTime=target;return;}}if(el.readyState>=3&&(!el.seekable.length||el.seekable.end(el.seekable.length-1)===0))bufferedCopy();};'''
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
p=root/'tests/products_checks.py';s=p.read_text()
a="    check('Recorded time resumes after reload without autoplay',page.locator('#listen-recording').evaluate('(a,t)=>a.paused&&Math.abs(a.currentTime-t)<.15',saved_time))"
b=a+"\n    check('Resumed recording remains playable with a nonempty seekable range',page.locator('#listen-recording').evaluate('(a)=>a.seekable.length>0&&a.seekable.end(a.seekable.length-1)>a.currentTime'))"
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
p=root/'README.md';s=p.read_text();s+='\nFor a host whose media reports no usable seekable range, a saved recording can load a full same-origin copy after a media request. That fallback checks the actual byte count and SHA-256, is bounded to 24 MiB, and keeps the saved time until seeking succeeds. It may download the file again. Object URLs and pending fetches are released on navigation. It does not bypass authentication, create synthetic test audio, or promise streaming on every host.\n';p.write_text(s)
Path(__file__).unlink()
