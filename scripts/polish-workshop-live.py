"""Idempotent refinements from the first native editor interaction review."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];g=ROOT/'mario-maker-clone/svgn-paper-route'
p=g/'route-workshop.js';s=p.read_text()
s=s.replace("S.doc=W.decode(S.history[a]());clearSelection();S.dirty=current()!==S.saved;refresh();return;", "const ids=new Set(selected().map(p=>p.meta?.id).filter(Boolean));const indexes=new Set(S.selected);S.doc=W.decode(S.history[a]());S.selected=new Set(S.doc.paths.map((p,i)=>p.meta?.id?ids.has(p.meta.id)?i:-1:indexes.has(i)?i:-1).filter(i=>i>=0));S.object=null;S.dirty=current()!==S.saved;refresh();return;")
s=s.replace("for(const c of host.querySelectorAll('[data-tile-thumb]')){try{drawTile(c.getContext('2d'),Number(c.dataset.tileThumb),4,4,0,false,null);}catch{}}", "function renderThumbnails(){for(const c of host.querySelectorAll('[data-tile-thumb]')){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(4,4);drawTileIcon(ctx,Number(c.dataset.tileThumb));ctx.restore();}}renderThumbnails();")
s=s.replace("if(recover?.code){load(recover.code);message(", "if(recover?.code){draftId=recover.id||null;load(recover.code);message(")
s=s.replace("refresh();canvas.focus({preventScroll:true});draw();", "refresh();renderThumbnails();canvas.focus({preventScroll:true});draw();")
s=s.replace("drawTile(ctx,id,x,y,0,false,null)", "drawTileRaw(ctx,id,x,y,0,false,null)")
# The inspector is useful on first open without a hidden soundtrack dependency.
s=s.replace('<details><summary>World settings</summary>', '<details open><summary>World settings</summary>')
# Ignore the Tab release; moving focus is a key-down operation only.
s=s.replace("if(e.key==='Tab'){const list=", "if(e.key==='Tab'){if(e.type==='keyup')return;const list=")
p.write_text(s)
p=g/'workshop-core.js';s=p.read_text().replace("else if(id==='half')pts=arc(130,-65,130,162,18);", "else if(id==='half')pts=arc(150,-150,150,45,315,72);")
s=s.replace("hint:'A gold-sector timed exit. One option, not every level.'", "hint:'A complete circle with an open exit. Custom adventures ride off its lip.'")
p.write_text(s)
print('Selection survives undo/redo; object thumbnails use the real game icon renderer.')
