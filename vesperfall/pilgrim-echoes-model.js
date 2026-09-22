/* Original public story fragments. Collection adds no money, damage or gates. */
(function(root){'use strict';
 const NOTES=Object.freeze([
  {id:'causeway-dispatch',title:"Ilyra's dispatch",short:'The lanterns guide the missing pilgrims. Read the dispatch in your story journal.',text:'Orin, the Causeway has gone dark. Two relay lanterns mark the route our pilgrims took into the Ashen Archive. The wardens defend their orders, not the people who wrote them. Restore the signals; do not mistake killing for rescue. I will wait beyond the far beacon. - Keeper Ilyra'},
  {id:'causeway-slate',title:"Courier's slate",short:'Orin found a way around the shutters. The service latch opens a lasting retreat.',text:'I watched from the gallery before I crossed. Raising the shutter gave me a clean shot, but gave the watcher the same. The service passage took longer and kept me alive. I unbarred its latch so the next courier could retreat without repeating my mistake. - Orin'},
  {id:'causeway-ledger',title:'Evacuation ledger',short:'The pilgrims reached the Archive. The two lanterns reveal their next refuge.',text:'The ledger records no dead, only names moved from the Causeway to the Archive reading room. Ilyra did not ask for revenge. She asked for a route someone frightened could follow. Beyond this beacon, two sealed lenses still hide the record of where they went.'},
  {id:'archive-seal',title:"Archivist's seal",short:'Unseal both lenses to recover the route, not merely to open another door.',text:'We sealed the lenses when the wardens began burning names out of the evacuation books. Ordinary arrows still carry enough resonance to open them. Use the columns, read the galleries, and reach the restored room. The missing pilgrims deserve to be remembered.'},
  {id:'archive-watch',title:'The last watch',short:'The fallen courier left a retreat, not a demand that you kill every defender.',text:'I thought courage meant crossing faster. I learned it meant leaving a way back. The stacks break the watchers\' sight; the service gate turns a dead end into a return. Whoever takes this route next, save your strongest arrows for the threats that stand between you and the living. - Orin'},
  {id:'archive-reply',title:"Keeper's reply",short:'The route is restored. The pilgrims left together; their names survived.',text:'You restored more than lanterns. The Archive now records that the pilgrims left together, with Orin guiding the final group. Take a blessing and carry their route into the cathedral beyond. This chapter ends in a way forward, not an empty room full of defeated wardens. - Ilyra'}
 ]);
 function anchors(s){if(!s.pilgrimage)return [];const offset=s.pilgrimage.stage*3,c=s.world.pipeline.connector,exit=s.world.pipeline.controls.find(c=>c.kind==='exit');return [
  {...NOTES[offset],p:[s.world.start[0]-1.5,s.world.start[1],s.world.start[2]-1]},
  {...NOTES[offset+1],p:[(c[1][0]+c[2][0])/2-1,c[1][1],c[1][2]]},
  {...NOTES[offset+2],p:[exit.p[0]-2,exit.p[1],exit.p[2]+1.5]}
 ];}
 function current(s,C){if(s.phase!=='playing'||s.unscored)return null;return anchors(s).filter(n=>Math.abs(n.p[1]-s.p[1])<.65&&Math.hypot(n.p[0]-s.p[0],n.p[2]-s.p[2])<1.9&&!C.segmentBlocked(s.world,s.head,[n.p[0],n.p[1]+.6,n.p[2]],.02)).sort((a,b)=>C.len(C.sub(a.p,s.p))-C.len(C.sub(b.p,s.p)))[0]||null;}
 function clean(raw){return Array.isArray(raw)?[...new Set(raw.filter(id=>NOTES.some(n=>n.id===id)))].slice(0,6):[];}
 function opacity(elapsed){return elapsed<0||elapsed>=2000?0:elapsed<1500?1:(2000-elapsed)/500;}
 const api=Object.freeze({NOTES,anchors,current,clean,opacity});root.PilgrimEchoesModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
