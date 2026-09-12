/* Original Floodgate narrative and route annotations. No enemy locations or
 * gameplay shortcuts are encoded in the guide. All reading is optional. */
export const FLOODGATE_NOTES=Object.freeze([
 {id:'south-letter',title:'For the next person',author:'Mara / shelter volunteer',x:-1.8,z:28,text:'We left the lamp burning for whoever comes after us. The transmitter needs a signal battery from the clinic and a spindle from Freight Hall. Bring both to the floodgate. The garden path is slower, but the grass and low walls break up the street. You do not have to fight everyone you hear.'},
 {id:'garden-ledger',title:'The rain garden',author:'Ivo / groundskeeper',x:-20,z:18.4,text:'The beds used to catch stormwater before it reached the clinic. Now they catch every seed the city lets go. Keep low through the grass; it hides a shape, not a footstep at somebody\'s boots. The front doorway is still clear. Please leave the path clear for the next person.'},
 {id:'clinic-letter',title:'Leave one light',author:'Mara / field clinic',x:-25.3,z:2.4,text:'We moved the last patients north before the street filled. I put the signal battery in the back room. Record your supplies at the shelter before crossing to the freight hall. A light in a window is not a promise that a building is empty. It is a promise that somebody once tried to help.'},
 {id:'market-receipt',title:'A debt settled',author:'Jon / market porter',x:-26,z:-22.3,text:'Two tins, one roll of cloth, and a bottle with no label. Take what keeps you moving. We stopped counting debts when the pumps stopped. Sound carries across the market; a bottle can send a lookout toward a noise, but the noise is not a wall. Move while they investigate.'},
 {id:'freight-manifest',title:'The north loading door',author:'Freight crew / last shift',x:16,z:-16,text:'The gate spindle never made it onto the last truck. It is still in the north end of Freight Hall. When you have both components, follow the floodgate signs. Save your strength for the open quay. The fastest route and the safest route are not always the same.'},
 {id:'quay-postcard',title:'A way through',author:'Unsigned / found at the quay',x:3,z:-40,text:'We did not fix the whole city. We found one route, marked it, and came back for the others. That was enough for today. If the gate opens for you, leave the marks where they are. Somebody behind you is still looking for a way through.'}
]);
export const FLOODGATE_ROUTES=Object.freeze({
 garden:{title:'Garden approach',order:['cell','crank'],description:'Clinic first. Cross the rain garden, use low cover and the clinic shelter, then work around the market toward Freight Hall.',points:[[0,27],[-13,23],[-19,16],[-19,7],[-24,6],[-24,-3.5],[-22,-3.5]],tag:'MORE COVER / CLINIC FIRST'},
 freight:{title:'Freight approach',order:['crank','cell'],description:'Freight Hall first. Use the eastern verge and building entrances. The crossing is exposed: watch patrols, listen, and keep a retreat open.',points:[[0,27],[13,23],[18,13],[20,4],[21,-5],[21,-12],[21,-19],[21,-27],[22.3,-26.7]],tag:'EXPOSED CROSSINGS / FREIGHT FIRST'}
});
// These are real low-cover collision boxes, not decorative invisibility zones.
export const FLOODGATE_COVER=Object.freeze([
 {id:'garden-screen-west',x:-29,z:17,w:.7,d:6,h:1.05,kind:'brick',bottom:0},
 {id:'garden-screen-south',x:-22,z:22,w:5,d:.7,h:.95,kind:'brick',bottom:0}
]);
export function validFieldNotes(level,notes,route){return Array.isArray(notes)&&notes.length<=FLOODGATE_NOTES.length&&new Set(notes).size===notes.length&&notes.every(id=>level==='district'&&FLOODGATE_NOTES.some(n=>n.id===id))&&(route===null||level==='district'&&Object.hasOwn(FLOODGATE_ROUTES,route));}
