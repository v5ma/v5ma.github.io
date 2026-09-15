/* Quiet, authored wayfinding for the already-built clinic seam.
 * No patrol disclosure, route auto-selection, checkpoint changes or HUD popup. */
import * as T from './vendor/three.module.js';
import {RECUT_ROUTES,RETURN_TASK,recutHeight} from './floodgate-recut.mjs';
export const CLINIC_CUES=Object.freeze([
 {x:-30,z:-20,dx:0,dz:1},{x:-30,z:-16,dx:0,dz:1},
 {x:-30,z:-11,dx:1,dz:0},{x:-26,z:-10,dx:1,dz:0},
 {x:-9.5,z:-10,dx:-1,dz:0},{x:-13,z:-10,dx:-1,dz:0},
 {x:-17.5,z:-10,dx:-1,dz:0},{x:-22,z:-9.5,dx:0,dz:1},
 {x:-22,z:-7,dx:0,dz:1},{x:-22,z:-4.8,dx:0,dz:1}
].map(Object.freeze));
export function clinicNavigation(state){
 if(state?.level!=='district')return null;
 const open=!!state.completedTasks?.includes(RETURN_TASK);
 return {open,status:open?'OPEN / YARD RETURN':'CLOSED / RELEASE FROM INSIDE',
  detail:open?'The west shutter now connects the clinic to the rain garden. Save at a shelter to retain route changes.':'Reach the latch from inside the clinic to open the west yard return. The map marks the closed crossing with an X.',
  legend:'CLINIC ROUTES: solid = terrace ramps; dotted = garden; '+(open?'open ring = yard return.':'X = shutter closed.')};
}
export function drawClinicRoutes(g,state,{x,z}){
 const nav=clinicNavigation(state);if(!nav)return;
 g.save();g.lineWidth=2;
 for(const [id,color,dash] of [['garden','#a7d6bb',[2,3]],['marketTerrace','#f3dd99',[]],['westRamp','#f3dd99',[]],['clinicReturn','#b9dadd',[5,3]]]){
  // A closed shutter is a visible blockage, not a promised walkable shortcut.
  g.strokeStyle=color;g.setLineDash(dash);g.beginPath();
  RECUT_ROUTES[id].points.forEach(([px,pz],i)=>g[i?'lineTo':'moveTo'](x(px),z(pz)));g.stroke();
 }
 g.setLineDash([]);const gx=x(-28),gz=z(5.8);g.strokeStyle=nav.open?'#e8f4d5':'#ffc2ac';g.lineWidth=2.5;g.beginPath();
 if(nav.open)g.arc(gx,gz,4,0,Math.PI*2);else{g.moveTo(gx-4,gz-4);g.lineTo(gx+4,gz+4);g.moveTo(gx+4,gz-4);g.lineTo(gx-4,gz+4);}g.stroke();g.restore();
}
export function createClinicJournal(){
 const root=document.createElement('details');root.id='clinic-route-guide';
 const summary=document.createElement('summary');summary.id='clinic-route-guide-open';summary.textContent='CLINIC / TERRACE / RETURN ROUTE';
 const status=document.createElement('p');status.id='clinic-route-status';
 const detail=document.createElement('p');const routes=document.createElement('p');
 routes.textContent='The garden approach stays at street level. The market and collapsed-ruin ramps meet at the observation terrace, 2.4 metres above the street. Follow the painted chevrons down into the clinic. These are route choices, not protection from enemies.';
 const legend=document.createElement('p');legend.id='clinic-route-legend';root.append(summary,status,detail,routes,legend);
 const map=document.getElementById('map');map.parentNode.insertBefore(root,map);let previous='';
 return {update(state){const nav=clinicNavigation(state);root.hidden=!nav;if(!nav)return;const key=nav.status;if(key===previous)return;previous=key;status.textContent=nav.status;detail.textContent=nav.detail;legend.textContent=nav.legend;}};
}
export function createClinicCues(scene){
 // Low painted chevrons conform to the same floor function as the body and ramps.
 const vertices=[];
 for(const {x,z,dx,dz}of CLINIC_CUES){const len=Math.hypot(dx,dz),fx=dx/len,fz=dz/len,sx=fz,sz=-fx;
  const points=[[0,.48],[-.38,-.16],[-.22,-.27],[0,.13],[.22,-.27],[.38,-.16]];
  for(const triangle of [[0,1,2],[0,2,3],[0,3,4],[0,4,5]])for(const i of triangle){const [side,forward]=points[i],px=x+sx*side+fx*forward,pz=z+sz*side+fz*forward;vertices.push(px,recutHeight(px,pz)+.035,pz);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:0xd6c28e,roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const mesh=new T.Mesh(geometry,material);mesh.name='Clinic floor route chevrons';scene.add(mesh);return {mesh,count:CLINIC_CUES.length};
}
