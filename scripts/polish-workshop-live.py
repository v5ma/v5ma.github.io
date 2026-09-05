"""Idempotent refinements from native editor interaction and visual review."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];g=ROOT/'mario-maker-clone/svgn-paper-route'
p=g/'route-workshop.js';s=p.read_text()
s=s.replace("S.doc=W.decode(S.history[a]());clearSelection();S.dirty=current()!==S.saved;refresh();return;", "const ids=new Set(selected().map(p=>p.meta?.id).filter(Boolean));const indexes=new Set(S.selected);S.doc=W.decode(S.history[a]());S.selected=new Set(S.doc.paths.map((p,i)=>p.meta?.id?ids.has(p.meta.id)?i:-1:indexes.has(i)?i:-1).filter(i=>i>=0));S.object=null;S.dirty=current()!==S.saved;refresh();return;")
s=s.replace("for(const c of host.querySelectorAll('[data-tile-thumb]')){try{drawTile(c.getContext('2d'),Number(c.dataset.tileThumb),4,4,0,false,null);}catch{}}", "function renderThumbnails(){for(const c of host.querySelectorAll('[data-tile-thumb]')){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(4,4);drawTileIcon(ctx,Number(c.dataset.tileThumb));ctx.restore();}}renderThumbnails();")
s=s.replace("if(recover?.code){load(recover.code);message(", "if(recover?.code){draftId=recover.id||null;load(recover.code);message(")
s=s.replace("refresh();canvas.focus({preventScroll:true});draw();", "refresh();renderThumbnails();canvas.focus({preventScroll:true});draw();")
s=s.replace("drawTile(ctx,id,x,y,0,false,null)", "drawTileRaw(ctx,id,x,y,0,false,null)")
s=s.replace("if(z>.7){try{drawTileRaw(ctx,id,x,y,0,false,null);}catch{}}if(z>.35){", "if(z>.45){ctx.save();ctx.translate(x,y);drawTileIcon(ctx,id);ctx.restore();}if(z>.35&&z<=.45){")
s=s.replace('<details><summary>World settings</summary>', '<details open><summary>World settings</summary>')
s=s.replace("if(e.key==='Tab'){const list=", "if(e.key==='Tab'){if(e.type==='keyup')return;const list=")
s=s.replace('{name:S.doc.name,code:current(),time:Date.now()}', '{id:draftId,name:S.doc.name,code:current(),time:Date.now()}')
s=s.replace("S.object=null;S.dirty=current()!==S.saved;refresh();return;", "S.object=null;S.dirty=current()!==S.saved;safeStore.set(recoveryKey,JSON.stringify({id:draftId,name:S.doc.name,code:current(),time:Date.now()}));refresh();return;")
if 'Save from text fields' not in s:
    s=s.replace("function handleKey(e){if(!S.active)return;", "function handleKey(e){if(!S.active)return;/* Save from text fields commits their pending change first. */if(e.type==='keydown'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.target.blur();save();return;}")
if 'id="maker-inspector-close"' not in s:
    s=s.replace('<aside class="maker-inspector"><h2>', '<aside class="maker-inspector"><button id="maker-inspector-close" data-mk="inspector">Back to canvas</button><h2>')
    s=s.replace("else if(e.key==='Escape'){clearSelection();", "else if(e.key==='Escape'){if(host.classList.contains('show-inspector')){host.classList.remove('show-inspector');$('maker-inspector-toggle').setAttribute('aria-expanded','false');$('maker-inspector-toggle').focus();return;}clearSelection();")
p.write_text(s)
p=g/'workshop-core.js';s=p.read_text().replace("else if(id==='half')pts=arc(130,-65,130,162,18);", "else if(id==='half')pts=arc(150,-150,150,45,315,72);")
s=s.replace("hint:'A gold-sector timed exit. One option, not every level.'", "hint:'A complete circle with an open exit. Custom adventures ride off its lip.'")
p.write_text(s)
p=g/'workshop.css';s=p.read_text()
if '#maker-inspector-close{' not in s:s+='\n#maker-inspector-close{display:none}@media(max-width:740px){#maker-inspector-close{display:block;width:100%;margin:0 0 12px;background:#d8c18c!important;color:#153340!important}}\n'
p.write_text(s)
p=ROOT/'tests/workshop_browser.py';s=p.read_text()
if 'Undo also updates the recovery snapshot' not in s:
    s=s.replace("draft=code(page);page.reload(wait_until='domcontentloaded');", "draft=code(page)\n            page.locator('#maker-name').fill('Temporary unsaved rename');page.locator('#maker-name').press('Tab');page.wait_for_timeout(800)\n            page.locator('#maker-canvas').focus();page.keyboard.press('Control+z')\n            check(code(page)==draft,'Undo also updates the recovery snapshot instead of resurrecting discarded edits')\n            page.reload(wait_until='domcontentloaded');")
    s=s.replace("check(code(page)==draft,'The last saved/recovery draft survives a page reload')", "check(code(page)==draft,'The last saved/recovery draft survives a page reload')\n            page.locator('#maker-name').fill('Recovered neighborhood');page.locator('#maker-name').press('Control+s')\n            check(page.evaluate('JSON.parse(localStorage.getItem(\"svgn_route_workshop_library_v2\"))[0].name')=='Recovered neighborhood','Ctrl+S saves pending text-field edits')\n            check(page.evaluate('JSON.parse(localStorage.getItem(\"svgn_route_workshop_library_v2\")).length')==2,'Saving a recovered draft updates its existing library slot')")
    s=s.replace("page.screenshot(path=str(OUT/'editor-mobile.png'))", "page.screenshot(path=str(OUT/'editor-mobile-properties.png'))\n            page.locator('#maker-inspector-close').click();check(not page.locator('.maker-inspector').is_visible(),'Phone properties can be closed to resume canvas editing')\n            page.screenshot(path=str(OUT/'editor-mobile.png'))")
p.write_text(s)
print('Native object art, selection/history recovery and mobile properties are integrated.')
