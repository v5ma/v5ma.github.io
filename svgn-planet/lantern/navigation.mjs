import {walls,floors} from './core.mjs';
import {stories,residents,cityState,storyTarget,cityMarkers,available} from './city.mjs';
export function missionOptions(s){const c=cityState(s);return [{id:'main',title:'The Broken Delivery Loop'+(s.claimed?' / complete':''),detail:'Original depot delivery, restored connection and return.'},...stories.map(m=>({id:m.id,title:m.title+(c.completed.includes(m.id)?' / complete':!available(s,m)?' / after 3 resident stories':''),detail:residents.find(r=>r.id===m.giver).name+' / '+m.summary,disabled:c.completed.includes(m.id)||!available(s,m),active:c.active===m.id,stage:c.progress[m.id]}))];}
export function navigation(s,yaw=0){const t=storyTarget(s);if(!t)return {label:'Meet a resident marked ! or open Missions.',distance:0,angle:0,level:'',target:null};const dx=t.x-s.x,dz=t.z-s.z;return {label:t.label,distance:Math.hypot(dx,dz,t.y-s.y),angle:Math.atan2(dx,-dz)+yaw,level:t.y>s.y+1?'UPSTAIRS':t.y<s.y-1?'LOWER LEVEL':'THIS LEVEL',target:{...t}};}
export function drawMap(canvas,s,mini=false){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad=mini?9:28,sx=(w-pad*2)/50,sz=(h-pad*2)/44,X=x=>pad+(x+25)*sx,Z=z=>pad+(z+22)*sz;
 c.fillStyle='#152c38';c.fillRect(0,0,w,h);c.fillStyle='#385759';c.fillRect(X(-24),Z(-21),48*sx,42*sz);
 c.fillStyle=s.water==='high'?'#468eae':'#7c958d';c.fillRect(X(-3),Z(-13),5*sx,28*sz);
 c.fillStyle='#b99877';for(const b of walls){if(b.gate&&s.gate)continue;c.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),Math.max(1,b.w*sx),Math.max(1,b.d*sz));}
 c.strokeStyle='#b7cfca';c.lineWidth=mini?1:2;c.setLineDash([4,3]);for(const f of floors.filter(f=>f.y>3&&!f.id.endsWith('-roof'))){c.strokeRect(X(f.x-f.w/2),Z(f.z-f.d/2),f.w*sx,f.d*sz);}c.setLineDash([]);
 c.textAlign='center';c.textBaseline='middle';
 for(const r of cityMarkers(s)){if(!r.available)continue;c.fillStyle='#a08022';c.beginPath();c.arc(X(r.x),Z(r.z),mini?6:11,0,Math.PI*2);c.fill();c.fillStyle='#fff3be';c.font='bold '+(mini?9:15)+'px sans-serif';c.fillText('!',X(r.x),Z(r.z));}
 if(!mini){c.fillStyle='#e5eeee';c.font='12px sans-serif';for(const [txt,x,z]of[['DEPOT',-12,19],['PRINT',-12,9],['KITCHEN',-20.5,5],['STOREHOUSE',-10,-20],['GREENHOUSE',18,-20],['WORKSHOP',15,14],['PUMP',7,-14]])c.fillText(txt,X(x),Z(z));}
 const t=storyTarget(s);if(t){c.fillStyle='#ffda55';c.strokeStyle='#1b2933';c.lineWidth=3;const x=X(t.x),z=Z(t.z),r=mini?9:17;c.beginPath();c.moveTo(x,z-r);c.lineTo(x+r,z);c.lineTo(x,z+r);c.lineTo(x-r,z);c.closePath();c.fill();c.stroke();c.fillStyle='#25323b';c.font='bold '+(mini?11:20)+'px sans-serif';c.fillText('★',x,z);}
 c.save();c.translate(X(s.x),Z(s.z));c.rotate(-s.yaw);c.fillStyle='#8ceaff';c.strokeStyle='#142733';c.lineWidth=2;c.beginPath();c.moveTo(0,-9);c.lineTo(6,6);c.lineTo(0,3);c.lineTo(-6,6);c.closePath();c.fill();c.stroke();c.restore();
}
