import * as T from './vendor/three.module.js';
export function actor(scene,mesh,color,enemy=false){const root=new T.Group();scene.add(root);const rig=new T.Group();root.add(rig);
 const torso=mesh('capsule',[.44,.39,.30],color);torso.position.y=1.12;rig.add(torso);
 const coat=mesh('box',[.53,.31,.40],color);coat.position.y=.79;rig.add(coat);
 const hood=mesh('ball',[.255,.295,.235],color);hood.position.set(0,1.64,.035);rig.add(hood);
 const face=mesh('ball',[.175,.205,.13],0xa69475);face.position.set(0,1.63,-.13);rig.add(face);
 const mask=mesh('box',[.33,.12,.11],0x303f3e);mask.position.set(0,1.57,-.24);rig.add(mask);
 const eyes=mesh('box',[.30,.065,.015],0x9aa997,'metal');eyes.position.set(0,1.705,-.231);rig.add(eyes);
 const pack=mesh('box',[.43,.55,.25],enemy?0x6a6150:0x5b7164);pack.position.set(0,1.04,.27);rig.add(pack);
 for(const side of [-1,1]){const strap=mesh('box',[.055,.62,.032],0x2d3d34);strap.position.set(side*.16,1.12,-.15);strap.rotation.z=side*.08;rig.add(strap);}
 const limbs=[];for(const [side,arm]of[[-1,false],[1,false],[-1,true],[1,true]]){const pivot=new T.Group();pivot.position.set(side*(arm?.30:.14),arm?1.30:.73,0);rig.add(pivot);const upper=mesh('capsule',[arm?.14:.19,arm?.21:.24,arm?.14:.19],arm?color:0x34493f);upper.position.y=-.17;pivot.add(upper);const knee=new T.Group();knee.position.y=arm?-.33:-.39;pivot.add(knee);const lower=mesh('capsule',[arm?.12:.16,.18,arm?.12:.16],arm?color:0x3b4c41);lower.position.y=-.16;knee.add(lower);const end=mesh('box',arm?[.13,.15,.13]:[.21,.14,.34],0x273533);end.position.set(0,arm?-.34:-.31,arm?0:-.06);knee.add(end);limbs.push({pivot,knee,side,arm});}
 const gun=mesh('box',[.10,.13,.40],0x384445,'metal');gun.position.set(.30,1.1,-.54);rig.add(gun);const barrel=mesh('cyl',[.028,.3,.028],0x777b69,'metal');barrel.rotation.x=Math.PI/2;barrel.position.set(.30,1.13,-.78);rig.add(barrel);
 return {root,rig,limbs,gun,barrel,coat,torso,hood,face,mask,eyes,pack,down:false};
}
export function pose(a,p,time,enemy=false){const stance=p.stance||'stand',moving=enemy?(p.speed||0):p.speed;const rate=time*(moving>3?10:7),prone=stance==='prone',crouch=stance==='crouch';a.root.position.set(p.x,prone?.28:0,p.z);const dt=a.lastTime===undefined?.016:Math.min(.05,Math.max(0,time-a.lastTime));a.lastTime=time;const angle=Math.atan2(Math.sin(p.yaw-a.root.rotation.y),Math.cos(p.yaw-a.root.rotation.y));a.root.rotation.y+=angle*(1-Math.exp(-dt*16));
 a.rig.rotation.set(prone?-Math.PI/2:0,0,0);a.rig.position.set(0,crouch?-.36:0,prone?.8:0);if(p.vault)a.rig.position.y+=Math.sin(Math.PI*Math.min(1,p.vault.t/p.vault.duration))*.95;
 for(const l of a.limbs){const step=Math.sin(rate+(l.side>0?Math.PI:0));l.pivot.rotation.x=prone?(l.arm?-.4:.1):(crouch&&!l.arm?-1:0)+(moving>.1?step*(l.arm?.35:.55):0);l.knee.rotation.x=crouch&&!l.arm?1.8:(!l.arm?Math.max(0,-step)*.5:.1);if(p.aim&&l.arm){l.pivot.rotation.x=-1.18;l.knee.rotation.x=-.35;}if(prone){l.pivot.rotation.x+=step*.1;l.knee.rotation.x=l.arm?-.5:.1;}}
 a.gun.visible=a.barrel.visible=!!p.aim||enemy;if(p.hp<=0){a.rig.rotation.z=-1.5;a.rig.position.y=.05;a.root.position.y=0;a.gun.visible=a.barrel.visible=false;}
}
