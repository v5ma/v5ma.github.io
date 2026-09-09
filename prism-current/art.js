/* Original visual language: enamel prisms, split light edges, fine lane guides.
 * Shared geometry/materials, pooled notes/fragments, no external artwork. */
(function(root){'use strict';
 function create(T,scene){const colors=[0x63eddd,0xff839d],materials=new Map(),textures=[];const group=new T.Group();scene.object3D.add(group);
  const mat=(color,metal=0,rough=.35)=>{const key=[color,metal,rough].join('/');if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return materials.get(key);};
  const neon=color=>{const key='n'+color;if(!materials.has(key))materials.set(key,new T.MeshBasicMaterial({color,toneMapped:false}));return materials.get(key);};
  const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12),sphere=new T.SphereGeometry(1,10,8);
  function mesh(parent,geo,material,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  function rounded(width=.29,depth=.22,radius=.035){const s=new T.Shape(),w=width/2,r=radius;s.moveTo(-w+r,-w);s.lineTo(w-r,-w);s.quadraticCurveTo(w,-w,w,-w+r);s.lineTo(w,w-r);s.quadraticCurveTo(w,w,w-r,w);s.lineTo(-w+r,w);s.quadraticCurveTo(-w,w,-w,w-r);s.lineTo(-w,-w+r);s.quadraticCurveTo(-w,-w,-w+r,-w);const g=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.008,bevelThickness:.01,curveSegments:5});g.translate(0,0,-depth/2);return g;}
  const prism=rounded(),frame=new T.EdgesGeometry(prism,30),disc=new T.RingGeometry(.18,.187,48);
  function glyph(hand,dir){const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d');p.clearRect(0,0,128,128);p.fillStyle='#092733';p.font='bold 16px system-ui';p.fillText(hand?'R':'L',13,25);p.save();p.translate(64,71);p.fillStyle='#092733';if(dir===6){p.beginPath();p.arc(0,0,16,0,7);p.fill();}else{const d=PrismCore.dirs[dir];p.rotate(Math.atan2(-d[1],d[0]));p.beginPath();p.moveTo(29,0);p.lineTo(1,-22);p.lineTo(1,-8);p.lineTo(-24,-8);p.lineTo(-24,8);p.lineTo(1,8);p.lineTo(1,22);p.closePath();p.fill();}p.restore();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);return new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});}
  const glyphs=[0,1].map(h=>Array.from({length:7},(_,d)=>glyph(h,d))),facePlane=new T.PlaneGeometry(.268,.268),notes=[];
  for(let i=0;i<48;i++){const g=new T.Group();group.add(g);mesh(g,prism,mat(0x1c3146,.6),0,0,0);const face=mesh(g,box,neon(colors[0]),0,0,.117,.271,.271,.01);const glyphMesh=mesh(g,facePlane,glyphs[0][0],0,0,.125);const edges=new T.LineSegments(frame,neon(0xb9c7d5));g.add(edges);g.visible=false;notes.push({g,face,glyph:glyphMesh,id:null});}
  const studio=new T.Group();scene.object3D.add(studio);const canvas=document.createElement('canvas');canvas.width=16;canvas.height=512;const p=canvas.getContext('2d'),gr=p.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#11132a');gr.addColorStop(.48,'#303151');gr.addColorStop(.65,'#293347');gr.addColorStop(1,'#080e20');p.fillStyle=gr;p.fillRect(0,0,16,512);const skyTex=new T.CanvasTexture(canvas);skyTex.colorSpace=T.SRGBColorSpace;const sky=new T.Mesh(new T.SphereGeometry(40,24,16),new T.MeshBasicMaterial({map:skyTex,side:T.BackSide}));studio.add(sky);
  const floor=mesh(studio,box,mat(0x101d30,.65,.25),0,-.055,-8,24,.10,34);
  const portal=mesh(studio,new T.TorusGeometry(3.15,.027,8,100,Math.PI*1.78),neon(0x7698c0),0,2,-16);portal.rotation.z=-Math.PI*.39;
  mesh(studio,new T.TorusGeometry(3.4,.008,4,100),neon(0x475c88),0,2,-16);
  const stars=new T.BufferGeometry(),pts=[];let seed=17;for(let i=0;i<180;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=(seed/4294967296-.5)*30;seed=(Math.imul(seed,1664525)+1013904223)>>>0;pts.push(x,2+seed/4294967296*14,-15-i%14);}stars.setAttribute('position',new T.Float32BufferAttribute(pts,3));studio.add(new T.Points(stars,new T.PointsMaterial({color:0x9fafcb,size:.025,transparent:true,opacity:.6})));
  const lane=new T.Group();group.add(lane);for(let i=0;i<5;i++)mesh(lane,box,neon(i===0?colors[0]:i===4?colors[1]:0x344455),(i-2)*.43,.025,-4.7,.006,.005,8.3);
  const hitRing=mesh(lane,new T.TorusGeometry(.95,.007,5,90),neon(0x64738e),0,.02,0);hitRing.rotation.x=-Math.PI/2;
  for(const hand of[0,1])mesh(lane,box,neon(colors[hand]),hand? .44:-.44,.026,-1.05,.85,.012,.035);
  for(let i=0;i<20;i++){const z=-1-i*.42;mesh(studio,box,neon(0x24384b),0,.001,z,4+i*.3,.002,.008);}
  const hands=[0,1].map(hand=>{const g=new T.Group();scene.object3D.add(g);g.visible=false;mesh(g,cylinder,mat(0x273a4c,.85),0,0,.01,.027,.21,.027).rotation.x=Math.PI/2;for(let i=0;i<4;i++)mesh(g,cylinder,mat(0x8a9fa9,.65),0,0,.055-i*.035,.028,.008,.028).rotation.x=Math.PI/2;
   mesh(g,cylinder,neon(colors[hand]),0,0,-.4,.012,.68,.012).rotation.x=Math.PI/2;mesh(g,cylinder,neon(0xf7fff4),0,0,-.4,.006,.67,.006).rotation.x=Math.PI/2;mesh(g,sphere,neon(colors[hand]),0,0,-.74,.018);
   const line=new T.Line(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(60),3)),new T.LineBasicMaterial({color:colors[hand],transparent:true,opacity:.45}));line.frustumCulled=false;scene.object3D.add(line);return {g,line,trail:[]};});
  const fragments=[];for(let i=0;i<72;i++){const m=mesh(group,box,neon(colors[i%2]),0,0,0,.045,.07,.02);m.visible=false;fragments.push({m,life:0,v:new T.Vector3()});}
  function burst(note,position){for(let i=0;i<8;i++){const f=fragments.find(f=>f.life<=0);if(!f)break;f.life=.48;f.m.visible=true;f.m.position.fromArray(position);f.m.material=neon(colors[note.hand]);const a=i/8*Math.PI*2;f.v.set(Math.cos(a)*(1.0+i*.05),Math.sin(a)*1.0,-.15);}}
  function update(s,time,dt,menu){let active=0;const show=menu?PrismCore.chart('first-light').notes:s?.song.notes||[];const t=menu?7+time%14:time;
   for(const n of show){if(!menu&&s.judged[n.id]||n.time-t>2.5||t-n.time>.20)continue;if(active===notes.length)break;const o=notes[active++];o.id=n.id;o.g.visible=true;o.g.position.fromArray(PrismCore.position(n,t,s?.reach||1));o.face.material=neon(colors[n.hand]);o.glyph.material=glyphs[n.hand][n.dir];}
   for(let i=active;i<notes.length;i++)notes[i].g.visible=false;
   const pulse=1+.08*Math.exp(-((t*(s?.song.bpm||104)/60)%1)*10);hitRing.scale.setScalar(pulse);
   for(const f of fragments)if(f.life>0){f.life-=dt;f.m.visible=f.life>0;f.m.position.addScaledVector(f.v,dt);f.v.y-=dt*.8;f.m.rotation.x+=dt*4;f.m.scale.setScalar(Math.max(0,f.life)*.1);}
  }
  function blade(hand,matrix,visible){const h=hands[hand];h.g.visible=h.line.visible=visible;if(!visible){h.trail=[];return;}h.g.matrixAutoUpdate=false;h.g.matrix.copy(matrix);h.g.matrix.decompose(h.g.position,h.g.quaternion,h.g.scale);const tip=new T.Vector3(0,0,-.74).applyMatrix4(matrix);h.trail.push(tip);if(h.trail.length>20)h.trail.shift();const a=h.line.geometry.attributes.position;for(let i=0;i<h.trail.length;i++)a.setXYZ(i,...h.trail[i].toArray());a.needsUpdate=true;h.line.geometry.setDrawRange(0,h.trail.length);}
  function textPanel(w,h){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const context=c.getContext('2d'),texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}),mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);group.add(mesh);return {canvas:c,context,texture,mesh};}
  return {T,group,studio,lane,notes,hands,update,burst,blade,textPanel,colors,mesh,mat,neon};
 }
 root.PrismArt=Object.freeze({create});
})(globalThis);
