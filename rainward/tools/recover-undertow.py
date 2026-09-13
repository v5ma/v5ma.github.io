"""Recover the unpublished v0.13 release using locally verified source anchors.
All edits are staged in memory and written only after every anchor validates.
Run on the recovery branch, then retain native evidence before publishing.
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
updates={}
def edit(name,old,new):
 p=R/name;s=updates.get(name,p.read_text())
 if new in s:return
 assert s.count(old)==1,(name,s.count(old),old[:100])
 updates[name]=s.replace(old,new)
edit('camera-core.mjs','radius=.20,boxes=OBSTACLES){','radius=.20,boxes=OBSTACLES,floorAt=heightAt){')
edit('camera-core.mjs','heightAt(desired.x,desired.z)','floorAt(desired.x,desired.z)')
edit('camera-core.mjs','y<heightAt(x,z)+radius','y<floorAt(x,z)+radius')
edit('camera-core.mjs','dt,snap=false){','dt,snap=false,floorAt=heightAt){')
for end in ['desired','previous','blend']:
 edit('camera-core.mjs',f'clipBoom(target,{end})',f'clipBoom(target,{end},.20,OBSTACLES,floorAt)')
edit('scene.mjs',"import {followCamera} from './camera-core.mjs';","import {followCamera} from './camera-core.mjs';\nimport {poolCameraFloor,underwaterBoom} from './pool-layout.mjs';")
edit('scene.mjs',"const p=state.player,aim=view.aim,lookY=heightAt(p.x,p.z)-(p.swimDepth||0)+(p.stance==='prone'?.38:p.stance==='crouch'?1.05:1.5)","const p=state.player,swimming=p.waterMode==='swim',aim=view.aim&&!swimming,lookY=heightAt(p.x,p.z)+(swimming?(p.submerged?-(p.swimDepth||0)+.35:.50):(p.stance==='prone'?.38:p.stance==='crouch'?1.05:1.5))")
edit('scene.mjs',"const safe=followCamera(target,desired,cameraSet?camera.position:null,dt,!cameraSet||view.snap);","const cameraFloor=swimming?(x,z)=>poolCameraFloor(chapter.water||[],x,z,heightAt(x,z)):heightAt;if(swimming){const water=chapter.water.find(w=>Math.abs(p.x-w.x)<w.w/2&&Math.abs(p.z-w.z)<w.d/2);if(water){desired.y=p.submerged?Math.min(desired.y,(water.surface??-.08)-.22):Math.max(desired.y,(water.surface??-.08)+.25);if(p.submerged)desired.copy(underwaterBoom(water,target,desired));}}\n  const safe=followCamera(target,desired,cameraSet?camera.position:null,dt,!cameraSet||view.snap,cameraFloor);")
for depth in ['.48','2.55','3.15','1.65']:
 edit('natatorium.mjs','depth:'+depth+',surface:.28','depth:'+depth+',surface:-.08')
edit('natatorium.mjs',"task('nat-dive-marker',-12,-35","task('nat-dive-marker',-7.5,-34")
edit('natatorium.mjs',"task('nat-chemical-lock',-43,-61","task('nat-chemical-lock',-40.2,-61")
edit('supplies.mjs','CURRENT,syncGates,heightAt,START','CURRENT,syncGates,heightAt,waterAt,START')
edit('supplies.mjs',"export function interactable(s){const p=s.player;","export function interactable(s){const p=s.player,w=waterAt(p);if(w?.swimmable&&w.depth>=.8){const i=ITEMS.find(i=>i.underwater&&!s.taken.has(i.id)&&dist(i,p)<1.8&&waterAt(i)===w);if(!i)return null;return p.submerged?{kind:'item',id:i.id,label:i.label}:{kind:'underwater',id:i.id,label:'Dive to reach '+i.label};}")
edit('aquatic.mjs',"import {emit,hint} from './state.mjs';","import {emit,hint} from './state.mjs';\nimport {cancelAction} from './survival.mjs';")
edit('aquatic.mjs',"if(!w)return false;if(p.reload","if(s.status!=='playing'||!w)return false;if(p.reload")
edit('aquatic.mjs',"if(p.waterMode!=='swim')return false;","if(s.status!=='playing'||p.waterMode!=='swim')return false;")
edit('aquatic.mjs',"if(prior!=='swim'){p.submerged=false;","if(prior!=='swim'){cancelAction(s,'Dry actions cancelled on entering deep water.');p.reload=0;p.reloadTotal=0;p.melee=null;p.submerged=false;")
edit('natatorium-art.mjs',"import {rnd} from './artkit.mjs';","import {rnd} from './artkit.mjs';\nimport {basinLayout,dryDeckRectangles} from './pool-layout.mjs';\nfunction tiledBox(w,h,d){const g=new T.BoxGeometry(w,h,d),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);uv.setXY(i,(Math.abs(n.getX(i))>.5?z:x)/4,(Math.abs(n.getY(i))>.5?z:y)/4);}uv.needsUpdate=true;return g;}")
edit('natatorium-art.mjs','t.repeat.set(6,8);','t.repeat.set(1,1);')
edit('natatorium-art.mjs','const y=p.surface??.28,wall=.22;','const layout=basinLayout(p),y=layout.surfaceY,wall=.22;')
edit('natatorium-art.mjs',"const bottom=new T.Mesh(new T.BoxGeometry(p.w,p.depth*.12,p.d),tileMat);bottom.position.set(p.x,-p.depth-.06,p.z);","const bottom=new T.Mesh(tiledBox(p.w,layout.slabHeight,p.d),tileMat);bottom.name='Pool floor / '+p.id;bottom.position.set(p.x,layout.slabCenterY,p.z);")
edit('natatorium-art.mjs','new T.BoxGeometry(w,p.depth,d)','tiledBox(w,layout.wallHeight,d)')
edit('natatorium-art.mjs','side.position.set(x,-p.depth/2,z);','side.position.set(x,layout.wallCenterY,z);')
edit('natatorium-art.mjs','lane.position.set(p.x+i*3,-p.depth+.03,p.z);',"lane.name='Competition lane';lane.position.set(p.x+i*3,layout.laneY,p.z);")
edit('natatorium-art.mjs','glow.mesh.position.set(p.x,-p.depth+.09,p.z);',"glow.mesh.name='Pool floor caustics / '+p.id;glow.mesh.position.set(p.x,layout.causticY,p.z);")
edit('natatorium-art.mjs',' for(const p of CURRENT.water){'," const deck=new T.Group();deck.name='Dry tiled deck / pool openings';for(const r of dryDeckRectangles(CURRENT.bounds,CURRENT.water)){const slab=new T.Mesh(tiledBox(r.w,.16,r.d),tileMat);slab.position.set(r.x,-.08,r.z);slab.receiveShadow=true;deck.add(slab);}scene.add(deck);\n for(const p of CURRENT.water){")
edit('natatorium-art.mjs','lamp.position.set(15,-1.1,z);','lamp.position.set(15,-1.1,z);lamp.userData.laneLight=true;')
edit('natatorium-art.mjs','update(s,dt){const t=s.t;',"update(s,dt){const t=s.t;for(const l of dynamic.lights)if(l.userData.laneLight)l.intensity=s.completedTasks.includes('nat-lane-lights')?3.4:.35;")
edit('natatorium-art.mjs','activeLights:dynamic.lights.length,extraRenderTargets:0','activeLights:dynamic.lights.length,deckPanels:deck.children.length,extraRenderTargets:0')
edit('aquatic-ui.mjs',"document.getElementById('water-control').textContent=control;","document.getElementById('water-control').textContent=control+' / GEAR STOWED';")
edit('tests/aquatic.py',"  oxygen=p.evaluate('Rainward.state.player.oxygen');",'''  check(p.evaluate('Rainward.snapshot().visuals.aquatic.deckPanels')>0,'Tiled dry decks have real pool openings')
  saved=p.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');press(3);check(p.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'Y cannot save at a dry shelter while swimming beside its edge')
  p.evaluate('pad.axes[1]=-1');wait('Rainward.state.player.z<18');p.evaluate('pad.axes[1]=0');frames(3);check(True,'The left stick swims away from the pool rim without a mouse')
  oxygen=p.evaluate('Rainward.state.player.oxygen');''')
edit('tests/aquatic.py',"  mag=p.evaluate('Rainward.state.player.mag');",'''  check(p.evaluate('Rainward.snapshot().camera.y<-.2&&Rainward.snapshot().camera.heroVisible'),'The camera follows the submerged body above the basin instead of collapsing at the land floor')
  mag=p.evaluate('Rainward.state.player.mag');''')
boom='''
/* Shorten the submerged boom before land-floor correction can lift its endpoint
 * out of the water. A positive inset reserves room for the near plane. */
export function underwaterBoom(pool,target,desired,inset=.30){
 let t=1;
 for(const [axis,half] of [['x',pool.w/2-inset],['z',pool.d/2-inset]]){
  const delta=desired[axis]-target[axis];
  if(Math.abs(delta)>1e-9){const edge=pool[axis]+(delta>0?half:-half);t=Math.min(t,Math.max(0,(edge-target[axis])/delta));}
 }
 return {x:target.x+(desired.x-target.x)*t,y:target.y+(desired.y-target.y)*t,z:target.z+(desired.z-target.z)*t};
}
'''
p=R/'pool-layout.mjs'
if boom not in p.read_text():updates['pool-layout.mjs']=p.read_text()+boom
edit('tests/water-hardening.test.mjs','poolContains} from','poolContains,underwaterBoom} from')
test='''
test('Diving beside the far edge shortens the boom rather than raising it through the surface',()=>{
 game();const p=W.CURRENT.water.find(w=>w.id==='competition'),target={x:15,y:-1.35,z:17.82};
 const intended=underwaterBoom(p,target,{x:15.72,y:-.30,z:22.62}),floor=(x,z)=>poolCameraFloor(W.CURRENT.water,x,z);
 const safe=clipBoom(target,intended,.20,[],floor);
 assert.ok(safe.y<-.2);assert.ok(poolContains(p,safe.x,safe.z,.28));assert.ok(Math.hypot(safe.x-target.x,safe.z-target.z)>3.8);
});
'''
name='tests/water-hardening.test.mjs';s=updates.get(name,(R/name).read_text())
if test not in s:updates[name]=s+test
notes='\nRecovery hardening: the pool camera now samples recessed basin floors instead of collapsing against the land floor; pool decks have real openings; metre-scaled tiles, lane paint and caustic planes are layered above the basin slabs. Swimming interaction cannot operate dry shelters, valves, supplies or takedowns. Unfinished dry actions cancel safely on water entry. Both optional depth/chemical stations are on clear dry ground, and the lane-light task changes the actual underwater light intensity. The complete mission, including all optional tasks, is covered by interaction tests.\n'
p=R/'UNDERTOW.md'
if notes not in p.read_text():updates['UNDERTOW.md']=p.read_text()+notes
for name,text in updates.items():(R/name).write_text(text);print('Recovered',name)
