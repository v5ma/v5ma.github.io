/* Original procedural geometry. Batched opaque meshes keep the Quest-targeted
 * scene bounded; no external models, image textures or downloaded font assets. */
(function(root){'use strict';
 function create(THREE,scene){
  const T=THREE,materials=new Map(),geos={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,10,7),cylinder:new T.CylinderGeometry(1,1,1,10),cone:new T.ConeGeometry(1,1,8),ring:new T.TorusGeometry(1,.055,6,32)};
  function mat(color,metal=0,glow=false){const key=color+metal+glow;if(!materials.has(key))materials.set(key,glow?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,metalness:metal,roughness:metal?.42:.9}));return materials.get(key);}
  function mesh(shape,color,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1,rz=0){const m=new T.Mesh(geos[shape],mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.z=rz;parent.add(m);return m;}
  class Batch{constructor(){this.groups=new Map();}add(shape,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,metal=0,glow=false){const k=shape+':'+color+':'+metal+':'+glow;if(!this.groups.has(k))this.groups.set(k,{shape,color,metal,glow,list:[]});const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));this.groups.get(k).list.push(matrix);}finish(parent){let n=0;for(const v of this.groups.values()){const m=new T.InstancedMesh(geos[v.shape],mat(v.color,v.metal,v.glow),v.list.length);v.list.forEach((a,i)=>m.setMatrixAt(i,a));m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();parent.add(m);n+=v.list.length;}return n;}}
  function beam(batch,a,b,w,color,metal=0){const dir=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir.clone().normalize()),e=new T.Euler().setFromQuaternion(q);batch.add('box',color,mid.x,mid.y,mid.z,w,dir.length(),w,e.x,e.y,e.z,metal);}
  function label(parent,text,x,y,z,w=3,h=.6,bg='#152d39',ink='#e5d5a7'){const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,768,192);g.strokeStyle='#887852';g.lineWidth=4;g.strokeRect(5,5,758,182);g.fillStyle=ink;g.font='500 45px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,98,718);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
  function arch(b,x,z,rotation,w=2,h=3.8,color='#79778b'){
   const tr=(a)=>[x+a[0]*Math.cos(rotation),a[1],z-a[0]*Math.sin(rotation)];
   for(const side of[-1,1]){beam(b,tr([side*w,0]),tr([side*w,h*.61]),.42,color);let prev=[side*w,h*.61];for(let i=1;i<=12;i++){const t=i/12,xx=side*w*(1-t)*(1-t),yy=h*.61+(h*.39)*t+Math.sin(t*Math.PI)*.16;const next=[xx,yy];beam(b,tr(prev),tr(next),.3,color);prev=next;}}
   b.add('cone','#b7a274',x,h+.26,z,.14,.6,.14,0,0,0,.4);b.add('ring','#ae9766',x,h*.68,z,.5,.5,.5,0,rotation,0,.4);
  }
  function world(model){const group=new T.Group();group.name='Vesperfall / original seeded cloister';const b=new Batch(),pal=[['#626575','#454658','#ba9d67'],['#6c625e','#413c49','#df9a5e'],['#657575','#394d55','#adbd91']][(model.depth-1)%3],random=VesperCore.rng(VesperCore.hash(model.seed));
   for(const f of model.floors){b.add('box',pal[1],f.x,-.32,f.z,f.w,.64,f.d);b.add('box',pal[0],f.x,-.03,f.z,f.w,.06,f.d);
    if(f.type==='bridge'){const along=f.w>f.d;for(const side of[-1,1]){if(along)beam(b,[f.x-f.w/2,.16,f.z+side*(f.d/2-.12)],[f.x+f.w/2,.16,f.z+side*(f.d/2-.12)],.13,pal[2],.2);else beam(b,[f.x+side*(f.w/2-.12),.16,f.z-f.d/2],[f.x+side*(f.w/2-.12),.16,f.z+f.d/2],.13,pal[2],.2);}for(let i=-3;i<=3;i++)b.add('box',pal[1],f.x+(along?i:0),.004,f.z+(along?0:i),along?.025:3.8,.013,along?3.8:.025);}
   }
   for(const w of model.solids){const p=w.min.map((v,i)=>(v+w.max[i])/2),d=w.max.map((v,i)=>v-w.min[i]);b.add('box',w.type==='cover'?'#7b787b':pal[0],...p,...d);b.add('box',pal[1],p[0],w.max[1]+.04,p[2],d[0]+.1,.12,d[2]+.1);if(w.type==='column'){b.add('box',pal[2],p[0],.3,p[2],1.14,.14,1.14,0,0,0,.3);b.add('box',pal[2],p[0],3.2,p[2],1.05,.12,1.05,0,0,0,.3);b.add('cone',pal[1],p[0],4.8,p[2],.8,1.4,.8,0,Math.PI/4);}}
   for(const r of model.rooms){
    b.add('cone',pal[1],r.x,-4,r.z,8,7,8,Math.PI,Math.PI/4);
    for(let i=-3;i<=3;i++){b.add('box',pal[1],r.x+i*1.8,.008,r.z,.018,.01,13);b.add('box',pal[1],r.x,.009,r.z+i*1.8,13,.01,.018);}
    for(const n of model.links[r.id]){const q=model.rooms[n],dx=Math.sign(q.x-r.x),dz=Math.sign(q.z-r.z);arch(b,r.x+dx*6.65,r.z+dz*6.65,dx?Math.PI/2:0,2,5.1);}
    for(const [x,z]of[[-5,-5],[5,-5],[-5,5],[5,5]]){b.add('cylinder',pal[1],r.x+x,.6,r.z+z,.18,1.2,.18);b.add('cone',pal[2],r.x+x,1.24,r.z+z,.28,.16,.28,Math.PI);b.add('ball','#8ef4ce',r.x+x,1.44,r.z+z,.1,.24,.1,0,0,0,0,true);}
    for(let i=0;i<14;i++){const x=r.x+(random()>.5?1:-1)*(5+random()),z=r.z+(random()*10-5);b.add('cone',i%2?'#354f51':'#51696a',x,.25,z,.11,.5,.11,0,random());}
    if(r.id!==1&&r.style===1){arch(b,r.x+3,r.z-4,0,.85,3.3,pal[1]);b.add('ball',pal[2],r.x+3,1.2,r.z-4,.18,.18,.18,0,0,0,.3);}
   }
   const exit=model.rooms[model.exit];arch(b,exit.x,exit.z-4,0,2.25,5.9,'#b9a680');label(group,'THE NEXT BELL',exit.x,4.7,exit.z-3.8,3.5,.55);const gate=new T.Group();group.add(gate);gate.position.set(exit.x,1.8,exit.z-3.8);mesh('ring','#5d6d82',gate,0,0,0,1.1,1.4,1);mesh('ring','#aa9466',gate,0,0,.03,.84,1.1,.9);gate.name='Exit beacon';
   for(const [i,p]of model.targets.entries()){b.add('cylinder',pal[2],p[0],.65,p[2],.065,1.3,.065);b.add('ring','#dcb773',...p,.48,.48,.48,0,0,0,.35);b.add('ball','#759ba0',p[0],p[1],p[2],.25,.25,.12,0,0,0,0,true);}
   label(group,'VESPERFALL',0,3.6,5.9,4.8,.9).rotation.y=Math.PI;
   label(group,'DRAW. RELEASE. BEGIN AGAIN.',0,2.8,5.88,4.5,.35).rotation.y=Math.PI;
   for(let i=0;i<30;i++){const ang=i/30*Math.PI*2,x=Math.sin(ang)*75,z=Math.cos(ang)*70-22,h=8+random()*24; b.add('box','#354355',x,h/2-12,z,4,h,4,0,ang);b.add('cone','#29394e',x,h-10,z,3,6,3,0,ang+Math.PI/4);}
   const instances=b.finish(group);return {group,gate,instances};
  }
  function enemy(kind){const g=new T.Group(),b=new Batch(),gold=kind==='warden'?'#d4b77c':'#9daec0',cloth=kind==='stalker'?'#4c6670':'#55536f',scale=kind==='warden'?1.3:1;
   b.add('cone',cloth,0,0,0,.4,.9,.32);b.add('ball',cloth,0,.34,0,.31,.3,.27);b.add('cone',cloth,0,.68,0,.28,.4,.27);b.add('box',gold,0,.59,.21,.31,.31,.08,0,0,0,.3);for(const side of[-1,1]){b.add('ball','#b8f6e2',side*.085,.65,.263,.03,.023,.02,0,0,0,0,true);beam(b,[side*.24,.31,0],[side*.45,-.02,.16],.12,cloth);}b.add('ring',gold,0,.92,0,.43,.43,.43,Math.PI/2,0,0,.3);b.finish(g);g.scale.setScalar(scale);return g;
  }
  function bow(){const g=new T.Group();g.name='Procedural recurved bow';const b=new Batch();let points=[];
   for(let i=0;i<=32;i++){const t=i/32*2-1;points.push([.10*Math.sin(t*Math.PI),t*.61,.11*Math.pow(Math.abs(t),1.5)]);}for(let i=1;i<points.length;i++)beam(b,points[i-1],points[i],.032,i%3?'#a98a59':'#ead7aa',.35);b.add('cylinder','#2c3942',0,0,0,.038,.22,.038);b.add('ball','#a8ecde',0,.17,.02,.047,.06,.025,0,0,0,0,true);b.finish(g);
   const stringGeometry=new T.BufferGeometry();stringGeometry.setAttribute('position',new T.Float32BufferAttribute([0,.61,.11,0,0,.1,0,-.61,.11],3));const string=new T.Line(stringGeometry,new T.LineBasicMaterial({color:'#d4f4dc'}));g.add(string);return {group:g,string};
  }
  function arrow(type='plain'){const g=new T.Group(),colors={plain:'#edd6ab',cinder:'#ffa470',frost:'#8dcfec',blink:'#80e7cc'};mesh('cylinder','#d4bf90',g,0,0,0,.012,.67,.012).rotation.x=Math.PI/2;mesh('cone',colors[type],g,0,0,-.39,.028,.15,.028).rotation.x=-Math.PI/2;for(const sign of[-1,1])mesh('box',colors[type],g,sign*.025,0,.25,.05,.01,.18,sign*.35);return g;}
  function dispose(group){const unique=new Set();group.traverse(o=>{if(o.geometry&&!Object.values(geos).includes(o.geometry))unique.add(o.geometry);if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms)if(![...materials.values()].includes(m)){m.map?.dispose();unique.add(m);}}});unique.forEach(x=>x.dispose());group.removeFromParent();}
  return {world,enemy,bow,arrow,label,mesh,mat,geos,Batch,beam,dispose};
 }
 root.VesperArt={create};
})(globalThis);
