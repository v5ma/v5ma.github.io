"""Apply a bounded presentation-only upgrade to the exact v0.18 baseline."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]

def edit(name,changes):
    p=ROOT/name;s=p.read_text()
    for before,after in changes:
        if s.count(before)!=1:raise RuntimeError(f'{name}: integration anchor changed: {before[:65]}')
        s=s.replace(before,after,1)
    p.write_text(s)

edit('prismatic-renderer.js',[
("import './prismatic-core.js';", "import './prismatic-core.js';\nimport {KEY as LUMINOUS_KEY, preferences as luminousPreferences} from './luminous-core.mjs';\nimport {installLuminous} from './luminous-materials.js';"),
("const motion=()=>prefs.motion&&!motionQuery.matches;", "let luminousPrefs=luminousPreferences(),luminousSaveOK=true;\ntry{luminousPrefs=luminousPreferences(JSON.parse(localStorage.getItem(LUMINOUS_KEY)||'{}'));}catch{luminousSaveOK=false;}\nconst motion=()=>prefs.motion&&!motionQuery.matches;"),
(" s.actorMaterial=enamel;", " s.actorMaterial=enamel;s.roadMaterial=road;"),
(" enhanceExisting(s);buildStations(s,paths);", " enhanceExisting(s);s.luminous=installLuminous(T,s,clock,luminousPrefs,course,mesh);report.luminous=s.luminous.stats;buildStations(s,paths);"),
("s.group.traverse(o=>{if(o.geometry)o.onAfterRender=()=>{report.draws++;};});", "s.group.traverse(o=>{if(o.geometry){const previous=o.onAfterRender;o.onAfterRender=function(...args){previous?.apply(this,args);report.draws++;};}});"),
(" actor(s);const step=active?", " s.luminous?.update(active?player.x:0,active?player.y:0,active);\n actor(s);const step=active?"),
("<h2>Glass. Gold. Motion.</h2>","<h2>Glass. Gold. Light.</h2>"),
("<div class=\"prism-samples\" aria-hidden=\"true\">",'<fieldset id="luminous-settings"><legend>Luminous shader finish</legend><label for="luminous-finish">Pearlescent enamel and sky light</label><select id="luminous-finish"><option value="subtle">Subtle / soft opal highlights</option><option value="vivid">Vivid / richer spectral color</option><option value="off">Off / previous Prismatic finish</option></select><label class="prism-check"><input id="luminous-water" type="checkbox">Ripple-lit canal water</label><label class="prism-check"><input id="luminous-sky" type="checkbox">Soft sky-silk ribbons</label><p id="luminous-status" role="status"></p></fieldset><div class="prism-samples" aria-hidden="true">'),
(" let wasPaused=false;button.onclick=()=>{wasPaused=!!__delivery.paused;if(__sky.active()&&!wasPaused&&!__delivery.state.menu)__delivery.act('pause');panel.showModal();$('prism-close').focus();};$('prism-close').onclick=()=>panel.close();panel.addEventListener('close',()=>{if(!wasPaused&&__delivery.paused)__delivery.act('resume');cv.focus({preventScroll:true});});", """ let resumeOwned=false,returnFocus=null;
 const invalidateResume=()=>{resumeOwned=false;};
 window.addEventListener('blur',invalidateResume);window.addEventListener('gamepaddisconnected',invalidateResume);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)invalidateResume();});
 function show(){if(panel.open)return;returnFocus=document.activeElement;resumeOwned=mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu&&!document.hidden;if(resumeOwned)__delivery.act('pause');panel.showModal();$('prism-close').focus();}
 button.onclick=show;$('prism-close').onclick=()=>panel.close();
 panel.addEventListener('cancel',event=>{event.preventDefault();panel.close();});
 panel.addEventListener('close',()=>{if(resumeOwned&&mode==='play'&&!won&&!document.hidden&&!document.querySelector('dialog[open]'))__delivery.act('resume');resumeOwned=false;if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true});});
 function mountGraphics(){for(const [selector,id]of [['#flight-deck .fd-actions','prism-deck'],['#delivery-pause .delivery-pause-card','prism-pause']]){const host=document.querySelector(selector);if(host&&!$(id)){const b=document.createElement('button');b.id=id;b.className='delivery-btn';b.textContent='Materials & FX';b.setAttribute('aria-haspopup','dialog');b.onclick=show;host.append(b);}}return !!$('prism-deck')&&!!$('prism-pause');}
 if(!mountGraphics()){const observer=new MutationObserver(()=>{if(mountGraphics())observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}
 function luminousUI(){
  $('luminous-finish').value=luminousPrefs.finish;$('luminous-water').checked=luminousPrefs.water;$('luminous-sky').checked=luminousPrefs.sky;
  $('luminous-status').textContent=luminousSaveOK?'Subtle is the default. Off restores the previous Prismatic finish; Classic removes both layers. Animation follows the motion setting below.':'Graphics preferences could not be saved; these choices apply to this session only.';
 }
 for(const id of ['luminous-finish','luminous-water','luminous-sky'])$(id).onchange=()=>{luminousPrefs=luminousPreferences({finish:$('luminous-finish').value,water:$('luminous-water').checked,sky:$('luminous-sky').checked});try{localStorage.setItem(LUMINOUS_KEY,JSON.stringify(luminousPrefs));luminousSaveOK=true;}catch{luminousSaveOK=false;}luminousUI();rebuild();};
 luminousUI();"""),
("get settings(){return {...prefs};}","get settings(){return {...prefs,luminous:{...luminousPrefs}};}"),
("get stats(){return {...report,installs", "get stats(){return {...report,luminous:report.luminous?{...report.luminous}:null,luminousSaveOK,installs")
])
edit('sunrise.js', [("const reading=mode===", "const reading=!document.getElementById('prism-panel')?.open&&mode===")])
css=ROOT/'prismatic.css'
css.write_text(css.read_text()+'''\n#luminous-settings{margin:17px 0 5px;padding:12px 14px;border:1px solid #699eab;border-radius:12px;background:#102b3b80;min-width:0}#luminous-settings legend{padding:0 7px;color:#ffe6ae;font-weight:700}#luminous-finish{display:block;box-sizing:border-box;width:100%;max-width:100%;min-height:44px;margin:6px 0 12px;padding:9px;background:#102a3d;color:#edf7f6;border:1px solid #7197a6;border-radius:8px;font:13px system-ui}#luminous-status{font-size:11px;color:#bed9df;line-height:1.5}#prism-panel .prism-check{min-height:32px}#prism-panel button{min-height:44px}\n''')
edit('release-status.js',[("const VERSION='0.18.0',BUILD='sky-cycle-sunrise-2026.09.12';","const VERSION='0.19.0',BUILD='sky-cycle-luminous-2026.09.12';")])
edit('sw.js',[("svgn-paper-route-sky-cycle-sunrise-20260912","svgn-paper-route-sky-cycle-luminous-20260912")])
(ROOT/'release.json').write_text(json.dumps({'version':'0.19.0','build':'sky-cycle-luminous-2026.09.12','date':'2026-09-12','changes':['Luminous thin-film enamel on existing rails and courier materials','Ripple-lit canal water with procedural highlights and surface normals','Soft procedural sky-silk ribbons behind the playable world','Subtle, Vivid and Off finishes plus independent water and sky controls','Controller-accessible Materials & FX from pause and Flight Deck with safe nested return','No level, collision, movement, music or progression changes; existing saves preserved']},indent=2)+'\n')
print('Integrated Luminous shaders into the existing Prismatic renderer.')
