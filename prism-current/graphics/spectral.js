/* SPECTRAL OBSERVATORY / original object-space GLSL, no sampled screen/camera.
 * Three shared planes, two inner-core materials and a six-event uniform pool.
 * The gameplay clock, geometry, input, hit windows and score writers are untouched. */
(function(root){'use strict';
 const KEY='prism-current.graphics.spectral.v1',THEMES=['opal','solar','abyss','classic'];
 const LABELS=['Opal Aurora','Solar Silk','Deep Current','Classic Jewelbox'];
 const clamp=(n,lo=0,hi=1)=>Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):lo;
 function preference(raw){try{const p=JSON.parse(raw||'null');return {theme:THEMES.includes(p?.theme)?p.theme:'opal',reactive:p?.reactive!==false};}catch{return {theme:'opal',reactive:true};}}
 function policy(theme,quality,intensity,reduced,immersive,reactive){const enabled=THEMES.includes(theme)&&theme!=='classic'&&quality!=='light'&&clamp(intensity)>0&&!immersive;return {enabled,motion:enabled&&!reduced,reactions:enabled&&!reduced&&reactive===true};}
 class ImpactPool{
  constructor(){this.items=Array.from({length:6},()=>({x:0,z:0,born:-10,hand:0}));this.next=0;this.count=0;this.last=-10;}
  clear(){for(const p of this.items)p.born=-10;this.next=0;this.count=0;this.last=-10;}
  add(hand,p,time){if(![0,1].includes(hand)||!p||![p[0],p[2],time].every(Number.isFinite)||time-this.last<.065)return false;const v=this.items[this.next];v.x=clamp(p[0],-3,3);v.z=clamp(p[2],-10,2);v.born=time;v.hand=hand;this.next=(this.next+1)%6;this.count++;this.last=time;return true;}
  active(time){let n=0;for(const p of this.items)if(time>=p.born&&time-p.born<1.25)n++;return n;}
 }
 const vertex='varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 const shared=`varying vec2 vUv;uniform float uTime,uPower,uBeat,uTheme;
 const float PI=3.14159265;
 vec3 palette(float x){
  if(uTheme<.5)return mix(vec3(.10,.82,.64),vec3(.68,.19,.90),clamp(x,0.,1.));
  if(uTheme<1.5)return mix(vec3(1.,.45,.12),vec3(.85,.15,.43),clamp(x,0.,1.));
  return mix(vec3(.035,.28,.75),vec3(.04,.85,.76),clamp(x,0.,1.));
 }
 float edges(vec2 uv){return smoothstep(0.,.09,uv.x)*(1.-smoothstep(.91,1.,uv.x))*smoothstep(0.,.10,uv.y)*(1.-smoothstep(.90,1.,uv.y));}
 `;
 const atmosphere=shared+`
 void main(){vec2 p=vUv;float t=uTime*.065;float glow=0.;float shade=p.x;
  if(uTheme<.5){
   float ridge=.47+.12*sin(p.x*7.+t)+.045*sin(p.x*19.-t*.8);
   float curtains=.55+.45*sin(p.x*63.+sin(p.x*15.+t)*3.);
   float a=exp(-abs(p.y-ridge)*23.)*curtains;
   float b=exp(-abs(p.y-ridge-.12-.03*sin(p.x*10.-t))*38.);
   float c=exp(-abs(p.y-ridge+.075)*55.);
   glow=a*.55+b*.34+c*.17;shade=.5+.45*sin(p.x*3.8+p.y*2.+t*.4);
  }else if(uTheme<1.5){
   vec2 q=(p-vec2(.50,.46))*vec2(1.55,1.);float r=length(q),a=atan(q.y,q.x);
   float silk=.5+.5*sin(a*6.+r*21.-t+sin(a*3.+t)*1.4);
   glow=exp(-abs(r-.33-.026*sin(a*5.-t))*35.)*(.28+.5*silk);
   glow+=exp(-abs(r-.43)*48.)*.2;glow+=exp(-r*6.)*.065;shade=silk;
  }else{
   float bend=p.y+.06*sin(p.x*12.+t)+.025*sin(p.x*23.-t);
   float lines=pow(.5+.5*sin(bend*42.+sin(p.x*7.+t)*2.),12.);
   glow=lines*exp(-abs(p.y-.5)*5.)*.45;
   glow+=exp(-abs(p.y-.45-.08*sin(p.x*8.+t))*23.)*.16;shade=p.y+.25*sin(p.x*5.);
  }
  float corridor=mix(.45,1.,smoothstep(.03,.24,abs(p.x-.5)));
  gl_FragColor=vec4(palette(shade)*(1.+uBeat*.08),clamp(glow*edges(p)*corridor*uPower,0.,.58));
  #include <colorspace_fragment>
 }`;
 const corona=shared+`
 void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);
  float halo=exp(-abs(r-.71)*42.)*.20+exp(-abs(r-.78)*68.)*.12;
  float filament=pow(.5+.5*cos(a*12.+r*24.-uTime*.11),8.);
  halo+=exp(-abs(r-.745-.016*sin(a*6.+uTime*.08))*85.)*filament*.34;
  gl_FragColor=vec4(palette(.5+.5*sin(a+uTime*.03)),min(.38,halo)*uPower*edges(vUv));
  #include <colorspace_fragment>
 }`;
 const ground=shared+`
 uniform vec4 uImpacts[6];uniform float uReaction;
 void main(){vec2 q=(vUv-.5)*vec2(16.,18.);float t=uTime*.12;
  float a=sin(q.x*2.+sin(q.y*.8+t))+sin(q.y*1.7-sin(q.x*.8-t));
  float lace=pow(max(0.,1.-abs(a)*.7),9.)*.07;
  float vignette=exp(-length(q*vec2(.33,.14))*.8)*edges(vUv);
  vec3 light=palette(.5+.45*sin(q.y*.24))*lace*vignette;
  for(int i=0;i<6;i++){
   vec4 hit=uImpacts[i];float age=uTime-hit.z;
   if(age>=0.&&age<1.25){
    float r=length(q-vec2(hit.x,hit.y)),radius=age*2.4;
    float band=exp(-pow((r-radius)/.075,2.));
    float echo=exp(-pow((r-radius*.68)/.045,2.))*.28;
    float fade=sin(min(1.,age/.08)*PI*.5)*pow(1.-age/1.25,2.);
    vec3 color=mix(vec3(.10,.90,.71),vec3(1.,.28,.50),hit.w);
    light+=color*(band+echo)*fade*.34*uReaction*edges(vUv);
   }
  }
  float m=max(max(light.r,light.g),light.b);
  gl_FragColor=vec4(light/max(m,.001),min(m,.48)*uPower);
  #include <colorspace_fragment>
 }`;
 const coreVertex=`varying vec3 vN,vEye,vLocal;void main(){vLocal=position;vec4 p=modelViewMatrix*vec4(position,1.);vEye=-p.xyz;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`;
 const coreFragment=`varying vec3 vN,vEye,vLocal;uniform vec3 uHand;uniform float uTime,uPower;
 void main(){float nv=abs(dot(normalize(vN),normalize(vEye)));float rim=pow(1.-nv,2.);
  float layers=dot(vLocal,vec3(9.,13.,7.))+nv*1.4+uTime*.035;
  vec3 opal=.5+.5*cos(6.283185*(layers+vec3(0.,.32,.64)));
  float vein=pow(.5+.5*sin(layers*9.),12.);
  vec3 c=uHand*.30+mix(uHand,opal,.27)*(.28+.26*rim)+vein*.10*uPower;
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
 function install(art,scene){
  const T=art.T,baseUpdate=art.update,baseBurst=art.burst,baseDispose=art.dispose,pool=new ImpactPool();let disposed=false,clock=0,priorState=null,priorMenu=null,prefs=preference(null),label='';
  const originalAurora=art.studio.children.find(o=>o.material===art.fx.aurora),coreMeshes=[];
  // Identify only existing tiny inner seeds. Outer crystals, glyphs and collision
  // geometry remain the same objects. Existing art.update assigns hand materials.
  const seedGeometry=art.notes[0].heart.geometry;
  for(const parent of [art.group,art.studio])parent.traverse(o=>{if(o.isMesh&&o.geometry===seedGeometry)coreMeshes.push({mesh:o,original:o.material});});
  const group=new T.Group();group.name='Spectral Observatory / desktop only';group.visible=false;art.studio.add(group);
  const uniforms={uTime:{value:0},uPower:{value:.72},uBeat:{value:0},uTheme:{value:0},uReaction:{value:1},uImpacts:{value:Array.from({length:6},()=>new T.Vector4(0,0,-10,0))}};
  const materials=[];function material(fragment,name){const m=new T.ShaderMaterial({name,vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,blending:T.AdditiveBlending});materials.push(m);return m;}
  const plane=new T.PlaneGeometry(1,1),sky=new T.Mesh(plane,material(atmosphere,'Spectral curtains / analytic interference')),halo=new T.Mesh(plane,material(corona,'Orbital diffraction halo')),floor=new T.Mesh(plane,material(ground,'Hit-driven interference ripples'));
  sky.position.set(0,5.5,-23);sky.scale.set(35,17,1);sky.renderOrder=-2;
  halo.position.set(0,2.25,-15.16);halo.scale.set(9,9,1);halo.renderOrder=-1;
  floor.position.set(0,-.040,-7);floor.rotation.x=-Math.PI/2;floor.scale.set(16,18,1);floor.renderOrder=0;
  group.add(sky,halo,floor);
  const cores=[0x63eddd,0xff839d].map(c=>{const m=new T.ShaderMaterial({name:'Dichroic inner seed',vertexShader:coreVertex,fragmentShader:coreFragment,uniforms:{uTime:uniforms.uTime,uPower:uniforms.uPower,uHand:{value:new T.Color(c)}}});materials.push(m);return m;});
  const status={edition:'Spectral Observatory',theme:'opal',enabled:false,motion:false,reactions:false,impacts:0,activeRipples:0,planes:3,extraRenderTargets:0,disposed:false};
  function settings(){try{prefs=preference(root.localStorage?.getItem(KEY));}catch{}
   const select=document.getElementById('spectral-theme'),reactive=document.getElementById('spectral-reactive');
   if(select){select.value=prefs.theme;select.addEventListener('change',save);}if(reactive){reactive.checked=prefs.reactive;reactive.addEventListener('change',save);}
  }
  function save(){const theme=document.getElementById('spectral-theme')?.value,reactive=document.getElementById('spectral-reactive')?.checked; prefs={theme:THEMES.includes(theme)?theme:'opal',reactive:reactive!==false};try{root.localStorage?.setItem(KEY,JSON.stringify(prefs));}catch{}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settings,{once:true});else settings();
  art.update=function(s,time,dt,menu){
   baseUpdate.call(art,s,time,dt,menu);if(disposed)return;
   const f=art.fx.state,p=policy(prefs.theme,f.quality,f.intensity,f.reduced,f.immersive,prefs.reactive);
   if(s!==priorState||menu!==priorMenu||p.enabled!==status.enabled||p.reactions!==status.reactions){pool.clear();priorState=s;priorMenu=menu;}
   Object.assign(status,{theme:prefs.theme,enabled:p.enabled,motion:p.motion,reactions:p.reactions});
   group.visible=p.enabled;if(originalAurora)originalAurora.visible=!p.enabled;
   if(p.motion&&(menu||s?.state==='playing'))clock+=clamp(dt,0,.06);
   uniforms.uTime.value=p.motion?clock:0;uniforms.uPower.value=clamp(f.intensity)*(menu?1:.72);uniforms.uTheme.value=Math.max(0,THEMES.indexOf(prefs.theme));
   uniforms.uBeat.value=p.motion?(1-Math.cos(time*(s?.song.bpm||104)/60*Math.PI*2))*.5:0;uniforms.uReaction.value=p.reactions?1:0;
   for(let i=0;i<6;i++){const v=pool.items[i];uniforms.uImpacts.value[i].set(v.x,-(v.z+7),v.born,v.hand);}
   for(const c of coreMeshes){if(p.enabled){const hand=c.mesh.material.color?.getHex()===art.colors[1]?1:c.original.color?.getHex()===art.colors[1]?1:0;c.mesh.material=cores[hand];}else if(cores.includes(c.mesh.material))c.mesh.material=c.original;}
   status.impacts=pool.count;status.activeRipples=p.reactions?pool.active(clock):0;
   const text=document.getElementById('spectral-status'),next=LABELS[THEMES.indexOf(prefs.theme)]+(f.immersive?' / headset uses original lightweight art':f.quality==='light'?' / new effects disabled in Light':!p.enabled?' / original art only':f.reduced?' / still light, no reactive ripples':prefs.reactive?' / hit-reactive light':' / ambient light only');
   if(text&&next!==label){text.textContent=next;label=next;}
  };
  art.burst=function(note,position){baseBurst.call(art,note,position);if(!disposed&&status.reactions)pool.add(note.hand,position,clock);};
  function dispose(){if(disposed)return;disposed=true;status.disposed=true;pool.clear();group.removeFromParent();plane.dispose();for(const m of materials)m.dispose();for(const c of coreMeshes)if(cores.includes(c.mesh.material))c.mesh.material=c.original;if(originalAurora)originalAurora.visible=true;document.removeEventListener('DOMContentLoaded',settings);for(const id of ['spectral-theme','spectral-reactive'])document.getElementById(id)?.removeEventListener('change',save);}
  art.dispose=function(){dispose();baseDispose.call(art);};
  return {status,uniforms,group,materials,cores,pool,dispose};
 }
 const api={KEY,THEMES,LABELS,preference,policy,ImpactPool,install,shaders:{vertex,atmosphere,corona,ground,coreVertex,coreFragment}};root.PrismSpectral=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
