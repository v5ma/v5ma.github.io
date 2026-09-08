/* Real CC0 glTF artwork, shared materials, batched static facades. The original
 * shells remain a fallback until the complete selected art set is available.
 * No collisions, story state, camera controls or vehicle physics are replaced. */
import * as T from './vendor/three.module.js';
import {selectFacades,makeMaterialTiers,windowBacking} from './art-quality.mjs';
import {batchStatic} from './art-batch.mjs';
import {heightAt} from './model.mjs';
import {label,Batch} from './art.mjs';
import {person} from './guild-art.mjs';
import {STREET_SITES,STREET_JOBS,eligibleAt,available} from './street-core.mjs';
export function createStreetArt({scene,root,w,m,camera}){
 const group=new T.Group();group.name='Street-life objects';scene.add(group);const markers=[],people=[],objects=[],lamps=[],rooms=[],outcomes=[];
 const status={ready:false,failed:false,models:0,instances:0,facades:0,bytes:0,message:'Loading curated CC0 artwork...'};
 const badge=document.createElement('div');badge.id='art-status';badge.textContent=status.message;document.body.append(badge);
 const materialBank=new Map(),templates=new Map();let built=false;const replacements=[],added=[],facadeLevels=[];let currentQuality='high',detailPoint={x:2,z:-6};const materialTiers=new Map();
 const glazing=new T.MeshStandardMaterial({name:'Recessed window backing',color:'#264945',roughness:.55,metalness:.1,side:T.DoubleSide});
 const ringMat=new T.MeshBasicMaterial({color:'#e9b466',transparent:true,opacity:.72,depthWrite:false});
 for(const site of STREET_SITES){
  const holder=new T.Group();holder.position.set(site.x,heightAt(site.x,site.z)+(site.inside?-5:0),site.z);group.add(holder);
  const ring=new T.Mesh(new T.TorusGeometry(.62,.035,4,24),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.21;holder.add(ring);
  const tag=label(holder,site.name+'\nY / WORK',0,2.1,0,2.3,.6,0,'#4d5841');markers.push({site,holder,ring,tag});
  if(site.person){const npc=person(m);npc.root.position.set(site.x+1.25,heightAt(site.x,site.z),site.z-.9);group.add(npc.root);people.push({site,npc:npc.root});}
 }
 function instance(key,parent,x,y,z,scale=1,rotation=0){
  const original=templates.get(key);if(!original)throw Error('Missing curated model '+key);
  const g=original.clone(true);g.position.set(x,y,z);g.scale.set(...(Array.isArray(scale)?scale:[scale,scale,scale]));g.rotation.y=rotation;parent.add(g);status.instances++;return g;
 }
 const batch=batchStatic;
 function facade(h,shell){
  const detail=new T.Group(),width=h.d,depth=h.w,ht=7.5+h.kind*.6,floor=ht/2;
  function panels(from,to,z,y,rotation=0,windows=true){const length=to-from,count=Math.max(1,Math.round(length/2)),span=length/count;
   for(let k=0;k<count;k++){const x=from+(k+.5)*span,model=windows&&k%2===0?'Wall_Plaster_Window_Wide_Round':'Wall_Plaster_Straight';
    const xw=rotation===0?x:rotation===Math.PI?-x:z,zw=rotation===0?z:rotation===Math.PI?-z:rotation>0?-x:x;
    instance('village/'+model,detail,xw,y,zw,[span/2,floor/3.1,1],rotation);
    if(model.includes('Window'))windowBacking(detail,xw,y,zw,span,floor,rotation,glazing);
   }
  }
  panels(-width/2,-1.6,depth/2-.1,0);panels(1.6,width/2,depth/2-.1,0);
  // Keep the existing 3.2m open doorway, with nothing crossing its collision gap.
  if(!h.room)instance('village/Door_1_Round',detail,0,0,depth/2,[1.25,1.25,1.25]);
  panels(-width/2,width/2,depth/2-.1,floor);
  for(const y of[0,floor]){panels(-width/2,width/2,depth/2-.1,y,Math.PI);panels(-depth/2,depth/2,width/2-.1,y,Math.PI/2);panels(-depth/2,depth/2,-width/2+.1,y,-Math.PI/2);}
  instance('village/Roof_RoundTiles_6x8',detail,0,ht+.2,0,[(width+1)/8.25,.52,(depth+1)/9.68]);
  for(const sign of[-1,1])instance('village/Roof_Front_Brick6',detail,0,ht,sign*(depth/2-.1),[width/6,.55,1],sign<0?Math.PI:0);
  instance('village/Prop_Chimney',detail,width*.28,ht+1,-depth*.18,[.8,.8,.8]);
  if(h.kind%2===0)instance('village/Prop_Vine1',detail,-width/2+1,ht*.64,depth/2+.13,1.2);
  batch(detail);detail.name='Curated textured Renaissance facade';const originals=shell.children.map(object=>({object,visible:object.visible}));replacements.push(...originals);shell.add(detail);added.push(detail);facadeLevels.push({h,detail,originals});status.facades++;
 }
 function roomArt(r,g){
  const base=new T.Group();base.name='Curated room workspaces';g.add(base);
  for(const x of[-r.hx+2,r.hx-2]){instance('props/Bookcase_2',base,x,.19,-r.hz+1,.85);instance('props/BookGroup_Medium_1',base,x,.95,-r.hz+1.22,.9);}
  instance('props/Table_Large',base,0,.2,r.hz-1.2,[.8,.85,.65]);instance('props/Scroll_1',base,.15,1.0,r.hz-1.2,.8);instance('props/CandleStick_Triple',base,.7,1.02,r.hz-1.3,.5);
  if(r.kind==='apothecary')instance('props/Shelf_Small_Bottles',base,2,1.2,-r.hz+.7,1.5);
  if(r.kind==='smith'){instance('props/Anvil_Log',base,r.hx-1.5,.2,1,.85);instance('props/Whetstone',base,-r.hx+1.5,.2,1,.8);}
  if(r.kind==='inn'){instance('props/Barrel',base,-r.hx+1,.2,r.hz-2,1.1);instance('props/Barrel_Apples',base,r.hx-1,.2,r.hz-2,1.1);}
  if(r.kind==='workshop')instance('props/Workbench',base,-r.hx+1.5,.2,1,[.7,.9,.75],Math.PI/2);
  batch(base);if(g.getObjectByName('Replaceable workshop furniture')){const object=g.getObjectByName('Replaceable workshop furniture');replacements.push({object,visible:object.visible});}added.push(base);rooms.push({r,g:base});
 }
 async function load(){
  if(new URLSearchParams(location.search).get('art')==='baseline'){status.message='Baseline procedural art selected for comparison.';badge.textContent=status.message;return;}
  const [loaderMod,manifest]=await Promise.all([import('./vendor/GLTFLoader.js'),fetch('./ASSET-REGISTER.json').then(r=>{if(!r.ok)throw Error('Missing asset register');return r.json();})]);
  T.Cache.enabled=true;const loader=new loaderMod.GLTFLoader();
  const entries=Object.entries(manifest.models);
  // Four model requests at a time keep the first load bounded on mobile.
  let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<entries.length){const [key,rec]=entries[cursor++],gltf=await loader.loadAsync('./'+rec.path);gltf.scene.traverse(o=>{if(!o.isMesh)return;const materialKey=key.split('/')[0]+':'+o.material.name;
    if(materialBank.has(materialKey))o.material=materialBank.get(materialKey);else{o.material=o.material.clone();o.material.vertexColors=true;if(o.material.map)o.material.map.anisotropy=4;o.material.roughness=Math.max(.5,o.material.roughness);materialBank.set(materialKey,o.material);const tiers=makeMaterialTiers(o.material);materialTiers.set(tiers.key,tiers);}o.castShadow=o.receiveShadow=true;
   });templates.set(key,gltf.scene);status.models++;badge.textContent=`Detailed town artwork ${status.models}/${entries.length}`;}}));
  status.bytes=manifest.totalBytes;
  for(const h of w.houses){const shell=root.children.find(g=>g.userData.room===h.room&&g.position.x===h.x&&g.position.z===h.z)||root.children.find(g=>g.position.x===h.x&&g.position.z===h.z&&g.children.some(c=>c.name==='Renaissance plaster and masonry'));if(shell)facade(h,shell);}
  const allRooms=[];scene.traverse(g=>{if(g.name?.endsWith(' interior')||g.name?.endsWith(' basement')){const r=w.rooms.find(r=>g.name===r.name+' interior'||g.name===r.name+' basement');if(r)allRooms.push({g,r});}});for(const {g,r} of allRooms)roomArt(r,g);
  for(const {site,holder}of markers){const name=site.asset==='BookStand'?'Workbench':site.asset;const scale=['Pot_1','Potion_1','Scroll_1'].includes(name)?.6:name==='Workbench'?.65:name==='Bench'?.7:name==='Lantern_Wall'?.65:1;
   const obj=instance('props/'+name,holder,0,.18,0,scale);objects.push({site,obj});
  }
  // Ground-floor lanterns stand beside existing entrances, never across them.
  for(const h of w.houses){const g=new T.Group();g.position.set(h.x-h.side*(h.w/2+.35),heightAt(h.x,h.z)+2.5,h.z+2.2);g.rotation.y=-h.side*Math.PI/2;root.add(g);instance('props/Lantern_Wall',g,0,0,0,.5);lamps.push(g);}
  const siteHolder=id=>markers.find(x=>x.site.id===id).holder;
  for(const [id,job] of [['bell','bell'],['garden-work','gardenbench']]){
   const light=new T.Mesh(new T.SphereGeometry(.09,7,5),new T.MeshBasicMaterial({color:'#ffd78d'}));light.position.set(0,1.15,0);siteHolder(id).add(light);outcomes.push({job,obj:light});
  }
  const bowlWater=new T.Mesh(new T.CircleGeometry(.1,16),new T.MeshStandardMaterial({color:'#72bcc4',roughness:.2,metalness:.15}));bowlWater.rotation.x=-Math.PI/2;bowlWater.position.y=.27;siteHolder('catcare').add(bowlWater);outcomes.push({job:'bowl',obj:bowlWater});
  const meal=new T.Group();meal.position.set(1.5,0,2.7);siteHolder('cook').add(meal);instance('props/Table_Large',meal,0,.12,0,.65);instance('props/FarmCrate_Apple',meal,-.4,.7,0,.28);instance('props/FarmCrate_Carrot',meal,.4,.7,0,.28);batch(meal);outcomes.push({job:'dinner',obj:meal});
  const painting=document.createElement('canvas');painting.width=256;painting.height=192;const paint=painting.getContext('2d'),texture=new T.CanvasTexture(painting);texture.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(1.2,.9),new T.MeshStandardMaterial({map:texture,roughness:.8,side:T.DoubleSide}));panel.position.set(0,1.05,.08);panel.rotation.x=-.2;siteHolder('painter').add(panel);
  outcomes.push({job:'exhibition',obj:panel,painting,paint,texture,last:null});
  const ribbon=new T.Mesh(new T.TorusGeometry(.11,.025,5,18,5.5),new T.MeshStandardMaterial({color:'#cb8658',roughness:.8}));ribbon.position.set(.5,.9,.12);siteHolder('painter').add(ribbon);outcomes.push({job:'ribbon',obj:ribbon});
  for(const o of outcomes)o.obj.visible=false;
  replacements.forEach(r=>r.object.visible=false);built=true;
  status.ready=true;applyQuality();updateDistance(detailPoint);status.message='Curated CC0 art loaded';badge.textContent=status.message;badge.classList.add('ready');
 }
 load().catch(error=>{if(!built){for(const o of added)o.removeFromParent();replacements.forEach(r=>r.object.visible=r.visible);status.facades=0;}status.failed=true;status.error=String(error.message||error);status.message='Detailed art unavailable; original town remains playable.';badge.textContent=status.message;console.warn('Curated art fallback:',error);});
 function applyQuality(){
  scene.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const tier=materialTiers.get(o.material.userData.guildArtKey);if(tier)o.material=tier[currentQuality];});
  status.materialTier=currentQuality;
 }
 function setQuality(value){if(!['high','balanced','low'].includes(value))return;currentQuality=value;if(built){applyQuality();updateDistance(detailPoint);}}
 function updateDistance(s){
  const selected=selectFacades(facadeLevels,s,currentQuality);status.detailedVisible=selected.size;
  facadeLevels.forEach((f,i)=>{const chosen=selected.has(i);f.detail.visible=chosen;f.originals.forEach(r=>r.object.visible=chosen?false:r.visible);});
  // Detailed 2800-triangle lanterns do not need rendering on distant streets.
  lamps.forEach(l=>l.visible=Math.hypot(l.position.x-s.x,l.position.z-s.z)<(currentQuality==='low'?50:95));
 }
 function update(s,dt){
  detailPoint=s;if(built)updateDistance(s);
  for(const {site,holder,ring,tag} of markers){const floor=(site.inside||null)===(s.life.inside||null);holder.visible=floor&&(!site.garden||s.life.flags.garden);const d=Math.hypot(site.x-s.x,site.z-s.z);ring.visible=d<20&&eligibleAt(s,site).some(j=>available(s,j));tag.visible=d<7&&ring.visible;tag.quaternion.copy(camera.quaternion);}
  for(const {site,npc}of people){npc.visible=!s.life.inside;npc.rotation.y=Math.atan2(s.x-npc.position.x,s.z-npc.position.z);npc.rotation.z=Math.sin(s.time*.75+site.z)*.018;}
  for(const {site,obj}of objects){if(site.id==='cart')obj.rotation.z=s.street.done.includes('cart')?0:.13;if(site.id==='barrels')obj.rotation.z=s.street.done.includes('cider')?0:.07;
   if(['apples','carrots','basket'].includes(site.id)){const n=s.street.progress.dinner||0;obj.visible=n<=['apples','carrots','basket'].indexOf(site.id)+1;}
  }
  for(const o of outcomes){o.obj.visible=s.street.done.includes(o.job);
   if(o.painting&&o.obj.visible&&o.last!==s.street.choices.exhibition){o.last=s.street.choices.exhibition;const palette=({'warm terracotta':['#edc494','#b36f4b','#5f7556'],'cool river blue':['#cadad7','#698f9d','#4d665f'],'olive and gold':['#dfd4a1','#969463','#586653']})[o.last]||['#dfd4a1','#969463','#586653'];const c=o.paint;c.fillStyle=palette[0];c.fillRect(0,0,256,192);c.fillStyle=palette[2];c.beginPath();c.moveTo(0,135);c.lineTo(85,73);c.lineTo(146,116);c.lineTo(256,81);c.lineTo(256,192);c.lineTo(0,192);c.fill();c.fillStyle=palette[1];for(let i=0;i<7;i++){const x=i*40;c.fillRect(x,125-i%2*20,28,70);c.beginPath();c.moveTo(x-4,125-i%2*20);c.lineTo(x+14,103-i%2*20);c.lineTo(x+32,125-i%2*20);c.fill();}c.strokeStyle='#dec78f';c.lineWidth=12;c.strokeRect(6,6,244,180);o.texture.needsUpdate=true;}
  }
  group.visible=true;
 }
 return {update,setQuality,inspect:()=>({...status})};
}
