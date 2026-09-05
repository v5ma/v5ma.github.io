/* Cloudview art kit. Original procedural geometry, no image-generated scenery.
   All dimensions are visual world units. This file never writes gameplay state. */
'use strict';
globalThis.CloudAssets=(()=>{
 function create(T){
  const colorCache=new Map(),cache=new Map();
  const rgb=c=>{if(!colorCache.has(c)){const v=new T.Color(c);colorCache.set(c,[v.r,v.g,v.b]);}return colorCache.get(c);};
  function primitive(key,make){if(!cache.has(key))cache.set(key,make());return cache.get(key);}
  function sphere(){return primitive('sphere',()=>{const p=[],n=[];const v=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let i=0;i<12;i++)for(let j=0;j<20;j++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12,c=j*Math.PI/10,d=(j+1)*Math.PI/10;for(const q of [v(a,c),v(b,c),v(b,d),v(a,c),v(b,d),v(a,d)]){p.push(...q);n.push(...q);}}return {p,n};});}
  function smallSphere(){return primitive('smallSphere',()=>{const p=[],n=[],v=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let i=0;i<4;i++)for(let j=0;j<8;j++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,c=j*Math.PI/4,d=(j+1)*Math.PI/4;for(const q of[v(a,c),v(b,d),v(b,c),v(a,c),v(a,d),v(b,d)]){p.push(...q);n.push(...q);}}return {p,n};});}
  function cylinder(top=1,sides=12){return primitive('cyl'+top+':'+sides,()=>{const p=[],n=[];function tri(a,b,c,na,nb=na,nc=na){p.push(...a,...b,...c);n.push(...na,...nb,...nc);}for(let i=0;i<sides;i++){const a=i/sides*2*Math.PI,b=(i+1)/sides*2*Math.PI,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),u=[ca,-.5,sa],v=[cb,-.5,sb],w=[cb*top,.5,sb*top],x=[ca*top,.5,sa],l=Math.hypot(1,1-top),na=[ca/l,(1-top)/l,sa/l],nb=[cb/l,(1-top)/l,sb/l];tri(u,w,v,na,nb,nb);tri(u,x,w,na,na,nb);tri([0,.5,0],w,x,[0,1,0]);tri([0,-.5,0],u,v,[0,-1,0]);}return {p,n};});}
  function torus(){return primitive('torus',()=>{const p=[],n=[];const at=(a,b)=>({p:[(1+.22*Math.cos(b))*Math.cos(a),(1+.22*Math.cos(b))*Math.sin(a),.22*Math.sin(b)],n:[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)]});for(let i=0;i<24;i++)for(let j=0;j<8;j++){const a=i/24*2*Math.PI,b=(i+1)/24*2*Math.PI,c=j/8*2*Math.PI,d=(j+1)/8*2*Math.PI;for(const v of[at(a,c),at(b,c),at(b,d),at(a,c),at(b,d),at(a,d)]){p.push(...v.p);n.push(...v.n);}}return {p,n};});}
  function box(){return primitive('box',()=>{const g=new T.BoxGeometry(1,1,1).toNonIndexed(),r={p:Array.from(g.attributes.position.array),n:Array.from(g.attributes.normal.array)};g.dispose();return r;});}
  class Batch{
   constructor(){this.p=[];this.n=[];this.c=[];}
   add(g,color,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
    const m=new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)).elements,col=rgb(color),[sx,sy,sz]=scale;
    for(let i=0;i<g.p.length;i+=3){const x=g.p[i]*sx,y=g.p[i+1]*sy,z=g.p[i+2]*sz;this.p.push(m[0]*x+m[4]*y+m[8]*z+pos[0],m[1]*x+m[5]*y+m[9]*z+pos[1],m[2]*x+m[6]*y+m[10]*z+pos[2]);const nx=g.n[i]/sx,ny=g.n[i+1]/sy,nz=g.n[i+2]/sz,l=Math.hypot(nx,ny,nz)||1;this.n.push((m[0]*nx+m[4]*ny+m[8]*nz)/l,(m[1]*nx+m[5]*ny+m[9]*nz)/l,(m[2]*nx+m[6]*ny+m[10]*nz)/l);this.c.push(...col);}return this;
   }
   box(x,y,z,w,h,d,c,rz=0){return this.add(box(),c,[x,y,z],[w,h,d],[0,0,rz]);}
   ell(x,y,z,rx,ry,rz,c,angle=0){return this.add(Math.max(rx,ry,rz)<=3.2?smallSphere():sphere(),c,[x,y,z],[rx,ry,rz],[0,0,angle]);}
   cone(x,y,z,r,h,c,top=0,sides=10){return this.add(cylinder(top,sides),c,[x,y,z],[r,h,r]);}
   torus(x,y,z,r,c){return this.add(torus(),c,[x,y,z],[r,r,r]);}
   rod(a,b,r,c){const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()),rot=new T.Euler().setFromQuaternion(q);return this.add(cylinder(),c,a.map((n,i)=>(n+b[i])/2),[r,v.length()||.001,r],[rot.x,rot.y,rot.z]);}
   tri(a,b,c,color){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;return this.add({p:[...a,...b,...c],n:[...n.map(x=>x/l),...n.map(x=>x/l),...n.map(x=>x/l)]},color);}
   finish(m,parent,options={}){
    if(!this.p.length)return null;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));if(options.map){const uv=new Float32Array(this.p.length/3*2);for(let i=0,j=0;i<this.p.length;i+=3){uv[j++]=this.p[i]/110;uv[j++]=this.p[i+1]/110;}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}g.computeBoundingSphere();
    const {unlit=false,...opts}=options,mat=unlit?new T.MeshBasicNodeMaterial({vertexColors:true,side:T.DoubleSide,...opts}):new T.MeshStandardNodeMaterial({vertexColors:true,side:T.DoubleSide,roughness:.56,metalness:.08,...opts});const mesh=m.makeSingle(g,mat);mesh.name='Cloudview merged art';parent.add(mesh);return mesh;
   }
  }
  function rock(batch,x,y,z,r,depth,seed=1){
   const rings=[],sides=25,cols=['#7389a0','#9cabb7','#b0b9ba','#8b9daa','#c2c8c4','#8091a2'];
   for(let level=0;level<6;level++){const ring=[];for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,k=1+Math.sin(j*17+seed)*.13+Math.sin(level*7+j*3+seed)*.09,rr=r*[1,1.02,.82,.6,.30,.025][level]*k;ring.push([x+Math.cos(a)*rr,y-depth*[0,.13,.33,.58,.84,1][level]+Math.sin(j*7+seed+level)*r*.07,z+Math.sin(a)*rr*.65]);}rings.push(ring);}
   for(let i=0;i<5;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides;batch.tri(rings[i][j],rings[i+1][j],rings[i+1][k],cols[(j+i+seed)%cols.length]);batch.tri(rings[i][j],rings[i+1][k],rings[i][k],cols[(j+i+seed+1)%cols.length]);}
  }
  function tree(b,x,y,z,s=1,seed=1){b.cone(x,y+10*s,z,1.6*s,22*s,'#766247',.65,6);for(let i=0;i<4;i++)b.cone(x,y+(14+i*6)*s,z,(11-i*2)*s,(17-i)*s,['#36764d','#4c8a45','#62a04c','#83b253'][(i+seed)%4],0,9);}
  function flowers(b,x,y,z,s=1){for(let i=0;i<7;i++){const px=x+Math.sin(i*2.4)*s*11,pz=z+Math.cos(i*2.4)*s*5,h=(3+i%3)*s;b.rod([px,y,pz],[px,y+h,pz],.45*s,'#59922f');b.ell(px,y+h,pz,1.6*s,1.2*s,1.6*s,i%2?'#ffe471':'#f393b2');b.ell(px,y+h+.5*s,pz, .6*s,.7*s,.6*s,'#f9f5d0');}}
  function grass(b,x,y,z,r,s=1){b.ell(x,y-2*s,z,r,5*s,r*.63,'#679e37');b.ell(x-r*.08,y,z,r*.95,3.5*s,r*.61,'#8cbf47');for(let i=0;i<26;i++){const a=i*2.4,rr=r*(.72+.25*(i%3)/2),px=x+Math.sin(a)*rr,pz=z+Math.cos(a)*rr*.62;b.tri([px-1.4*s,y,pz],[px,y+(4+i%4)*s,pz],[px+1.4*s,y,pz],'#9dc853');}}
  function city(b,x,y,z,s=1){
   for(let i=0;i<8;i++){const px=x+(i-3.5)*19*s,pz=z+((i%3)-1)*14*s,h=(22+i*7%26)*s;b.box(px,y+h/2,pz,14*s,h,12*s,'#edf0d9');b.box(px,y+h,pz,18*s,4*s,17*s,i%2?'#ebbc54':'#6597ba');for(let j=0;j<3;j++)b.box(px,y+9*s+j*9*s,pz+6.3*s,4*s,5*s,.8*s,'#638797');}
   for(const [dx,h,r]of[[-35,90,7],[10,125,9],[40,74,7]]){const px=x+dx*s;b.cone(px,y+h*s/2,z,r*s,h*s,'#f9f3d5',.85,8);b.cone(px,y+h*s+12*s,z,(r+3)*s,25*s,'#e9b844',0,8);for(let j=0;j<4;j++)b.box(px,y+(20+j*20)*s,z+r*s,3*s,8*s,1*s,'#568397');b.box(px,y+h*s+25*s,z,1.2*s,10*s,1.2*s,'#fbecc6');}
  }
  function courier(m,parent){
   const group=new T.Group();group.name='Cloudview courier and jet bike';parent.add(group);const b=new Batch(),lit=new Batch();
   // Twin-wheel hover-motorcycle, with real depth and a separate lit engine.
   b.ell(0,-9,0,23,6,7,'#f2ede0',-.10);b.ell(12,-6,1,13,5,7,'#197cbe',-.20);b.box(-9,-6,0,16,4,12,'#273c54');b.rod([-17,-13,0],[3,-4,0],1.7,'#e9a82e');b.rod([3,-4,0],[19,-14,0],1.5,'#9cbace');
   for(const x of[-17,19]){b.torus(x,-14,0,7,'#24374b');b.torus(x,-14,2.4,4.6,'#3189b8');b.ell(x,-14,3.7,2.1,2.1,1,'#e7ddbc');for(let j=0;j<5;j++){const a=j*2*Math.PI/5;b.rod([x,-14,3.3],[x+Math.cos(a)*4,-14+Math.sin(a)*4,3.3],.7,'#b2dbea');}}
   b.ell(-21,-8,-2,7,3,3.5,'#304b61');lit.ell(-26,-8,-2,2,2.4,2.6,'#67efff');lit.ell(26,-8,3,2,1.8,2,'#fff1a3');
   // Boots, bent legs, jacket, backpack, gloves and forward leaning helmet.
   b.rod([-4,3,2],[6,-4,5],3.7,'#315b80');b.rod([6,-4,5],[0,-11,7],2.8,'#284c6e');b.ell(2,-12,7,5,2.2,2.5,'#e29e31');
   b.ell(-3,10,0,7,9,5.4,'#f6b336',-.35);b.ell(0,13,0,5.4,7,4.7,'#fac456',-.38);
   b.rod([0,14,5],[9,9,7],2.3,'#edb345');b.rod([9,9,7],[16,11,7],2,'#ffd498');b.ell(17,11,7,2.8,2,2.3,'#243e59');b.rod([18,10,3],[20,-4,1],.85,'#aac7d4');
   b.ell(4,24,0,7.2,7.6,6,'#f3c392');b.ell(7,24,4.8,4.6,5.5,1.9,'#ffd6a7');b.ell(10,24,4.6,2.2,1.9,2,'#f4c293');
   b.ell(2.5,27.5,-.4,8.3,7,6.9,'#187ebc');b.ell(2,33.1,-.4,2.9,2,6.3,'#efa32e');b.box(6,27.6,6.3,12.5,4,1.7,'#eea32c',.04);b.ell(8.6,27.1,7.7,4,2.9,1.1,'#264956');b.ell(9.3,27.8,8.6,1.5,1.2,.35,'#b8f6f3');b.ell(8.8,23.9,6.7,.75,1.25,.4,'#283d4b');
   b.ell(6,19.4,6.1,2.1,.55,.4,'#c47753');b.box(-3,18,-1,12,3.4,12,'#e14b36',-.15);
   b.box(-14,7,-.5,13,14,12,'#d3a54d',-.08);b.box(-14,7,6,11,12,1,'#eac36b',-.08);b.box(-14,7,6.8,3,12,.4,'#f5ddad');b.box(-14,7,7.2,6,4,.4,'#efeee0');
   const scarf=new T.Group();scarf.position.set(-8,19,0);group.add(scarf);const sb=new Batch();sb.tri([0,0,1],[-22,-1,2],[-12,-5,2],'#ed513c');sb.tri([0,1,1],[-16,4,2],[-25,1,3],'#ff6744');sb.finish(m,scarf,{roughness:.85});
   b.finish(m,group,{roughness:.33,metalness:.14});lit.finish(m,group,{unlit:true});
   const flame=new T.Group();flame.position.set(-28,-8,-2);group.add(flame);const f=new Batch();f.ell(-7,0,0,9,1.7,1.7,'#55dfff');f.ell(-3,0,0,5,1,1,'#e5ffff');f.finish(m,flame,{unlit:true,transparent:true,opacity:.82,depthWrite:false});
   return {group,scarf,flame};
  }
  function envelope(b,x,y,z,s=1,angle=0){b.box(x,y,z,15*s,10*s,2*s,'#ffeac0',angle);const c=Math.cos(angle),n=Math.sin(angle),q=(a,d)=>[x+a*c-d*n,y+a*n+d*c,z+1.1*s];b.tri(q(-7*s,4*s),q(7*s,4*s),q(0,-1*s),'#fff5d8');b.rod(q(-7*s,4*s),q(0,-1*s),.28*s,'#ce994b');b.rod(q(0,-1*s),q(7*s,4*s),.28*s,'#ce994b');b.ell(x,y-1*s,z+1.8*s,1.5*s,1.4*s,.65*s,'#e85748');}
  return {Batch,sphere,cylinder,torus,rock,tree,flowers,grass,city,courier,envelope,dispose(){cache.clear();colorCache.clear();}};
 }
 return {create,version:'cloudview-1'};
})();
