/* Original synthesis score and per-weapon transient recipes, no borrowed audio. */
export const SHOTS=Object.freeze({
 arc:{body:170,tail:.19,noise:.045,cutoff:3100,volume:.30},
 carbine:{body:94,tail:.13,noise:.13,cutoff:5600,volume:.35},
 sniper:{body:56,tail:.48,noise:.24,cutoff:2700,volume:.50},
 scatter:{body:70,tail:.29,noise:.20,cutoff:3900,volume:.43}
});
export const SCORE=Object.freeze({chords:[[50,57,62,65],[46,53,58,62],[53,60,65,69],[48,55,60,64]],melody:[0,7,12,16,14,7,11,9],bpm:112});
export function cleanAudio(v){v=v&&typeof v==='object'?v:{};const n=(k,d)=>Number.isFinite(v[k])?Math.max(0,Math.min(1,v[k])):d;return{master:n('master',.72),effects:n('effects',.84),music:n('music',.38),ambience:n('ambience',.50),night:v.night===true};}
export function spatialMix(origin,listener,occluded=false){if(!origin)return{pan:0,gain:1,cutoff:16000};const dx=origin.x-listener.x,dz=origin.z-listener.z,d=Math.hypot(dx,origin.y-listener.y,dz),right=dx*Math.cos(listener.yaw)+dz*Math.sin(listener.yaw);return{pan:Math.max(-1,Math.min(1,right/(d||1))),gain:Math.min(1,1/(1+(d/18)**2))*(occluded?.32:1),cutoff:occluded?900:Math.max(1700,14000-d*100)};}
export function musicNotes(step,mode='calm'){const beat=step%16,bar=Math.floor(step/16),chord=SCORE.chords[bar%4],result=[];if(beat===0)for(const note of chord)result.push({note,duration:1.5,gain:.016,instrument:'pad'});if(beat%4===0)result.push({note:chord[0]-12,duration:.34,gain:mode==='combat'?.10:.045,instrument:'bass'});if(beat%2===0)result.push({note:chord[0]+12+SCORE.melody[(beat/2+bar)%8],duration:mode==='rail'?.22:.36,gain:.034,instrument:'bell'});return result;}
