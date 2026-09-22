/* Original River Prism toy models, Currentworks modular water/fire and space arena.
   Shared merged geometry, capped effects, no imported imagery or screen samples. */
(function(root){'use strict';
 // Shared authored riverbed for water optics and visible banks. Outside the
 // central action corridor; the plateau also grounds the existing tree roots.
 function bankHeight(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return NaN;
  const edge=4.25+.06*Math.sin(z*.8)+.04*Math.sin(z*1.7);
  const t=Math.max(0,Math.min(1,(Math.abs(x)-edge)/.84));
  return -2.78+3.74*t*t*(3-2*t);
 }
 function build(T,scene){const C=RiverCore,stage=new T.Group(),environment=new T.Group(),actors=new T.Group(),fx=new T.Group();stage.add(environment,actors,fx);scene.object3D.add(stage);
  const geometry=[],materials=[],textures=[],models=new Map(),active=new Map(),free=new Map();let lastEvent=0,disposed=false,quality='balanced';
  const geo=g=>(geometry.push(g),g),mat=m=>(materials.push(m),m),base=mat(new T.MeshStandardMaterial({vertexColors:true,metalness:.12,roughness:.40})),white=mat(new T.MeshBasicMaterial({color:0xd7fff3}));
  const box=geo(new T.BoxGeometry(1,1,1)),sphere=geo(new T.SphereGeometry(1,16,10)),cylinder=geo(new T.CylinderGeometry(1,1,1,18)),cone=geo(new T.ConeGeometry(1,1,14)),torus=geo(new T.TorusGeometry(1,.12,7,24));
  const point=(g,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,color=0xffffff)=>({g,x,y,z,sx,sy,sz,rx,ry,rz,color});
  function merge(parts){const ps=[],ns=[],cs=[],v=new T.Vector3(),n=new T.Vector3(),m=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),normal=new T.Matrix3();
   for(const p of parts){const g=p.g.index?p.g.toNonIndexed():p.g;const a=g.attributes.position,b=g.attributes.normal;q.setFromEuler(new T.Euler(p.rx,p.ry,p.rz));m.compose(new T.Vector3(p.x,p.y,p.z),q,s.set(p.sx,p.sy,p.sz));normal.getNormalMatrix(m);const color=new T.Color(p.color);
    for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(m);n.fromBufferAttribute(b,i).applyMatrix3(normal).normalize();ps.push(v.x,v.y,v.z);ns.push(n.x,n.y,n.z);cs.push(color.r,color.g,color.b);}if(g!==p.g)g.dispose();
   }const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('normal',new T.Float32BufferAttribute(ns,3));g.setAttribute('color',new T.Float32BufferAttribute(cs,3));g.computeBoundingSphere();return g;
  }
  function model(kind){if(models.has(kind))return models.get(kind);let p=[];const put=(g,c,x,y,z,a,b=a,d=a,rx=0,ry=0,rz=0)=>p.push(point(g,x,y,z,a,b,d,rx,ry,rz,c));
   const duck=(size=1)=>{put(sphere,0xffcd31,0,0,0,.43*size,.28*size,.48*size);put(sphere,0xffdc49,0,.31*size,.23*size,.26*size);put(sphere,0xf17c24,0,.26*size,.48*size,.23*size,.07*size,.17*size);for(const x of[-.15,.15]){put(sphere,0x152c39,x*size,.39*size,.435*size,.038*size);put(sphere,0xffe16e,x*size*2,.03*size,-.04*size,.13*size,.13*size,.28*size);}put(cone,0xffcc35,0,.12*size,-.45*size,.14*size,.25*size,.12*size,-.5);};
   if(kind==='catapult'||kind==='boss-duck'){
    const k=kind==='boss-duck'?2:1;duck(k);put(box,0x247b82,0,-.34*k,0,.95*k,.17*k,1.15*k);put(box,0xb87739,0,-.18*k,-.30*k,.45*k,.14*k,.42*k);put(box,0xa96834,0,.03*k,-.38*k,.09*k,.55*k,.1*k,-.4);put(sphere,0xf0a344,0,.30*k,-.3*k,.15*k,.07*k,.18*k);
    if(k===2){put(cylinder,0x223d63,0,.96,.5,.44,.10,.44);put(sphere,0xe9f3e9,0,1.03,.5,.30,.16,.3);put(box,0xe76455,0,-.03,1.0,1.0,.10,.15);}
   }else if(kind==='boat'){
    put(box,0xc95448,0,-.18,0,.98,.25,1.28);put(cone,0xc95448,0,-.16,.72,.48,.48,.23,-Math.PI/2);put(box,0xe9dca9,0,.0,0,.72,.08,.85);put(cylinder,0x3a8275,0,.25,-.08,.18,.45,.18);put(sphere,0xe8b784,0,.55,-.08,.15);put(sphere,0x3b6651,0,.63,-.08,.19,.10,.19);put(box,0x344c53,0,.35,.2,.14,.14,.50);put(torus,0x75f6d0,0,-.05,.79,.16,.16,.08);
   }else if(kind==='plane'||kind==='fighter'){
    const color=kind==='plane'?0xf39862:0xa68afa;put(sphere,color,0,0,0,.19,.14,.63);put(box,color,0,0,-.1,1.30,.08,.36,0,0,.04);put(box,color,0,.1,-.5,.6,.06,.25);put(box,0x274b74,0,.19,-.5,.06,.32,.25);put(sphere,0x83efff,0,.1,.23,.13,.14,.18);for(const x of[-.49,.49]){put(cylinder,0x294e60,x,-.02,-.06,.085,.38,.085,Math.PI/2);put(sphere,0x97fff0,x,0,-.30,.07,.07,.12);}if(kind==='plane')put(box,0xf2e0b4,0,0,.63,.56,.04,.04);
   }else if(kind==='boss-space'){
    put(sphere,0x414e86,0,.55,-.65,3.0,.40,1.7);put(sphere,0x8592bc,0,.72,-.68,1.2,.42,.78);put(torus,0x82ffe4,0,.49,-.5,1.4,1.4,.55,Math.PI/2);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;put(sphere,0x938aff,Math.cos(a)*2.25,.49,-.65+Math.sin(a)*1.2,.16,.08,.16);}put(box,0x243858,0,.35,.42,.75,.52,.4);
   }else if(kind.startsWith('fruit')){
    const color=[0x65c065,0xffb242,0xee6881][Number(kind.at(-1))||0];put(sphere,color,0,0,0,.24);put(cylinder,0x70613a,0,.25,0,.025,.14,.025);put(sphere,0x4eab75,.06,.28,0,.1,.025,.05,0,0,.4);if(kind==='fruit0')for(let i=0;i<5;i++)put(torus,0x368c57,0,0,0,.245,.245,.245,0,i*.62,0);
   }else if(kind==='bomb'){
    put(sphere,0x304351,0,0,0,.21);for(const v of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]])put(cone,0xfa7a72,v[0]*.24,v[1]*.24,v[2]*.24,.065,.15,.065,v[2]?Math.PI/2:0,0,v[0]?Math.PI/2:0);put(torus,0xff736e,0,0,.19,.11,.11,.1);
   }else{put(sphere,kind==='return'?0x8effdd:0xff677a,0,0,0,.12,.12,.22);}
   const g=merge(p);models.set(kind,g);return g;
  }
  for(const k of ['catapult','boat','plane','fighter','boss-duck','boss-space','fruit0','fruit1','fruit2','bomb','bolt','return'])model(k);
  const handColors=[0x73ffd7,0xff99c0],handMats=handColors.map(color=>mat(new T.MeshBasicMaterial({color}))),danger=mat(new T.MeshBasicMaterial({color:0xff736e})),dim=mat(new T.MeshBasicMaterial({color:0x253b50}));
  const plane=geo(new T.PlaneGeometry(1,1)),ringGeo=geo(new T.TorusGeometry(.36,.012,5,30)),barGeo=geo(new T.PlaneGeometry(1,.045));
  const glyphs=[];for(let h=0;h<2;h++){glyphs[h]=[];for(let d=0;d<8;d++){const c=document.createElement('canvas');c.width=c.height=128;const a=c.getContext('2d');a.fillStyle=h?'#ffbfd8':'#afffe4';a.beginPath();a.arc(64,64,61,0,Math.PI*2);a.fill();a.translate(64,64);const v=C.DIRS[d];a.rotate(Math.atan2(-v[1],v[0]));a.fillStyle='#123345';a.beginPath();a.moveTo(38,0);a.lineTo(0,-29);a.lineTo(0,-10);a.lineTo(-30,-10);a.lineTo(-30,10);a.lineTo(0,10);a.lineTo(0,29);a.closePath();a.fill();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);glyphs[h][d]=mat(new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));}}
  function make(kind){const g=new T.Group(),body=new T.Mesh(model(kind),base);g.add(body);const icon=new T.Mesh(plane,white);icon.position.set(0,0,.25);icon.scale.setScalar(.30);icon.visible=false;g.add(icon);const health=new T.Mesh(barGeo,handMats[0]);health.position.set(0,.80,0);health.visible=false;g.add(health);
   const core=new T.Mesh(sphere,handMats[0]);core.scale.setScalar(kind.startsWith('boss')?.64:.14);core.position.set(0,0,kind.startsWith('boss')?.75:.72);core.visible=kind.startsWith('boss')||kind==='boat';g.add(core);const outline=new T.Mesh(ringGeo,handMats[0]);outline.visible=kind.startsWith('boss');if(outline.visible){outline.scale.setScalar(2.4);outline.position.z=.77;g.add(outline);}return {g,body,icon,health,core,outline,kind};}
  function kindOf(s,n){return n.type==='boss'?(s.chapter==='mothership'?'boss-space':'boss-duck'):n.type==='fruit'?'fruit'+n.id%3:n.type;}
  function release(id){const o=active.get(id);o.g.visible=false;(free.get(o.kind)||free.set(o.kind,[]).get(o.kind)).push(o);active.delete(id);}
  // Reusable module owns its GPU resources; it never writes the combat state.
  const waterSystem=SVGNWater.create(T,{width:10.5,length:42,centerZ:-22,level:-.18,preset:'river',bedHeight:bankHeight});
  const river=waterSystem.mesh;environment.add(river);
  const wakeBodies=[];
  const fireSystem=SVGNFire.create(T);fx.add(fireSystem.group);
  const banks=new T.Group();banks.name='river-bank-ground';environment.add(banks);
  const bankUniforms={bankLevel:{value:-.18},bankNoise:{value:waterSystem.uniforms.waterNoise.value}};
  const groundMat=mat(new T.MeshStandardMaterial({name:'Prism wet shoreline',vertexColors:true,roughness:.96,metalness:0}));
  groundMat.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,bankUniforms);
   shader.vertexShader='varying vec3 vBank;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBank=position;');
   shader.fragmentShader='varying vec3 vBank;uniform float bankLevel;uniform sampler2D bankNoise;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float grain=texture2D(bankNoise,vBank.xz*.43).b;
    float dry=smoothstep(bankLevel-.04,bankLevel+.25,vBank.y);
    diffuseColor.rgb*=mix(.48,1.,dry)*(.84+.28*grain);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.28,.96,dry);');
  };
  groundMat.customProgramCacheKey=()=> 'prism-wet-bank-1';
  const pos=[],colors=[],indices=[],groundSteps=96,across=14;
  const grassColor=new T.Color(0x63794c),sandColor=new T.Color(0xb09b72),siltColor=new T.Color(0x53664f),tone=new T.Color();
  for(const side of [-1,1]){
   const start=pos.length/3;
   for(let i=0;i<=groundSteps;i++)for(let j=0;j<=across;j++){
    const z=-.6-i*43.4/groundSteps,x=side*(4+j*4.4/across),y=bankHeight(x,z);
    pos.push(x,y,z);tone.copy(y>.72?grassColor:y>-.35?sandColor:siltColor);
    tone.multiplyScalar(.91+.09*Math.sin(z*1.8+x*3.1));colors.push(tone.r,tone.g,tone.b);
   }
   for(let i=0;i<groundSteps;i++)for(let j=0;j<across;j++){
    const a=start+i*(across+1)+j,b=a+1,c=a+across+1,d=c+1;
    indices.push(...(side>0?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
   }
  }
  const shoreGeometry=geo(new T.BufferGeometry());shoreGeometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));shoreGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));shoreGeometry.setIndex(indices);shoreGeometry.computeVertexNormals();shoreGeometry.computeBoundingSphere();
  const ground=new T.Mesh(shoreGeometry,groundMat);ground.name='river-bank-slope';banks.add(ground);
  const bankParts=[],stone=geo(new T.IcosahedronGeometry(1,1));
  for(const side of[-1,1])for(let i=0;i<12;i++){
   const z=-2-i*3.5,x=side*(5.06+.15*Math.sin(i*2.71));
   bankParts.push(point(stone,x,bankHeight(x,z)+.12,z,.32+(i%3)*.07,.20+(i%4)*.05,.44+(i%3)*.10,.2*Math.sin(i),i*.83,.12, i%2?0x92917b:0x788378));
  }
  const rocks=new T.Mesh(merge(bankParts),groundMat);rocks.name='river-bank-stones';banks.add(rocks);
  // Actual narrow leaf fans replace the old tall cone-reeds; no alpha overdraw.
  const reedPos=[],reedColors=[],reedIndices=[];
  for(const side of[-1,1])for(let i=0;i<8;i++)for(let j=0;j<5;j++){
   const x=side*(5.63+.11*Math.sin(i*2)),z=-2.5-i*5+.07*j,y=bankHeight(x,z),a=j*2.4+i,h=.36+(j%3)*.14,w=.028;
   const leanX=Math.cos(a)*.16,leanZ=Math.sin(a)*.16,k=reedPos.length/3;
   reedPos.push(x-w,y,z,x+w,y,z,x+leanX*.5+w*.5,y+h*.6,z+leanZ*.5,x+leanX*.5-w*.5,y+h*.6,z+leanZ*.5,x+leanX,y+h,z+leanZ);
   for(let v=0;v<5;v++){tone.set(0x718452).multiplyScalar(.80+v*.05);reedColors.push(tone.r,tone.g,tone.b);}
   reedIndices.push(k,k+1,k+3,k+1,k+2,k+3,k+3,k+2,k+4);
  }
  const reedGeo=geo(new T.BufferGeometry());reedGeo.setAttribute('position',new T.Float32BufferAttribute(reedPos,3));reedGeo.setAttribute('color',new T.Float32BufferAttribute(reedColors,3));reedGeo.setIndex(reedIndices);reedGeo.computeVertexNormals();
  const reeds=new T.Mesh(reedGeo,mat(new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.96})));reeds.name='river-bank-reeds';banks.add(reeds);
  const arches=new T.Group();environment.add(arches);for(const z of[-22,-36]){const parts=[];for(const x of[-5.5,5.5]){parts.push(point(box,x,2,z,1.1,4,1.4,0,0,0,0xc58e77));parts.push(point(cone,x,4.55,z,.95,1.4,.95,0,0,0,0x355975));}parts.push(point(box,0,3.9,z,10.2,.22,.38,0,0,0,0xd5b687));arches.add(new T.Mesh(merge(parts),base));}
  const platform=new T.Mesh(cylinder,mat(new T.MeshStandardMaterial({color:0x233e4f,metalness:.5,roughness:.3})));platform.position.set(0,-.2,.35);platform.scale.set(1.0,.13,1.0);stage.add(platform);
  const stars=new T.Group();environment.add(stars);const starGeo=geo(new T.SphereGeometry(.035,5,4)),starM=mat(new T.MeshBasicMaterial({color:0xb0dffa})),inst=new T.InstancedMesh(starGeo,starM,160),matrix=new T.Matrix4();
  for(let i=0;i<160;i++){const a=i*2.399,rad=15+(i%9)*2;matrix.makeTranslation(Math.cos(a)*rad,Math.sin(i*3.31)*14+6,-10-(i%38));inst.setMatrixAt(i,matrix);}stars.add(inst);
  const skyGeo=geo(new T.SphereGeometry(60,20,12)),sky= new T.Mesh(skyGeo,mat(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{space:{value:0},waterNoise:{value:waterSystem.uniforms.waterNoise.value},sunDirection:{value:waterSystem.uniforms.sunDirection.value}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;uniform float space;uniform sampler2D waterNoise;uniform vec3 sunDirection;
void main(){vec3 p=normalize(v);float h=clamp(p.y,0.,1.);
 vec3 river=mix(vec3(.28,.37,.45),vec3(.065,.15,.255),pow(h,.55));
 vec2 uv=p.xz/max(.18,p.y+.28);
 float cloud=smoothstep(.47,.70,texture2D(waterNoise,uv*.11+vec2(.17,.21)).a)*smoothstep(.01,.23,h);
 river=mix(river,vec3(.70,.74,.76),cloud*.60);
 float sun=max(0.,dot(p,sunDirection));river+=vec3(.45,.32,.14)*pow(sun,90.)+vec3(1.,.85,.55)*smoothstep(.9995,.9998,sun);
 float mist=pow(max(0.,sin(p.x*5.+p.y*3.)*cos(p.y*4.+p.z*3.)),3.);vec3 stars=vec3(.008,.012,.04)+vec3(.025,.018,.08)*mist;
 gl_FragColor=vec4(mix(river,stars,space),1.);
#include <colorspace_fragment>
}`})));environment.add(sky);
  const shieldMaterial=handColors.map(color=>mat(new T.MeshBasicMaterial({color,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false}))),shieldGeo=geo(new T.CircleGeometry(.5,48));
  const weapons=[0,1].map(h=>{const g=new T.Group();const grip=new T.Mesh(cylinder,mat(new T.MeshStandardMaterial({color:0x314152,metalness:.8,roughness:.25})));grip.scale.set(.024,.18,.024);grip.rotation.x=Math.PI/2;g.add(grip);const blade=new T.Mesh(box,handMats[h]);blade.position.z=-.43;blade.scale.set(.023,.028,.68);g.add(blade);stage.add(g);const shield=new T.Group(),disc=new T.Mesh(shieldGeo,shieldMaterial[h]),rim=new T.Mesh(torus,handMats[h]);rim.scale.set(.50,.50,.18);shield.add(disc,rim);stage.add(shield);g.visible=shield.visible=false;return {g,blade,shield};});
  const effects=Array.from({length:32},()=>{const g=new T.Group();const ring=new T.Mesh(ringGeo,handMats[0]),a=new T.Mesh(sphere,base),b=new T.Mesh(sphere,base);g.add(ring,a,b);g.visible=false;fx.add(g);return {g,ring,a,b,born:-10,type:'',dir:0};});
  const laserGeo=geo(new T.CylinderGeometry(.008,.013,1,5)),lasers=Array.from({length:12},(_,i)=>{const m=new T.Mesh(laserGeo,handMats[i%2]);m.visible=false;fx.add(m);return {m,born:-10};});let ei=0,li=0;
  const preview=[{type:'catapult',id:-1,x:2.2,y:.75,z:-5.5},{type:'boat',id:-2,x:3.1,y:.6,z:-9},{type:'plane',id:-3,x:1.4,y:2.5,z:-7}].map(n=>{const o=make(n.type);o.g.position.set(n.x,n.y,n.z);actors.add(o.g);return o;});
  function update(s,time,dt,ar=false,quiet=false,playing=false){const chapter=s?.chapter||'duck-armada',space=chapter==='mothership',ph=C.phase(chapter,s?.time||time);sky.visible=!ar;river.visible=banks.visible=arches.visible=!space;stars.visible=space&&!ar;sky.material.uniforms.space.value=space?1:0;
   const waterLevel=C.water(chapter,s?.mode==='ready'?0:(s?.time??0));bankUniforms.bankLevel.value=waterLevel;
   const g=scene.components?.['river-game'];wakeBodies.length=0;
   if(ar){banks.visible=arches.visible=false;river.scale.x=.55;}else river.scale.x=1;
   for(const o of preview)o.g.visible=(!s||s.mode==='ready')&&!space;if(!s||s.mode==='ready'){preview[0].g.rotation.y=Math.sin(time*.25)*.18;preview[0].g.position.y=.75+Math.sin(time)*.10;}
   const ids=new Set();for(const n of s?.entities||[]){if(n.dead)continue;ids.add(n.id);let o=active.get(n.id);if(!o){const kind=kindOf(s,n);o=free.get(kind)?.pop()||make(kind);actors.add(o.g);active.set(n.id,o);}o.g.visible=true;const p=C.position(s,n);if(!space&&['catapult','boat','boss'].includes(n.type))wakeBodies.push({id:n.id,x:p[0]/river.scale.x,z:p[2],radius:(n.type==='boss'?.8:.38)/river.scale.x});o.g.position.fromArray(p);o.g.rotation.y=n.type==='fruit'?Math.sin(time*1.3+n.id)*.12:Math.sin(time*.6+n.id)*.10;
    o.icon.visible=n.type==='fruit';if(o.icon.visible){o.icon.material=glyphs[n.hand][n.dir];o.icon.rotation.y=-o.g.rotation.y;}
    o.health.visible=n.type==='boss'||['boat','catapult','plane','fighter'].includes(n.type);o.health.scale.x=Math.max(.01,n.hp/n.maxHP)*(n.type==='boss'?3: .7);o.health.position.y=n.type==='boss'?1.5:.75;o.health.material=C.open(s,n)?handMats[0]:danger;
    if(o.core.visible)o.core.material=C.open(s,n)?handMats[0]:danger;if(o.outline.visible){o.outline.material=C.open(s,n)?handMats[0]:danger;o.outline.rotation.z=time*.4;}
   }for(const id of active.keys())if(!ids.has(id))release(id);
   waterSystem.update({time,level:waterLevel,visible:!space,quiet,xr:scene.is('vr-mode')||ar,
    opacity:ar?(g?.dock?.prefs.opacity??.38):1,quality:g?.quality||'balanced',bodies:wakeBodies});
   fireSystem.update({time,quiet,xr:scene.is('vr-mode')||ar,quality:g?.quality||'balanced'});
   for(const e of s?.events||[]){if(e.id<=lastEvent)continue;lastEvent=e.id;
    if(e.type==='destroy'&&e.position&&['catapult','boat','plane','fighter','bomb','boss'].includes(e.kind))fireSystem.emit({id:e.id,position:e.position,radius:e.kind==='boss'?1.2:e.kind==='bomb'?.45:.70,life:e.kind==='boss'?2:1.65});
    if(!space&&e.type==='destroy'&&e.position&&['catapult','boat','boss'].includes(e.kind))waterSystem.splash(e.position[0]/river.scale.x,e.position[2],e.kind==='boss'?1:.65,e.kind==='boss'?.65:.24);
    if(e.type==='laser'){const l=lasers[li++%lasers.length],a=new T.Vector3(...e.start),b=new T.Vector3(...e.end),d=b.clone().sub(a);l.m.position.copy(a).add(b).multiplyScalar(.5);l.m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());l.m.scale.y=d.length();l.m.material=handMats[e.hand];l.born=time;l.m.visible=true;}
    if(['destroy','block','damage','hit','armored'].includes(e.type)&&e.position){const f=effects[ei++%effects.length];f.born=time;f.type=e.reason==='slice'?'slice':'ring';f.dir=e.dir||0;f.g.position.fromArray(e.position);f.g.visible=true;f.g.scale.setScalar(1);f.ring.material=e.type==='damage'?danger:handMats[e.hand||0];f.ring.visible=f.type!=='slice';f.a.visible=f.b.visible=f.type==='slice';f.a.material=f.b.material=handMats[e.hand||0];f.a.scale.set(.11,.20,.20);f.b.scale.copy(f.a.scale);}
   }
   for(const f of effects){const age=time-f.born;if(age>.55){f.g.visible=false;continue;}f.ring.scale.setScalar(1+age*3);if(f.type==='slice'){const d=C.DIRS[f.dir],a=.10+age*1.4;f.a.position.set(-d[1]*a,d[0]*a-age*age,0);f.b.position.set(d[1]*a,-d[0]*a-age*age,0);f.a.rotation.z=age*4;f.b.rotation.z=-age*4;}}
   for(const l of lasers)if(time-l.born>.07)l.m.visible=false;
  }
  const zaxis=new T.Vector3(0,0,1),q=new T.Quaternion();
  function weapon(h,pose,shield){const w=weapons[h];w.g.visible=!!pose;w.shield.visible=!!shield?.active;if(pose){w.g.position.fromArray(pose.a);const d=new T.Vector3(...pose.b).sub(w.g.position),reach=d.length();w.g.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),d.normalize());w.blade.position.z=-(reach+.06)/2;w.blade.scale.z=Math.max(.01,reach-.06);w.blade.visible=!shield?.active;}if(shield?.active){w.shield.position.fromArray(shield.center);w.shield.quaternion.setFromUnitVectors(zaxis,new T.Vector3(...shield.normal).normalize());}}
  function reset(){waterSystem.reset();fireSystem.reset();lastEvent=0;for(const id of active.keys())release(id);for(const f of effects)f.g.visible=false;for(const l of lasers)l.m.visible=false;for(const h of[0,1])weapon(h,null,null);}
  function panel(w,h){const c=document.createElement('canvas');c.width=1200;c.height=Math.round(1200*h/w);const context=c.getContext('2d'),t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const material=mat(new T.MeshBasicMaterial({map:t,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide})),mesh=new T.Mesh(geo(new T.PlaneGeometry(w,h)),material);mesh.renderOrder=15;stage.add(mesh);return {canvas:c,context,texture:t,mesh};}
  function dispose(){if(disposed)return;disposed=true;waterSystem.dispose();fireSystem.dispose();stage.removeFromParent();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
  return {stage,update,weapon,reset,panel,dispose,prepare:(renderer,camera)=>fireSystem.prepare(renderer,camera,scene.object3D),get stats(){return {active:active.size,models:models.size,effectSlots:effects.length,laserSlots:lasers.length,water:waterSystem.stats,fire:fireSystem.stats,shore:{version:'0.1.0',visible:banks.visible,level:bankUniforms.bankLevel.value,vertices:shoreGeometry.attributes.position.count,triangles:(shoreGeometry.index.count+rocks.geometry.attributes.position.count)/3+reedGeo.index.count/3},disposed};}};
 }
 root.RiverArt={build,bankHeight};if(typeof module!=='undefined'&&module.exports)module.exports=root.RiverArt;
})(globalThis);
