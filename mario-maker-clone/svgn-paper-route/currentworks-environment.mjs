/* Currentworks library adapter for Sky Cycle's existing r177 node renderer.
 * Three pinned ORIGINAL modules; no imported engine, secondary renderer, clock,
 * input, collision, reward or save owner. New geometry only; never global restyle.
 */
import * as T from './vendor/three.webgpu.js';
import './vendor/currentworks/toon.js';
import './vendor/currentworks/cloudlets.js';
import './vendor/currentworks/islands.js';
import {UNIT,CLOUDS,ISLANDS,BUDGET,enabled,inRange,nearViewer} from './currentworks-core.mjs';
import {createPath,accepts} from './depth-path-core.mjs';
const Toon=globalThis.SVGNToon,Cloudlets=globalThis.SVGNCloudlets,Islands=globalThis.SVGNIslands;
// Use the SAME renderer namespace, with its native node material constructor.
// This is a local constructor adapter, not another Three.js version or engine.
const NODE_THREE={...T,MeshToonMaterial:T.MeshToonNodeMaterial};
const path=createPath(),noRaycast=()=>{};
export function createGarden(scene){
 if(!scene?.isScene)throw new TypeError('Garden needs the original game scene');
 const group=new T.Group();group.name='Sky Cycle / Currentworks gardens';group.userData.currentworks=true;
 group.scale.setScalar(UNIT);scene.add(group);
 const style=Toon.create(NODE_THREE,{bands:[.24,.50,.76,1]}),geometries=new Set();
 let clouds=null,islands=null,disposed=false,time=0,visible=false;
 const canopy=style.material({color:0xdfeaf1,vertexColors:true,fog:false});
 const ground=style.material({color:0xbdd4ba,vertexColors:true,fog:false});
 const wood=style.material({color:0x72534b,fog:false}),leaves=style.material({color:0x73aa72,fog:false});
 const copper=style.material({color:0xc77959,fog:false}),teal=style.material({color:0x529aa7,fog:false});
 const own=g=>{geometries.add(g);return g;};
 const trunk=own(new T.CylinderGeometry(.035,.06,.40,6)),crown=own(new T.SphereGeometry(.30,8,6));
 const pole=own(new T.CylinderGeometry(.016,.023,.65,6)),flag=own(new T.BoxGeometry(.32,.16,.045,2,1,1));
 function mesh(g,m,x,y,z,parent=group){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.raycast=noRaycast;parent.add(o);return o;}
 const badges=[];
 try{
  clouds=Cloudlets.create(T,{clouds:CLOUDS,material:canopy,hideNearViewer:false});
  islands=Islands.create(T,{islands:ISLANDS,material:ground});group.add(clouds.group,islands.group);
  for(const [i,d]of ISLANDS.entries()){
   const socket=islands.socket(d.id),g=new T.Group();g.name='Garden landmark / '+d.id;g.position.fromArray(socket);group.add(g);badges.push(g);
   // Orchard silhouettes and paired pennants distinguish the two sides of the
   // market sweep. All remain behind the gold, actually rideable surfaces.
   for(const x of [-.23,.17]){mesh(trunk,wood,x,.20,0,g);const top=mesh(crown,leaves,x,.51,0,g);top.scale.set(1,.85,.8);}
   mesh(pole,wood,.46,.325,.08,g);const f=mesh(flag,i%2?teal:copper,.59,.57,.08,g);f.name='Fixed garden pennant';
  }
  group.traverse(o=>{if(o.isMesh){o.raycast=noRaycast;o.userData.currentworksScenery=true;}});
 }catch(error){dispose();throw error;}
 const p=new T.Vector3(),eye=new T.Vector3(),scale=new T.Vector3(),near=new Map();
 const cloudBounds=CLOUDS.map(d=>Cloudlets.extent(Cloudlets.shape(d.seed,d.radius)).radius*UNIT*1.4+36);
 function renderedPoint(object,curved,riderX){
  object.getWorldPosition(p);scene.worldToLocal(p);
  if(curved){const q=path.project([p.x,p.y,p.z]);p.fromArray(q);p.x-=path.sample(riderX).x-riderX;}
  return p.applyMatrix4(scene.matrixWorld);
 }
 function update(frame={}){
  if(disposed)return false;
  if(!Number.isFinite(frame.time)||!Number.isFinite(frame.riderX))return false;
  if(frame.viewer!=null&&(!Array.isArray(frame.viewer)||frame.viewer.length!==3||!frame.viewer.every(Number.isFinite)))return false;
  time=Math.max(0,frame.time);visible=frame.visible!==false;group.visible=visible;
  // Light detail is deliberate for this small backdrop in BOTH eyes. The module's
  // undeformed world-distance query cannot safely represent a GPU-curved world.
  // Host near-viewer suppression below uses the actual shared CPU depth mapping.
  clouds.update({time,quiet:!!frame.quiet,visible,xr:!!frame.xr,quality:'light'});islands.update({visible});
  scene.updateWorldMatrix(true,false);group.updateWorldMatrix(false,true);scene.getWorldScale(scale);const factor=Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z));
  if(frame.viewer)eye.fromArray(frame.viewer);
  clouds.group.children.forEach((o,i)=>{
   const hide=!!frame.viewer&&nearViewer(renderedPoint(o,!!frame.curved,frame.riderX).distanceTo(eye),cloudBounds[i]*factor,near.get(o));
   near.set(o,hide);o.visible=visible&&inRange(CLOUDS[i].position[0]*UNIT,frame.riderX)&&!hide;
  });
  islands.group.children.forEach((o,i)=>{o.visible=visible&&inRange(ISLANDS[i].position[0]*UNIT,frame.riderX);badges[i].visible=o.visible;});
  return true;
 }
 function dispose(){
  if(disposed)return;disposed=true;group.removeFromParent();clouds?.dispose();islands?.dispose();
  for(const geometry of geometries)geometry.dispose();style.dispose();
 }
 return Object.freeze({group,update,dispose,clouds,islands,style,
  get stats(){return {active:visible&&!disposed,disposed,time,modules:['Cloudlets 0.1.0','Islands 0.1.0','Toon 0.1.0'],clouds:clouds?.stats,islands:islands?.stats,materials:style.stats.materials,extraGeometries:disposed?0:geometries.size,renderTargets:0,colliders:0,depthAwareNearSuppression:true};}});
}
// Attach as a scene sibling, not inside the host-disposed Cloudview root. The
// library owns its resources exactly once; the original environment retains its
// own cleanup. Depth/aperture traversals still include this original scene.
if(typeof window!=='undefined'&&window.SkyVisual){
 let live=null,source=null,owner=null,builds=0,disposals=0,fault=null;
 const eye=new T.Vector3(),scratch=new T.Vector3();
 function cleanup(){if(live){live.dispose();disposals++;}live=null;source=null;owner=null;}
 function sync(){
  const engine=window.__merged,root=window.__cloudview?.root,ww=window.__sky?.state?.data?.gp?.waterwheel;
  const allowed=!!engine?.scene&&!!root?.parent&&enabled({preview:ww?.preview,testing:!!window.RouteWorkshop?.testing,view:window.__delivery?.state.view,look:window.Prismatic?.settings.look});
  if(!allowed){cleanup();return;}
  if(source!==root||owner!==engine.scene){cleanup();try{live=createGarden(engine.scene);source=root;owner=engine.scene;builds++;fault=null;}catch(e){fault=String(e);console.error('Currentworks garden:',e);return;}}
  if(!live)return;
  const xr=!!window.SkyCycleXR?.presenting,camera=xr?engine.renderer.xr.getCamera():engine.camera;
  let viewer;
  if(camera){if(camera.cameras?.length){eye.set(0,0,0);for(const c of camera.cameras)eye.add(c.getWorldPosition(scratch));eye.multiplyScalar(1/camera.cameras.length);}else camera.getWorldPosition(eye);viewer=eye.toArray();}
  live.update({time:(window.__sky?.state.steps||0)/60,riderX:typeof player==='undefined'?0:player.x+player.w/2,viewer,xr,curved:accepts(ww?.depthPath),quiet:matchMedia('(prefers-reduced-motion: reduce)').matches||window.Prismatic?.settings.motion===false});
 }
 const visual=window.SkyVisual,build=visual.build,update=visual.update,render=window.render;
 visual.build=function(...args){cleanup();return build.apply(this,args);};
 // Create before the depth shader owner visits the scene, not a frame after it.
 visual.update=function(...args){sync();return update.apply(this,args);};
 if(render)window.render=function(...args){if(!window.RouteWorkshop?.testing||window.__delivery?.state.view!=='3d'||window.Prismatic?.settings.look==='classic')cleanup();return render.apply(this,args);};
 window.SkyCycleEnvironment=Object.freeze({version:'0.29.0',get stats(){return {...live?.stats,active:!!live,builds,disposals,error:fault,source:'Currentworks pinned library',previewOnly:true};}});
}
