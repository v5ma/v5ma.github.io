/* Original River Prism toy models, moving water and space arena.
   Shared merged geometry, capped effects, no imported imagery or screen samples. */
(function(root){'use strict';
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
  const u={time:{value:0},level:{value:-.18},phase:{value:0},motion:{value:1},energy:{value:.5},opacity:{value:1}};
  const waterGeo=geo(new T.PlaneGeometry(10.5,42,28,80));waterGeo.rotateX(-Math.PI/2);waterGeo.translate(0,0,-22);
  const waterMaterial=mat(new T.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:T.DoubleSide,
   vertexShader:`uniform float time,level,motion;varying vec3 p;void main(){p=position;vec3 v=position;v.y=level+motion*(sin(v.x*2.3+time)*.023+sin(v.z*1.9-time*3.)*.036);gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
   fragmentShader:`uniform float time,phase,motion,energy,opacity;varying vec3 p;void main(){vec2 q=p.xz;float flow=time*3.2*motion;q.y-=flow;float n=sin(q.x*3.+sin(q.y*.7))+cos(q.y*2.+sin(q.x*1.4));float caustic=pow(max(0.,1.-abs(n)*.62),9.);float lines=pow(.5+.5*sin(q.y*2.4+sin(q.x*4.)),18.);vec3 deep=mix(vec3(.025,.23,.29),vec3(.07,.29,.44),phase/3.);vec3 c=deep+vec3(.06,.21,.16)*caustic+vec3(.14,.26,.24)*lines*.35;float foam=smoothstep(4.1,5.2,abs(p.x))*(.45+.35*sin(q.y*3.+q.x));c+=vec3(.40,.72,.65)*foam*.55;float distant=1.-exp(-abs(p.z)*.04);c=mix(c,vec3(.08,.20,.25),distant*.45);gl_FragColor=vec4(c,.95*opacity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` }));
  const river=new T.Mesh(waterGeo,waterMaterial);environment.add(river);
  const banks=new T.Group();environment.add(banks);const bankParts=[];
  for(const side of[-1,1])for(let i=0;i<16;i++){const z=-i*2.8-2;bankParts.push(point(box,side*6,-.02,z,2.2,.65,2.9,0,0,0,0x54755a));bankParts.push(point(sphere,side*(5.1+(i%3)*.14),.18,z,.4,.3,.7,0,0,0,i%2?0x91b79a:0x7a9a83));if(i%2===0)for(let j=0;j<3;j++)bankParts.push(point(cone,side*(5.7+j*.19),.75+j*.18,z+j*.12,.12,1.6,.1,0,0,side*.1,0x87b893));}
  banks.add(new T.Mesh(merge(bankParts),base));
  const arches=new T.Group();environment.add(arches);for(const z of[-22,-36]){const parts=[];for(const x of[-5.5,5.5]){parts.push(point(box,x,2,z,1.1,4,1.4,0,0,0,0xc58e77));parts.push(point(cone,x,4.55,z,.95,1.4,.95,0,0,0,0x355975));}parts.push(point(box,0,3.9,z,10.2,.22,.38,0,0,0,0xd5b687));arches.add(new T.Mesh(merge(parts),base));}
  const platform=new T.Mesh(cylinder,mat(new T.MeshStandardMaterial({color:0x233e4f,metalness:.5,roughness:.3})));platform.position.set(0,-.2,.35);platform.scale.set(1.0,.13,1.0);stage.add(platform);
  const stars=new T.Group();environment.add(stars);const starGeo=geo(new T.SphereGeometry(.035,5,4)),starM=mat(new T.MeshBasicMaterial({color:0xb0dffa})),inst=new T.InstancedMesh(starGeo,starM,160),matrix=new T.Matrix4();
  for(let i=0;i<160;i++){const a=i*2.399,rad=15+(i%9)*2;matrix.makeTranslation(Math.cos(a)*rad,Math.sin(i*3.31)*14+6,-10-(i%38));inst.setMatrixAt(i,matrix);}stars.add(inst);
  const skyGeo=geo(new T.SphereGeometry(60,20,12)),sky= new T.Mesh(skyGeo,mat(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{space:{value:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;uniform float space;void main(){vec3 p=normalize(v);float h=clamp(p.y*.7+.4,0.,1.);vec3 river=mix(vec3(.15,.26,.30),vec3(.035,.085,.16),h);float mist=pow(max(0.,sin(p.x*5.+p.y*3.)*cos(p.y*4.+p.z*3.)),3.);vec3 stars=vec3(.008,.012,.04)+vec3(.025,.018,.08)*mist;gl_FragColor=vec4(mix(river,stars,space),1.);
#include <colorspace_fragment>
}`})));environment.add(sky);
  const shieldMaterial=handColors.map(color=>mat(new T.MeshBasicMaterial({color,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false}))),shieldGeo=geo(new T.CircleGeometry(.5,48));
  const weapons=[0,1].map(h=>{const g=new T.Group();const grip=new T.Mesh(cylinder,mat(new T.MeshStandardMaterial({color:0x314152,metalness:.8,roughness:.25})));grip.scale.set(.024,.18,.024);grip.rotation.x=Math.PI/2;g.add(grip);const blade=new T.Mesh(box,handMats[h]);blade.position.z=-.43;blade.scale.set(.023,.028,.68);g.add(blade);stage.add(g);const shield=new T.Group(),disc=new T.Mesh(shieldGeo,shieldMaterial[h]),rim=new T.Mesh(torus,handMats[h]);rim.scale.set(.50,.50,.18);shield.add(disc,rim);stage.add(shield);g.visible=shield.visible=false;return {g,blade,shield};});
  const effects=Array.from({length:32},()=>{const g=new T.Group();const ring=new T.Mesh(ringGeo,handMats[0]),a=new T.Mesh(sphere,base),b=new T.Mesh(sphere,base);g.add(ring,a,b);g.visible=false;fx.add(g);return {g,ring,a,b,born:-10,type:'',dir:0};});
  const laserGeo=geo(new T.CylinderGeometry(.008,.013,1,5)),lasers=Array.from({length:12},(_,i)=>{const m=new T.Mesh(laserGeo,handMats[i%2]);m.visible=false;fx.add(m);return {m,born:-10};});let ei=0,li=0;
  const preview=[{type:'catapult',id:-1,x:2.2,y:.75,z:-5.5},{type:'boat',id:-2,x:3.1,y:.6,z:-9},{type:'plane',id:-3,x:1.4,y:2.5,z:-7}].map(n=>{const o=make(n.type);o.g.position.set(n.x,n.y,n.z);actors.add(o.g);return o;});
  function update(s,time,dt,ar=false,quiet=false,playing=false){const chapter=s?.chapter||'duck-armada',space=chapter==='mothership',ph=C.phase(chapter,s?.time||time);sky.visible=!ar;river.visible=banks.visible=arches.visible=!space;stars.visible=space&&!ar;sky.material.uniforms.space.value=space?1:0;
   u.time.value=quiet?0:time;u.level.value=C.water(chapter,s?.time||time);u.phase.value=ph.index;u.motion.value=quiet?0:1;u.opacity.value=ar?(scene.components?.['river-game']?.dock?.prefs.opacity??.38):1;
   if(ar){banks.visible=arches.visible=false;river.scale.x=.55;}else river.scale.x=1;
   for(const o of preview)o.g.visible=(!s||s.mode==='ready')&&!space;if(!s||s.mode==='ready'){preview[0].g.rotation.y=Math.sin(time*.25)*.18;preview[0].g.position.y=.75+Math.sin(time)*.10;}
   const ids=new Set();for(const n of s?.entities||[]){if(n.dead)continue;ids.add(n.id);let o=active.get(n.id);if(!o){const kind=kindOf(s,n);o=free.get(kind)?.pop()||make(kind);actors.add(o.g);active.set(n.id,o);}o.g.visible=true;const p=C.position(s,n);o.g.position.fromArray(p);o.g.rotation.y=n.type==='fruit'?Math.sin(time*1.3+n.id)*.12:Math.sin(time*.6+n.id)*.10;
    o.icon.visible=n.type==='fruit';if(o.icon.visible){o.icon.material=glyphs[n.hand][n.dir];o.icon.rotation.y=-o.g.rotation.y;}
    o.health.visible=n.type==='boss'||['boat','catapult','plane','fighter'].includes(n.type);o.health.scale.x=Math.max(.01,n.hp/n.maxHP)*(n.type==='boss'?3: .7);o.health.position.y=n.type==='boss'?1.5:.75;o.health.material=C.open(s,n)?handMats[0]:danger;
    if(o.core.visible)o.core.material=C.open(s,n)?handMats[0]:danger;if(o.outline.visible){o.outline.material=C.open(s,n)?handMats[0]:danger;o.outline.rotation.z=time*.4;}
   }for(const id of active.keys())if(!ids.has(id))release(id);
   for(const e of s?.events||[]){if(e.id<=lastEvent)continue;lastEvent=e.id;
    if(e.type==='laser'){const l=lasers[li++%lasers.length],a=new T.Vector3(...e.start),b=new T.Vector3(...e.end),d=b.clone().sub(a);l.m.position.copy(a).add(b).multiplyScalar(.5);l.m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());l.m.scale.y=d.length();l.m.material=handMats[e.hand];l.born=time;l.m.visible=true;}
    if(['destroy','block','damage','hit','armored'].includes(e.type)&&e.position){const f=effects[ei++%effects.length];f.born=time;f.type=e.reason==='slice'?'slice':'ring';f.dir=e.dir||0;f.g.position.fromArray(e.position);f.g.visible=true;f.g.scale.setScalar(1);f.ring.material=e.type==='damage'?danger:handMats[e.hand||0];f.ring.visible=f.type!=='slice';f.a.visible=f.b.visible=f.type==='slice';f.a.material=f.b.material=handMats[e.hand||0];f.a.scale.set(.11,.20,.20);f.b.scale.copy(f.a.scale);}
   }
   for(const f of effects){const age=time-f.born;if(age>.55){f.g.visible=false;continue;}f.ring.scale.setScalar(1+age*3);if(f.type==='slice'){const d=C.DIRS[f.dir],a=.10+age*1.4;f.a.position.set(-d[1]*a,d[0]*a-age*age,0);f.b.position.set(d[1]*a,-d[0]*a-age*age,0);f.a.rotation.z=age*4;f.b.rotation.z=-age*4;}}
   for(const l of lasers)if(time-l.born>.07)l.m.visible=false;
  }
  const zaxis=new T.Vector3(0,0,1),q=new T.Quaternion();
  function weapon(h,pose,shield){const w=weapons[h];w.g.visible=!!pose;w.shield.visible=!!shield?.active;if(pose){w.g.position.fromArray(pose.a);const d=new T.Vector3(...pose.b).sub(w.g.position),reach=d.length();w.g.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),d.normalize());w.blade.position.z=-(reach+.06)/2;w.blade.scale.z=Math.max(.01,reach-.06);w.blade.visible=!shield?.active;}if(shield?.active){w.shield.position.fromArray(shield.center);w.shield.quaternion.setFromUnitVectors(zaxis,new T.Vector3(...shield.normal).normalize());}}
  function reset(){lastEvent=0;for(const id of active.keys())release(id);for(const f of effects)f.g.visible=false;for(const l of lasers)l.m.visible=false;for(const h of[0,1])weapon(h,null,null);}
  function panel(w,h){const c=document.createElement('canvas');c.width=1200;c.height=Math.round(1200*h/w);const context=c.getContext('2d'),t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const material=mat(new T.MeshBasicMaterial({map:t,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide})),mesh=new T.Mesh(geo(new T.PlaneGeometry(w,h)),material);mesh.renderOrder=15;stage.add(mesh);return {canvas:c,context,texture:t,mesh};}
  function dispose(){if(disposed)return;disposed=true;stage.removeFromParent();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
  return {stage,update,weapon,reset,panel,dispose,get stats(){return {active:active.size,models:models.size,effectSlots:effects.length,laserSlots:lasers.length,disposed};}};
 }
 root.RiverArt={build};
})(globalThis);
