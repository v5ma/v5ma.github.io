/* Pure art placement plan. These values are NOT a second collision world.
 * Facade shells stay inside the two existing Quay building footprints. */
export const QUAY_BUILDINGS=Object.freeze([
 {id:'arrival',x:-10,z:9,w:9,d:9,floors:3,theme:'stone',title:'AETHER FREIGHT & ARCHIVE'},
 {id:'customs',x:11,z:-12,w:7,d:6,floors:3,theme:'brick',title:'MERIDIAN CUSTOMS'}
]);
export const QUAY_LAMPS=Object.freeze([[-15.7,0,-15.7],[15.7,0,-15.7],[-15.7,0,15.7],[15.7,0,15.7]]);
export const QUAY_PLANTERS=Object.freeze([[-14.7,0,-1.5,1.6],[-14.7,0,-12.3,1.7],[14.8,0,11.5,1.8],[-3.9,0,13.8,1.5],[6,0,14.7,1.7],[14.7,0,5.8,1.5]]);
export function facadePlan(b){const slots=[];for(const face of ['north','east','south','west']){
 const horizontal=face==='north'||face==='south',width=horizontal?b.w:b.d,count=Math.round(width/2),span=width/count;
 const yaw={north:0,east:-Math.PI/2,south:Math.PI,west:Math.PI/2}[face];
 for(let row=0;row<b.floors;row++)for(let n=0;n<count;n++){
  const along=-width/2+span*(n+.5),out=horizontal?b.d/2:b.w/2;
  let x=horizontal?b.x+along:b.x+(face==='east'?out:-out),z=horizontal?b.z+(face==='north'?-out:out):b.z+along;
  x-=Math.sin(-yaw)*.28;z+=Math.cos(yaw)*.28;
  const door=row===0&&face==='north'&&n===Math.floor(count/2);
  const module=door?'DoorFrame_Trim':row===0?'Trim_FirstFloor_Window_001':b.theme==='brick'?'Brick_Window_Square_Single':'Trim_Window';
  slots.push({module,x,y:row*3,z,yaw,sx:span/2,door,face});
 }
 }
 return slots;
}
export function roofPlan(b){
 const parts=[];
 for(const face of ['north','east','south','west']){
  const horizontal=face==='north'||face==='south',width=(horizontal?b.w:b.d)-4.28,count=Math.max(1,Math.round(width/2)),span=width/count;
  const yaw={north:0,east:-Math.PI/2,south:Math.PI,west:Math.PI/2}[face],nx=-Math.sin(yaw),nz=-Math.cos(yaw);
  for(let i=0;i<count;i++){const along=-width/2+span*(i+.5),x=horizontal?b.x+along:b.x+(face==='east'?b.w/2:-b.w/2),z=horizontal?b.z+(face==='north'?-b.d/2:b.d/2):b.z+along;parts.push({module:i%2?'Roof_Slate_Center':'Roof_Slate_Window_1',x:x-nx*.14,y:9.7,z:z-nz*.14,sx:span/2,yaw:yaw+Math.PI,face});}
 }
 const L=b.x-b.w/2+.14,R=b.x+b.w/2-.14,N=b.z-b.d/2+.14,S=b.z+b.d/2-.14;
 for(const [x,z,yaw]of[[L+1,S,0],[R,S-1,Math.PI/2],[R-1,N,Math.PI],[L,N+1,-Math.PI/2]])parts.push({module:'Roof_Slate_Corner',x,y:9.7,z,sx:1,yaw,face:'corner'});
 return parts;
}
