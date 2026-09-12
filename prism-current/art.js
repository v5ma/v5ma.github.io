/* JEWELBOX / original jewelry-grade game art. One A-Frame/Three.js context,
 * shared material library, bounded effect pools and a passthrough-safe profile.
 * No scoring, note times, controller transforms or save records are changed. */
(function(root){'use strict';
 function create(T,scene){
  const colors=[0x63eddd,0xff839d],group=new T.Group(),studio=new T.Group();group.name='Prism playfield';studio.name='Jewelbox studio / hidden in AR';scene.object3D.add(group,studio);
  const geometry=PrismGeometry.build(T),fx=PrismMaterials.create(T),ownedGeometries=new Set(Object.values(geometry)),basic=new Map(),textures=[];let disposed=false,setup=false,lastProfile='',menuNow=false,warming=null;
  function own(g){ownedGeometries.add(g);return g;}
  const box=own(new T.BoxGeometry(1,1,1)),cylinder=own(new T.CylinderGeometry(1,1,1,24)),plane=own(new T.PlaneGeometry(1,1)),sphere=own(new T.SphereGeometry(1,16,12)),octa=own(new T.OctahedronGeometry(1));
  function mat(c,metal=0,rough=.3){const k=[c,metal,rough].join('/');if(!basic.has(k))basic.set(k,new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough}));return basic.get(k);}
  function neon(c){const k='n'+c;if(!basic.has(k))basic.set(k,new T.MeshBasicMaterial({color:c,toneMapped:false}));return basic.get(k);}
  function mesh(parent,g,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
  function ring(parent,r,tube,material,x,y,z){const o=mesh(parent,own(new T.TorusGeometry(r,tube,8,96)),material,x,y,z);return o;}
  function glyph(hand,dir){const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');p.save();p.translate(128,142);p.fillStyle='#fff7d9';p.strokeStyle='#102e3a';p.lineWidth=12;p.lineJoin='round';p.shadowColor='#0b263c';p.shadowBlur=4;
   if(dir===6){p.beginPath();p.arc(0,0,23,0,Math.PI*2);p.stroke();p.fill();}else{const d=PrismCore.dirs[dir];p.rotate(Math.atan2(-d[1],d[0]));p.beginPath();p.moveTo(49,0);p.lineTo(1,-36);p.lineTo(1,-13);p.lineTo(-40,-13);p.lineTo(-40,13);p.lineTo(1,13);p.lineTo(1,36);p.closePath();p.stroke();p.fill();}p.restore();p.font='600 24px system-ui';p.textAlign='center';p.fillStyle='#f5fff0';p.strokeStyle='#102e3a';p.lineWidth=6;p.strokeText(hand?'R':'L',128,54);p.fillText(hand?'R':'L',128,54);
   const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const m=new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false});basic.set('glyph'+hand+dir,m);return m;
  }
  const glyphs=[0,1].map(h=>Array.from({length:7},(_,d)=>glyph(h,d)));
  const sparkleMaterial=new T.ShaderMaterial({uniforms:{uTime:{value:0},uStrength:{value:.72}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`uniform float uTime;varying float vBrightness;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vBrightness=.45+.3*pow(.5+.5*sin(position.x*28.+position.y*18.+uTime*.8),6.);gl_PointSize=clamp(13./max(.5,-p.z),1.,15.);gl_Position=projectionMatrix*p;}`,fragmentShader:`varying float vBrightness;uniform float uStrength;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);float cross=exp(-abs(p.x)*24.)*exp(-abs(p.y)*3.)+exp(-abs(p.y)*24.)*exp(-abs(p.x)*3.);float a=(exp(-r*r*28.)+cross*.4)*vBrightness*uStrength*(1.-smoothstep(.7,1.,r));gl_FragColor=vec4(vec3(.92,1.,.98),a);
#include <colorspace_fragment>}`});basic.set('sparkles',sparkleMaterial);
  const sparkGeometry=own(new T.BufferGeometry());
  // Only four corner highlights, not an expensive particle light per facet.
  sparkGeometry.setAttribute('position',new T.Float32BufferAttribute([-.12,.105,.09,.11,.12,.085,-.115,-.11,.087,.125,-.095,.09],3));
  function jewel(parent,hand,dir=0,withGlyph=true){const g=new T.Group();parent.add(g);const body=mesh(g,geometry.gem,fx.jewel(hand));body.name='64-triangle cushion-cut crystal';const bezel=mesh(g,geometry.bezel,hand?fx.gold:fx.silver);bezel.name='Reflective precious-metal setting';
   // The small opaque inner seed catches the virtual transmission pass.
   const heart=mesh(g,octa,mat(colors[hand],.5,.19),0,0,-.025,.065,.065,.055);heart.rotation.set(.15,.45,.1);
   const face=mesh(g,plane,glyphs[hand][dir],0,0,.12,.255,.255,1);face.visible=withGlyph;face.renderOrder=3;
   const halo=mesh(g,plane,fx.halo[hand],0,0,-.14,.63,.63,1);halo.renderOrder=0;
   const sparks=new T.Points(sparkGeometry,sparkleMaterial);g.add(sparks);
   return {g,body,bezel,heart,glyph:face,halo,sparks,hand,dir,id:null};
  }
  const notes=Array.from({length:48},()=>{const o=jewel(group,0);o.g.visible=false;return o;});
  // Layered, slowly moving studio atmosphere. This entire subtree is hidden in AR.
  const sky=mesh(studio,own(new T.SphereGeometry(42,24,16)),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vLocal;void main(){vec3 d=normalize(vLocal);float h=smoothstep(-.1,.65,d.y);vec3 c=mix(vec3(.009,.018,.035),vec3(.003,.005,.014),h);c+=vec3(.009,.004,.021)*pow(max(0.,-d.z),5.);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>}`}));basic.set('sky',sky.material);
  const floorGeo=own(new T.PlaneGeometry(34,40));floorGeo.rotateX(-Math.PI/2);const floor=mesh(studio,floorGeo,fx.floor,0,-.045,-9);floor.name='Obsidian runway / procedural caustic lace';
  mesh(studio,plane,fx.aurora,0,4,-20,30,11,1).name='Slow silk aurora';
  const orbit=new T.Group();studio.add(orbit);orbit.position.set(0,2.25,-15);
  ring(orbit,3.0,.036,fx.gold,0,0,0);ring(orbit,3.08,.009,neon(0x76d3d1),0,0,.03);ring(orbit,3.35,.011,fx.silver,0,0,-.05);
  const orbitJewels=[];const petals=new T.Group();orbit.add(petals);for(let i=0;i<12;i++){const a=i/12*Math.PI*2,o=jewel(petals,i%2,6,false);o.g.position.set(Math.sin(a)*3.2,Math.cos(a)*3.2,0);o.g.rotation.z=-a;o.g.scale.setScalar(.75);orbitJewels.push(o);}
  const starsGeo=own(new T.BufferGeometry()),starPts=[];let seed=32;for(let i=0;i<100;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed/4294967296*25-12.5;seed=(Math.imul(seed,1664525)+1013904223)>>>0;starPts.push(x,2+seed/4294967296*10,-10-i%24);}starsGeo.setAttribute('position',new T.Float32BufferAttribute(starPts,3));studio.add(new T.Points(starsGeo,sparkleMaterial));
  const lane=new T.Group();group.add(lane);const rails=[];for(let i=0;i<5;i++){const r=mesh(lane,box,i===0?neon(colors[0]):i===4?neon(colors[1]):fx.silver,(i-2)*.43,.015,-4.7,.007,.008,8.3);rails.push(r);}
  const hitRing=ring(lane,.95,.006,fx.silver,0,.012,0);hitRing.rotation.x=-Math.PI/2;for(const h of[0,1])mesh(lane,box,neon(colors[h]),h?.44:-.44,.017,-1.05,.85,.01,.026);
  // Showroom sculpture is clearly preview art: hidden throughout active songs.
  const showroom=new T.Group();studio.add(showroom);const exhibitLeft=jewel(showroom,0,0),exhibitRight=jewel(showroom,1,2);exhibitLeft.g.position.set(.95,2.20,-2.65);exhibitLeft.g.scale.setScalar(3.5);exhibitLeft.g.rotation.set(.20,-.36,.15);exhibitRight.g.position.set(1.91,1.77,-3.25);exhibitRight.g.scale.setScalar(2.6);exhibitRight.g.rotation.set(-.10,.32,-.24);
  ring(showroom,.66,.012,fx.gold,.95,2.2,-2.83).rotation.set(.3,.18,.3);
  function saber(parent,h){const g=new T.Group();parent.add(g);mesh(g,geometry.grip,fx.ceramic);mesh(g,geometry.grip,h?fx.gold:fx.silver,0,0,0,1.03,1.03,1.03).scale.z=.35;
   for(let i=0;i<7;i++){const r=ring(g,.024+i%2*.0005,.0016,h?fx.gold:fx.silver,0,0,.065-i*.018);r.rotation.z=i*.1;}
   // Curved longitudinal emitter ribs, same grip-origin and blade endpoints.
   const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push(new T.Vector3(Math.sin(t*Math.PI*2)*.031,Math.cos(t*Math.PI*2)*.031,.1-t*.18));}mesh(g,own(new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,.002,5,false)),fx.gold);
   const end=mesh(g,geometry.gem,fx.crystal[h],0,0,.133,.23,.23,.23);end.rotation.z=Math.PI/4;
   ring(g,.038,.003,h?fx.gold:fx.silver,0,0,-.10);ring(g,.026,.002,neon(colors[h]),0,0,-.123);
   const blade=mesh(g,geometry.blade,fx.blade[h]);blade.name='Faceted light blade (-0.08 to -0.74m)';mesh(g,cylinder,neon(0xdcfff2),0,0,-.4,.004,.64,.004).rotation.x=Math.PI/2;
   for(const side of[-1,1]){const rib=mesh(g,box,h?fx.gold:fx.silver,side*.025,0,-.125,.005,.014,.063);rib.rotation.y=-side*.25;}
   return g;
  }
  const previewSaber=saber(showroom,0);previewSaber.position.set(1.0,.87,-2.7);previewSaber.rotation.set(.35,-.75,-.8);previewSaber.scale.setScalar(1.7);
  const hands=[0,1].map(h=>{const g=saber(scene.object3D,h);g.visible=false;const geom=own(new T.BufferGeometry()),pos=new Float32Array(20*2*3),uv=new Float32Array(20*2*2),idx=[];for(let i=0;i<20;i++){uv.set([i/19,0,i/19,1],i*4);if(i<19){const j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}}geom.setAttribute('position',new T.BufferAttribute(pos,3));geom.setAttribute('uv',new T.BufferAttribute(uv,2));geom.setIndex(idx);const line=mesh(scene.object3D,geom,fx.trail[h]);line.frustumCulled=false;line.visible=false;return {g,line,trail:[]};});
  const fragments=Array.from({length:64},(_,i)=>{const m=mesh(group,geometry.gem,fx.crystal[i%2]);m.visible=false;return {m,life:0,v:new T.Vector3()};});
  const rings=Array.from({length:8},(_,i)=>{const m=ring(group,.14,.002,neon(colors[i%2]),0,0,0);m.visible=false;return {m,life:0};});
  function burst(note,p){const budget=fx.state.quality==='light'?4:10;for(let i=0;i<budget;i++){const f=fragments.find(f=>f.life<=0);if(!f)break;f.life=.55;f.m.visible=true;f.m.position.fromArray(p);f.m.material=fx.crystal[note.hand];const a=i/budget*Math.PI*2;f.v.set(Math.cos(a)*(1+i*.03),Math.sin(a)*.9,.10);f.m.scale.setScalar(.13);}
   const r=rings.find(r=>r.life<=0);if(r&&fx.state.quality!=='light'){r.life=.4;r.m.visible=true;r.m.position.fromArray(p);r.m.material=neon(colors[note.hand]);}
  }
  const previewNotes=PrismCore.chart('first-light').notes;let quality='cinematic',intensity=.72,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state={version:'0.2.0',profile:'cinematic',requested:'cinematic',ar:false,reflection:'generated linear-HDR studio / PMREM',effects:'object-space only',lastError:null,materialsReady:false,disposed:false};
  function settings(){const select=document.getElementById('graphics-quality'),slider=document.getElementById('effect-strength'),motion=document.getElementById('quiet-effects');if(select){quality=select.value;intensity=Number(slider.value)/100;reduced=motion.checked;}const immersive=scene.is('vr-mode')||scene.is('ar-mode'),ar=scene.is('ar-mode');const profile=ar?'AR translucent':immersive?'XR balanced':quality;state.profile=profile;state.requested=quality;state.ar=ar;fx.setQuality(quality,ar,immersive);return immersive;}
  function update(s,time,dt,menu){if(disposed)return;menuNow=menu;if(warming){menu=false;s=warming;time=warming.song.notes[0].time-.8;}const immersive=settings();const t=menu?(reduced?10:7+time%14):time;fx.update(time,((t*(s?.song.bpm||104)/60)%1)/1,intensity,reduced);sparkleMaterial.uniforms.uTime.value=reduced?0:time;sparkleMaterial.uniforms.uStrength.value=intensity*(state.ar?.45:1);
   if(!setup&&scene.renderer){try{fx.environment(scene.renderer);setup=true;state.materialsReady=true;}catch(e){state.lastError=String(e);quality='balanced';setup=true;}scene.renderer.toneMapping=T.ACESFilmicToneMapping;scene.renderer.toneMappingExposure=1.04;}
   showroom.visible=menu&&!immersive;const rotate=reduced?0:Math.sin(time*.18)*.12;exhibitLeft.g.rotation.y=-.36+rotate;exhibitRight.g.rotation.y=.32-rotate;petals.rotation.z=reduced?0:Math.sin(time*.055)*.05;
   // Both shared variants are updated, including the menu presentation jewels.
   for(const o of[exhibitLeft,exhibitRight,...orbitJewels]){o.body.material=fx.jewel(o.hand);o.halo.visible=quality!=='light';o.sparks.visible=quality!=='light'&&!reduced;}
   let active=0;for(const n of(menu?previewNotes:s?.song.notes||[])){if(!menu&&s.judged[n.id]||n.time-t>2.5||t-n.time>.20)continue;if(active===notes.length)break;const o=notes[active++];o.id=n.id;o.g.visible=true;o.g.position.fromArray(PrismCore.position(n,t,s?.reach||1));o.body.material=fx.jewel(n.hand);o.bezel.material=n.hand?fx.gold:fx.silver;o.heart.material=mat(colors[n.hand],.5,.19);o.glyph.material=glyphs[n.hand][n.dir];o.halo.material=fx.halo[n.hand];o.halo.visible=quality!=='light'&&intensity>0;o.sparks.visible=quality!=='light'&&!reduced;}
   for(let i=active;i<notes.length;i++)notes[i].g.visible=false;
   // Do not pulse targets or move the hit plane. Only the ground ornament breathes.
   hitRing.scale.setScalar(reduced?1:1+.015*Math.cos(t));for(let i=0;i<rails.length;i++)rails[i].position.x=(i-2)*.43*(s?.reach||1);
   for(const f of fragments)if(f.life>0){f.life-=dt;f.m.visible=f.life>0;f.m.position.addScaledVector(f.v,dt);f.v.y-=dt*.7;f.m.rotation.x+=dt*3;f.m.scale.setScalar(Math.max(0,f.life)/.55*.13);}
   for(const r of rings)if(r.life>0){r.life-=dt;r.m.visible=r.life>0;r.m.scale.setScalar(1+(1-r.life/.4)*1.6);}
   const text=document.getElementById('graphics-status');if(text&&lastProfile!==state.profile){text.textContent=state.profile+(immersive?' · no screen-space transmission':' · reflected studio light');lastProfile=state.profile;}
  }
  // Warm the actual playfield before the AudioBuffer starts. First-use shader
  // compilation must not consume the music's count-in or trigger a false stall.
  async function prepare(songState){
   if(disposed||!scene.renderer)throw Error('The renderer is not ready.');
   warming=songState;
   try{
    update(songState,0,0,false);
    if(scene.renderer.compileAsync)await scene.renderer.compileAsync(scene.object3D,scene.camera);
    // Let normal A-Frame frames allocate/compile the transmission render pass.
    for(let i=0;i<3;i++)await new Promise(resolve=>requestAnimationFrame(resolve));
   }finally{warming=null;}
  }
  const tmpA=new T.Vector3(),tmpB=new T.Vector3();
  function blade(h,matrix,visible){const hand=hands[h];hand.g.visible=visible;hand.line.visible=visible&&quality!=='light'&&!reduced;if(!visible){hand.trail.length=0;hand.line.geometry.setDrawRange(0,0);return;}hand.g.matrixAutoUpdate=false;hand.g.matrix.copy(matrix);hand.g.matrix.decompose(hand.g.position,hand.g.quaternion,hand.g.scale);tmpA.set(0,0,-.12).applyMatrix4(matrix);tmpB.set(0,0,-.74).applyMatrix4(matrix);hand.trail.push([tmpA.x,tmpA.y,tmpA.z,tmpB.x,tmpB.y,tmpB.z]);if(hand.trail.length>20)hand.trail.shift();const a=hand.line.geometry.attributes.position;for(let i=0;i<hand.trail.length;i++){const p=hand.trail[i];a.setXYZ(i*2,p[0],p[1],p[2]);a.setXYZ(i*2+1,p[3],p[4],p[5]);}a.needsUpdate=true;hand.line.geometry.setDrawRange(0,Math.max(0,hand.trail.length-1)*6);}
  function textPanel(w,h){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const context=c.getContext('2d'),texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide});basic.set('panel'+basic.size,material);const m=mesh(group,own(new T.PlaneGeometry(w,h)),material);return {canvas:c,context,texture,mesh:m};}
  function dispose(){if(disposed)return;disposed=true;state.disposed=true;group.removeFromParent();studio.removeFromParent();for(const h of hands){h.g.removeFromParent();h.line.removeFromParent();}for(const g of ownedGeometries)g.dispose();for(const m of basic.values())m.dispose();for(const t of textures)t.dispose();fx.dispose();}
  const art={T,group,studio,lane,notes,hands,update,burst,blade,textPanel,colors,mesh,mat,neon,prepare,dispose,graphics:state,fx};art.spectral=root.PrismSpectral?.install(art,scene);return art;
 }
 root.PrismArt=Object.freeze({create});
})(globalThis);
