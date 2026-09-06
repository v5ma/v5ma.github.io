"""One-time, hash-guarded v0.1.0 -> v0.2.0 adapter wiring.
Public files only; a changed base aborts rather than overwrites unrelated work.
The normal validation workflow never rewrites source.
"""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
EDITS=json.loads(r'''{
  "aether-reach/app.mjs": {
    "before": "969d7691e688813fab621b7dd9a0936e5d23e6cd6dc915f2a9dea75094969ebb",
    "after": "e99a6b275c35dff3aef95de582c04ceeb0a9d5ba67333d95fadee69e61c7cc03",
    "replacements": [
      [";\nimport {makeView,T} from './scene.mjs';\nconst $=id=>document.getElem",";\nimport {makeView,T} from './scene.mjs';\nimport {installControllers} from './controllers.mjs';\nconst $=id=>document.getElem"],
      ["tches,explorer:true,railCamera:true};\nlet savedSettings={};try{savedSe","tches,explorer:true,railCamera:true,controllerSpeed:1,invertY:false};\nlet savedSettings={};try{savedSe"],
      ["nite(v))settings[k]=clamp(v,60,95);}\nlet state=createState(),view=null,playi","nite(v))settings[k]=clamp(v,60,95);else if(k==='controllerSpeed'&&Number.isFinite(v))settings[k]=clamp(v,.5,2.5);}\nlet devices=null,state=createState(),view=null,playi"],
      ["('dialog')];\nfunction clearInput(){reloadQueued=false;keys.clear();hel","('dialog')];\nfunction clearInput(){devices?.reset();reloadQueued=false;keys.clear();hel"],
      ["|paused||navigator.maxTouchPoints>0)return;lookReadyAt=performance.now","|paused||navigator.maxTouchPoints>0||devices?.xr.active)return;lookReadyAt=performance.now"],
      ["ed=true;if(name==='fire')fire(state);if(view)events();}\nfunction recor","ed=true;if(name==='fire')fire(state,devices?.aim);if(view)events();}\nfunction recor"],
      ["size',resize);\nfunction animate(now){requestAnimationFrame(animate);const elapsed=Math.min(.12,(now-last)/1000);last=now;if(document.hidden)return;visualTime+=elapsed;\n if(playing&&!paused&&!state.won)","size',resize);\nfunction animate(now,xrFrame){const elapsed=Math.min(.12,(now-last)/1000);last=now;if(document.hidden)return;visualTime+=elapsed;devices?.frame(elapsed,xrFrame);\n if(playing&&!paused&&!state.won)"],
      ["tions.has('fire')||keys.has('KeyF'))fire(state);const controls=input();reloadQueued=false;step(sta","tions.has('fire')||keys.has('KeyF')||devices?.firing)fire(state,devices?.aim);const controls=devices?devices.merge(input()):input();reloadQueued=false;step(sta"],
      ["k;}}else accumulator=0;\n if(playing){const p=state.p,d=forward(p.yaw,p","k;}}else accumulator=0;\n if(playing&&!devices?.xr.active){const p=state.p,d=forward(p.yaw,p"],
      ["x,p.y+1.65+d.y,p.z+d.z);hud();}else{menuAngle=settings.reduced?0:Math.","x,p.y+1.65+d.y,p.z+d.z);hud();}else if(!devices?.xr.active){menuAngle=settings.reduced?0:Math."],
      [",48);view.camera.lookAt(4,13,-58);}\n view.update(playing?state:{...sta",",48);view.camera.lookAt(4,13,-58);}\n if(devices?.xr.active)devices.xr.syncRig();\n view.update(playing?state:{...sta"],
      [" no installation';updateContinue();requestAnimationFrame(animate);\n window.AetherReach=Object.freeze({version:VERSION,snapshot:()=>({playing,paused,won:state.won,time:s"," no installation';updateContinue();devices=installControllers({view,state:()=>state,settings,saveSettings:()=>store.set(SETTINGS,JSON.stringify(settings)),start:()=>{if(!playing)start(!!store.get(SAVE));else{closeDialogs();paused=false;}},clear:clearInput,pause,playing:()=>playing,paused:()=>paused,action,map:()=>{map();showDialog('map-dialog');},hint:()=>nearby(state)?.label||$('toast').textContent});view.renderer.setAnimationLoop(animate);\n window.AetherReach=Object.freeze({version:VERSION,snapshot:()=>({devices:devices?.snapshot(),playing,paused,won:state.won,time:s"]
    ]
  },
  "aether-reach/model.mjs": {
    "before": "fd9680ae07aa0e28e003c1c0672de8eea4e42948138297dc0aadf4186595b9b9",
    "after": "a803f0eecb1e13634d6cdb55747dfceac32b3c442a6be76b0a693dcf21b48534",
    "replacements": [
      ["ervice. */\nexport const VERSION='0.1.0';\nexport const clamp=(n,a,b)=>Ma","ervice. */\nexport const VERSION='0.2.0';\nexport const clamp=(n,a,b)=>Ma"],
      ["'reverse');}\nexport function fire(s){const p=s.p;if(p.shoot>0||p.reload>0||p.ammo<=0||s.won)return false;p.shoot=.23;p.ammo--;s.stats.shots++;const o={x:p.x,y:p.y+1.6,z:p.z},d=forward(p.yaw,p.pitch);let limit=85,hit=null;for(const b ","'reverse');}\nexport function fire(s,aim=null){const p=s.p;if(p.shoot>0||p.reload>0||p.ammo<=0||s.won)return false;const head={x:p.x,y:p.y+1.6,z:p.z};\n let o=head,d=forward(p.yaw,p.pitch);\n if(aim){if(!aim.origin||!aim.direction||!['x','y','z'].every(k=>Number.isFinite(aim.origin[k])&&Number.isFinite(aim.direction[k])))return false;const len=Math.hypot(aim.direction.x,aim.direction.y,aim.direction.z);if(len<.001||distance(head,aim.origin)>2.5||!clearLine(head,aim.origin))return false;o={...aim.origin};d={x:aim.direction.x/len,y:aim.direction.y/len,z:aim.direction.z/len};}\np.shoot=.23;p.ammo--;s.stats.shots++;let limit=85,hit=null;for(const b "],
      ["h.cos(p.yaw),rz=Math.sin(p.yaw),ix=(input.right?1:0)-(input.left?1:0),iz=(input.forward?1:0)-(input.back?1:0),len=Math.hypot(ix,iz)||1,speed=input.boost?10.5:6.5;\n  cons","h.cos(p.yaw),rz=Math.sin(p.yaw),ix=Number.isFinite(input.moveX)?clamp(input.moveX,-1,1):(input.right?1:0)-(input.left?1:0),iz=Number.isFinite(input.moveZ)?clamp(input.moveZ,-1,1):(input.forward?1:0)-(input.back?1:0),len=Math.max(1,Math.hypot(ix,iz)),speed=input.boost?10.5:6.5;\n  cons"],
      ["y+=.05;return true;}return false;}\n","y+=.05;return true;}return false;}\n\n// Room-scale translation is collision checked independently of joystick motion.\nexport function roomMove(s,dx,dz){if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)>.5||s.p.rail)return false;const p=s.p;if(!occupied(p.x+dx,p.y,p.z))p.x+=dx;if(!occupied(p.x,p.y,p.z+dz))p.z+=dz;return true;}\n"]
    ]
  },
  "aether-reach/scene.mjs": {
    "before": "763d6c6736ab49b36ef02ef374ac01a433131701bbcfc52c0dee0a05ec2cbfff",
    "after": "45b6a91d0b70c9ee3c40840b5f2c69807c099c5ce602cc84dd2b415cafa8dd7e",
    "replacements": [
      ["true,opacity:.25,wireframe:true}));mesh.position.copy(camera.position);scene.add(mesh);sparks.p","true,opacity:.25,wireframe:true}));camera.getWorldPosition(mesh.position);scene.add(mesh);sparks.p"],
      ["}\n  hand.visible=hook.visible=!menu;hook.position.y=state.p.rail?.24:0","}\n  hand.visible=hook.visible=!menu&&!renderer.xr.isPresenting;hook.position.y=state.p.rail?.24:0"],
      ["coil*.06;\n }\n function resize(w,h){renderer.setSize(w,h,false);camera.","coil*.06;\n }\n function resize(w,h){if(renderer.xr.isPresenting)return;renderer.setSize(w,h,false);camera."]
    ]
  },
  "aether-reach/index.html": {
    "before": "60b3479909dff34aa60c660c6d1d6f8dc3207601b4be93afc5acef0da95312ee",
    "after": "ed16f965c51ac06828200e617ef2e5e13ac6a1a3007dde66a6d1988701cc9cd8",
    "replacements": [["an class=\"build\">AETHER REACH <i>0.1.0</i></span><button id=\"pause-butt","an class=\"build\">AETHER REACH <i>0.2.0</i></span><button id=\"pause-butt"]]
  },
  "aether-reach/style.css": {
    "before": "b8acd1bbf0a37696ada52e340be92919fea958a0543c85bc46c25a4331583281",
    "after": "f2f8d85f9a153718f6c43a552e80cca4d40abf241aa41ddd9bb09bc35e66607d",
    "replacements": [["g::backdrop{backdrop-filter:none}}\n","g::backdrop{backdrop-filter:none}}\n\n/* Controller and XR adapter */\n#controller-status{font:9px/1.4 Arial;color:#cde8dc;max-width:200px}#xr-status{font:10px/1.6 Arial;color:#c3d9cd;max-width:345px}.roadmap-link{font:11px Arial;padding:10px 0}.in-xr #hud,.in-xr #touch,.in-xr #vignette,.in-xr #damage-flash{visibility:hidden}\n@media(max-width:680px){#controller-status{display:none}#enter-vr{font-size:11px}}\n"]]
  },
  "aether-reach/release.json": {
    "before": "14e53d44556e5996f9b17ed5e2b153467162d967ddf3a295ccbe2635b01e3b41",
    "after": "4cc2fa8034abd8b1e524dfe72b957c8a1b4eadda51a0e8cac6f9d166b2ecc2d5",
    "replacements": [["{\"version\":\"0.1.0\",\"name\":\"Aether Reach\",\"expedition\":\"The Silent Network\",\"date\":\"2026-09-06\",\"status\":\"first playable expedition\",\"renderer\":\"Three.js r177; pinned local distribution\"}\n","{\"version\":\"0.2.0\",\"focus\":\"Xbox-standard controller, experimental WebXR, trackable roadmap\",\"questHardwareVerified\":false}\n"]]
  }
}''')
pending=[]
for name,item in EDITS.items():
 p=ROOT/name;raw=p.read_bytes();sha=hashlib.sha256(raw).hexdigest()
 if sha==item['after']:continue
 assert sha==item['before'], 'Base changed; review instead of overwrite: '+name
 text=raw.decode('utf-8')
 for old,new in item['replacements']:
  assert text.count(old)==1,(name,old[:80])
  text=text.replace(old,new,1)
 out=text.encode('utf-8');assert hashlib.sha256(out).hexdigest()==item['after'],name
 pending.append((p,out))
for p,out in pending:p.write_bytes(out)
print('Verified and integrated',len(pending),'public runtime files.')
