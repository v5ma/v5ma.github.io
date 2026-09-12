/* Walkable rooms and cellar instances belong to existing buildings. Exterior
 * shells cut away only on entry; markers are real interaction coordinates. */
import {animatePerson} from './character-motion.mjs';
import * as T from './vendor/three.module.js';
import {Batch,unit,label,rand} from './art.mjs';
import {person} from './guild-art.mjs';
import {heightAt} from './model.mjs';
import {PEOPLE,CATS,OBJECTS,personAt,questStatus,QUESTS} from './life-core.mjs';
export function createTownLifeVisuals({scene,root,w,m,rider,bike,camera}){
 const world=new T.Group();world.name='Living town extension';root.add(world);const cellars=new T.Group();cellars.name='Below the same town';scene.add(cellars);cellars.visible=false;
 const baseBackground=scene.background,baseFog=scene.fog,belowBackground=new T.Color('#2c2520'),belowFog=new T.Fog('#2c2520',30,90);
 const people=[],cats=[],objects=[],rooms=[],cellarRooms=[],textLabels=[];
 const parentQuaternion=new T.Quaternion(),labelPosition=new T.Vector3();
 const wood='#9c724b',oak='#6a4c35',stone='#b5a383',gold='#ddb771',paper='#e8d7ae';
 function bookcase(b,x,z,y=0){b.box(x,y+1.1,z,2.6,2.2,.5,oak);for(let shelf=0;shelf<3;shelf++){b.box(x,y+.35+shelf*.65,z+.03,2.7,.10,.6,wood);for(let k=0;k<10;k++)b.box(x-1.1+k*.24,y+.62+shelf*.65,z+.3,.15,.35+rand(k+shelf*12)*.14,.25,['#b06345','#6e8173','#c2aa79'][k%3]);}}
 function table(b,x,z,y=0){b.box(x,y+.83,z,2,.16,1.2,wood);for(const a of[-.8,.8])for(const c of[-.43,.43])b.box(x+a,y+.4,z+c,.12,.8,.12,oak);b.box(x,y+.95,z,.75,.02,.5,paper);b.add(unit.cyl,x+.6,y+1.08,z,.08,.23,.08,'#b09c75');}
 function lamp(parent,x,y,z){const b=new Batch();b.box(x,y,z,.12,.4,.12,gold);b.ball(x,y+.25,z,.075,.12,.075,'#ffe8a4');b.finish(parent,m.light,'Lamplight');}
 function furnishings(room,basement=false){
  const g=new T.Group(),depth=basement?-5:0,baseY=heightAt(room.x,room.z)+depth;g.position.set(room.x,baseY,room.z);g.name=room.name+(basement?' basement':' interior');(basement?cellars:world).add(g);
  const b=new Batch(),trim=new Batch(),furniture=new Batch();b.box(0,.08,0,room.hx*2-.4,.16,room.hz*2-.4,basement?'#746c59':'#bc9565');
  for(let z=-room.hz+.5;z<room.hz;z+=.65)b.box(0,.17,z,room.hx*2-.5,.02,.022,basement?'#565648':'#816047');
  // Cutaway interior walls frame the room without hiding it from the player.
  for(const sign of[-1,1])b.box(0,.5,sign*(room.hz-.3),room.hx*2,.9,.3,basement?'#766e5c':'#dbcba4');b.box(room.side*(room.hx-.3),1.1,0,.3,2.2,room.hz*2,'#aa9578');
  b.box(0,.19,0,3.8,.025,5.5,room.kind==='hall'?'#797b96':room.kind==='inn'?'#ac6858':'#5c7d75');for(const x of[-1.76,1.76])b.box(x,.21,0,.08,.02,5.2,gold);
  table(furniture,0,room.hz-1.2);
  for(const x of[-room.hx+2,room.hx-2]){const holder=new T.Group(),shelf=new Batch();holder.name=room.id+' original bookcase '+x;holder.userData.cameraOccluder=true;holder.userData.replaceableBookcase=true;bookcase(shelf,x,-room.hz+1);shelf.finish(holder,m.trim,'Bookcase and books');g.add(holder);}
  if(room.kind==='apothecary')for(let i=0;i<12;i++){const x=-3+i%6*1.1,z=-room.hz+2+Math.floor(i/6)*.6;b.add(unit.cyl,x,.8,z,.17,.7,.17,['#638d79','#8b7d9c','#ae8952'][i%3]);}
  if(room.kind==='inn'){for(const z of[-2,2]){table(furniture,room.hx-2,z);for(const dz of[-.9,.9])b.add(unit.cyl,room.hx-2,.36,z+dz,.3,.7,.3,wood);}for(const x of[-room.hx+1,room.hx-1])b.add(unit.cyl,x,.68,room.hz-2,.62,1.35,.62,oak);}
  if(room.kind==='workshop'||room.kind==='smith'){for(let i=0;i<4;i++)b.add(unit.ring,-room.hx+1.2,.8+i*.06,i*1.7-2,.65,.65,.65,gold,0,Math.PI/2);b.box(room.hx-1.2,.7,1,1.3,1.4,1,'#666d65');}
  if(room.kind==='hall'){b.box(0,1.2,room.hz-2,3.4,.2,1.2,oak);b.box(0,1.55,room.hz-2.7,1,.95,.2,'#704e4a');label(g,'THE PEOPLE\nOF VINCI',room.side*(room.hx-.5),2.15,0,2.9,1.4,-room.side*Math.PI/2,'#68583f');}
  if(room.kind==='observatory'){b.rod([2,.2,0],[2,1.6,0],.08,wood);b.add(unit.cyl,2,1.6,0,.25,2.6,.25,gold,.6,0);b.add(unit.ring,-2,1.5,0,.9,.9,.9,'#80a9aa',.4,.2);}
  if(basement){b.add(unit.ring,0,2,room.hz-.5,1.2,1.2,1.2,gold);for(let k=0;k<3;k++)b.box(-2+k*2,.65,room.hz-1.5,.9,1.3,.9,'#8e7955');}
  b.finish(g,m.trim,'Room furniture, shelves and floor');furniture.finish(g,m.trim,'Replaceable workshop furniture');trim.finish(g,m.trim,'Small room details');for(const z of[-room.hz+1,room.hz-1])lamp(g,room.side*(room.hx-1),1.8,z);
  if(room.cellar){const sx=room.stairs.x-room.x,sz=room.stairs.z-room.z;const sb=new Batch();for(let k=0;k<5;k++)sb.box(sx,.25+k*.11,sz+k*.24,1.4,.15,.3,'#d3b78c');sb.finish(g,m.trim,'Marked basement stair');label(g,basement?'T / UPSTAIRS':'T / BASEMENT',sx,1.45,sz,1.5,.5,0,'#486563');}
  return g;
 }
 for(const room of w.rooms){const group=furnishings(room),shell=root.children.find(g=>g.userData.room===room.id);rooms.push({room,group,shell});if(room.cellar)cellarRooms.push({room,group:furnishings(room,true)});
  const plaque=label(world,room.name.toUpperCase()+'\nWALK IN',room.door.x, heightAt(room.door.x,room.door.z)+3.1,room.door.z,4.0,1.0,-room.side*Math.PI/2,'#596954');
  const threshold=new Batch();threshold.box(room.door.x,heightAt(room.door.x,room.door.z)+.13,room.door.z,1.6,.12,2.6,gold);threshold.finish(world,m.trim,'Open shop threshold');
 }
 for(const p of PEOPLE.filter(p=>!p.existing)){
  const model=person(m,p.enemy?'bandit':'apprentice'),g=model.root;const attire=new Batch();const tint=({ada:'#857194',beatrice:'#b68367',isabella:'#a96056',sofia:'#557e93',mayor:'#965b56',lucia:'#536f84',guard:'#536f84',luca:'#b68c4d',neri:'#8a7a60'})[p.id]||'#7c886b';
  attire.box(0,1.03,0,.49,.43,.38,tint);attire.box(0,1.28,.205,.39,.44,.055,tint);
  if(['ada','beatrice'].includes(p.id)){attire.box(0,1.05,.235,.33,.6,.04,'#e6dac0');attire.ball(0,1.92,-.02,.21,.055,.17,p.id==='ada'?'#a697b6':'#f1e5c9');}
  if(p.id==='mayor'){attire.box(0,1.1,-.245,.57,.85,.10,tint);attire.add(unit.ring,0,1.35,.255,.15,.15,.045,gold);}
  if(p.romance){attire.box(0,1.58,-.13,.25,.35,.12,p.id==='isabella'?'#614737':'#815938');}
  if(p.romance)attire.add(unit.cone,0,.75,0,.39,.75,.34,tint);if(p.id==='lucia'||p.id==='guard'||p.enemy){attire.box(0,1.3,.24,.3,.4,.04,'#d7bd82');attire.rod([.34,.3,0],[.34,2.2,0],.035,oak);}attire.finish(g,m.trim,p.name+' clothing');
  (p.inside?cellars:world).add(g);const tag=label(g,p.name+'\n'+(p.enemy?'T / TALK OR J / DEFEND':'T / TALK'),0,2.65,0,1.7,.64,0,'#385a58');textLabels.push(tag);people.push({p,model});
 }
 function catModel(p){const root=new T.Group(),b=new Batch();b.ball(0,.35,0,.21,.22,.46,p.color);b.ball(0,.48,.39,.21,.19,.20,p.color);for(const side of[-1,1]){b.add(unit.cone,side*.13,.68,.4,.11,.20,.11,p.color);b.ball(side*.09,.51,.56,.025,.035,.015,'#e4d78a');}b.ball(0,.43,.59,.055,.035,.03,'#b08f81');b.finish(root,m.trim,'Cat fur');const legs=[];for(const x of[-.14,.14])for(const z of[-.26,.25]){const mesh=new T.Mesh(new T.CylinderGeometry(.04,.05,.28,5),new T.MeshStandardMaterial({color:p.color}));mesh.position.set(x,.14,z);root.add(mesh);legs.push(mesh);}const tail=new T.Group(),tb=new Batch();tb.rod([0,.1,0],[0,.7,-.2],.04,p.color);tb.finish(tail,m.trim,'Cat tail');tail.position.set(0,.4,-.36);root.add(tail);return {root,legs,tail};}
 for(const p of CATS){const model=catModel(p);world.add(model.root);cats.push({p,model});}
 for(const o of OBJECTS){const g=new T.Group(),b=new Batch();g.position.set(o.x,heightAt(o.x,o.z)+(o.inside?-5:0),o.z);(o.inside?cellars:world).add(g);
  if(o.kind==='plant'){b.add(unit.cyl,0,.18,0,.28,.35,.28,'#986647');for(let i=0;i<4;i++){const x=Math.sin(i*2)*.2,z=Math.cos(i*2)*.2;b.rod([0,.2,0],[x,.7,z],.025,'#79976a');b.ball(x,.76,z,.13,.11,.13,o.id.includes('red')?'#c66766':o.id.includes('blue')?'#738bb0':'#d8b167');}}
  else if(o.kind==='meeting'){b.box(0,.55,0,2.5,.18,.9,wood);b.box(0,.95,-.36,2.5,.7,.12,oak);for(const x of[-1,1])b.box(x,.25,0,.15,.5,.7,oak);}
  else if(o.kind==='invention'){b.rod([0,.6,-1.2],[0,1.2,1.2],.1,wood);for(const side of[-1,1]){b.tri([0,1.2,0],[side*3.4,1.5,.8],[side*2,1,-1.2],paper);b.rod([0,1.2,0],[side*3.4,1.5,.8],.04,wood);}b.box(0,.3,0,1,.3,2.8,wood);}
  else{b.box(0,.55,0,1.1,1.1,.8,'#8f7857');b.box(0,1.13,0,1.2,.12,.9,gold);b.add(unit.ring,0,1.4,0,.32,.32,.32,o.kind==='hidden'?'#8dbedf':gold);}
  b.finish(g,m.trim,o.name);const tag=label(g,o.name+'\nT / INTERACT',0,1.95,0,2.2,.65,0,o.inside?'#473f50':'#436057');textLabels.push(tag);objects.push({o,g,tag});
 }
 // The old map ends here; two stone walls leave exactly the traversable gateway.
 const fort=new Batch();for(const sign of[-1,1]){fort.box(sign*78,heightAt(sign*78,407)+2.3,407,141.6,4.6,3,stone);for(let x=10;x<147;x+=8)fort.box(sign*x,heightAt(sign*x,407)+4.9,407,3.2,.8,3.2,paper);}fort.finish(world,m.wall,'Northern city walls');
 const gate=new T.Group();gate.position.set(0,heightAt(0,407),407);world.add(gate);const bars=new Batch();for(let x=-6.5;x<=6.5;x+=.6)bars.box(x,2.1,0,.17,4.2,.3,oak);for(const y of[1,3])bars.box(0,y,0,14,.18,.4,gold);bars.finish(gate,m.trim,'Quest-unlocked north gate');label(world,'NORTH GARDEN\nCHARTER + PUMP',0,heightAt(0,407)+5.8,407,7,1.6,Math.PI,'#556c59');
 const pool=new Batch();pool.add(unit.cyl,0,heightAt(0,481)+.22,481,6,.4,6,stone);pool.add(unit.cyl,0,heightAt(0,481)+.48,481,5.5,.1,5.5,'#65a8a8');pool.add(unit.cyl,0,heightAt(0,481)+1.5,481,.5,2.1,.5,gold);pool.finish(world,m.trim,'Conservatory fountain');
 for(const z of[445,510])for(const x of[-47,47]){const pergola=new Batch();for(const a of[-4,4])for(const b of[-2,2])pergola.rod([x+a,heightAt(x+a,z+b),z+b],[x+a,heightAt(x+a,z+b)+3.5,z+b],.14,oak);for(let a=-4;a<=4;a++)pergola.box(x+a,heightAt(x,z)+3.5,z,.16,.15,5,wood);pergola.finish(world,m.trim,'Garden pergola');}
 const ring=new T.Mesh(new T.TorusGeometry(1,.035,5,40),new T.MeshBasicMaterial({color:'#a6d7ff',transparent:true,opacity:.5}));ring.rotation.x=-Math.PI/2;scene.add(ring);
 const cargo=new T.Group(),cb=new Batch();for(const sign of[-1,1]){cb.box(sign*.44,.65,-.45,.45,.62,.8,'#a17b4c');cb.box(sign*.44,.98,-.45,.48,.08,.82,gold);}cb.finish(cargo,m.trim,'Cargo-cycle panniers');bike.root.add(cargo);
 const courier=new T.Group(),qb=new Batch();qb.rod([0,.8,-.4],[0,.95,.25],.048,'#ebc471');qb.add(unit.ring,0,.47,0,.2,.2,.2,gold,0,Math.PI/2);qb.finish(courier,m.trim,'Courier bicycle brass gearing');bike.root.add(courier);
 let current=null;
 function update(s,dt,room){current=room?.id||null;const below=!!s.life.inside;cellars.visible=below;scene.background=below?belowBackground:baseBackground;scene.fog=below?belowFog:baseFog;
  for(const r of rooms){if(r.shell)r.shell.visible=below?false:!(room?.id===r.room.id);r.group.visible=!s.doors?.level&&Math.hypot(s.x-r.room.x,s.z-r.room.z)<65;}for(const r of cellarRooms)r.group.visible=s.life.inside===r.room.id;
  for(const {p,model} of people){const point=personAt(p,s);animatePerson(model,s.time,{motion:p.id==='rocco'&&s.life.attackPending?'guard':Math.hypot(s.x-point.x,s.z-point.z)<5?'listen':['ada','bartolo','neri','sofia'].includes(p.id)?'work':'idle'});model.root.visible=!s.doors?.level&&(point.inside||null)===(s.life.inside||null);model.root.position.set(point.x,heightAt(point.x,point.z)+(p.inside?-5:0),point.z);model.root.rotation.y=Math.hypot(s.x-point.x,s.z-point.z)<8?Math.atan2(s.x-point.x,s.z-point.z):Math.PI;model.root.rotation.x=p.id==='rocco'&&s.life.flags.rocco?.25:0;model.root.rotation.z=p.id==='rocco'&&s.life.attackPending?-.17:0;}
  for(const {p,model}of cats){const following=p.id==='pippa'&&s.life.cat;const x=following?s.life.petX:p.x+Math.sin(s.time*.45+p.z)*.5,z=following?s.life.petZ:p.z+Math.cos(s.time*.4)*.4;model.root.position.set(x,heightAt(x,z),z);model.root.rotation.y=Math.atan2(s.x-x,s.z-z);model.tail.rotation.z=Math.sin(s.time*2)*.2;model.legs.forEach((l,i)=>l.rotation.x=Math.sin(s.time*7+i*Math.PI)*.22);}
  for(const {o,g,tag}of objects){g.visible=!s.doors?.level&&(o.inside||null)===(s.life.inside||null);if(o.kind==='hidden')g.visible=g.visible&&(s.life.aura>0||s.life.flags.ledger);tag.visible=Math.hypot(s.x-o.x,s.z-o.z)<18;}
  // Labels need camera orientation relative to their rotated parent, not an
  // absolute camera quaternion that turns a resident's name edge-on.
  for(const tag of textLabels){tag.parent.updateWorldMatrix(true,false);tag.parent.getWorldQuaternion(parentQuaternion);tag.quaternion.copy(parentQuaternion.invert().multiply(camera.quaternion));tag.getWorldPosition(labelPosition);tag.visible=Math.hypot(labelPosition.x-s.x,labelPosition.z-s.z)<18;}gate.position.y=heightAt(0,407)+(s.life.flags.garden?5:0);ring.visible=s.life.aura>0;ring.position.set(s.x,heightAt(s.x,s.z)+(below?-5:0)+.25,s.z);ring.scale.setScalar(2+Math.sin(s.time*2)*.15);cargo.visible=s.life.bike==='cargo';courier.visible=s.life.bike==='courier';
 }
 return {update,inspect:()=>({room:current,below:cellars.visible,rooms:rooms.length,basements:cellarRooms.length,characters:people.length+2,cats:cats.length})};
}
