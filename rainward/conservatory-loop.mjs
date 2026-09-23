// Carve only a previously solid wall. No new resource, task or save key.
export const GARDEN_REVISION='conservatory-maintenance-1';
export const ARCHIVE_SERVICE_GATE='archive-maintenance-shutter';
export const GARDEN_RETURN=Object.freeze([[-40,-21],[-40,-23],[-40,-27],[-33,-27],[-26,-27],[-18,-27],[-16,-22],[-16,-10]]);
export function applyConservatoryLoop(data){
 if(data.id!=='conservatory'||data.gardenRevision===GARDEN_REVISION)return data;
 const wall=data.obstacles.find(o=>o.id==='archive-n');
 if(!wall||wall.x!==-35||wall.z!==-25||wall.w!==24||wall.d!==1.2)throw Error('Review archive wall before applying the maintenance loop');
 data.obstacles=data.obstacles.map(o=>o===wall?{...o,x:-30.5,w:15}:o).concat([
  {...wall,id:'archive-service-west-pier',x:-44.5,w:5},
  {...wall,id:ARCHIVE_SERVICE_GATE,x:-40,w:4,h:3,kind:'service-gate',openOnTask:'archive-pages',disabled:false,gardenServiceArt:true},
  {...wall,id:'archive-service-lintel',x:-40,w:4,bottom:3,h:6}
 ]);
 data.tasks=data.tasks.map(t=>t.id==='archive-pages'?{...t,description:'Recover the rain-soaked catalogue and operate its desk-side maintenance release. The archive north shutter opens into the service court before the sluice. The original garden entrances remain usable.',completionHint:'CATALOGUE RECOVERED / NORTH ARCHIVE SHUTTER OPEN. The maintenance court returns to the colonnade before the sluice. Pursuers can follow.'}:t);
 data.gardenRevision=GARDEN_REVISION;return data;
}
export function buildConservatoryLoop(scene,A,chapter){
 const spec=chapter.obstacles.find(o=>o.id===ARCHIVE_SERVICE_GATE);if(!spec)return {update(){}};
 const door=A.mesh('box',[spec.w,spec.h,spec.d],0x526b61,'metal');door.name=ARCHIVE_SERVICE_GATE;door.position.set(spec.x,spec.h/2,spec.z);scene.add(door);
 const label=A.label('ARCHIVE SERVICE\nRELEASE AT CATALOGUE',-43.7,1.85,-24.38,2.2,.6,'#344d45','#dbd8bb');label.material.side=0;
 // A backed, noninteractive sightline landmark and irrigation pipe. Do not add
 // giant floating directions or solid furniture on old walkable save points.
 A.add('box',-42.4,3.35,-24.32,.09,.09,2.1,0x829184,'metal');
 A.add('box',-40,3.35,-24.32,4.8,.09,.09,0x829184,'metal');
 A.add('box',-40.7,1.4,-3,.14,.3,.14,0xb2a77d,'metal');
 return {update(state){const open=state.completedTasks.includes('archive-pages');door.visible=!open;}};
}
