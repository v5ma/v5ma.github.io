/* Original upper archive annex and optional sequel. One geometry description
 * supplies support/collision, wayfinding and scenery; no forced actor movement. */
export const ARCHIVE_FLOORS=Object.freeze([
 Object.freeze({id:'archive-room',x:-20.15,y:10.8,z:-5.05,w:5.9,d:4.2,highline:true}),
 Object.freeze({id:'archive-roof',x:-20.15,y:14,z:-5.05,w:5.9,d:4.2,highline:true})
]);
export const ARCHIVE_WALLS=Object.freeze([
 {id:'archive-west',x:-23.05,y:10.8,z:-5.05,w:.18,d:4.2,h:3.2},
 {id:'archive-north',x:-20.15,y:10.8,z:-7.07,w:5.9,d:.18,h:3.2},
 {id:'archive-south',x:-20.15,y:10.8,z:-3.03,w:5.9,d:.18,h:3.2}
].map(w=>Object.freeze({...w,color:0xc9b190,cut:true,highline:true})));
export function archiveDoor(w){
 if(w.id!=='highline-print-west')return [w];
 // Split the real wall, only for the 10.8 m archive doorway. Keep the other
 // floors closed and preserve sufficient head clearance on both approaches.
 return [
  {...w,id:w.id+'-below',h:10.8-w.y},
  {...w,id:w.id+'-above',y:13.8,h:w.y+w.h-13.8},
  {...w,id:w.id+'-south-jamb',y:10.8,h:3,z:.125,d:6.75},
  {...w,id:w.id+'-north-jamb',y:10.8,h:3,z:-5.925,d:.35}
 ];
}
export const ARCHIVE_GUIDE=Object.freeze([
 {label:'Archive doorway',x:-17.4,y:10.8,z:-5.05},
 {label:'Archive reading room',x:-20,y:10.8,z:-5.05}
].map(Object.freeze));
const point=(id,label,x,y,z)=>({id,label,x,y,z,kind:'interact'});
export const ARCHIVE_CASE=Object.freeze({id:'unsent',title:'Archive: The Unsent Call',reward:120,
 summary:'After Highline, follow Sal\'s recording into Ada\'s upper reading room. Isolate the crossfeed, uncover the original sender and return with a lead.',steps:[
 point('unsent-brief','Ask Ada about Sal\'s recording / print shop',-9.5,0,4.5),
 point('unsent-isolate','Isolate the archive crossfeed / upper reading room',-19.1,10.8,-6),
 point('unsent-read','Read the recovered service log / upper reading room',-21.5,10.8,-4.6),
 point('unsent-report','Bring the original call to Sal / old loading loft',12,4.4,0)
 ]});
export const ARCHIVE_STORY=Object.freeze({
 'unsent-brief':'Ada: Sal\'s recording has two voices sharing one channel. My upper reading room has the original service log. Isolate the damaged crossfeed first; do not shut down the ward.',
 'unsent-isolate':'The archive channel turns green. Ada: There. The forged maintenance orders were covering a request for help, not creating it. The reading desk can recover the sender now.',
 'unsent-read':'The service log names the South Cable Exchange. Its night operator asked for a manual inspection before the sender field was erased. Sal: Bring that original call down. We need to hear the person, not just chase the signal.',
 'unsent-report':'Sal: An operator tried to warn us, and somebody buried the call in our own system. Keep Ada\'s route open. The South Cable Exchange is our next lead, not a destination we can reach yet.'
});
export const archiveIsolated=s=>(s.campaign?.progress?.unsent||0)>=2;
