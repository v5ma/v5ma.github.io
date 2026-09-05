"""Idempotent integration of the connected upper world in the main application.
Only explicit game-owned files are changed. No account or unrelated app edits.
"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
G=ROOT/'mario-maker-clone/svgn-paper-route'
p=G/'index.html';s=p.read_text()
if 'src="./sky-network-layout.js"' not in s:
    anchor='<script src="./ground-courses.js"></script>'
    assert anchor in s
    s=s.replace(anchor,anchor+'\n<script src="./sky-network-layout.js"></script>\n<script src="./sky-network-art.js"></script>',1)
    anchor='<script src="./adventure-game.js"></script>'
    assert anchor in s
    s=s.replace(anchor,anchor+'\n<script src="./sky-network-runtime.js"></script>',1)
    s=s.replace('<link rel="stylesheet" href="./adventure.css">','<link rel="stylesheet" href="./adventure.css">\n<link rel="stylesheet" href="./sky-network.css">')
    guard='<script id="network-dialog-keys">window.addEventListener("keydown",e=>{const d=document.getElementById("sky-network-map");if(d?.open&&(e.code==="Escape"||e.code==="KeyM")){e.preventDefault();e.stopImmediatePropagation();d.close();}},true);</script>\n'
    s=s.replace('<script>',guard+'<script>',1)
    s=re.sub(r'window\.__BUILD=\d+;', 'window.__BUILD=1788651001;',s,count=1)
p.write_text(s,newline='\r\n')
p=G/'cloudview-world.js';s=p.read_text()
if 'SkyNetworkArt.populate' not in s:
    anchor='  for(const {pts,sky:tag}of paths){'
    assert anchor in s,'Review the existing Cloudview path renderer before integrating.'
    s=s.replace(anchor,'  if(course.gp?.skyNetwork)SkyNetworkArt.populate({course,m,root,kit,metal,terrain,greenery,far,sign,paths});\n  else for(const {pts,sky:tag}of paths){',1)
p.write_text(s)
p=G/'cloudview-depth.js';s=p.read_text()
if 'if(!course.gp?.skyNetwork)' not in s:
    anchor='    for(const {pts,tag}of paths) {'
    assert anchor in s
    s=s.replace(anchor,'    if(!course.gp?.skyNetwork)for(const {pts,tag}of paths) {',1)
p.write_text(s)
p=G/'ground-runtime.js';s=p.read_text()
if 'p._networkAir && meta.skyNetwork' not in s:
    anchor='    GroundNative.step();if(player!==p)return;'
    assert anchor in s
    replacement='''    if(p._networkAir && meta.skyNetwork && !p.onGround){
      if(p.trackCD>0)p.trackCD--;fireNitro(p);fireGun(p);
      K.flight(p,{right:!!(keys.KeyD||keys.ArrowRight),left:!!(keys.KeyA||keys.ArrowLeft)},q=>{moveX(q);moveY(q);});
      if(p.inv>0)p.inv--;interactTiles(p);
    }else GroundNative.step();if(player!==p)return;'''
    s=s.replace(anchor,replacement,1)
p.write_text(s)
p=G/'sky-network-runtime.js';s=p.read_text()
if 'releaseRequired=false' not in s:
    anchor='  const step=stepPlayer;'
    assert anchor in s
    s=s.replace(anchor,'''  let releaseRequired=false;
  const whipInput=__grapple.tickInput;
  __grapple.tickInput=function(){
    if(active()&&releaseRequired){const z=keys.KeyZ;keys.KeyZ=false;try{whipInput();}finally{keys.KeyZ=z;}if(!z)releaseRequired=false;}
    else whipInput();
  };
'''+anchor,1)
    s=s.replace('if(peg&&!p.peg){','if(peg&&!p.peg){if(keys.KeyZ)releaseRequired=true;',1)
p.write_text(s)
p=G/'sw.js';s=p.read_text();s=re.sub(r"const CACHE = '[^']+';","const CACHE = 'svgn-paper-route-sky-network-20260905';",s,count=1);p.write_text(s)
# Remove the incomplete transfer checkpoint: no compressed runtime is shipped.
transfer=ROOT/'.network-transfer'
if transfer.exists():
    for f in transfer.glob('*.b64'):f.unlink()
    try:transfer.rmdir()
    except OSError:pass
print('Connected sky network integrated; ground and original score retained.')
