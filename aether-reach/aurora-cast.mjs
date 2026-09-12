/* Static, same-origin CC0 character assets. Bounded actor slots, shared geometry,
 * independent skeletons. Original procedural people stay as loading/failure/LOD fallback. */
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {makeActor} from './aurora-rig.mjs';
import {castBudget,installAuroraAtmosphere} from './aurora-shaders.mjs';
export function castCandidates(s,budget){
 const p=s.p,near=(a)=>Math.hypot(a.x-p.x,a.y-p.y,a.z-p.z)<budget.distance,c=s.skirmish?.companion,e=s.expedition?.escort,out=[];
 if(c&&near(c))out.push({id:'tavi',role:'courier',variant:'courier',actor:{...c,offer:!!s.skirmish.offer},priority:-2});
 if(e&&near(e))out.push({id:'surveyor',role:'worker',variant:'worker',actor:e,priority:-1});
 for(const a of s.drones||[])if(a.humanoid&&a.hp>0&&near(a))out.push({id:a.id,role:'guard',variant:a.kind,actor:a,priority:Math.hypot(a.x-p.x,a.y-p.y,a.z-p.z)});
 return out.sort((a,b)=>a.priority-b.priority).slice(0,budget.actors);
}
export function installAuroraCast({scene,load=role=>new GLTFLoader().loadAsync(new URL('./art/characters/'+role+'.glb',import.meta.url).href)}){
 const templates=new Map(),failures=[],slots=[],covered=new Set(),atmosphere=installAuroraAtmosphere({scene});let disposed=false,enabled=true,effects=true,revision=0,lastTime=null,created=0;
 scene.userData.auroraCovered=covered;scene.userData.auroraEffects=true;
 const pending=['courier','guard','worker'].map(async role=>{try{const g=await load(role);if(!g.scene||!g.animations?.length)throw Error('No animated rig');
   if(disposed){disposeTemplate(g);return;}templates.set(role,g);revision++;
  }catch(e){failures.push(role+': '+String(e.message||e).slice(0,140));revision++;}});
 let settled=false;const ready=Promise.all(pending).then(()=>settled=true);
 function disposeTemplate(g){const geometry=new Set(),materials=new Set();g.scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 function acquire(spec){let slot=slots.find(v=>v.id===spec.id);if(slot)return slot;
  slot=slots.find(v=>v.id===null&&v.role===spec.role&&v.variant===spec.variant)||slots.find(v=>v.id===null);
  if(!slot){if(slots.length>=10)return null;slot={id:null,rig:null};slots.push(slot);}
  if(!slot.rig||slot.role!==spec.role||slot.variant!==spec.variant||slot.rig.stats().dead){slot.rig?.dispose();slot.rig=makeActor(templates.get(spec.role),spec.role,spec.variant);scene.add(slot.rig.root);created++;}
  slot.id=spec.id;slot.role=spec.role;slot.variant=spec.variant;slot.elapsed=0;slot.actor=spec.actor;slot.death=null;return slot;
 }
 function update(s,dt,{mode='balanced',xr=false,menu=false,reduced=false}={}){
  const budget=castBudget(mode,xr),reset=lastTime!==null&&s.time<lastTime;lastTime=s.time;covered.clear();
  atmosphere.update(dt,{mode,xr,reduced,enabled:effects});scene.userData.auroraEffects=effects;scene.userData.auroraRich=budget.rifts;
  if(reset)for(const slot of slots){slot.id=null;slot.rig.root.visible=false;}
  const selected=enabled&&!menu?castCandidates(s,budget).filter(c=>templates.has(c.role)):[];
  const ids=new Set(selected.map(c=>c.id));
  for(const slot of slots){if(!slot.id||ids.has(slot.id))continue;
   const enemy=slot.role==='guard'&&(s.drones||[]).find(b=>b.id===slot.id);
   if(enabled&&!menu&&enemy&&enemy.hp<=0&&selected.length<budget.actors){if(slot.death===null)slot.death=s.time;
    if(s.time-slot.death<1.7){selected.push({id:slot.id,role:slot.role,variant:slot.variant,actor:enemy});ids.add(slot.id);continue;}}
   slot.rig.root.visible=false;slot.id=null;
  }
  for(const spec of selected){let slot;try{slot=acquire(spec);}catch(e){if(!failures.includes('Actor construction failed'))failures.push('Actor construction failed');continue;}if(!slot)continue;
   slot.actor=spec.actor;slot.elapsed+=Math.max(0,dt);const animate=dt>0&&slot.elapsed>=1/budget.animatedHz;
   slot.rig.update(spec.actor,animate?slot.elapsed:0,{time:s.time,reduced,rich:effects&&budget.clothRim,animate,shadow:mode!=='low'&&!xr});if(animate)slot.elapsed=0;
   if(slot.rig.root.visible)covered.add(spec.id);
  }
  // Foundry is updated before view.update; suppress its companion only after the
  // imported replacement is actually visible. Never hide a failed or unloaded rig.
  const fallback=scene.getObjectByName('Tavi');if(fallback&&covered.has('tavi'))fallback.visible=false;
 }
 function effect(e){if(e.type==='hit'){slots.find(v=>v.id===e.id)?.rig.effect('hit');}
  if(e.type==='companion-offer')slots.find(v=>v.id==='tavi')?.rig.effect('offer');
  if(e.type==='enemy-shot'&&e.at){const v=slots.find(v=>v.id&&v.role==='guard'&&Math.hypot(v.actor.x-e.at.x,v.actor.y-e.at.y,v.actor.z-e.at.z)<.6);v?.rig.effect('shot');}
 }
 function options(v={}){if(typeof v.characters==='boolean')enabled=v.characters;if(typeof v.effects==='boolean')effects=v.effects;revision++;}
 function stats(){return{revision,enabled,effects,settled,loaded:[...templates.keys()],errors:[...failures],pool:slots.length,created,visible:covered.size,actors:slots.filter(v=>v.id&&v.rig.root.visible).map(v=>({id:v.id,...v.rig.stats()})),atmosphere:atmosphere.stats()};}
 return{ready,update,effect,setOptions:options,stats,dispose(){if(disposed)return;disposed=true;covered.clear();slots.forEach(s=>s.rig?.dispose());templates.forEach(disposeTemplate);templates.clear();atmosphere.dispose();delete scene.userData.auroraCovered;delete scene.userData.auroraEffects;}};
}
export function installAuroraSettings(view){
 const key='aether-reach.aurora.v1';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
 const opts={characters:saved.characters!==false,effects:saved.effects!==false};view.setAuroraOptions(opts);
 for(const [id,name,title]of [['cast-characters','characters','Animated human models'],['cast-effects','effects','Aurora cloth, rift and high-cloud shaders']]){
  const label=document.createElement('label'),input=document.createElement('input');input.id=id;input.type='checkbox';input.checked=opts[name];label.append(input,document.createTextNode(' '+title));document.querySelector('.settings-grid').append(label);
  input.onchange=()=>{opts[name]=input.checked;view.setAuroraOptions(opts);try{localStorage.setItem(key,JSON.stringify(opts));}catch{}};
 }
 const note=document.createElement('p');note.className='fine';note.textContent='Aurora Cast uses locally hosted, freely licensed Quaternius human models. Light and VR reduce the nearby character budget and disable the extra shader layer; distant people keep the original lightweight shapes. These controls change presentation only.';document.querySelector('#settings-dialog form').before(note);
}
