/* Jewelglass: visual layer on the single existing A-Frame/WebXR renderer.
 * All gameplay, collision, pickups and records remain in the existing engine.
 * Original shaders + native physical materials; no engine switch/CDN downloads. */
(function(){'use strict';
 const S=JewelShaders,KEY='vesperfall-jewelglass-v1',COLORS={plain:'#fff0cb',cinder:'#ff9b43',frost:'#8bdcff',blink:'#63e9cc',volley:'#df98ff'};
 AFRAME.registerComponent('jewelglass',{
  dependencies:['vesper-game'],
  init(){this.g=this.el.components['vesper-game'];this.T=AFRAME.THREE;this.started=false;this.disposed=false;this.errors=[];this.onReady=()=>this.setup();if(this.el.renderer)this.setup();else this.el.addEventListener('renderstart',this.onReady,{once:true});},
  setup(){if(this.started||this.disposed)return;this.started=true;const T=this.T,g=this.g;this.resources=new Set();this.swaps=[];this.hidden=[];this.world=null;this.lastEvent=0;this.lastTrail=0;this.age=0;this.poolIndex=0;this.stats={builds:0,bursts:0,probes:0};
   let saved=null;try{saved=localStorage.getItem(KEY);this.options=S.settings(JSON.parse(saved||'{}'));}catch{this.options=S.settings();}if(!saved&&matchMedia('(prefers-reduced-motion: reduce)').matches)this.options.reduced=true;
   this.root=new T.Group();this.root.name='Jewelglass / owned visuals';this.el.object3D.add(this.root);this.worldFX=new T.Group();this.root.add(this.worldFX);
   this.materials={};this.uniforms=[];this.geometries={};this.cachedMetal=new Map();this.cachedGlass=new Map();this.cachedPool=new Map();this.v=new T.Vector3();this.q=new T.Quaternion();
   const own=v=>{this.resources.add(v);return v;};this.own=own;
   this.geo=(key,make)=>this.geometries[key]||(this.geometries[key]=own(make()));
   const data=S.gemData(8),cut=new T.BufferGeometry();cut.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));cut.setIndex(data.indices);const gem=cut.toNonIndexed();cut.dispose();gem.computeVertexNormals();this.gem=own(gem);
   this.mat=(name,params)=>this.materials[name]||(this.materials[name]=own(new T.MeshPhysicalMaterial({name,...params})));
   this.gold=this.mat('Sun-gilt electrum',{color:'#d5ae55',metalness:.96,roughness:.21,clearcoat:.65,clearcoatRoughness:.16});this.steel=this.mat('Polished bellsteel',{color:'#b1c8d4',metalness:.98,roughness:.2,clearcoat:.45});this.enamel=this.mat('Midnight lacquer',{color:'#102d3b',metalness:.24,roughness:.19,clearcoat:1,clearcoatRoughness:.1});
   this.gems=['#dcefff','#65c9bf','#ad98ee','#e2ae61'].map((color,i)=>this.mat('Cut reliquary crystal '+i,{color,metalness:0,roughness:.10,ior:2.2,clearcoat:1,iridescence:.22,iridescenceIOR:1.38,envMapIntensity:1.8}));
   this.heroGlass=this.mat('Optical crown / hero refraction',{color:'#c7f3ef',metalness:0,roughness:.05,ior:1.8,clearcoat:1,thickness:.7,attenuationColor:'#75cfca',attenuationDistance:2.2,envMapIntensity:1.45});
   this.shader=(fragment,extra={},additive=false)=>{const m=own(new T.ShaderMaterial({vertexShader:S.vertex,fragmentShader:fragment,uniforms:{uTime:{value:0},uCalm:{value:0},...extra},transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,blending:additive?T.AdditiveBlending:T.NormalBlending}));this.uniforms.push(m.uniforms);return m;};
   this.shieldMat=this.shader(S.shield,{uHit:{value:0},uStrength:{value:1},uImpact:{value:new T.Vector2(.5,.5)}});this.portalMat=this.shader(S.portal,{uOpen:{value:0}});this.shaftMat=this.shader(S.shaft,{},true);
   this.skyMat=own(new T.ShaderMaterial({vertexShader:S.skyVertex,fragmentShader:S.skyFragment,uniforms:{uNight:{value:.55}},side:T.BackSide,depthWrite:false,fog:false}));this.sky=new T.Mesh(own(new T.SphereGeometry(180,24,12)),this.skyMat);this.sky.name='Jewelglass / graded sky';this.sky.renderOrder=-100;this.root.add(this.sky);
   this.environments=[];this.prepareEnvironment();this.makeParticles();this.makeEquipment();this.makeSettings();
   const originalBuild=g.build;this.originalBuild=originalBuild;const self=this;
   g.build=function(...args){self.restore();self.clearWorld();const result=originalBuild.apply(this,args);self.rebuild();return result;};this.wrappedBuild=g.build;
   this.onXR=()=>this.apply();this.onLighting=()=>this.apply();this.el.addEventListener('enter-vr',this.onXR);this.el.addEventListener('exit-vr',this.onXR);document.getElementById('lighting').addEventListener('change',this.onLighting);
   this.rebuild();this.apply();g.jewelglass=this;
  },
  prepareEnvironment(){const T=this.T;const renderer=this.el.renderer,pmrem=new T.PMREMGenerator(renderer);try{
   for(const night of[0,.65]){const scene=new T.Scene(),sky=new T.Mesh(new T.SphereGeometry(20,16,8),this.skyMat.clone());sky.material.uniforms.uNight.value=night;scene.add(sky);
    // Bright architectural cards create HDR highlights; this is a reusable
    // authored lighting environment, not live mirror reflections or ray tracing.
    for(let i=0;i<6;i++){const a=i*Math.PI/3,mat=new T.MeshBasicMaterial({color:new T.Color().setRGB(i%2?2.2:.6,i%2?1.6:1.8,i%2?.8:2.8),side:T.DoubleSide,toneMapped:false}),mesh=new T.Mesh(new T.PlaneGeometry(1.0,5.5),mat);mesh.position.set(Math.cos(a)*8,1.6,Math.sin(a)*8);mesh.lookAt(0,1.6,0);scene.add(mesh);}
    const target=pmrem.fromScene(scene,.03,.1,60,{size:128});this.own(target);this.environments.push(target.texture);this.stats.probes++;scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
   }
  }catch(e){this.errors.push('Reflection environment: '+e.message);}finally{pmrem.dispose();}},
  add(parent,geometry,material,p=[0,0,0],s=[1,1,1]){const m=new this.T.Mesh(geometry,material);m.position.set(...p);m.scale.set(...s);parent.add(m);return m;},
  ring(parent,p,r,material=this.gold){const geo=this.geo('ring',()=>new this.T.TorusGeometry(1,.025,6,48));return this.add(parent,geo,material,p,[r,r,r]);},
  makeEquipment(){const T=this.T,g=this.g;this.bow=new T.Group();this.bow.name='Jewelglass / sculpted crystal recurve';g.visualBow.group.add(this.bow);
   const originalChildren=g.visualBow.group.children.slice(0,g.visualBow.group.children.indexOf(g.visualBow.string));this.oldBow=originalChildren;
   const tube=(name,points,radius,material,parent)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),geo=this.geo(name,()=>new T.TubeGeometry(curve,32,radius,8,false));return this.add(parent,geo,material);};
   for(const sign of[-1,1]){const points=[[0,sign*.11,0],[.018,sign*.27,.005],[.055,sign*.43,-.045],[.018,sign*.56,.055],[0,sign*.61,.11]];tube('limb'+sign,points,.032,this.enamel,this.bow);for(const dx of[-.023,.023])tube('wire'+sign+dx,points.map(p=>[p[0]+dx,p[1],p[2]]),.008,this.gold,this.bow);
    for(let i=0;i<3;i++){const m=this.add(this.bow,this.gem,this.gems[1],[.02,sign*(.26+i*.10),-.04],[.027,.047,.025]);m.rotation.z=sign*.22;}
   }
   const grip=this.geo('grip',()=>new T.CylinderGeometry(.038,.044,.22,18));this.add(this.bow,grip,this.enamel);for(let i=0;i<9;i++){const r=this.ring(this.bow,[0,-.095+i*.024,0],.045,i%3?this.steel:this.gold);r.rotation.x=Math.PI/2;}
   this.bowJewel=this.add(this.bow,this.gem,this.heroGlass,[0,.158,-.018],[.065,.085,.059]);this.ring(this.bow,[0,.155,-.02],.094,this.gold).scale.y=1.12*.094;
   this.crossTrim=new T.Group();this.crossTrim.name='Jewelglass / crossbow fittings';g.arsenal.crossbow.add(this.crossTrim);for(const x of[-.14,0,.14])this.add(this.crossTrim,this.gem,this.gems[x?2:1],[x,.045,-.43],[.035,.04,.03]);for(const z of[-.33,-.20,-.07]){const m=this.ring(this.crossTrim,[0,-.055,z],.075,this.steel);m.scale.y=.055;}
   this.originalShield=g.arsenal.shield.children[0].material;
  },
  makeParticles(){const T=this.T,n=256,geo=this.own(new T.BufferGeometry());this.particleArrays={};for(const [key,size]of Object.entries({position:3,aVelocity:3,aColor:3,aBorn:1,aLife:1,aSize:1})){const a=new Float32Array(n*size);if(key==='aBorn')a.fill(-100);this.particleArrays[key]=a;geo.setAttribute(key,new T.BufferAttribute(a,size).setUsage(T.DynamicDrawUsage));}
   this.particleMat=this.own(new T.ShaderMaterial({vertexShader:S.particleVertex,fragmentShader:S.particleFragment,uniforms:{uTime:{value:0},uPixels:{value:350}},transparent:true,depthWrite:false,blending:T.AdditiveBlending}));this.particles=new T.Points(geo,this.particleMat);this.particles.frustumCulled=false;this.particles.name='Jewelglass / bounded spell sparks';this.root.add(this.particles);
  },
  burst(p,color,n=20,force=1){if(!this.current?.particles)return;const a=this.particleArrays,c=new this.T.Color(color);for(let j=0;j<n;j++){const i=this.poolIndex++%this.current.particles,k=i*3,r=(i*2.39996+j*.7),v=.3+(i%9)/8;a.position.set(p,k);a.aColor.set([c.r,c.g,c.b],k);a.aVelocity.set([Math.cos(r)*v*force,(.4+(i%7)*.17)*force,Math.sin(r)*v*force],k);a.aBorn[i]=this.g.game.time;a.aLife[i]=.3+(i%9)*.07;a.aSize[i]=.12+(i%4)*.035;}for(const attr of Object.values(this.particles.geometry.attributes))attr.needsUpdate=true;this.stats.bursts++;},
  restore(){for(const [o,old]of this.swaps)o.material=old;this.swaps=[];for(const [o,old]of this.hidden)o.visible=old;this.hidden=[];},
  swap(o,m){if(o.material===m)return;this.swaps.push([o,o.material]);o.material=m;},
  metal(o){if(!o.material||Array.isArray(o.material)||!o.material.isMeshStandardMaterial||o.material.metalness<.2)return;const old=o.material;if(this.resources.has(old))return;let m=this.cachedMetal.get(old);if(!m){m=this.mat('Faceted metal '+old.uuid,{color:old.color.clone(),map:old.map,metalness:Math.max(.82,old.metalness),roughness:.24,clearcoat:.6,clearcoatRoughness:.17});this.cachedMetal.set(old,m);}this.swap(o,m);},
  clearWorld(){this.worldFX.clear();this.jewels=[];this.projections=[];this.hero=null;this.particleArrays.aBorn.fill(-100);this.particles.geometry.attributes.aBorn.needsUpdate=true;this.poolIndex=0;this.lastEvent=0;this.lastTrail=0;},
  rebuild(){if(!this.started)return;this.clearWorld();const T=this.T,g=this.g,w=g.game.world;this.world=w;this.stats.builds++;this.pickups=[];
   for(const [i,p]of w.pickups.entries()){const group=new T.Group();group.name='Cut jewel / '+p.kind;this.worldFX.add(group);const kind=p.kind==='relic'?3:p.kind==='frost'?2:1,m=this.add(group,this.gem,this.gems[kind],[0,.06,0],p.kind==='relic'?[.23,.3,.23]:[.14,.20,.14]);m.rotation.z=.08;for(const y of[-.16,.19]){const r=this.ring(group,[0,y,0],p.kind==='relic'?.27:.18);r.rotation.x=Math.PI/2;}this.pickups.push({group,p});}
   const sphere=this.geo('lampGlass',()=>new T.SphereGeometry(1,16,12));
   for(const r of w.rooms){for(const side of[-1,1]){const p=[r.x+side*(r.w/2-.95),2.65,r.z+r.d/2-1.1],group=new T.Group();group.position.set(...p);group.name='Suspended crystal lamp';this.worldFX.add(group);
     this.add(group,this.gem,this.gems[(r.id+side+4)%4],[0,0,0],[.22,.38,.22]);for(const y of[-.36,.3]){const ring=this.ring(group,[0,y,0],.26);ring.rotation.x=Math.PI/2;}const wire=this.geo('hanger',()=>new T.CylinderGeometry(.014,.014,1.1,6));this.add(group,wire,this.gold,[0,.89,0]);this.jewels.push(group);
    }}
   const center=new T.Group();center.name='Choir crown / refractive centerpiece';center.position.set(0,4.75,-4.9);this.worldFX.add(center);this.hero=this.add(center,this.gem,this.heroGlass,[0,0,0],[.47,.68,.47]);for(const tilt of[-.6,.6]){const ring=this.ring(center,[0,0,0],.77);ring.rotation.y=tilt;ring.rotation.x=.4;}this.center=center;
   // Additional optical layers sit on existing window and floor surfaces; no
   // opaque wall becomes a secret traversable door or false landing surface.
   g.worldArt.group.traverse(o=>{if(o.name==='Original leaded rose-glass window'){const old=o.material;let glass=this.cachedGlass.get(old);if(!glass){glass=this.mat('Leaded jewel glass '+old.uuid,{color:'#f2ead8',map:old.map,emissive:'#ffffff',emissiveMap:old.map,emissiveIntensity:.32,metalness:.06,roughness:.18,clearcoat:1,clearcoatRoughness:.13,iridescence:.25});this.cachedGlass.set(old,glass);}this.projections.push({window:o,material:glass});}});
   for(const {window:o}of this.projections){const room=w.rooms.reduce((a,b)=>Math.hypot(b.x-o.position.x,b.z-o.position.z)<Math.hypot(a.x-o.position.x,a.z-o.position.z)?b:a,w.rooms[0]);let mat=this.cachedPool.get(o.material.map);if(!mat){mat=this.shader(S.pool,{uGlass:{value:o.material.map}},true);this.cachedPool.set(o.material.map,mat);}const pool=this.add(this.worldFX,this.geo('lightPool',()=>new T.PlaneGeometry(5.5,6.5)),mat,[room.x,.032,room.z]);pool.rotation.x=-Math.PI/2;pool.name='Rose light / artistic projection';const shaft=this.add(this.worldFX,this.geo('shaft',()=>new T.PlaneGeometry(2,7)),this.shaftMat,[o.position.x*.45+room.x*.55,3.45,o.position.z*.45+room.z*.55]);shaft.rotation.z=.25;shaft.name='Local depth-tested light shaft';this.projections.find(p=>p.window===o).pool=pool;this.projections.find(p=>p.window===o).shaft=shaft;}
   this.portal=new T.Group();this.portal.name='Animated open-beacon seal';this.worldFX.add(this.portal);this.portalDisc=this.add(this.portal,this.geo('portal',()=>new T.CircleGeometry(1,64)),this.portalMat,[0,0,.035],[1.0,1.3,1]);for(const r of[1.06,.78])this.ring(this.portal,[0,0,.025],r,this.gold).scale.y=r*1.30;
   this.apply();
  },
  makeSettings(){const $=id=>document.getElementById(id),box=document.createElement('details');box.id='jewel-settings';box.innerHTML='<summary>Jewelglass · materials & effects</summary><label for="jewel-quality">Material quality</label><select id="jewel-quality"><option value="classic">Classic · previous materials</option><option value="balanced">Balanced · reflective jewels</option><option value="jewel">Jewel · desktop optical glass</option></select><label><input id="jewel-effects" type="checkbox"> Spell trails & rose-window light</label><label><input id="jewel-reduced" type="checkbox"> Reduced effects · no sparkle or light shafts</label><p id="jewel-policy" role="status"></p><p class="jewel-note">Jewel adds screen-space transmission on the crown and bow stone. VR uses reflective crystal instead, without a second screen render. These are not ray-traced diamonds. Existing collision and teleport rules do not change.</p>';
   document.querySelector('.settings').after(box);this.settingsElement=box;this.select=$('jewel-quality');this.effects=$('jewel-effects');this.reduced=$('jewel-reduced');this.readout=$('jewel-policy');this.select.value=this.options.mode;this.effects.checked=this.options.effects;this.reduced.checked=this.options.reduced;
   this.onOptions=()=>{this.options=S.settings({mode:this.select.value,effects:this.effects.checked,reduced:this.reduced.checked});try{localStorage.setItem(KEY,JSON.stringify(this.options));}catch{}this.apply();};for(const e of[this.select,this.effects,this.reduced])e.addEventListener('change',this.onOptions);
  },
  apply(){if(!this.started||!this.options||!this.world)return;const T=this.T,g=this.g,p=this.current=S.policy(this.options,g.xr);this.restore();this.root.visible=p.enabled;this.bow.visible=p.enabled;this.crossTrim.visible=p.enabled;for(const o of this.oldBow)o.visible=!p.enabled;g.arsenal.shield.children[0].material=p.enabled?this.shieldMat:this.originalShield;
   const night=document.getElementById('lighting').value==='twilight';this.skyMat.uniforms.uNight.value=night?.55:0;const env=this.environments[night?1:0];for(const m of Object.values(this.materials)){m.envMap=p.enabled?env:null;m.needsUpdate=true;}
   this.heroGlass.transmission=p.transmission;this.heroGlass.opacity=1;this.heroGlass.transparent=false;this.heroGlass.dispersion=p.dispersion;this.heroGlass.iridescence=p.transmission?0:.22;this.heroGlass.needsUpdate=true;
   if(p.enabled){g.worldArt.group.traverse(o=>this.metal(o));for(const a of [g.visualArrow,...g.arrowPool])this.swap(a.children[0],this.steel);g.enemyMeshes.forEach(m=>m.traverse(o=>this.metal(o)));g.arsenal.crossbow.traverse(o=>{if(o.parent!==this.crossTrim)this.metal(o);});g.arsenal.shield.children.slice(1).forEach(o=>this.metal(o));for(const {window,material}of this.projections)this.swap(window,material);}
   for(const {pool,shaft}of this.projections){pool.visible=p.enabled&&p.effects;shaft.visible=p.shafts;}this.particles.visible=p.particles>0;this.particles.geometry.setDrawRange(0,p.particles);this.readout.textContent=p.xr?'WebXR: bounded reflective glass · screen-space transmission off':p.transmission?'Jewel: optical crown + bow stone · dispersion + clearcoat':p.enabled?'Balanced: environment reflections · cut jewels · lacquered metal':'Classic: original materials and effects';
  },
  tick(){if(!this.started||this.disposed||!this.current)return;const g=this.g,s=g.game;let p=this.current;if(this.world!==s.world){this.restore();this.rebuild();}if(p.xr!==g.xr){this.apply();p=this.current;}if(!p.enabled)return;
   const t=s.time,calm=p.reduced?1:0;for(const u of this.uniforms){u.uTime.value=t;u.uCalm&&(u.uCalm.value=calm);}this.sky.position.copy(g.head.object3D.getWorldPosition(this.v));this.particleMat.uniforms.uTime.value=t;this.particleMat.uniforms.uPixels.value=Math.min(innerHeight,1000)*.5;
   this.hero.rotation.y=p.reduced?.35:t*.20;this.hero.position.y=p.reduced?0:Math.sin(t*.8)*.07;this.bowJewel.material=this.heroGlass;this.crossTrim.visible=s.weapon==='crossbow';
   this.shieldMat.uniforms.uStrength.value=s.guard/s.maxGuard;this.shieldMat.uniforms.uHit.value=Math.max(0,1-(t-(this.impactTime??-10))*2.5);
   for(let i=0;i<this.pickups.length;i++){const {group,p:pickup}=this.pickups[i],original=g.pickupMeshes[i];group.visible=!pickup.taken;group.position.copy(original.position);group.rotation.y=p.reduced?.4:t*.5;original.visible=false;}
   this.portal.position.copy(g.worldArt.gate.position);this.portal.visible=g.running;this.portalMat.uniforms.uOpen.value=s.portalReady?1:0;
   for(const e of s.events){if(e.seq<=this.lastEvent)continue;let position=e.p,color=COLORS[s.type],n=18;
    if(e.type==='hit'||e.type==='kill'){position=s.world.enemies.find(x=>x.id===e.id)?.p;color=e.head?'#ffdf81':COLORS[s.type];n=e.type==='kill'?30:15;}
    if(e.type==='target'){position=s.world.targets[e.id];color='#ffeeac';}
    if(e.type==='block'){this.impactTime=t;g.arsenal.shield.updateMatrixWorld(true);const local=g.arsenal.shield.worldToLocal(this.v.fromArray(e.p));this.shieldMat.uniforms.uImpact.value.set(.5+local.x/1.18,.5+local.y/1.18);color='#ffe5aa';}
    if(e.type==='pickup'){position=[s.p[0],s.p[1]+.55,s.p[2]];color='#ffe5a5';n=28;}
    if(e.type==='explosion'){color=COLORS.cinder;n=40;}if(position&&['hit','kill','target','block','pickup','explosion','blink','shard','enemy-deflect'].includes(e.type))this.burst(position,color,n,e.type==='explosion'?2:1);
   }this.lastEvent=s.eventSeq||0;
   if(t-this.lastTrail>.05&&p.particles){this.lastTrail=t;for(const a of s.arrows)if(a.type!=='plain'&&Math.hypot(a.p[0]-s.p[0],a.p[2]-s.p[2])<28)this.burst(a.p,COLORS[a.type],2,.08);}
  },
  remove(){this.disposed=true;if(!this.started)return;const g=this.g;this.restore();if(g.build===this.wrappedBuild)g.build=this.originalBuild;g.arsenal.shield.children[0].material=this.originalShield;for(const o of this.oldBow)o.visible=true;this.bow.removeFromParent();this.crossTrim.removeFromParent();this.root.removeFromParent();this.settingsElement.remove();this.el.removeEventListener('enter-vr',this.onXR);this.el.removeEventListener('exit-vr',this.onXR);document.getElementById('lighting').removeEventListener('change',this.onLighting);for(const e of[this.select,this.effects,this.reduced])e.removeEventListener('change',this.onOptions);for(const r of this.resources)r.dispose?.();g.jewelglass=null;}
 });
})();
