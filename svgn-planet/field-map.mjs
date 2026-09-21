import {CITY,WORLD,RADIUS,distance,target,dot,cross,norm,tangent} from './model.mjs';
import {waterTarget} from './tidewater-core.mjs';
import {storyTarget} from './homecoming.mjs';
import {jobTarget} from './activities.mjs';
export function cityMissionTarget(s,waypoint){return waterTarget(s)||storyTarget(s)||jobTarget(s)||(waypoint==='post'?WORLD.sites[0]:CITY.districts.find(d=>d.id===waypoint))||target(s);}
/* Local tangent-map projection; out-of-range objectives stay on the rim with a
 * numeric distance. Uses the exact active task target, never a invented quest. */
export function drawCityFieldMap(canvas,s,waypoint){
 const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height,range=150,scale=Math.min(w,h)/2/range;
 const forward=norm(tangent(s.north,s.n)),right=norm(cross(forward,s.n));
 const project=n=>({x:w/2+dot(n,right)*RADIUS*scale,y:h/2-dot(n,forward)*RADIUS*scale});
 g.fillStyle='#183b46';g.fillRect(0,0,w,h);g.strokeStyle='#547b7a';g.lineWidth=3;
 for(const road of [...WORLD.roads,...CITY.roads]){let last=null;g.beginPath();for(const n of road.points){const p=project(n);if(dot(n,s.n)<.95||p.x<0||p.x>w||p.y<0||p.y>h){last=null;continue;}if(last)g.lineTo(p.x,p.y);else g.moveTo(p.x,p.y);last=p;}g.stroke();}
 const t=cityMissionTarget(s,waypoint),p=project(t.mail),dx=p.x-w/2,dy=p.y-h/2,l=Math.max(1,Math.abs(dx)/(w/2-16),Math.abs(dy)/(h/2-16)),x=w/2+dx/l,y=h/2+dy/l;
 g.fillStyle='#ffda55';g.strokeStyle='#172531';g.lineWidth=3;g.beginPath();g.moveTo(x,y-11);g.lineTo(x+11,y);g.lineTo(x,y+11);g.lineTo(x-11,y);g.closePath();g.fill();g.stroke();
 g.fillStyle='#8ceaff';g.beginPath();g.arc(w/2,h/2,7,0,Math.PI*2);g.fill();g.fillStyle='#e4f7f1';g.font='bold 14px sans-serif';g.fillText('N',w/2-5,18);g.fillText(Math.round(distance(s.n,t.mail))+' m',8,h-10);
}
