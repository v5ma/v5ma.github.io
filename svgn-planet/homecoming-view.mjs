import * as T from './vendor/three.module.js';
import {street,point,tangent,distance} from './world.mjs';
import {mesh,anchor,batchStatic,faceSurface} from './neighborhood.mjs';
import {road} from './art.mjs';
import {storyStatus,HOST} from './homecoming.mjs';
import {roundedBox,coastalMaterial} from './coastal-materials.mjs';
/* One hand-authored plaza. All third-party art remains local and untouched. */
export function createHomecomingPlaza(root,courier){
 const group=new T.Group();group.name='Homecoming / Common Ground plaza';root.add(group);
 const center=street(-17,10),stat=anchor(group,center),gardens=new T.Group(),workshop=new T.Group(),litter=new T.Group(),tables=new T.Group(),photos=new T.Group(),lights=new T.Group();stat.add(gardens,workshop,litter,tables,photos,lights);
 const p=(kind,color,pos,size,parent=stat,rotation)=>mesh(parent,kind,color,pos,size,rotation);
 // Wide, open approaches and low planting beds. No solid roof over the rider.
 const path=Array.from({length:16},(_,i)=>street(-8-i*.6,3.7+i*.42));road(group,path,2.2,'#c8c2b3',.24);
 for(let z=-5;z<5;z+=1.2){const n=street(-17-z,10);const line=Array.from({length:15},(_,i)=>street(-17-z,4.5+i*.8));road(group,line,1.18,(Math.round(z*10)%3)?'#c3bbac':'#d6cbbb',.23);}
 const wood='#99704e',cream='#e8e0c9',ink='#31494e';
 for(const x of[-4,4])for(const z of[-3.8,3.8])p('box',wood,[x,1.85,z],[.16,3.7,.16]);
 for(const z of[-3.8,3.8])p('box',wood,[0,3.71,z],[8.7,.18,.2]);
 for(let x=-4.2;x<=4.3;x+=.5)p('box',cream,[x,3.9,0],[.12,.12,8.3]);
 for(const x of[-3.7,3.7]){p('box',wood,[x,.7,1],[.65,.13,2.4]);p('box',cream,[x,.37,1],[.48,.62,.14]);p('box',wood,[x,1.16,1],[.13,.72,2.4]);}
 p('box',ink,[1,1,-3.05],[3.3,1.75,.70]);p('box',cream,[1,1.91,-3.05],[3.6,.16,.95]);
 for(const x of[0,.4,.8,1.2])p('cylinder','#e9e3d2',[x,2.10,-3.1],[.09,.25,.09]);p('box','#696f62',[2,2.2,-3.06],[.56,.53,.53]);
 for(let i=0;i<6;i++){p('box','#b4a187',[(i%3-1)*1.25,.35,Math.floor(i/3)*2-1],[.45,.55,.35],litter,[0,i*.6,.17]);}
 p('box',wood,[0,.88,.6],[2.4,.14,1.25],tables);for(const x of[-.85,.85])p('box',ink,[x,.45,.6],[.12,.86,.8],tables);
 for(const x of[-1.8,1.8])p('cylinder',wood,[x,.54,.6],[.32,.18,.32],tables);
 for(const x of[-2.6,2.6])for(const z of[-2,2.9]){p('box',wood,[x,.32,z],[1.4,.54,.85],gardens);p('box','#374b38',[x,.59,z],[1.27,.03,.74],gardens);for(let i=0;i<7;i++){p('cylinder','#648368',[x+(i-3)*.15,.85,z],[.025,.6,.025],gardens);p('ball',i%2?'#dea56e':'#9db9a4',[x+(i-3)*.15,1.12,z],[.12,.13,.13],gardens);}}
 for(const x of[-2,2]){p('box',ink,[x,.1,2.3],[1.35,.13,.65],workshop);p('cylinder',wood,[x,.9,2.3],[.06,1.6,.06],workshop);p('box',cream,[x,1.55,2.3],[1.3,.1,.5],workshop);for(let i=0;i<3;i++)p('box','#b2bfc0',[x-.4+i*.4,1.65,2.3],[.09,.14,.45],workshop);}
 for(let i=0;i<9;i++){const x=-3.4+i*.84,z=-3.75;p('cylinder',ink,[x,3.48,z],[.015,.55,.015]);const bulb=p('ball','#ffe5aa',[x,3.12,z],[.07,.10,.07],lights);bulb.material=new T.MeshStandardMaterial({color:'#ffecb7',emissive:'#e9a64e',emissiveIntensity:.9,roughness:.5});}
 for(let i=0;i<3;i++){p('box',cream,[-2.6+i*.77,1.96,-3.77],[.67,.45,.05],photos);p('box',['#64918c','#c39c6b','#9fabb9'][i],[-2.6+i*.77,1.96,-3.73],[.55,.34,.015],photos);}
 // Named guide with readable face, clothing, and a hand wave, not a marker cube.
 const maya=anchor(group,HOST.n,.12);faceSurface(maya,HOST.n,tangent([-1,0,0],HOST.n));
 p('round','#436d73',[0,1.18,0],[.26,.35,.20],maya);p('box','#dcc7a4',[0,.85,0],[.39,.23,.27],maya);
 for(const side of[-1,1]){p('round','#344951',[side*.12,.48,0],[.09,.37,.1],maya);p('round','#ebe2c9',[side*.12,.13,.065],[.11,.1,.19],maya);}
 p('round','#b98563',[0,1.65,0],[.19,.23,.19],maya);p('round','#3a3430',[0,1.80,-.015],[.205,.15,.20],maya);
 for(const x of[-.072,.072]){p('ball','#e8ddc7',[x,1.67,.168],[.042,.023,.015],maya);p('ball','#263a3f',[x,1.67,.184],[.014,.017,.006],maya);}p('round','#a86854',[0,1.53,.166],[.055,.009,.008],maya);
 const arm=new T.Group();arm.position.set(-.29,1.39,0);maya.add(arm);p('round','#436d73',[0,-.18,0],[.085,.22,.085],arm);p('round','#b98563',[0,-.43,0],[.063,.18,.068],arm);
 p('round','#436d73',[.3,1.2,0],[.085,.26,.085],maya);p('ball','#b98563',[.3,.95,0],[.067,.07,.067],maya);
 const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d'),tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(3.2,1),new T.MeshStandardMaterial({map:tex,roughness:.85,side:T.DoubleSide}));sign.position.set(0,2.56,3.83);stat.add(sign);
 const plaque=document.createElement('canvas');plaque.width=256;plaque.height=80;const q=plaque.getContext('2d');q.fillStyle='#244653';q.fillRect(0,0,256,80);q.fillStyle='#fff0ca';q.textAlign='center';q.font='600 24px system-ui';q.fillText('MAYA / X TO TALK',128,49);const labelTex=new T.CanvasTexture(plaque);labelTex.colorSpace=T.SRGBColorSpace;const label=new T.Mesh(new T.PlaneGeometry(1.8,.56),new T.MeshBasicMaterial({map:labelTex,side:T.DoubleSide}));label.position.set(0,2.3,0);maya.add(label);
 // Foreground courier details retain the original skeleton, scale and controls.
 for(const x of[-.083,.083]){mesh(courier.body,'ball','#ede3cb',[x,1.72,-.225],[.049,.026,.013]);mesh(courier.body,'ball','#253b46',[x,1.72,-.238],[.020,.018,.005]);}
 mesh(courier.body,'round','#a76755',[0,1.60,-.224],[.056,.01,.008]);
 for(const x of[-.245,.245])mesh(courier.body,'box','#b17e46',[x,1.28,.442],[.036,.39,.025]);
 for(let i=0;i<6;i++)mesh(courier.body,'box','#fff1cc',[-.17+i*.064,1.10,.44],[.035,.04,.028]);
 const bikeLight=mesh(courier.bicycle,'ball','#d95d49',[0,1.02,.46],[.06,.035,.025]);bikeLight.material=new T.MeshStandardMaterial({color:'#d74d3c',emissive:'#9b211a',emissiveIntensity:.3});
 const architecture=new T.Group();for(const child of [...stat.children])if(child.isMesh){stat.remove(child);architecture.add(child);}stat.add(architecture);batchStatic(architecture);
 const personStatic=new T.Group();for(const child of [...maya.children])if(child.isMesh&&child!==label){maya.remove(child);personStatic.add(child);}maya.add(personStatic);batchStatic(personStatic);
 batchStatic(tables);batchStatic(gardens);batchStatic(workshop);batchStatic(litter);batchStatic(photos);batchStatic(lights);
 let key='',lastFlags={};
 return {update(dt,s,camera,overview){group.visible=!overview&&distance(s.n,center)<150;if(!group.visible)return;const h=storyStatus(s),flags={welcome:h.accepted,clean:h.done.includes('care'),signals:h.done.includes('signals'),photos:h.done.includes('postcards'),complete:h.complete,project:h.project};lastFlags=flags;const next=JSON.stringify(flags);if(next!==key){key=next;gardens.visible=flags.clean&&h.project==='garden';workshop.visible=flags.clean&&h.project==='workshop';litter.visible=!flags.clean;tables.visible=flags.clean;lights.visible=flags.signals;photos.visible=flags.photos;ctx.fillStyle='#244653';ctx.fillRect(0,0,512,160);ctx.textAlign='center';ctx.fillStyle='#f3dfb5';ctx.font='600 36px system-ui';ctx.fillText(flags.complete?'WELCOME HOME':'COMMON GROUND',256,62);ctx.font='23px system-ui';ctx.fillText(flags.complete?'A place we made together.':'Meet Maya. Make this block your own.',256,116);tex.needsUpdate=true;}
 arm.rotation.z=distance(s.n,HOST.n)<12?-.7+Math.sin(s.time*3)*.12:.08;label.quaternion.copy(camera.quaternion).premultiply(maya.quaternion.clone().invert());label.visible=distance(s.n,HOST.n)<30;},inspect:()=>({name:'Common Ground',authoredPlaza:true,batchedArchitecture:true,flags:{...lastFlags},host:[...HOST.n]})};
}
