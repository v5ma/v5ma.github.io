/* Readable blockmesh with original architectural story props. Not final art. */
import {createClinicCues} from './clinic-wayfinding.mjs';
import * as T from './vendor/three.module.js';
import {RECUT_SURFACES,recutHeight,RETURN_TASK,RECUT_REVISION} from './floodgate-recut.mjs';
export function createFloodgateRecutArt(scene,A,chapter){
 if(chapter.id!=='district')return {update(){},stats:()=>null,dispose(){}};
 const cues=createClinicCues(scene),surfaces=[];
 for(const r of RECUT_SURFACES){
  // Shared height function drives physical body placement and the actual mesh.
  const step=.5,nx=Math.ceil((r.x1-r.x0)/step),nz=Math.ceil((r.z1-r.z0)/step),positions=[],indices=[];
  for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){const x=r.x0+(r.x1-r.x0)*ix/nx,z=r.z0+(r.z1-r.z0)*iz/nz;positions.push(x,recutHeight(x,z)+.015,z);}
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){const a=iz*(nx+1)+ix,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:0x8b9e99,roughness:.9,side:T.DoubleSide}));mesh.name='Recut '+r.id;mesh.receiveShadow=true;scene.add(mesh);surfaces.push(mesh);
 }
 const gate=new T.Group();gate.name='Clinic return shutter';gate.position.set(-28,0,5.8);
 for(let i=0;i<7;i++){const bar=A.mesh('box',[.24,.09,2.65],0x727e7c,'metal');bar.position.y=.3+i*.36;gate.add(bar);}scene.add(gate);
 const amber=new T.Mesh(new T.SphereGeometry(.055,8,6),new T.MeshBasicMaterial({color:0xe9bb71}));amber.position.set(-27.3,1.3,4.65);scene.add(amber);
 const closedLabel=A.label('YARD SHUTTER\nRELEASE FROM INSIDE',-27.1,1.5,4.48,1.35,.4,'#344e4b','#f2dfb2');
 const openLabel=A.label('YARD RETURN OPEN\nRAIN GARDEN',-27.1,1.5,4.48,1.35,.4,'#344e4b','#f2dfb2');openLabel.visible=false;
 A.label('MARKET TERRACE\nCLINIC / RETURN',-15,2.9,-11.95,2.7,.45,'#344e4b','#f2dfb2');
 A.label('LAST WARD MOVED NORTH\nKEEP THE RETURN CLEAR',-22,2.9,-8.22,3,.45,'#4b5046','#eee2bd');
 A.label('CLINIC VIA TERRACE',-30,1.3,-22.05,2.7,.55,'#344e4b','#f2dfb2');
 const marker=A.mesh('box',[.26,.62,.2],0xab8854,'metal');marker.position.set(-27.3,.96,4.65);scene.add(marker);
 // The abandoned evacuation line explains why the inside-barred yard matters.
 for(let i=0;i<3;i++){const trolley=new T.Group();trolley.position.set(-26.25,0,-4.7+i*1.9);const bed=A.mesh('box',[1.1,.12,1.65],0xbbb99f,'cloth');bed.position.y=.67;trolley.add(bed);for(const x of [-.46,.46])for(const z of[-.64,.64]){const leg=A.mesh('box',[.06,.55,.06],0x5d6966,'metal');leg.position.set(x,.34,z);trolley.add(leg);}scene.add(trolley);}
 for(let x=-15;x<=-9;x+=1.5){const strip=A.mesh('box',[.22,.03,1],0xd0bd8d,'stone');strip.position.set(x,recutHeight(x,-10)+.04,-10);scene.add(strip);}
 let open=false;
 return {update(s){open=(s.completedTasks||[]).includes(RETURN_TASK);gate.position.y=open?3.45:0;gate.scale.y=open?.08:1;closedLabel.visible=!open;openLabel.visible=open;amber.material.color.setHex(open?0x9dccad:0xe9bb71);},stats:()=>({revision:RECUT_REVISION,phase:'playable-graybox',rampSurfaces:surfaces.length,upperHeight:2.4,returnGateOpen:open,routeChevrons:cues.count,gateLabel:open?'YARD RETURN OPEN':'RELEASE FROM INSIDE',finalArtApproved:false}),dispose(){}};
}
