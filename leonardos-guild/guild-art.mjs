/* Original alternate-history Renaissance art. No commercial game assets.
 * Mesh footprints follow the retained city collision model. */
import * as T from './vendor/three.module.js';
import {Batch,unit,label,rand,person as cityPerson} from './art.mjs';
import {heightAt} from './model.mjs';
export function house(parent,h,m){
 const group=new T.Group();group.position.set(h.x,heightAt(h.x,h.z),h.z);group.rotation.y=h.side<0?Math.PI/2:-Math.PI/2;parent.add(group);
 const wall=new Batch(),trim=new Batch(),roof=new Batch(),windows=new Batch(),w=h.d,d=h.w,ht=7.5+h.kind*.6;
 const plaster=['#e4c891','#c7b78c','#dcaa82','#e1d4aa','#bfb88e'][h.kind];
 wall.box(0,ht/2,0,w,ht,d,plaster);trim.box(0,.7,0,w+.3,1.4,d+.3,'#a19b7d');trim.box(0,4.2,0,w+.45,.24,d+.4,'#e9d6ae');
 for(const x of[-w/2+.25,w/2-.25])for(let y=1.8;y<ht;y+=.85)trim.box(x,y,d/2+.08,.65,.67,.22,'#cbbd98');
 const ridge=ht+2.6;for(const side of[-1,1]){roof.tri([side*(w/2+.5),ht,d/2+.5],[0,ridge,d/2+.5],[0,ridge,-d/2-.5],'#a35235');roof.tri([side*(w/2+.5),ht,d/2+.5],[0,ridge,-d/2-.5],[side*(w/2+.5),ht,-d/2-.5],'#bd7047');for(let x=0;x<=w/2;x+=.75){const y=ht+2.6*(1-x/(w/2+.5));trim.rod([side*x,y+.05,-d/2-.45],[side*x,y+.05,d/2+.45],.06,'#d09362');}}
 wall.tri([-w/2,ht,d/2],[w/2,ht,d/2],[0,ridge,d/2],plaster);wall.tri([w/2,ht,-d/2],[-w/2,ht,-d/2],[0,ridge,-d/2],plaster);
 for(const x of[-w*.31,w*.31])for(const y of[2.7,6.2]){trim.box(x,y,d/2+.06,2.4,2.65,.16,'#ead8b0');windows.box(x,y,d/2+.17,1.9,2.15,.07,'#254d4b');trim.box(x,y,d/2+.23,.08,2.2,.06,'#8b7b59');for(const side of[-1,1]){trim.box(x+side*1.22,y,d/2+.23,.43,2.3,.13,'#517064');for(let k=-4;k<=4;k++)trim.box(x+side*1.22,y+k*.22,d/2+.31,.44,.08,.05,'#729079');}}
 // Oak door with a curved stone surround; actual entry interaction is outside.
 trim.box(0,1.45,d/2+.14,1.85,2.9,.24,'#624b31');for(let k=0;k<9;k++){const a=Math.PI*k/8;trim.box(Math.cos(a)*1.13,2.63+Math.sin(a)*1.13,d/2+.24,.43,.44,.3,'#dac69c',0,0,a);}
 trim.ball(.62,1.42,d/2+.31,.08,.08,.08,'#cca652');trim.box(0,.15,d/2+.7,2.7,.3,1.25,'#b9ae8b');
 if(h.kind%2===0){trim.box(0,5.07,d/2+.75,4.5,.24,1.5,'#afa181');for(let x=-2;x<=2;x+=.55)trim.rod([x,5.18,d/2+1.3],[x,6,d/2+1.3],.04,'#354b44');trim.rod([-2.1,6,d/2+1.3],[2.1,6,d/2+1.3],.045,'#354b44');}
 else{for(let k=-3;k<=3;k++)roof.box(k*.65,3.45,d/2+1.1,.65,.1,2.4,k%2?'#a6553c':'#e7c593',0,.12);trim.rod([-2.1,3.45,d/2+.3],[-2.1,3.25,d/2+2],.05,'#7f653d');}
 trim.box(w*.3,ht+1.8,-1,1.1,3,1,'#ac8060');trim.box(w*.3,ht+3.3,-1,1.4,.3,1.3,'#d3bda0');
 wall.finish(group,m.wall,'Renaissance plaster and masonry');roof.finish(group,m.roof,'Terracotta roof tiles');trim.finish(group,m.trim,'Stone arches, oak doors and shutters');windows.finish(group,m.glass,'Deep recessed windows');return group;
}
export function person(m,kind='apprentice'){
 const base=cityPerson(m),b=new Batch();
 // Soft cap, tunic hem, leather belt and a satchel remain readable while riding.
 b.box(0,1.05,0,.47,.20,.37,kind==='bandit'?'#83553e':'#566a4c');b.box(0,1.17,0,.48,.07,.39,'#65452d');b.box(0,1.19,.215,.11,.11,.025,'#d8b660');b.ball(0,1.98,-.015,.23,.09,.22,kind==='master'?'#56483c':'#775946');
 b.finish(base.root,m.trim,'Renaissance cap, tunic and belt');return base;
}
export function car(m,tint='#976b43'){
 const root=new T.Group(),b=new Batch(),wheels=[];
 b.box(0,.71,0,1.8,.22,3.8,'#7d5737');for(let z=-1.7;z<1.8;z+=.32)b.box(0,.86,z,1.7,.09,.27,'#bd925c');
 for(const x of[-.83,.83]){b.box(x,1.16,0,.13,.55,3.8,'#a27847');b.box(x,1.52,0,.14,.13,3.9,'#d1ad74');for(let z=-1.7;z<=1.7;z+=.85)b.box(x,1.32,z,.14,.75,.14,'#755334');}
 b.box(0,1.1,.98,1.4,.13,.55,'#b68c53');b.rod([0,.78,1.8],[0,1.45,1.55],.05,'#6c6550');b.rod([-.38,1.45,1.55],[.38,1.45,1.55],.045,'#bdab75');
 b.box(0,1.15,-.6,.95,.46,1.1,'#d0b482');b.rod([-.5,1.44,-.6],[.5,1.44,-.6],.06,'#766744');b.finish(root,m.trim,'Pedal carriage and wooden freight bed');
 for(const x of[-.99,.99])for(const z of[-1.28,1.27]){const g=new T.Group();g.position.set(x,.46,z);root.add(g);const t=new Batch();t.add(unit.ring,0,0,0,.43,.43,.43,'#604731',0,Math.PI/2);for(let i=0;i<10;i++)t.rod([0,0,0],[0,Math.cos(i*Math.PI/5)*.39,Math.sin(i*Math.PI/5)*.39],.023,'#ba925b');t.add(unit.cyl,0,0,0,.11,.25,.11,'#9d8a59',0,0,Math.PI/2);t.finish(g,m.trim,'Wooden wagon wheel');wheels.push(g);}
 return {root,wheels};
}
export function dressGuild(root,w,m){
 const b=new Batch(),stone=new Batch(),figures={};
 // The workshop and market are original places at the existing interaction coordinates.
 const master=person(m,'master');master.root.position.set(-10,heightAt(-10,2),2);master.root.rotation.y=Math.PI/2;root.add(master.root);const beard=new Batch();beard.ball(0,1.57,.14,.14,.22,.10,'#d9d3b6');beard.finish(master.root,m.trim,'Leonardo’s beard');figures.master=master;
 label(root,'LEONARDO\nWORKSHOP',-11.6,heightAt(-15,1)+3.2,1,3.8,1.6,Math.PI/2,'#735236');
 label(root,'LETTERS / REPAIRS',-11.55,heightAt(-15,1)+1,1,4,.65,Math.PI/2,'#735236');
 const sy=heightAt(16,170);b.box(16,sy+1,170,3.5,1,5,'#987344');for(let k=0;k<6;k++)b.box(16,sy+3.3,167.5+k,5.2,.13,1,k%2?'#e2c88c':'#7c5540',0,0,.07);
 for(const x of[14,18])for(const z of[167.7,172.3])b.rod([x,sy,z],[x,sy+3.3,z],.07,'#8e6b44');
 for(let i=0;i<8;i++)b.ball(14.7+i%4*.7,sy+1.75,168.5+Math.floor(i/4)*2,.25,.22,.3,i%2?'#b46740':'#a2a053');
 const merchant=person(m);merchant.root.position.set(17,sy,170);root.add(merchant.root);label(root,'ARTISANS\nF: TRADE',12.6,sy+3.1,170,2.8,1.2,Math.PI/2,'#566747');
 // Workshop experimental aerial screw: scenery, not an advertised usable vehicle.
 const yy=heightAt(-18,-8);b.add(unit.cyl,-18,yy+2.1,-8,.11,4.2,.11,'#785b38');for(let i=0;i<7;i++){const a=i/7*Math.PI*2;b.rod([-18,yy+2,-8],[-18+Math.cos(a)*2.7,yy+3+i*.12,-8+Math.sin(a)*2.7],.055,'#a48551');stone.tri([-18,yy+2.5,-8],[-18+Math.cos(a)*2.7,yy+3+i*.12,-8+Math.sin(a)*2.7],[-18+Math.cos(a+.8)*2.7,yy+3.1+i*.12,-8+Math.sin(a+.8)*2.7],'#ece0b7');}
 const wheel=new T.Group();wheel.position.set(14,heightAt(14,190)+2.7,190);root.add(wheel);const wb=new Batch();wb.add(unit.ring,0,0,0,2.4,2.4,2.4,'#967043',0,Math.PI/2);for(let i=0;i<12;i++){const a=i/6*Math.PI;wb.rod([0,0,0],[0,Math.cos(a)*2.4,Math.sin(a)*2.4],.085,'#765334');wb.box(0,Math.cos(a)*2.4,Math.sin(a)*2.4,1,.3,.7,'#b39257',a,0,0);}wb.finish(wheel,m.trim,'Operable waterwheel');figures.wheel=wheel;
 const guard=person(m,'bandit');guard.root.position.set(w.bandit.x,heightAt(w.bandit.x,w.bandit.z),w.bandit.z);guard.root.rotation.y=Math.PI;root.add(guard.root);const stick=new Batch();stick.rod([.34,.4,.2],[.34,2.1,.2],.045,'#9f7b4e');stick.finish(guard.root,m.trim,'Guard practice staff');figures.guard=guard;
 // Readable silhouette landmarks, not modern office towers.
 for(const [x,z,height]of [[-95,126,22],[115,265,30],[-105,360,26]]){const y=heightAt(x,z);stone.box(x,y+height/2,z,6,height,6,'#c1ac7f');stone.box(x,y+height-2,z,7.2,2,7.2,'#dccaa2');stone.add(unit.cone,x,y+height+2,z,5.3,5,5.3,'#93623f',0,Math.PI/4);for(const dx of[-1.3,1.3])stone.box(x+dx,y+height-4,z-3.03,1.1,2,.1,'#475341');}
 for(let z=10;z<400;z+=48){const x=-11.5,y=heightAt(x,z);b.rod([x,y,z],[x,y+3.8,z],.065,'#4d5c4c');b.box(x,y+3.75,z,.52,.72,.52,'#e3bb67');b.add(unit.cone,x,y+4.25,z,.43,.35,.43,'#716044',0,Math.PI/4);}
 b.finish(root,m.trim,'Market awnings, lanterns and workshop machines');stone.finish(root,m.roof,'Belltowers and canvas experimental screw');
 return {update(s,dt){wheel.rotation.x+=s.relay?dt*.8:0;guard.root.visible=true;guard.root.rotation.x=s.defeated?.55:0;guard.root.rotation.z=s.banditPhase==='windup'?-.2:0;if(!s.defeated)guard.root.rotation.y=Math.atan2(s.x-w.bandit.x,s.z-w.bandit.z);},figures};
}
