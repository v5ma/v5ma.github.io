/* Original SVGN cycle detailing. Reuses the licensed room Workbench already in
 * the asset register; no external requests or unlicensed new model downloads. */
import * as T from './vendor/three.module.js';
import {Batch,bicycle,label} from './art.mjs';
import {heightAt} from './model.mjs';
import {FINISHES,ROAD_GATES} from './cycle-core.mjs';
function detailedFrame(model,m){
 const old=model.root.getObjectByName('Courier bicycle frame');if(old)old.visible=false;
 const paint=new T.MeshStandardMaterial({vertexColors:true,color:FINISHES.terracotta.color,roughness:.35,metalness:.24});
 const frame=new Batch(),metal=new Batch(),leather=new Batch();
 const edges=[[[0,.43,-.72],[0,.91,-.12]],[[0,.91,-.12],[0,.48,.1]],[[0,.48,.1],[0,.43,-.72]],[[0,.91,-.12],[0,1.02,.5]],[[0,1.02,.5],[0,.48,.1]]];
 for(const [a,b]of edges)frame.rod(a,b,.039,'#ffffff');
 for(const sign of [-1,1]){frame.rod([sign*.045,1.01,.50],[sign*.05,.43,.72],.023,'#ffffff');metal.rod([sign*.07,.48,.1],[sign*.07,.43,-.72],.012,'#b2a879');metal.rod([sign*.16,.97,-.72],[sign*.16,.46,-.72],.014,'#af9671');}
 for(const p of[[0,.91,-.12],[0,.48,.1],[0,1.02,.5]])metal.ball(...p,.048,.046,.046,'#cfb56d');
 metal.rod([0,.88,-.12],[0,1.05,-.16],.026,'#c6b36f');metal.rod([0,1.0,.50],[0,1.28,.54],.026,'#b8c3b6');
 const grips=new Batch();for(const sign of[-1,1]){metal.rod([0,1.28,.54],[sign*.25,1.29,.59],.022,'#bcba93');metal.rod([sign*.25,1.29,.59],[sign*.32,1.25,.51],.023,'#bcba93');grips.rod([sign*.26,1.28,.58],[sign*.32,1.25,.48],.028,'#574635');}
 const seatShape=new T.Shape();seatShape.moveTo(-.13,-.20);seatShape.quadraticCurveTo(-.18,-.06,-.10,.12);seatShape.lineTo(0,.22);seatShape.lineTo(.10,.12);seatShape.quadraticCurveTo(.18,-.06,.13,-.20);seatShape.closePath();
 const seat=new T.Mesh(new T.ExtrudeGeometry(seatShape,{depth:.045,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.012}),new T.MeshStandardMaterial({color:'#624831',roughness:.82}));seat.rotation.x=Math.PI/2;seat.position.set(0,1.08,-.2);model.root.add(seat);
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2;leather.ball(Math.sin(a)*.12,1.087,-.2+Math.cos(a)*.17,.007,.006,.007,'#dcc39b');}
 leather.box(0,.97,-.73,.44,.30,.35,'#af8551');leather.box(0,1.14,-.73,.46,.055,.38,'#c4a269');for(const x of[-.15,.15])leather.box(x,1,-.92,.045,.30,.018,'#68513b');
 const crank=new T.Group();crank.position.set(.05,.48,.10);model.root.add(crank);const gear=new Batch();gear.add(new T.TorusGeometry(.135,.018,5,24),0,0,0,1,1,1,'#c0ac6d',0,Math.PI/2);for(let i=0;i<5;i++)gear.rod([0,0,0],[0,Math.cos(i*1.256)*.13,Math.sin(i*1.256)*.13],.01,'#c0ac6d');for(const sign of[-1,1]){gear.rod([0,0,0],[sign*.08,sign*.15,0],.012,'#bdbe9a');gear.box(sign*.12,sign*.15,0,.12,.035,.09,'#4c5144');}gear.finish(crank,m.metal,'Crank, pedals and chainring');
 const lever=new T.Group(),brake=new Batch();lever.position.set(.28,1.27,.54);brake.rod([0,0,0],[-.025,-.07,-.12],.013,'#d1c49d');brake.finish(lever,m.metal,'Long-pull brake lever');model.root.add(lever);
 frame.finish(model.root,paint,'Enamel cycle frame');metal.finish(model.root,m.metal,'Brass lugs, chain stays and rear rack');leather.finish(model.root,m.trim,'Leather saddle stitching and mail satchel');grips.finish(model.root,m.trim,'Wrapped handlebar grips');
 let current='';return {update(s){if(current!==s.cycle.finish){paint.color.set(FINISHES[s.cycle.finish].color);current=s.cycle.finish;}lever.visible=s.cycle.brake==='lever';crank.rotation.x=-s.distance/.17;},inspect:()=>({finish:current,brakeLever:lever.visible})};
}
export function createCycleVisuals({scene,world,m,bike,streetArt}){
 const riderDetail=detailedFrame(bike,m),display=bicycle(m),displayDetail=detailedFrame(display,m),stand=new T.Group();stand.position.set(-21,heightAt(-24.5,215)+.2,211);stand.rotation.y=Math.PI/2;world.add(stand);display.root.position.y=.8;display.root.scale.setScalar(.76);stand.add(display.root);
 const pole=new Batch();pole.rod([0,0,0],[0,1.2,0],.055,'#82694d');for(const side of[-1,1])pole.rod([0,.15,0],[side*.6,.06,.5],.045,'#82694d');pole.finish(stand,m.trim,'Cycle workstand');
 label(stand,'BARTOLO / ROAD TEST\nNEARBY: FIT YOUR CYCLE',0,2.7,0,2.8,.7,0,'#4b6757');
 const group=new T.Group();group.name='Optional bicycle test markers';scene.add(group);const gates=[];
 for(let i=0;i<ROAD_GATES.length;i++){const p=ROAD_GATES[i],g=new T.Group();g.position.set(p.x,heightAt(p.x,p.z)+.12,p.z);group.add(g);const mat=new T.MeshBasicMaterial({color:i===4?'#dfb967':'#9fd4b9',transparent:true,opacity:.8});const ring=new T.Mesh(new T.TorusGeometry(p.radius,.045,5,40),mat);ring.rotation.x=-Math.PI/2;g.add(ring);const post=new Batch();for(const sign of[-1,1]){post.rod([sign*p.radius,0,0],[sign*p.radius,1.55,0],.025,'#a49770');post.tri([sign*p.radius,1.5,0],[sign*(p.radius-.8),1.3,0],[sign*p.radius,1,0],i===4?'#c8a66d':'#729c89');}post.finish(g,m.trim,'Opt-in road test pennants');gates.push({g,mat});}
 let plaque=null;
 return {update(s){riderDetail.update(s);displayDetail.update(s);stand.visible=!s.life.inside&&Math.hypot(s.x+21,s.z-211)<42;
  if(!plaque){plaque=streetArt.cloneAsset('props/Scroll_1');if(plaque){plaque.scale.setScalar(.65);plaque.position.set(-.6,.2,0);stand.add(plaque);}}
  const active=s.cycle.active;group.visible=!!active&&!s.life.inside;gates.forEach(({g,mat},i)=>{g.visible=!!active&&i>=active.gate;mat.opacity=active?.gate===i?.9:.25;});
 },inspect:()=>({frame:riderDetail.inspect(),workstandVisible:stand.visible,roadGates:ROAD_GATES.length,activeGates:group.visible})};
}
