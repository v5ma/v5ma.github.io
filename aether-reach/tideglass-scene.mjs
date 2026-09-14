/* Physical reservoir architecture plus bounded shader uniforms. Rendering never awards objectives. */
import * as T from './vendor/three.module.js';
import {createFoundryKit} from './foundry-kit.mjs';
import {TIDEGLASS,TIDE_FLOORS,TIDE_SOLIDS,TIDE_POINTS,TIDE_POOLS,tideLevel,tideGoal} from './tideglass-world.mjs';
import {waterBudget,makePoolWater,patchPoolTiles} from './tideglass-shaders.mjs';
export function installTideglassScene({scene}){
 const kit=createFoundryKit(scene),{root,add,batch,sign}=kit;root.name='Tideglass Reservoir';
 const originalFog=scene.fog,underwaterFog=new T.Fog('#285c61',.8,24),tiles=[],surfaces=[],props=new Map();let effects=true,lastStats={};
 const tileMaterial=new T.MeshStandardMaterial({color:'#e5efdd',roughness:.47,metalness:.03});const tileUniforms={tideClock:{value:0},tideLevel:{value:TIDE_POOLS[0].high},tideCaustic:{value:.24}};
 tileMaterial.onBeforeCompile=s=>patchPoolTiles(s,tileUniforms);tileMaterial.customProgramCacheKey=()=> 'tideglass-pool-tiles-v1';
 const poolFloorGeo=[];
 for(const f of TIDE_FLOORS){const m=add('box','stone',[f.x,f.y-.22,f.z],[f.w,.44,f.d]);if(f.id.endsWith('-floor')){m.material=tileMaterial;tiles.push(m);}m.name=f.id;}
 // A suspended hull is below the pool bottom rather than filling the water volume.
 batch('box','metal',[132,.8,0],[44,.5,44]);batch('box','brass',[132,.48,0],[44.25,.14,44.25]);
 for(const c of TIDE_SOLIDS){if(c.id.startsWith('tide-pillar-'))continue;const m=add('box',c.id.includes('parapet')?'stone':'paper',[(c.x1+c.x2)/2,(c.y1+c.y2)/2,(c.z1+c.z2)/2],[c.x2-c.x1,c.y2-c.y1,c.z2-c.z1]);m.name=c.id;if(c.id.startsWith('reservoir-')||c.id.startsWith('filter-')){m.material=tileMaterial;tiles.push(m);}if(c.id.includes('parapet'))batch('box','brass',[(c.x1+c.x2)/2,c.y2+.04,(c.z1+c.z2)/2],[c.x2-c.x1+.05,.08,c.z2-c.z1+.05]);}
 for(const p of TIDE_POOLS){const geom=new T.PlaneGeometry(p.w-.05,p.d-.05),mat=makePoolWater(p),m=new T.Mesh(geom,mat);m.rotation.x=-Math.PI/2;m.position.set(p.x,p.high,p.z);m.name='water-'+p.id;m.renderOrder=3;root.add(m);surfaces.push({p,m,mat});poolFloorGeo.push(geom);}
 // Brass pool ladder is a visual depth cue; the broad railed stairs are the physical exit.
 for(const x of[137.8,139]){batch('cylinder','brass',[x,4.4,7.5],[.055,4.8,.055]);for(let i=0;i<2;i++)batch('box','brass',[x,6.65,8+i*.3],[.11,.11,.8]);}
 for(let y=2.6;y<6;y+=.45)batch('box','brass',[138.4,y,7.5],[1.2,.075,.075]);
 // Open pavilion: repeated ribs and glazing, without an expensive refraction pass.
 const glass=new T.MeshPhysicalMaterial({color:'#a1d8d4',transparent:true,opacity:.15,roughness:.25,metalness:.05,depthWrite:false,side:T.DoubleSide});const glassGeo=new T.PlaneGeometry(23,25);
 const canopy=new T.Mesh(glassGeo,glass);canopy.rotation.x=-Math.PI/2;canopy.position.set(130,12.3,-1);canopy.castShadow=false;root.add(canopy);
 for(const x of[119,141])for(const z of[-14,16]){batch('cylinder','metal',[x,9.1,z],[.11,6.2,.11]);batch('cylinder','brass',[x,6.2,z],[.26,.4,.26]);}
 for(const z of[-13,-7,-1,5,11]){batch('box','brass',[130,12.35,z],[23,.14,.14]);}
 sign('TIDEGLASS / PUBLIC RESERVOIR',119,9.3,17,11);
 sign('BASIN STEPS / SWIM OR DRAIN',126,8.25,10,6);
 sign('PUMP HOUSE',147,10.25,.3,6);
 for(const q of TIDE_POINTS){const g=new T.Group();g.name=q.id;g.position.set(q.x,q.y,q.z);root.add(g);props.set(q.id,g);
  if(q.kind==='plate'){add('box','dark',[0,.04,0],[.7,.08,.7],g);const ring=add('ring','glow',[0,.09,0],[.22,.22,.22],g);ring.rotation.x=Math.PI/2;}
  else if(q.kind==='pickup'){add('cylinder','brass',[0,.23,0],[.25,.46,.25],g);const ring=add('ring','glow',[0,.03,0],[.43,.43,.43],g);ring.rotation.x=Math.PI/2;}
  else {add('cylinder','metal',[0,.45,0],[.18,.9,.18],g);add('box','dark',[0,1,0],[.75,.32,.5],g);if(q.kind==='valve'){const wheel=add('ring','brass',[0,1.28,.09],[.34,.34,.34],g);add('box','brass',[0,0,0],[.55,.04,.04],wheel);g.userData.wheel=wheel;}
   else add('sphere','glow',[0,1.24,0],[.07,.07,.07],g);
   sign(q.name.toUpperCase(),q.x,q.y+2.95,q.z+.10,q.kind==='desk'?5:3.8);
  }
 }
 const jets=[];for(const z of[-10,-6,-2,2]){batch('cylinder','brass',[140.6,6.4,z],[.09,.8,.09]);const jet=add('cylinder','glow',[139.65,5.9,z],[.025,1.1,.025]);jet.rotation.z=-.9;jets.push(jet);}
 const marker=add('ring','glow',[0,0,0],[.6,.6,.6]);marker.rotation.x=-Math.PI/2;marker.visible=false;
 kit.flush();
 function update(s,{playing=true,reduced=false,quality='balanced',xr=false}={}){const w=s.tideglass;if(!w)return;const budget=waterBudget(quality,xr,reduced,effects);tileUniforms.tideClock.value=budget.clock?s.time:0;tileUniforms.tideLevel.value=w.level;tileUniforms.tideCaustic.value=budget.caustics;
  for(const {p,m,mat}of surfaces){const level=tideLevel(s,p);m.position.y=level;mat.uniforms.clock.value=budget.clock?s.time:0;mat.uniforms.detail.value=budget.detail;mat.uniforms.depth.value=level-p.floor;const r=w.ripples.filter(r=>r.pool===p.id);for(let i=0;i<8;i++){const v=r[i];mat.uniforms.ripples.value[i].set(v?.x||0,v?.z||0,budget.ripples&&v?s.time-v.born:-1,v?.strength||0);}}
  props.get('tide-regulator').visible=w.stage<2;
  TIDE_POINTS.filter(p=>p.kind==='plate').forEach(q=>{props.get(q.id).visible=!w.plates.includes(q.id);});
  for(let i=0;i<2;i++)props.get('tide-valve-'+i).userData.wheel.rotation.z=w.valves[i]?Math.PI/2:0;
  jets.forEach(m=>m.visible=w.stage>=3&&Math.abs(w.level-TIDE_POOLS[0].high)<.1);
  const inWater=playing&&s.p.water.submerged;scene.fog=inWater?underwaterFog:originalFog;
  const tracked=playing&&s.expedition.tracked?.startsWith('tideglass');marker.visible=tracked;const goal=tideGoal(s);if(tracked&&goal)marker.position.set(goal.x,goal.y+.11,goal.z);
  lastStats={pools:2,level:w.level,effects,clock:tileUniforms.tideClock.value,detail:budget.detail,caustics:budget.caustics,underwater:inWater,fountains:jets[0].visible,rippleCapacity:8,additionalRenderPasses:0};
 }
 return{update,setEffects:v=>{effects=!!v;},stats:()=>({...lastStats,effects}),dispose(){if(scene.fog===underwaterFog)scene.fog=originalFog;for(const v of surfaces)v.mat.dispose();tileMaterial.dispose();glass.dispose();kit.dispose();}};
}
