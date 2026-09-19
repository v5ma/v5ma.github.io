/* Test-driver route planning only. Receives a detached inspection snapshot.
 * Returns waypoints; never writes the live actor, objectives, health or clocks. */
import {blocked,support,floorHeight,lineClear} from './core.mjs';
const step=.5;
export function walkRoute(snapshot,target){
 const s=structuredClone(snapshot);s.ride='foot';
 const key=(x,y,z)=>`${Math.round(x/step)},${Math.round(y*100)},${Math.round(z/step)}`;
 const h=n=>Math.hypot(target.x-n.x,target.z-n.z)+Math.abs(target.y-n.y)*2;
 const open=[],seen=new Map(),previous=new Map();
 const start={x:s.x,y:s.y,z:s.z,g:0};start.key=key(start.x,start.y,start.z);start.f=h(start);open.push(start);seen.set(start.key,start);
 let end=null,visited=0;
 while(open.length&&visited++<22000){
  let at=0;for(let i=1;i<open.length;i++)if(open[i].f<open[at].f)at=i;
  const n=open.splice(at,1)[0];if(n.closed)continue;n.closed=true;
  if(Math.hypot(n.x-target.x,n.z-target.z)<.8&&Math.abs(n.y-target.y)<.38){end=n;break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=Math.round((n.x+dx*step)/step)*step,z=Math.round((n.z+dz*step)/step)*step;
   if(Math.abs(x)>=23.7||Math.abs(z)>=20.7)continue;
   const f=support(s,x,z,n.y+.3);if(!f)continue;const y=floorHeight(f,z);
   if(y>n.y+.33||n.y-y>4.6||blocked(s,x,n.y,z)||blocked(s,x,y,z))continue;
   if(dx&&dz&&(blocked(s,x,n.y,n.z)||blocked(s,n.x,n.y,z)))continue;
   if(!lineClear(s,{x:n.x,y:n.y+.5,z:n.z},{x,y:y+.5,z}))continue;
   const k=key(x,y,z),g=n.g+Math.hypot(x-n.x,z-n.z)+Math.abs(n.y-y)*.2,old=seen.get(k);if(old&&old.g<=g)continue;
   const q={key:k,x,y,z,g,f:g+Math.hypot(target.x-x,target.z-z)+Math.abs(target.y-y)*2};seen.set(k,q);previous.set(k,n);open.push(q);
  }
 }
 if(!end)throw Error('No walking route from '+[s.x,s.y,s.z]+' to '+[target.x,target.y,target.z]);
 const path=[];for(let n=end;n&&n.key!==start.key;n=previous.get(n.key))path.push({x:n.x,y:n.y,z:n.z});path.reverse();
 // Keep real corners, height changes and stair steps; avoid thousands of no-op reads.
 const reduced=[];for(let i=0;i<path.length;i++){const a=i?path[i-1]:start,b=path[i],c=path[i+1];if(c&&Math.abs((b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x))<1e-5&&Math.abs(a.y-b.y)<.001&&Math.abs(b.y-c.y)<.001)continue;reduced.push(b);}
 return reduced;
}
