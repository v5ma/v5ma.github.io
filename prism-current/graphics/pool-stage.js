/* Rhythm venue, not another exploration mode. Shared meshes and analytic water.
 * No postprocessing/camera feed; transparent AR never receives an opaque pool.
 * Environment follows the same recentered coordinate frame as the note runway. */
(function(root){'use strict';
 function install(art,scene){
  const T=art.T,baseUpdate=art.update,baseBurst=art.burst,baseDispose=art.dispose,group=new T.Group();group.name='Undertow / rhythm pool';group.visible=false;scene.object3D.add(group);
  const geometries=[],materials=[],textures=[],lights=[];
  const ownG=g=>(geometries.push(g),g),ownM=m=>(materials.push(m),m),boxGeo=ownG(new T.BoxGeometry(1,1,1));
  const uniforms={uTime:{value:0},uWater:{value:-.08},uEnergy:{value:.3},uMotion:{value:1},uEye:{value:new T.Vector3()},uRipples:{value:Array.from({length:6},()=>new T.Vector4(0,0,-100,0))}};
  const caustic=`float caustic(vec2 p,float t){p+=vec2(sin(p.y*1.3+t),cos(p.x*1.2-t))*.26;float a=sin(p.x*3.5+t*.7)+sin(p.y*3.2-t*.8)+cos(p.x*2.8-p.y*2.1+t*.3);return pow(max(0.,1.-abs(a)*.43),9.);}`;
  const vertex=`varying vec3 vP;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
  const tile=ownM(new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`varying vec3 vP;varying vec3 vN;uniform float uTime,uEnergy,uWater;${caustic}
   void main(){vec3 n=abs(vN);vec2 q=n.y>.5?vP.xz:n.x>.5?vP.zy:vP.xy;vec2 f=fract(q*3.3);vec2 d=min(f,1.-f);float seam=1.-smoothstep(.016,.032,min(d.x,d.y));float wet=1.-smoothstep(uWater-.02,uWater+.05,vP.y);
    float lamp=.50+.28*max(0.,dot(normalize(vN),normalize(vec3(-.3,1.,.3))));float age=.94+.06*sin(floor(q.x*3.3)*31.+floor(q.y*3.3)*13.);
    vec3 c=mix(vec3(.27,.39,.37),vec3(.052,.17,.17),wet)*lamp*age;c=mix(c,c*.37,seam);
    c+=vec3(.07,.25,.18)*caustic(q,uTime*.55)*wet*(.45+uEnergy*.3);
    c+=vec3(.09,.07,.025)*exp(-abs(vP.z+12.)*.09)*max(0.,vN.y);
    gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));
  const dark=ownM(new T.MeshStandardMaterial({color:0x183b40,roughness:.35,metalness:.3}));
  const metal=ownM(new T.MeshStandardMaterial({color:0x7b9692,roughness:.22,metalness:.85}));
  const glow=ownM(new T.MeshBasicMaterial({color:0xc0ffe5})),warm=ownM(new T.MeshBasicMaterial({color:0xf5d29b}));
  function box(m,x,y,z,w,h,d){const a=new T.Mesh(boxGeo,m);a.position.set(x,y,z);a.scale.set(w,h,d);group.add(a);return a;}
  box(tile,0,-.20,-10,2.35,.26,24); // The note runway stays dry and unobstructed.
  for(const side of[-1,1]){
   box(tile,side*3.85,-1.12,-10,5.25,.2,24);box(tile,side*6.4,1.8,-10,.28,5.8,25);
   box(tile,side*1.24,-.56,-10,.12,1.05,24);box(tile,side*6.1,.12,-10,.5,.3,24);
   for(const z of[-3,-9,-15,-21]){box(dark,side*6,2.1,z,.25,4.3,.35);box(warm,side*5.78,2.35,z,.12,.48,.18);box(glow,side*3.6,5.2,z,3.9,.055,.3);}
   box(glow,side*1.06,-.025,-10,.025,.025,23.7);
   for(let i=0;i<9;i++)box(metal,side*5.7,-.7+i*.2,-2,.58,.035,.035);
   for(const x of[side*5.42,side*5.99])box(metal,x,.16,-2,.035,2.1,.035);
  }
  box(tile,0,2.1,-22.3,13,6.4,.3);box(dark,0,5.25,-10,13,.1,25);
  for(const x of[-4,0,4])box(warm,x,5.14,-10,1.7,.03,21);
  const torus=ownG(new T.TorusGeometry(2.15,.024,8,80)),orbit=new T.Mesh(torus,glow);orbit.position.set(0,2.4,-21.9);group.add(orbit);
  function label(text,x,y,z,w,h){const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#133237';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#b2fbe2';ctx.textAlign='center';ctx.font='600 55px system-ui';ctx.fillText(text,512,100);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const m=ownM(new T.MeshBasicMaterial({map:t})),g=ownG(new T.PlaneGeometry(w,h)),a=new T.Mesh(g,m);a.position.set(x,y,z);group.add(a);}
  label('UNDERTOW / 132',0,4.65,-22.07,5.6,.86);
  const water=ownM(new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:`uniform float uTime,uMotion;varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=uMotion*(sin(w.x*2.+uTime*.8)*.012+cos(w.z*2.3-uTime*.6)*.014);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`varying vec3 vP;uniform float uTime,uMotion,uEnergy;uniform vec3 uEye;uniform vec4 uRipples[6];${caustic}
    void main(){float t=uTime;vec2 slope=vec2(cos(vP.x*2.+t*.8)*.065,sin(vP.z*2.3-t*.6)*.055)*uMotion;vec3 rings=vec3(0.);
     for(int i=0;i<6;i++){vec4 r=uRipples[i];float age=t-r.z;if(age>0.&&age<1.6){vec2 d=vP.xz-r.xy;float l=length(d),wave=exp(-abs(l-age*2.2)*12.)*(1.-age/1.6);slope+=d/max(.01,l)*wave*.12*uMotion;rings+=mix(vec3(.09,.44,.30),vec3(.48,.10,.18),r.w)*wave;}}
     vec3 n=normalize(vec3(slope.x,1.,slope.y)),eye=normalize(uEye-vP);float fres=.04+.82*pow(1.-clamp(abs(dot(n,eye)),0.,1.),4.);
     vec2 q=vP.xz+slope*.9;vec2 f=fract(q*3.3);float seam=1.-smoothstep(.015,.035,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
     vec3 floor=mix(vec3(.04,.26,.23),vec3(.02,.08,.09),seam);floor+=vec3(.09,.26,.13)*caustic(q,t*.55)*.5;
     vec3 reflected=vec3(.12,.21,.22);float roof=pow(.5+.5*cos((vP.x+slope.x*4.)*1.55),22.);reflected+=vec3(.40,.34,.23)*roof*(.6+uEnergy*.3);
     vec3 c=mix(floor,reflected,fres)+rings*.26;c+=vec3(.16,.28,.23)*pow(max(0.,dot(reflect(-normalize(vec3(-.2,1.,.1)),n),eye)),90.);
     gl_FragColor=vec4(c,.94);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}));
  const waterGeo=ownG(new T.PlaneGeometry(4.75,23.8,12,40));waterGeo.rotateX(-Math.PI/2);
  for(const side of[-1,1]){const m=new T.Mesh(waterGeo,water);m.position.set(side*3.67,-.08,-10);m.renderOrder=1;group.add(m);}
  const status={active:false,ar:false,waterVisible:false,hitsObserved:0,renderTargets:0,disposed:false};let was=false,clock=0,next=0,lastState=null,lastHit=-10;
  art.update=function(s,time,dt,menu){
   baseUpdate.call(art,s,time,dt,menu);if(status.disposed)return;
   const g=scene.components?.['prism-game'],selected=(s?.song.id||g?.track)==='undertow',ar=scene.is('ar-mode');
   const visible=selected&&!ar&&!s?.song.lesson;group.visible=visible;status.active=selected;status.ar=ar;status.waterVisible=visible;
   if(visible)art.studio.visible=false;else if(was)art.studio.visible=!ar;was=visible;
   group.position.copy(art.group.position);group.quaternion.copy(art.group.quaternion);
   if(s!==lastState){for(const r of uniforms.uRipples.value)r.z=-100;status.hitsObserved=0;lastState=s;}
   const quiet=art.fx.state.reduced;
   if(!quiet&&(menu||s?.state==='playing'))clock+=Math.min(.06,Math.max(0,dt||0));
   uniforms.uTime.value=quiet?0:clock;uniforms.uMotion.value=quiet?0:1;
   uniforms.uEnergy.value=quiet?.35:(s?.song.sections?.find(p=>time>=p.start&&time<p.end)?.id==='surge'?.9:.5);
   const camera=scene.renderer?.xr?.isPresenting?scene.renderer.xr.getCamera():scene.camera;
   if(camera)camera.getWorldPosition(uniforms.uEye.value);
  };
  art.burst=function(n,p){baseBurst.call(art,n,p);if(status.waterVisible&&!art.fx.state.reduced&&clock-lastHit>.06){uniforms.uRipples.value[next].set(n.hand?2.4:-2.4,p[2],clock,n.hand);next=(next+1)%6;lastHit=clock;status.hitsObserved++;}};
  function dispose(){if(status.disposed)return;status.disposed=true;group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
  art.dispose=function(){dispose();baseDispose.call(art);};return {status,group,uniforms,dispose};
 }
 root.PrismPoolStage=Object.freeze({install});
})(globalThis);
