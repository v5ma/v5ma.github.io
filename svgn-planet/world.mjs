/* Shared world coordinates, in meters. Every route remains on the same sphere. */
export const RADIUS=55;
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const mul=(a,t)=>a.map(v=>v*t);
export const norm=a=>{const l=Math.hypot(...a);return l>1e-9?mul(a,1/l):[0,1,0];};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const tangent=(v,n)=>norm(add(v,mul(n,-dot(v,n))));
export function rotate(v,axis,angle){const c=Math.cos(angle),s=Math.sin(angle);return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)));}
export const at=(x,z)=>{const a=x/RADIUS,b=z/RADIUS;return [Math.sin(a)*Math.cos(b),Math.cos(a)*Math.cos(b),Math.sin(b)];};
export const distance=(a,b)=>Math.acos(clamp(dot(a,b),-1,1))*RADIUS;
// A continuous street with constant-width verges, including across a pole.
export const street=(t,lateral=0)=>{const a=t/RADIUS,b=lateral/RADIUS;return [Math.sin(b),Math.cos(b)*Math.cos(a),-Math.cos(b)*Math.sin(a)];};
export const streetPosition=n=>Math.atan2(-n[2],n[1])*RADIUS;
export function height(n){const a=Math.atan2(-n[2],n[1]),ground=.6*Math.sin(a*3)+.3*Math.cos(n[0]*9+a*2);return Math.abs(n[0]-(.32+.035*Math.sin(a*4)))<.023?-.7:ground;}
export const point=(n,lift=0)=>mul(n,RADIUS+height(n)+lift);
export const rand=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function world(){
 const specs=[['post','SVGN delivery depot',-9,-1,'#efca83','post'],['cabin','01 · Cedar House',12,-1,'#f0d3ae','cabin'],['fern','02 · Fern Terrace',24,1,'#b7cfb4','cabin'],['mill','03 · Willow Cottage',36,-1,'#e9b39f','mill'],['terrace','04 · Bayview Terrace',48,1,'#c3d5cf','cabin'],['beacon','05 · Observatory House',60,-1,'#e6d6b2','cabin'],['market','06 · Corner Store',72,1,'#e7bd8c','post'],['quay','07 · Seabreeze House',84,-1,'#b8c4d9','cabin'],['harbor','08 · Harbor House',96,1,'#e0c1bc','cabin'],['garden','Community garden',111,-1,'#bfcf9a','garden']];
 const sites=specs.map(([id,name,t,side,color,type])=>({id,name,t,side,color,type,n:street(t,side*9.3),mail:street(t,side*5.1),message:id==='post'?'Pick any route. Deliver to the raised mailbox flags, then return here.':id==='garden'?'The road continues beyond the neighborhood. Explore at your own pace.':'Thanks for bringing the neighborhood news!'}));
 const homes=sites.filter(s=>!['post','garden'].includes(s.id)),trees=[];
 for(let i=0;i<200;i++){const z=rand(i+991)*2-1,a=rand(i)*Math.PI*2,n=[Math.sqrt(1-z*z)*Math.sin(a),Math.sqrt(1-z*z)*Math.cos(a),z];if(Math.abs(n[0])<.24||Math.abs(n[2])<.08||sites.some(s=>distance(s.n,n)<5)||height(n)<-.3)continue;trees.push({id:'tree-'+i,n,size:1.25+rand(i+2)*1.5,style:i%5===0?'fir':'oak',seed:i});}
 for(let i=0;i<12;i++)for(const side of[-1,1])trees.push({id:'avenue-'+i+'-'+side,n:street(i*12+5,side*6.8),size:1.15+rand(i)*.5,style:'oak',seed:i+300});
 const rocks=[[125,19,9],[150,21,14],[180,-24,12],[220,-18,7]].map(([t,x,size],i)=>({n:street(t,x),size,id:'rock-'+i}));
 const stars=Array.from({length:16},(_,i)=>({id:'stamp-'+i,n:street(7+i*15,(i%2?1:-1)*4.3)}));
 return {sites,homes,trees,rocks,stars};
}
export const WORLD=world();
