/* Prismatic material pass for the EXISTING pinned r177 renderer.
 * Owns only new render resources/preferences. Never changes collision, motion,
 * routes, scores, collectibles, campaign progression or authoring documents. */
import * as T from './vendor/three.webgpu.js';
import './prismatic-core.js';
const C=globalThis.PrismCore,{color,mix,normalView,positionViewDirection,uniform,uv,sin}=T.TSL;
const KEY='svgn.prismatic.preferences.v1',motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let prefs=C.preferences(),live=null,lastHero=null,disposed=0,installs=0,clock=uniform(0),fault=null;
try{prefs=C.preferences(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
const motion=()=>prefs.motion&&!motionQuery.matches;
const report={version:'prismatic-2',backend:null,materials:0,stations:0,jewels:0,pegs:0,particles:0,draws:0,effects:{},errors:[]};
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}}
function geometry(data){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));if(data.normals)g.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));else g.computeVertexNormals();if(data.uv)g.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));g.computeBoundingSphere();return g;}
function mesh(g,mat,parent,name){const m=new T.InstancedMesh(g,mat,1);m.setMatrixAt(0,new T.Matrix4());m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;m.name=name;parent.add(m);return m;}
function environment(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const g=canvas.getContext('2d'),gr=g.createLinearGradient(0,0,0,512);
 gr.addColorStop(0,'#09162e');gr.addColorStop(.23,'#477cc6');gr.addColorStop(.46,'#bdedfa');gr.addColorStop(.49,'#fff7d5');gr.addColorStop(.53,'#765151');gr.addColorStop(.70,'#142c44');gr.addColorStop(1,'#0b162a');g.fillStyle=gr;g.fillRect(0,0,1024,512);
 for(const [x,y,w,h,c]of[[90,65,75,132,'#fff7e1'],[310,82,180,48,'#edf8ff'],[575,104,46,175,'#b9e9ff'],[795,85,130,65,'#ffe8b9']]){const a=g.createLinearGradient(x,0,x+w,0);a.addColorStop(0,'#ffffff00');a.addColorStop(.16,c);a.addColorStop(.8,c);a.addColorStop(1,'#ffffff00');g.fillStyle=a;g.fillRect(x,y,w,h);}
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;tx.mapping=T.EquirectangularReflectionMapping;tx.name='Original studio-sky reflection';return tx;
}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'#ffffffff');r.addColorStop(.08,'#ffffffef');r.addColorStop(.25,'#ffffff55');r.addColorStop(1,'#ffffff00');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function material(s,options){const m=new T.MeshPhysicalNodeMaterial({envMap:s.env,envMapIntensity:1.8,roughness:.20,metalness:0,clearcoat:1,clearcoatRoughness:.10,...options});s.materials.add(m);return m;}
function own(s,g){s.geometries.add(g);return g;}
function replace(s,o,mat){if(s.originals.has(o)||!o.material)return;s.originals.set(o,o.material);o.material=mat;report.materials++;}
function enhanceExisting(s){
 const road=material(s,{name:'Deep sapphire enamel',vertexColors:true,color:'#b2c9ff',metalness:.42,roughness:.23,iridescence:.16,iridescenceThicknessRange:[160,320]});
 const gold=material(s,{name:'Champagne gold rail edging',color:'#f7c360',metalness:.92,roughness:.20,emissive:'#623608',emissiveIntensity:.18});
 const enamel=material(s,{name:'Clear-coated courier enamel',vertexColors:true,metalness:.23,roughness:.24,iridescence:.16});
 s.actorMaterial=enamel;
 s.root.traverse(o=>{if(!o.material||!o.geometry)return;
  if(o.name.startsWith('Network road ribbons'))replace(s,o,road);
  else if(o.name.startsWith('Double lane edging')||o.name.startsWith('Beveled enamel and gold'))replace(s,o,gold);
  else if(o.parent?.name==='Red airmail target'&&o.material.isMeshStandardNodeMaterial)replace(s,o,enamel);
 });
}
function glass(s){const refract=prefs.look==='refraction';return material(s,{name:refract?'Optical glass / scene transmission':'Tinted reflective glass / light mode',color:'#a2efe6',metalness:0,roughness:.09,ior:1.46,transmission:refract?.87:0,thickness:.12,attenuationColor:'#92cde8',attenuationDistance:200,dispersion:refract?.42:0,iridescence:.32,iridescenceThicknessRange:[120,370],transparent:!refract,opacity:refract?1:.23,depthWrite:refract,side:T.FrontSide});}
function buildStations(s,paths){
 const shell=glass(s),jewel=material(s,{name:'Faceted aquamarine',color:'#70ddd8',roughness:.085,metalness:.08,iridescence:.72,iridescenceIOR:1.32,envMapIntensity:2.35});
 const brass=material(s,{name:'Champagne polished metal',color:'#efc273',metalness:.94,roughness:.16});
 const inset=material(s,{name:'Glass-gallery footing',color:'#19394b',metalness:.5,roughness:.3});
 const gem=own(s,geometry(C.diamond(8))),ring=own(s,new T.TorusGeometry(1,.025,5,48)),meridian=own(s,new T.TorusGeometry(1,.018,5,32,Math.PI)),base=own(s,new T.CylinderGeometry(1,1.1,1,16)),dome=own(s,new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2));
 const gy=globalThis.__sky?.active()?__sky.state.data.ground*36:2160;
 const stations=[{x:355,y:-gy+12,z:-260,source:'post-office-background'}];for(let i=2;i<paths.length&&stations.length<C.LIMITS.stations;i+=3){const p=paths[i].pts;if(p.length<2)continue;const q=p[Math.floor(p.length*.40)];stations.push({x:q[0]+150,y:-q[1]+12,z:-310,source:paths[i].sky?.id});}
 if(!stations.length)stations.push({x:400,y:-2100,z:-210,source:'background'});
 for(let i=0;i<stations.length;i++){
  const loc=stations[i],g=new T.Group();g.name='Background crystal pavilion '+i;g.userData.decoration=true;g.position.set(loc.x,loc.y,loc.z);s.group.add(g);
  const foot=mesh(base,inset,g,'Pavilion base');foot.scale.set(91,13,61);
  const trim=mesh(ring,brass,g,'Metal canopy rim');trim.rotation.x=Math.PI/2;trim.position.y=9;trim.scale.set(90,60,90);
  const canopy=mesh(dome,shell,g,'Translucent conservatory glass');canopy.position.y=9;canopy.scale.set(84,100,55);canopy.renderOrder=20;
  for(let j=0;j<3;j++){const hoop=mesh(meridian,brass,g,'Canopy meridian');hoop.position.y=9;hoop.scale.set(83,100,55);hoop.rotation.y=j*Math.PI/3;}
  for(let j=0;j<3;j++){const d=mesh(gem,jewel,g,'Gallery jewel');d.position.set((j-1)*31,42+(j===1?10:0),j===1?13:0);d.scale.set(j===1?27:18,j===1?43:28,j===1?27:18);s.spin.push({mesh:d,angle:j+i*.3});}
  // Caustic-style light filigree is a procedural surface pattern, not a ray-traced simulation.
  const glowMat=new T.MeshBasicNodeMaterial({color:'#73ebdf',transparent:true,opacity:.28,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});
  const wave=sin(uv().x.mul(36).add(clock.mul(.4))).mul(sin(uv().y.mul(30).sub(clock.mul(.35)))).abs().pow(7).mul(.55);glowMat.opacityNode=wave;s.materials.add(glowMat);
  const pool=mesh(own(s,new T.CircleGeometry(1,40)),glowMat,g,'Decorative caustic filigree');pool.rotation.x=-Math.PI/2;pool.position.y=7.5;pool.scale.set(76,49,1);
  s.stations.push(g);
 }
 report.stations=s.stations.length;
 // The same reflective jewel marks a real existing peg, without moving its center.
 s.pegMaterial=material(s,{name:'Prismatic grip jewel',color:'#75ffe4',metalness:.12,roughness:.075,iridescence:.85,envMapIntensity:2.6});s.gemGeometry=gem;
}
function buildRailLight(s,paths){
 const mat=new T.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false});
 const rim=normalView.dot(positionViewDirection).abs().oneMinus().pow(3);
 const scan=sin(uv().x.mul(4).sub(clock.mul(1.5))).mul(.5).add(.5).pow(12);
 mat.colorNode=mix(color('#35cad3'),color('#b9a0ff'),sin(uv().x.mul(.13)).mul(.5).add(.5));mat.opacityNode=scan.mul(.18).add(rim.mul(.13)).add(.16);s.materials.add(mat);
 for(const p of paths){const data=C.ribbon(p.pts);if(!data.positions.length)continue;const o=mesh(own(s,geometry(data)),mat,s.group,'Inset prismatic light channel');o.renderOrder=5;}
}
function buildLiveGems(s){
 const grid=globalThis.__gameRefs?.T;if(!grid||!globalThis.__sky?.active())return;
 s.pickups=[];for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(pg(x,y)===grid.GEAR)s.pickups.push({x,y});
 const source=C.diamond(8),v=source.positions.length/3,g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(C.LIMITS.jewels*v*3),3).setUsage(T.DynamicDrawUsage));g.setAttribute('normal',new T.Float32BufferAttribute(new Float32Array(C.LIMITS.jewels*v*3),3).setUsage(T.DynamicDrawUsage));
 g.setDrawRange(0,0);s.geometries.add(g);
 s.pickupMaterial=material(s,{name:'Sapphire crystal envelope seals',color:'#87d8ff',roughness:.09,metalness:.18,iridescence:.72,envMapIntensity:2.4});s.liveGems={geometry:g,mesh:null,source,vertices:v};
 const pegs=globalThis.__grapple?.pegs?.()||[];for(const p of pegs.slice(0,C.LIMITS.pegs)){const o=mesh(s.gemGeometry,s.pegMaterial,s.group,'Real peg crystal '+p.id);o.position.set(p.x,-p.y,36);o.scale.set(13,17,9);s.pegs.push({mesh:o,p});}
 report.pegs=s.pegs.length;
}
function createShield(s){const f=normalView.dot(positionViewDirection).abs().oneMinus().pow(2.8),mat=new T.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:T.FrontSide,blending:T.AdditiveBlending,toneMapped:false});mat.colorNode=mix(color('#5eedff'),color('#d19bff'),f);mat.opacityNode=f.mul(.48).add(.025);s.materials.add(mat);s.shield=mesh(own(s,new T.SphereGeometry(1,24,16)),mat,s.group,'Reactive glass shield');s.shield.visible=false;s.shield.renderOrder=40;}
function actor(s){
 const h=globalThis.__railRepair?.unicycle;if(!h||lastHero===h)return;lastHero=h;
 h.traverse(o=>{if(o.geometry&&o.material?.isMeshStandardNodeMaterial)replace(s,o,s.actorMaterial);});
}
function attach(root){
 if(!root||prefs.look==='classic')return;const s={root,group:new T.Group(),materials:new Set(),geometries:new Set(),originals:new Map(),spin:[],stations:[],pegs:[],particles:new C.Particles(),lastStep:-1,last:null,gemIndices:[],env:environment(),glow:glowTexture()};
 s.group.name='Prismatic render-only layer';root.add(s.group);live=s;installs++;report.materials=0;report.draws=0;report.effects={};
 const active=globalThis.__sky?.active(),course=active?__sky.state.data:SkyRoutes.build(4,__gameRefs.T),paths=active?tracks.filter(t=>t.sky):course.ct.map(p=>({pts:p,sky:p.sky}));
 enhanceExisting(s);buildStations(s,paths);buildRailLight(s,paths);buildLiveGems(s);createShield(s);
 report.backend=__merged.renderer.backend.constructor.name;
 s.sparkMaterial=new T.MeshBasicNodeMaterial({map:s.glow,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,side:T.DoubleSide});s.materials.add(s.sparkMaterial);
 s.sparkGeometry=new T.BufferGeometry();for(const [key,size]of[['position',3],['color',3],['uv',2]])s.sparkGeometry.setAttribute(key,new T.Float32BufferAttribute(new Float32Array(C.LIMITS.particles*6*size),size).setUsage(T.DynamicDrawUsage));s.sparkGeometry.setDrawRange(0,0);s.geometries.add(s.sparkGeometry);s.sparkMesh=null;
 s.group.traverse(o=>{if(o.geometry)o.onAfterRender=()=>{report.draws++;};});
 fault=null;
}
function cleanup(){
 const s=live;if(!s)return;
 for(const [obj,old]of s.originals)obj.material=old;
 if(!s.root.parent)for(const mat of new Set(s.originals.values()))mat.dispose();
 s.group.removeFromParent();for(const g of s.geometries)safeDispose(g);for(const m of s.materials)safeDispose(m);safeDispose(s.env);safeDispose(s.glow);s.particles.clear();live=null;lastHero=null;disposed++;
}
function safeDispose(resource){resource.dispose();}
function gems(s,time){
 if(!s.liveGems)return;const data=s.liveGems,{geometry:g,source}=data,pos=g.attributes.position,norm=g.attributes.normal;let at=0,count=0;
 for(const item of s.pickups){if(count===C.LIMITS.jewels)break;if(pg(item.x,item.y)!==__gameRefs.T.GEAR||Math.abs(item.x*36-player.x)>760||Math.abs(item.y*36-player.y)>650)continue;
  const a=motion()?time*.6+item.x*.7:item.x*.7,ca=Math.cos(a),sa=Math.sin(a),x=item.x*36+18,y=-item.y*36-18;
  for(let j=0;j<source.positions.length;j+=3){const px=source.positions[j]*14,py=source.positions[j+1]*17,pz=source.positions[j+2]*8;let nx=source.normals[j]/14,ny=source.normals[j+1]/17,nz=source.normals[j+2]/8;const len=Math.hypot(nx,ny,nz)||1;nx/=len;ny/=len;nz/=len;pos.setXYZ(at,x+ca*px+sa*pz,y+py,22-sa*px+ca*pz);norm.setXYZ(at,ca*nx+sa*nz,ny,-sa*nx+ca*nz);at++;}count++;
 }
 if(at&&!data.mesh){data.mesh=mesh(g,s.pickupMaterial,s.group,'Faceted envelope seal batch');data.mesh.onAfterRender=()=>{report.draws++;};}
 if(data.mesh){data.mesh.visible=at>0;g.setDrawRange(0,at);pos.needsUpdate=norm.needsUpdate=true;}report.jewels=count;
}
function eventBurst(s,type,x,y,c,count=20){report.effects[type]=(report.effects[type]||0)+1;if(motion()&&prefs.glow)s.particles.burst(x,y,39,count,c);}
function events(s,step){
 const p=player,now={track:p.track?.sky?.id||null,peg:p.peg?.id||null,nitro:p.nitroT>0,shield:!!p.shield,star:p.star>0,x:p.x,y:p.y,tries};
 const old=s.last;if(old&&old.tries===now.tries&&step>=s.lastStep&&step-s.lastStep<8){
  if(now.track&&now.track!==old.track)eventBurst(s,'railCatch',p.x+13,-p.y-15,[.3,1,.86]);
  if(now.peg&&!old.peg)eventBurst(s,'whipCatch',p.peg.x,-p.peg.y,[.7,.9,1],25);
  if(old.peg&&!now.peg)eventBurst(s,'whipRelease',p.x+13,-p.y-15,[1,.72,.25]);
  if(now.nitro&&!old.nitro)eventBurst(s,'nitro',p.x+13,-p.y-15,[.35,.8,1],30);
  if(now.shield&&!old.shield)eventBurst(s,'shield',p.x+13,-p.y-15,[.25,1,.9]);
 }else s.particles.clear();
 if(motion()&&prefs.glow&&!p.dead&&(now.nitro||now.track&&Math.abs(p.speed)>12)&&step%2===0)s.particles.burst(p.x+13-p.vx*.3,-p.y-15+p.vy*.3,34,now.nitro?2:1,now.nitro?[.25,.75,1]:[.7,1,.9],.3);
 s.particles.advance(old?step-s.lastStep:0);s.last=now;s.lastStep=step;
}
function sparks(s){
 const g=s.sparkGeometry,p=g.attributes.position,c=g.attributes.color,u=g.attributes.uv,cam=__merged.camera;
 const right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion);let n=0;
 if(motion()&&prefs.glow)for(const a of s.particles.items){const fade=(1-a.age/a.life),size=a.size*(1+fade*.8),rgb=a.color.map(v=>v*fade),q=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];for(const [x,y]of q){p.setXYZ(n,a.x+(right.x*x+up.x*y)*size,a.y+(right.y*x+up.y*y)*size,a.z+(right.z*x+up.z*y)*size);c.setXYZ(n,...rgb);u.setXY(n,(x+1)/2,(y+1)/2);n++;}}
 if(n&&!s.sparkMesh){s.sparkMesh=mesh(g,s.sparkMaterial,s.group,'Bounded contact sparkles');s.sparkMesh.renderOrder=45;s.sparkMesh.onAfterRender=()=>{report.draws++;};}
 if(s.sparkMesh){s.sparkMesh.visible=n>0;g.setDrawRange(0,n);p.needsUpdate=c.needsUpdate=u.needsUpdate=true;}report.particles=n/6;
}
function frame(){
 const active=!!globalThis.__sky?.active(),visible=active||globalThis.__delivery?.state.menu;
 if(prefs.look==='classic'||!visible){if(live)cleanup();return;}
 const root=globalThis.__cloudview?.root;if(!root)return;if(live?.root!==root){cleanup();attach(root);}const s=live;if(!s)return;
 s.group.visible=!!__merged.get3D();if(!s.group.visible)return;
 actor(s);const step=active?__sky.state.steps:0,time=active?step/60:0;clock.value=motion()?time:0;
 for(const a of s.spin)a.mesh.rotation.y=a.angle+(motion()?time*.2:0);
 for(const g of s.stations)g.visible=!active||Math.abs(g.position.x-player.x)<1700&&Math.abs(g.position.y+player.y)<1300;
 if(active){gems(s,time);if(step!==s.lastStep)events(s,step);sparks(s);s.shield.visible=!!player.shield&&!player.dead;s.shield.position.set(player.x+13,-player.y-15,24);s.shield.scale.set(31,38,24);for(const a of s.pegs){a.mesh.visible=pg(Math.floor(a.p.x/36),Math.floor(a.p.y/36))===__gameRefs.T.PEG;a.mesh.rotation.y=motion()?time*.6:0;}}
}
function rebuild(){cleanup();try{frame();}catch(error){fault=String(error);report.errors.push(fault);cleanup();document.getElementById('prism-status').textContent='The original renderer is active; effects could not initialize.';}}
function boot(){
 const css=document.createElement('link');css.rel='stylesheet';css.href='./prismatic.css';document.head.append(css);
 const button=document.createElement('button');button.id='prism-options';button.className='delivery-btn';button.textContent='Materials & FX';document.querySelector('#delivery-header .actions').append(button);
 const panel=document.createElement('dialog');panel.id='prism-panel';panel.setAttribute('aria-label','Material and effects settings');panel.innerHTML='<header><div><small>PRISMATIC / RENDER STUDIO</small><h2>Glass. Gold. Motion.</h2></div><button id="prism-close" aria-label="Close graphics settings">Close</button></header><p>A material upgrade for the same world. Routes, grip, rewards and your saved levels stay unchanged.</p><label>Material treatment<select id="prism-look"><option value="prismatic">Prismatic / reflective glass</option><option value="refraction">Crystal+ / refractive glass</option><option value="classic">Classic / original materials</option></select></label><div class="prism-samples" aria-hidden="true"><span class="prism-glass">GLASS</span><span class="prism-metal">GOLD</span><span class="prism-jewel">JEWEL</span></div><label class="prism-check"><input id="prism-motion" type="checkbox">Animate material shimmer and jewel rotation</label><label class="prism-check"><input id="prism-glow" type="checkbox">Contact sparkles and nitro trails</label><p id="prism-status" role="status">Crystal+ adds real scene transmission and color dispersion and costs more GPU time. The default uses lighter tinted reflective glass. Glass galleries are background decoration, not landing surfaces.</p><p class="prism-note">Reduced-motion preferences suppress animated accents. No camera shake, screen flashes or motion blur. Open the 2D view or select Classic for the previous presentation.</p>';
 document.body.append(panel);const $=id=>document.getElementById(id);$('prism-look').value=prefs.look;$('prism-motion').checked=prefs.motion;$('prism-glow').checked=prefs.glow;
 let wasPaused=false;button.onclick=()=>{wasPaused=!!__delivery.paused;if(__sky.active()&&!wasPaused&&!__delivery.state.menu)__delivery.act('pause');panel.showModal();$('prism-close').focus();};$('prism-close').onclick=()=>panel.close();panel.addEventListener('close',()=>{if(!wasPaused&&__delivery.paused)__delivery.act('resume');cv.focus({preventScroll:true});});
 $('prism-look').onchange=e=>{prefs.look=e.target.value;save();rebuild();};$('prism-motion').onchange=e=>{prefs.motion=e.target.checked;save();if(live)live.particles.clear();};$('prism-glow').onchange=e=>{prefs.glow=e.target.checked;save();if(live)live.particles.clear();};motionQuery.addEventListener('change',()=>{if(live)live.particles.clear();});
 const build=SkyVisual.build;SkyVisual.build=function(...args){cleanup();return build.apply(this,args);};
 const update=SkyVisual.update;SkyVisual.update=function(...args){update.apply(this,args);try{frame();}catch(error){if(!fault){fault=String(error);report.errors.push(fault);console.error('Prismatic render pass:',error);}cleanup();prefs.look='classic';}};
 window.Prismatic=Object.freeze({version:'prismatic-2',get settings(){return {...prefs};},get stats(){return {...report,installs,disposed,active:!!live,clock:clock.value,resources:live?{materials:live.materials.size,geometries:live.geometries.size}:null};},get root(){return live?.group;}});
 window.PrismaticReady=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
