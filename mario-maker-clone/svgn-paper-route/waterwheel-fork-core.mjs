/* Authored choice information, not an input controller. No simulation or save writes. */
export const FORK=Object.freeze({id:'waterwheel-canal-choice',version:1,
 launch:'ww-runway',upper:'ww-crescent',lower:'ww-collector',
 upperPurpose:'Carry speed through the gallery to the wheelhouse.',
 lowerPurpose:'Brake, release, then return to Millworkers deliveries.',
 delivery:'millworkers-terrace',decisionRemaining:Object.freeze([260,60]),
 recovery:'Release the brake and continue on the road; the sky is optional.'});
export function brakeMarks(points){
 if(!Array.isArray(points)||points.length<2)return [];
 const length=[0];for(let i=1;i<points.length;i++)length.push(length[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 const total=length.at(-1),marks=[];
 for(let i=1;i<points.length;i++)if(total-length[i]<=FORK.decisionRemaining[0]&&total-length[i]>=FORK.decisionRemaining[1]&&i%3===0)marks.push({x:points[i][0],y:points[i][1],remaining:total-length[i]});
 return marks;
}
export const FORK_SIGNS=Object.freeze([
 Object.freeze({x:3730,y:1530,title:'BRAKE ZONE',detail:'RELEASE TO TAKE THE CANAL',w:290,h:72}),
 Object.freeze({x:4630,y:1900,title:'CANAL POST LINE',detail:'REJOIN FOR MILLWORKERS MAIL',w:300,h:72})
]);
