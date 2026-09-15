import * as T from './vendor/three.module.js';
import R from './vendor/rapier.mjs';
import {box,part,ellipsoid,bone,label,material} from './ranger-art.js';
import {bakeStatics} from './frontier-art.js';
import {POINTS,BOUNDS} from './tidegate-core.js';
// An authored working place, not a random prop field. Geometry and interactions
// share POINTS. Color supplements silhouettes, labels, elevation and materials.
export function buildTidegate(scene,physics,state){
 const root=new T.Group();root.name='Tidegate live simulation';scene.add(root);
 const fixed=new T.Group();root.add(fixed);const roofs=[],markers=[],walkMeshes=[];
 const palette={stone:0x7b877e,wall:0xdfd3b2,steel:0x2e5559,timber:0x877354,road:0xb7a480,orange:0xdd8855,grass:0x789778};
 scene.background=new T.Color(0xb7d3d0);scene.fog=new T.Fog(0xb7d3d0,155,320);
 const hemi=new T.HemisphereLight(0xe4efe2,0x496964,2.1),sun=new T.DirectionalLight(0xffe3b7,3.3);sun.position.set(-45,90,30);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-75,right:75,top:60,bottom:-60,near:1,far:180});sun.shadow.normalBias=.035;root.add(hemi,sun,sun.target);
 function solid(x,y,z,w,h,d,color=palette.stone){const m=box(fixed,color,x,y,z,w,h,d);physics.box(x,y,z,w/2,h/2,d/2);walkMeshes.push(m);return m;}
 function sign(text,x,z,w=7,y=2.4,angle=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;const s=label(text,w,.9);g.add(s);root.add(g);for(const offset of [-w*.36,w*.36])bone(fixed,palette.steel,[x+Math.cos(angle)*offset,0,z-Math.sin(angle)*offset],[x+Math.cos(angle)*offset,y+.4,z-Math.sin(angle)*offset],.055);return g;}
 function route(points,width=4,color=palette.road){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),m=box(fixed,color,(a[0]+b[0])/2,.025,(a[1]+b[1])/2,width,.04,length+.4);m.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);}}
 function ramp(ax,az,bx,bz,width,y0,y1){
  const dx=bx-ax,dz=bz-az,n=Math.hypot(dx,dz),sx=dz/n*width/2,sz=-dx/n*width/2;
  const v=[[ax+sx,y0,az+sz],[ax-sx,y0,az-sz],[bx+sx,y1,bz+sz],[bx-sx,y1,bz-sz]];
  const verts=v.flatMap(p=>p).concat(v.flatMap(p=>[p[0],p[1]-.35,p[2]]));
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex([0,2,1,1,2,3,4,5,6,5,7,6,0,4,2,2,4,6,1,3,5,3,7,5,0,1,4,1,5,4,2,6,3,3,6,7]);g.computeVertexNormals();
  const m=part(fixed,g,material(palette.timber),0,0,0);walkMeshes.push(m);const desc=R.ColliderDesc.convexHull(new Float32Array(verts));if(desc)physics.world.createCollider(desc.setFriction(.85));
  for(const side of [-1,1]){const a=[ax+sx*side,y0+1.1,az+sz*side],b=[bx+sx*side,y1+1.1,bz+sz*side];bone(fixed,palette.steel,a,b,.045);for(let i=0;i<=5;i++){const t=i/5;bone(fixed,palette.steel,[ax+dx*t+sx*side,y0+(y1-y0)*t,az+dz*t+sz*side],[ax+dx*t+sx*side,y0+(y1-y0)*t+1.1,az+dz*t+sz*side],.045);}}
 }
 function rail(ax,az,bx,bz,y=.1){const n=Math.ceil(Math.hypot(bx-ax,bz-az)/3);for(let i=0;i<=n;i++){const t=i/n;box(fixed,palette.steel,ax+(bx-ax)*t,y+.7,az+(bz-az)*t,.09,1.4,.09);}bone(fixed,palette.steel,[ax,y+1.2,az],[bx,y+1.2,bz],.045);}
 // River and deliberately finite banks read as a single district in both scales.
 box(fixed,palette.grass,-37.5,-.28,3,57,.55,98);box(fixed,0x80987b,37.5,-.28,3,57,.55,98);
 box(fixed,0x526963,0,-.35,3,18,.65,98);
 const waterMat=new T.MeshStandardMaterial({color:0x4b999d,roughness:.25,metalness:.2,transparent:true,opacity:.84});
 const waters=[[-27,30],[-8,10],[22,50]].map(([z,depth])=>{const m=part(root,new T.PlaneGeometry(18,depth,6,12),waterMat,0,.16,z);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;});
 // Bank edges are interrupted at the real crossing and docking approaches.
 for(const x of [-9.6,9.6])for(const [z,d] of [[-23,18],[7,19],[44,5]])box(fixed,0xb3b297,x,-.03,z,.6,.38,d);
 route([[-38,38],[-38,10],[-51,-12],[-50,-36],[-12,-36]],5);
 route([[-12,-36],[12,-36],[48,-36],[48,-18],[50,7],[50,24],[12,24]],4.5);
 route([[-38,36],[-24,38],[-12,38]],4.2);route([[12,38],[24,38],[24,24]],4.2);
 route([[15,-8],[17,-20],[48,-20]],2.2,0xb8ba9d);route([[15,-8],[20,-2],[43,7]],2.2,0xb8ba9d);
 route([[-38,24],[-12,24]],5.8);route([[-50,-36],[-35,-36]],4);
 // The first view frames the amber station mast and the raised bridge beyond a
 // familiar orange crane. The restored crossing returns to this exact silhouette.
 solid(-43,1.6,37,11,3.2,7,palette.wall);box(fixed,palette.steel,-43,3.45,37,12,.4,8);
 for(const x of [-46,-43,-40])box(fixed,0x3b6d70,x,1.9,40.52,2,1.4,.045);
 sign('TIDEGATE / RANGER OUTPOST',-39,43,12,3.8);
 solid(-33,4,32,.7,8,.7,palette.orange);bone(fixed,palette.orange,[-33,7.8,32],[-22,7.8,32],.22);bone(fixed,palette.steel,[-24,7.8,32],[-24,2,32],.025);box(fixed,0xd6c7a6,-24,1.2,32,2.3,2.3,1.7);
 box(fixed,palette.steel,-38,.25,32,4,.5,3);sign('REPORT / RESUPPLY',-38,31,5,1.6);
 // Upper route: refuge, overlook and readable bridge clearance, not a maze.
 ramp(-48,-12,-35,-22,4,.1,5.4);solid(-35,5.15,-26,10,.5,9,palette.timber);ramp(-35,-31,-35,-38,4,5.4,.1);
 rail(-40,-30,-40,-22,5.4);rail(-40,-22,-30,-22,5.4);sign('OBSERVE / HERD CROSSING',-35,-25,6,6.6);
 solid(0,.05,-36,25,.3,6,palette.timber);rail(-12,-39,12,-39,.2);rail(-12,-33,12,-33,.2);
 sign('HIGH ROUTE / PUMP HOUSE',-47,-37,9,2.4);sign('FEEDER / SERVICE ACCESS',37,-34,10,2.4);
 // Purposeful two-level pump house. Two entry paths, machinery aisles, gallery,
 // exterior maintenance stairs and a real landable roof, with a central skylight.
 solid(32,-.05,7,23,.3,20,0xacb3a7);
 solid(22,2,7,.45,4,18,palette.wall);solid(42,2,0,.45,4,5,palette.wall);solid(42,2,14,.45,4,5,palette.wall);
 solid(26.5,2,16,9,4,.45,palette.wall);solid(38.5,2,16,7,4,.45,palette.wall);solid(32,2,-2,20,4,.45,palette.wall);
 // Upper walls retain function, while view-dependent roofs are visual only.
 for(const x of [22,42]){if(x===22)solid(x,6.15,7,.45,4.1,18,palette.wall);else{solid(x,6.15,10,.45,4.1,12,palette.wall);solid(x,6.15,-1.5,.45,4.1,1,palette.wall);solid(x,7.8,1,.45,.8,5,palette.wall);}for(const z of [1,7,13])box(fixed,0x5b8c89,x+(x===22?-.25:.25),6,z,.04,1.4,2.8);}
 solid(32,6.15,-2,20,4.1,.45,palette.wall);solid(32,6.15,16,20,4.1,.45,palette.wall);
 // Gallery hugs the back half, leaving a readable double-height machine hall.
 solid(32,4.2,1.1,19,.25,5.8,palette.timber);rail(23,4,41,4,4.35);
 solid(45.5,4.15,1,6,.35,5,palette.timber);ramp(45.5,19,45.5,3.4,3.5,.15,4.35);
 solid(47.5,4.15,-3.5,10,.35,4,palette.timber);ramp(51.2,-2,51.2,14,3.2,4.35,8.45);solid(47,8.25,14,12,.4,4,palette.timber);
 // Openings into the gallery are real doors on its east side.
 // Keep one upper entry clear by using a split wall at z=1 (above wall amended below).
 const roofGroup=new T.Group();root.add(roofGroup);roofs.push(roofGroup);
 for(const [x,z,w,d] of [[32,-.5,21,3],[32,14.5,21,3],[23.4,7,3.8,12],[40.6,7,3.8,12]]){box(roofGroup,palette.steel,x,8.45,z,w,.3,d);physics.box(x,8.45,z,w/2,.15,d/2);}
 // A second, unroofed floor entrance is reached by the gallery from the stair landing.
 // Portal through the east upper wall is created as a separate walkable gate below.
 const machine=new T.Group();root.add(machine);
 for(const x of [26,36]){part(machine,new T.CylinderGeometry(1.3,1.3,2.7,18),0x4e7875,x,1.5,5);bone(machine,palette.orange,[x,1.7,5],[x,1.7,-4],.2);box(machine,palette.steel,x,.15,5,3,.3,4);physics.box(x,1.4,5,1.25,1.4,1.5);}
 const gear=part(root,new T.TorusGeometry(.7,.13,8,16),material(palette.orange),30,1.7,7);gear.rotation.y=Math.PI/2;solid(30,1.1,6.2,1.2,2.2,1,0x456363);
 sign('GEARBOX / ALIGN BY HAND',30,9,5,2.6);sign('PUMP HOUSE / FRONT ENTRY',33,19,10,3.0);sign('SERVICE AISLE',44,9.8,5,2.4,Math.PI/2);
 bone(fixed,palette.orange,[27,8.5,-1],[27,18,-1],.18);for(let i=0;i<4;i++)box(fixed,palette.orange,27,14+i,-1,3-i*.35,.16,.18);
 const beacon=part(root,new T.SphereGeometry(.28,10,8),new T.MeshStandardMaterial({color:0xffd6a5,emissive:0xffb777,emissiveIntensity:2}),27,18.1,-1);
 // Readable sluice state: control, wheel and channel are in the same view.
 solid(15,.2,-8,4,.4,4,palette.stone);const wheel=part(root,new T.TorusGeometry(.62,.09,8,20),material(palette.orange),15,1.6,-8);bone(fixed,palette.steel,[15,.2,-8],[15,1.6,-8],.12);sign('SLUICE / REVERSIBLE',15,-5,6,2.8);
 const bed=box(root,0xb5b49a,0,.02,-8,19,.15,9);bed.visible=state.drained;
 for(let x=-8;x<=8;x+=2)box(fixed,0x455f58,x,-.1,-8,1,.16,6);
 // A permanent service shortcut, split leaves visually communicate its state.
 const leaves=[-1,1].map(side=>{const pivot=new T.Group();pivot.position.set(side*10,.25,24);const m=box(pivot,palette.timber,-side*5,0,0,10,.35,7.2);for(const z of [-3.4,3.4])bone(pivot,palette.steel,[0,1,z],[-side*10,1,z],.045);root.add(pivot);return {pivot,side};});
 const bridgeBody=physics.box(0,.1,24,10,.15,3.6);bridgeBody.setEnabled(state.bridge);
 solid(18,.25,24,5,.5,5,palette.stone);box(fixed,palette.steel,18,1.1,24,1.2,1.8,.8);sign('BRIDGE / KEEP APRON CLEAR',18,27,9,2.7);
 for(const x of [-10.5,10.5]){solid(x,2,28,1.2,4,1.2,palette.orange);bone(fixed,palette.steel,[x,4,28],[x,1,20],.045);}
 // Lower water route bypasses the long approach, without remote objective completion.
 for(const side of [-1,1]){solid(side*11.4,.05,38,4,.35,7,palette.timber);for(const z of [35,41])solid(side*12.7,.6,z,.2,1.2,.2,palette.steel);sign(side<0?'PATROL BOAT / Y':'EAST LANDING / Y',side*14,43,8,2.5);}
 // Feeding and shelter are outside the bridge apron and physically reachable.
 solid(49,.18,-18,7,.36,5,0xa7af87);box(fixed,palette.timber,49,.55,-18,5,.6,1.5);sign('SHELTER FEEDER',49,-14,7,2.5);
 for(const x of [44,54])for(const z of [-26,-20])solid(x,2.3,z,.2,4.6,.2,palette.steel);box(fixed,palette.steel,49,4.7,-23,13,.22,10);
 sign('CAUTION / HERD APRON',27,31,8,2.4);route([[24,24],[48,24]],8,0xa6af88);
 // A handful of authored trees frame routes instead of occluding every landmark.
 const treePositions=[[-57,40],[-57,28],[-54,5],[-59,-10],[-61,-29],[-21,-42],[-20,-23],[-22,-15],[-26,3],[-15,12],[58,40],[60,13],[58,-7],[60,-31],[24,-40],[13,-26]];
 for(const [i,[x,z]] of treePositions.entries()){const h=6+(i%4)*1.1;bone(fixed,0x756e56,[x,0,z],[x,h,z],.38,.22);physics.cylinder(x,z,.45,h/2,h/2);for(let j=0;j<3;j++)ellipsoid(fixed,[0x4e7c6a,0x679282,0x8ba58a][j],x+(j-1)*.8,h+j*.6,z,2.8-j*.3,1.8,2.5-j*.2);}
 // Fern/reed clusters are authored along banks, outside all entry and turn clearances.
 for(let i=0;i<70;i++){const z=-42+i*1.3;if([-36,-8,24,38].some(v=>Math.abs(z-v)<5))continue;const x=(i%2?1:-1)*(10.8+(i%3)*.35);for(let j=0;j<3;j++)bone(fixed,0x779063,[x+j*.2,0,z],[x+j*.25,.65+(j%2)*.35,z+.1],.025);}
 // Boundary stones communicate the framed district; no invisible fall-to-death edge.
 for(const [x,z,w,d] of [[-66,3,1,99],[66,3,1,99],[0,-46,133,1],[0,52,133,1]])solid(x,.7,z,w,1.4,d,0x748980);
 const staticBaked=bakeStatics(fixed);if(staticBaked!==fixed){root.remove(fixed);root.add(staticBaked);}
 return {root,roofs,sun,hemi,waters,walkMeshes,bridgeBody,update(dt,time,state,player,diorama=false){
  const open=state.bridge;bridgeBody.setEnabled(open);for(const e of leaves)e.pivot.rotation.z=open?0:e.side*Math.PI*.37;
  waters[1].visible=!state.drained;bed.visible=state.drained;wheel.rotation.z=state.drained?Math.PI*.6:0;gear.rotation.x=state.gearbox?Math.PI*.25:0;
  beacon.material.emissiveIntensity=state.bridge?.7:1.6+Math.sin(time*2)*.3;
  for(const r of roofs)r.visible=!(diorama&&player.x>21&&player.x<43&&player.z>-3&&player.z<17&&player.y<8.2);
  },supportAt(x,z,fallback=0){const hit=physics.world.castRay(new R.Ray({x,y:20,z},{x:0,y:-1,z:0}),23,true);return hit?20-hit.timeOfImpact:fallback;}};
}
