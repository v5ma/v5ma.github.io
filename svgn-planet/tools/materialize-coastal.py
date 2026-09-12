"""One-time, auditable integration into the existing art pipeline.
Only svgn-planet files are changed. A marker makes repeated CI runs idempotent.
"""
from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
MARK=ROOT/'coastal-integration.json'
if MARK.exists():
    print('Coastal integration already materialized.');raise SystemExit(0)
def edit(name,fn):
    p=ROOT/name;s=p.read_text();out=fn(s)
    if s==out: raise RuntimeError('Integration made no changes: '+name)
    p.write_text(out)
def rep(s,a,b):
    if a not in s:raise RuntimeError('Missing integration anchor: '+a[:100])
    return s.replace(a,b)
def scene(s):
    s="import {createCoastalLife} from './coastal-life.mjs';\nimport {makePath,samplePath} from './coastal-motion.mjs';\n"+s
    s=rep(s,"antialias:false,powerPreference:'default'","antialias:!touch,powerPreference:'high-performance'")
    s=rep(s,'renderer.toneMappingExposure=1.18','renderer.toneMappingExposure=1.04')
    s=rep(s,"new T.Fog('#c6e0e4',110,250)","new T.Fog('#cbdde0',150,430)")
    s=rep(s,"'#a49b79',1.34","'#9c947d',1.02")
    s=rep(s,"'#ffe3ad',3.15","'#ffe1b3',2.72")
    s=rep(s,'sun.shadow.mapSize.set(1024,1024)','sun.shadow.mapSize.set(quality.shadowSize,quality.shadowSize)')
    s=rep(s,"if(original&&s.type!=='garden')home(fallback,s,i);","if(original&&s.type!=='garden'){const larger=home(fallback,s,i);larger.scale.set(1.6,1.1,1.05);}")
    s=rep(s,"renderer.info.autoReset=false;","renderer.info.autoReset=false;const life=createCoastalLife(root);")
    s=rep(s,"function lookBy(x,y){orbit+=x;","function lookBy(x,y){orbit-=x;")
    s=rep(s,"renderer.shadowMap.enabled=value==='low'?false:!touch;","renderer.shadowMap.enabled=value==='low'?false:!touch;") if False else s
    a=s.index(' function trafficPose(');b=s.index('\n function update',a)
    s=s[:a]+" function trafficPose(item,time,n){item.path??=makePath(item.r.points,item.r.id==='main');const q=samplePath(item.path,time*(item.speed+2.6)+item.phase,1.25);item.g.visible=mode!=='overview'&&distance(n,q.n)<180;if(item.g.visible)faceSurface(item.g,q.n,q.forward);}"+s[b:]
    s=rep(s,'city.update(s.n,mode===\'overview\',quality.low);',"city.update(s.n,mode==='overview',quality.low);life.update(dt,s,mode==='overview',quality.low,courier);")
    s=rep(s,'traffic.forEach(x=>trafficPose(x,s.time));','traffic.forEach(x=>trafficPose(x,s.time,s.n));')
    s=rep(s,'sun.position.set(...point(s.n,35)).addScaledVector(right,-22).addScaledVector(forward,-18);',"sun.position.set(...point(s.n,35)).addScaledVector(new T.Vector3(...cross(s.north,s.n)),-22).addScaledVector(new T.Vector3(...s.north),-18);")
    s=rep(s,'renderer,scene,camera,get fps()', 'renderer,scene,camera,life,get fps()')
    s=rep(s,'cameraMode:mode,playerScreenHeight:', 'cameraMode:mode,cameraOrbit:orbit,cameraPitch:pitch,life:life.inspect(),playerScreenHeight:')
    s=rep(s,"function setQuality(value){requested=value;renderer.shadowMap.enabled=value==='low'?false:!touch;if(value==='low')jewel.setLook('light',false);resize();}","function setQuality(value){requested=value;if(value==='low')jewel.setLook('light',false);resize();renderer.shadowMap.enabled=quality.shadows;sun.shadow.mapSize.set(quality.shadowSize,quality.shadowSize);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}")
    return s
edit('scene.mjs',scene)
edit('street-set.mjs',lambda s:rep(rep(s,"faceSurface(g,s.n,norm(add(s.mail,mul(s.n,-1))));const floors", "faceSurface(g,s.n,norm(add(s.mail,mul(s.n,-1))));g.scale.set(1.6,1.1,1.05);const floors"),'(i%5===1?2:1)','(i%3!==0?2:1)'))
def data(s):
    s=rep(s,"CITY_VERSION='0.6.0'","CITY_VERSION='0.7.0'")
    s=rep(s,"const w=style==='kiosk'?7:10+random(seed)*2,d=style==='kiosk'?6:7+random(seed+1)*2,h=style==='tower'?18+random(seed+2)*22:style==='apartment'?8+random(seed+2)*7:style==='shop'?4.8:3.3+random(seed+2)*1.1;", "const w=style==='kiosk'?7:13+random(seed)*2,d=style==='kiosk'?6:9+random(seed+1)*2,h=style==='tower'?25+random(seed+2)*23:style==='apartment'?12+random(seed+2)*7:style==='shop'?5.2:6.1+random(seed+2)*.5;")
    return s
edit('city-data.mjs',data)
def presentation(s):
    s=rep(s,"PRESENTATION_VERSION = '0.5.0'","PRESENTATION_VERSION = '0.7.0'")
    s=rep(s,'const pixelBudget=low?480000:1200000;',"const high=requested==='high';const pixelBudget=low?480000:high?3200000:1600000;")
    s=rep(s,'shadowSize:1024','shadowSize:high?2048:1024')
    s=rep(s,'low?1:1.5','low?1:high?2:1.5')
    return s
edit('presentation.mjs',presentation)
def city(s):
    s="import {coastalMaterial,worldRoadMaterial,addShopSigns} from './coastal-materials.mjs';\n"+s
    s=rep(s,'const bodyMat=new T.MeshStandardMaterial({roughness:.88});',"const bodyMat=coastalMaterial('stucco');")
    s=rep(s,'const roofMat=new T.MeshStandardMaterial({roughness:.83});',"const roofMat=coastalMaterial('roof');")
    s=rep(s,"color:'#426e82',roughness:.3,metalness:.35","color:'#557b88',roughness:.22,metalness:.45")
    s=rep(s,"new T.Mesh(g,new T.MeshStandardMaterial({color:shade,roughness:.94,side:T.DoubleSide}))","new T.Mesh(g,shade==='#526469'?worldRoadMaterial():new T.MeshStandardMaterial({color:shade,roughness:.94,side:T.DoubleSide}))")
    start=s.index(' for(let face=0;face<6;face++){\n  const shells=')
    end=s.index('\n const hubs=[];',start)
    replacement=''' const clusters=[];
 for(let face=0;face<6;face++)for(let ci=0;ci<6;ci++)for(let cj=0;cj<6;cj++){
  const group=new T.Group();root.add(group);const center=cubePoint(face,-1+(ci*2+1)/6,-1+(cj*2+1)/6);
  const shells=[],flatRoofs=[],hips=[],trunks=[],crowns=[];
  const blocks=CITY.blocks.filter(b=>b.face===face&&Math.floor(b.i/2)===ci&&Math.floor(b.j/2)===cj);
  for(const b of blocks.flatMap(b=>b.buildings)){
   const base=surface(b.n,b.front);b.matrix=base;b.inverseMatrix=base.clone().invert();
   shells.push({matrix:local(base,[0,b.h/2,0],[b.w,b.h,b.d]),color:b.color});
   if(b.style==='home')hips.push({matrix:local(base,[0,b.h+.92,0],[b.w*.76,1.85,b.d*.76]),color:b.seed%2?'#aa7155':'#617c83'});
   else flatRoofs.push({matrix:local(base,[0,b.h+.12,0],[b.w+.5,.28,b.d+.5]),color:'#d9d6c8'});
  }
  for(const t of blocks.flatMap(b=>b.trees)){const base=surface(t.n,FACES[face].v);trunks.push(local(base,[0,t.h/2,0],[1,t.h,1]));crowns.push(local(base,[0,t.h,0],[1,1,1]));}
  instances(group,box,bodyMat,shells,true);instances(group,box,roofMat,flatRoofs);instances(group,roof,roofMat,hips,true);instances(group,trunk,trunkMat,trunks);instances(group,leaves,leafMat,crowns);
  group.traverse(m=>{if(m.isMesh)m.userData.coastalShadow=m.castShadow;});clusters.push({g:group,n:center});
 }'''
    s=s[:start]+replacement+s[end:]
    s=rep(s,'const cache=new Map();let last=-Infinity,visible=0;','const cache=new Map();let last=-Infinity,visible=0,createdChunks=0;')
    s=rep(s,'Math.floor((b.h-.8)/2.8)','Math.floor(b.h/2.8)')
    s=rep(s,"if(b.style==='tower')doors.push(local(base,[0,b.h+.5,0],[b.w*.4,.7,b.d*.4]));", """if(b.style==='tower')doors.push(local(base,[0,b.h+.5,0],[b.w*.4,.7,b.d*.4]));
   frames.push(local(base,[0,.18,0],[b.w+.35,.36,b.d+.35]));
   if(b.style==='home'){
    frames.push(local(base,[0,3.35,b.d/2+1.2],[b.w*.54,.16,2.5]));
    for(const side of[-1,1])frames.push(local(base,[side*b.w*.24,1.76,b.d/2+2.2],[.15,3.1,.15]));
    wood.push(local(base,[b.w*.24,1,b.d/2+.8],[2.2,.65,.7]));
   }
   if(b.style==='apartment'||b.style==='tower')for(let row=1;row<Math.min(rows,5);row++){
    frames.push(local(base,[0,.95+row*2.8,b.d/2+.6],[b.w*.75,.14,1.2]));
    lamps.push(local(base,[0,1.85+row*2.8,b.d/2+1.18],[b.w*.75,.065,.065]));
    for(const x of[-.34,-.17,0,.17,.34])lamps.push(local(base,[x*b.w,1.42+row*2.8,b.d/2+1.18],[.055,.88,.055]));
   }""")
    s=rep(s,'detailRoot.add(g);cache.set(block.id,{g,block});return g;', 'addShopSigns(g,block.buildings);detailRoot.add(g);cache.set(block.id,{g,block,used:performance.now()});createdChunks++;return g;')
    start=s.index(' function update(n,overview,low){');end=s.index('\n return {update,inspect:',start)
    replacement=''' function update(n,overview,low){
  const now=performance.now();if(now-last<70)return;last=now;
  const limit=low?175:290,preload=low?220:365;
  for(const c of clusters){const d=Math.sqrt(Math.max(0,2-2*dot(n,c.n)))*RADIUS;c.g.visible=overview||d<650;c.g.traverse(m=>{if(m.isMesh)m.castShadow=!low&&!overview&&d<225&&!!m.userData.coastalShadow;});}
  const close=CITY.blocks.map(b=>({b,d:Math.sqrt(Math.max(0,2-2*dot(n,b.n)))*RADIUS})).filter(x=>x.d<preload).sort((a,b)=>a.d-b.d);
  let budget=1;for(const {b}of close)if(!cache.has(b.id)&&budget-->0)detail(b);
  visible=0;for(const [id,c]of cache){const d=Math.sqrt(Math.max(0,2-2*dot(n,c.block.n)))*RADIUS;c.g.visible=!overview&&d<limit;if(c.g.visible){visible++;c.used=now;}if(cache.size>48&&d>550){c.g.traverse(o=>{if(o.isInstancedMesh)o.dispose?.();else if(o.isMesh)o.geometry.dispose();});detailRoot.remove(c.g);cache.delete(id);}}
  for(const {g,d}of hubs)g.visible=!overview&&dot(n,d.mail)>.96;
 }'''
    s=s[:start]+replacement+s[end:]
    s=rep(s,'detailChunks:cache.size,visibleDetailChunks:', 'createdChunks,streamBudget:1,residentClusters:clusters.length,detailChunks:cache.size,visibleDetailChunks:')
    return s
edit('city-scene.mjs',city)
edit('coastal-motion.mjs',lambda s:rep(rep(s,'const brake=typeof input.brake', 'const intentional=!!direction;const brake=typeof input.brake'),"Math.max(s.speed,direction?7.5*throttle:0)","Math.max(s.speed,intentional?7.5*throttle:0)"))
edit('activities.mjs',lambda s:s.replace('p.v-.075','p.v-dv/2').replace('p.v+.075','p.v+dv/2'))
def life(s):
    s=s.replace('[.70,.24,.70]','[.24,.70,.70]').replace('[.39,.035,.39]','[.035,.39,.39]').replace('[.66,.20,.66]','[.20,.66,.66]').replace('s.distance/.33','s.time*a.speed/.33')
    s=s.replace('panel.scale.set(.53,.32,.06);panel.position.set(0,.92,.225)','panel.scale.set(.73,.26,.08);panel.position.set(0,.15,.52)')
    return s
edit('coastal-life.mjs',life)
edit('coastal-audio.mjs',lambda s:rep(s,"case 'land':hiss", "case 'collision':case 'land':hiss"))
def app(s):
    s=rep(s,"let saved=null,storage=true;","let touchBraking=false;let saved=null,storage=true;")
    s=rep(s,";let touchBraking=false;touchBrake.onpointerdown", ";touchBrake.onpointerdown")
    s=rep(s,"function clear(){keys.clear();", "function clear(){touchBraking=false;keys.clear();")
    return s
edit('app.mjs',app)
def html(s):
    s=s.replace('0.6.0','0.7.0').replace('Neighborhood Missions | A city around the planet','Neighborhood Missions | Coastal Pulse')
    s=s.replace('CITY EXPANSION v0.7.0','COASTAL PULSE v0.7.0').replace('A whole city.<br><em>Your next ride.</em>','Find your people.<br><em>Find your pace.</em>')
    s=s.replace('Your familiar route now connects to a planet of sunlit neighborhoods: 24 districts, palm-lined streets, shops, apartments and towers. A fictional coastal city inspired by Long Beach, with no time limit.','A living coastal city, original music, and 102 replayable contracts. Deliver cafe baskets, help the neighborhood, restore signals, capture postcards and ride fast through connected districts. Your original newspaper route and saves remain.')
    s=s.replace('Click the left stick for an alternative boost control.','Click the left stick to ring your bell. Acceleration never runs out: release RT to coast, and use LT or B to slow down. Real buildings still stop you.')
    s=s.replace('D-pad down opens these controls.','D-pad down opens the City jobs board and cycle workshop. These controls are available from Menu.')
    s=s.replace('Shift boosts. Space hops.','Shift accelerates; Ctrl or B brakes. J opens City jobs; G rings your bell; K mutes sound. Space hops.')
    s=s.replace('Controls: D-pad down or H','Controls: Menu or H')
    s=s.replace('Shift boost | M map | H controls','Shift accelerate | Ctrl brake | J jobs | G bell | M map')
    s=s.replace('RT boost | LT/B brake','RT accelerate | LT/B brake | D-pad down jobs')
    s=s.replace('Clear all delivery, sprint gate and postmark progress?','Clear all deliveries, contracts, credits, finishes, sprint gates and postmarks?')
    s=s.replace('Your original deliveries and saved progress remain.','D-pad down opens City jobs. RT accelerates without an energy limit; LT / B brakes. Your existing progress remains.')
    pattern=r'(<script type="importmap">)(.*?)(</script>)'
    m=re.search(pattern,s);data=json.loads(m.group(2))
    for p in ROOT.glob('*.mjs'):data['imports']['./'+p.name]='./'+p.name+'?v=0.7.0'
    s=s[:m.start(2)]+json.dumps(data,separators=(',',':'))+s[m.end(2):]
    return s
edit('index.html',html)
MARK.write_text(json.dumps({'version':'0.7.0','name':'Coastal Pulse','scope':'svgn-planet','camera':'standard right-stick yaw; independent inversion options','audio':'single transport; 4 mixer buses','contracts':102,'traffic':'arc-length continuous motion','boost':'unlimited 30 m/s; brake-controlled cruise','rendering':'fixed-step interpolation; spatially culled shells; one streaming chunk per update'},indent=2)+'\n')
print('Coastal Pulse integration materialized successfully.')
