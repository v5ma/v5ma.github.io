from pathlib import Path
D=Path(__file__).resolve().parents[1]/'dino-atlas'
def patch(name,old,new):
 p=D/name;s=p.read_text()
 if new in s:return
 assert old in s,(name,old[:100]);p.write_text(s.replace(old,new))
patch('ranger.js','audio,input,frontier,ranch,settings,','audio,input,frontier,ranch,settings,park,')
patch('ranger.js',"window.__dinoAAA={get state(){return director?.snapshot?.()||null;},open:()=>director?.open?.()}","window.__dinoAAA={get state(){return director?.snapshot?.()||null;},open:()=>director?.open?.(),suspend:()=>director?.suspend?.()}")
patch('ranch-game.js',"choose(id){this.race.cancel", "choose(id){window.__dinoAAA?.suspend?.();this.race.cancel")
patch('ranger.js',"state.tracked=b.dataset.track;campaignPinned=false;ranch?.pauseTracking();", "state.tracked=b.dataset.track;campaignPinned=false;director?.suspend();ranch?.pauseTracking();")
patch('ranger.js',"$('pen-track').onclick=()=>{state.tracked='pens';campaignPinned=false;close();};", "$('pen-track').onclick=()=>{director?.suspend();ranch?.pauseTracking();state.tracked='pens';campaignPinned=false;close();};")
patch('ranger.js',"$('campaign-track').onclick=()=>{ranch?.pauseTracking();", "$('campaign-track').onclick=()=>{director?.suspend();ranch?.pauseTracking();")
patch('ranger.js','and 14 species to discover.','and 30 species to discover.')
patch('frontier-data.js','const outside=!insidePen(a,pen,2),south=pen.z+pen.hz;','const outside=!insidePen(a,pen,0),south=pen.z+pen.hz;')
patch('frontier-data.js', 'const r=Math.min(a.radius*.6,1.5),was=insidePen(old,pen,r),now=insidePen(a,pen,r),gateX=Math.abs(a.x-pen.x)<5-r;\n  if(was&&!now', 'const r=Math.min(a.radius*.6,1.5),was=insidePen(old,pen,0),now=insidePen(a,pen,0),gateX=Math.abs(a.x-pen.x)<5-r;\n  if(was&&!insidePen(a,pen,r)')
for n in ['ranger.js','ranch-game.js']:
 p=D/n;s=p.read_text().replace('insidePen(a,p,1)','insidePen(a,p,2)').replace('insidePen(a,pen,1)','insidePen(a,pen,2)');p.write_text(s)
patch('frontier-economy-core.js',"typeof x==='string'&&x.startsWith('ranch:')", "typeof x==='string'&&(x.startsWith('ranch:')||x==='aaa:storm-response')")
patch('frontier-economy-core.js','s.rivalPressure[id]=clamp(rival,.04,.92);','s.rivalPressure[id]=clamp((s.rivalPressure[id]??rival)*.7+rival*.3,.04,.92);')
for p in D.glob('*.js'):
 s=p.read_text().replace('?v=ranch1','?v=storm2').replace('?base=ranch1','?base=storm2');p.write_text(s)
patch('ranger.js',"from './aaa-director.js'", "from './aaa-director.js?v=storm2'")
patch('ranger.js',"from './ranch-game.js'", "from './ranch-game.js?v=storm2'")
p=D/'index.html';s=p.read_text().replace('?v=ranch1','?v=storm2').replace('AAA VERTICAL SLICE 01','STORM RESPONSE').replace('Ranch<br>&amp; Coast.','Storm<br>Response.').replace('Dino Atlas | AAA Vertical Slice 01','Dino Atlas | Storm Response');p.write_text(s)
p=D/'README.md';s=p.read_text()
if not s.startswith('# Dino Atlas: Storm Response'):
 p.write_text('''# Dino Atlas: Storm Response

Play the existing game at index.html. Open Menu and select Story mission: Storm Response for the connected ground, air, interior and coastal operation. The new Development roadmap menu panel summarizes the production plan without leaving the game.

The maintained checklist is [AAA-ROADMAP.md](AAA-ROADMAP.md). Release scope and known limitations are in [STORM-RESPONSE.md](STORM-RESPONSE.md); verification receipts live in verification/. The earlier Ranch & Coast world, 30 species, 64 residents, trading, vehicles, tools and journal remain intact.

'''+s)
print('Storm Response integration applied. Other game directories remain untouched.')
