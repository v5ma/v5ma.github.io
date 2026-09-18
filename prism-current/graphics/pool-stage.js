/* Rhythm venue, not another exploration mode. Shared meshes and analytic water.
 * No postprocessing/camera feed; transparent AR never receives an opaque pool.
 * Environment follows the same recentered coordinate frame as the note runway. */
(function(root){'use strict';
 function install(art,scene){
  const T=art.T,baseUpdate=art.update,baseBurst=art.burst,baseDispose=art.dispose,group=new T.Group();group.name='Undertow / rhythm pool';group.visible=false;scene.object3D.add(group);
  const geometries=[],materials=[],textures=[],instances=[];
  const ownG=g=>(geometries.push(g),g),ownM=m=>(materials.push(m),m),boxGeo=ownG(new T.BoxGeometry(1,1,1));
  const uniforms={uTime:{value:0},uWater:{value:-.08},uEnergy:{value:.3},uMotion:{value:1},uStageInverse:{value:new T.Matrix4()},uEye:{value:new T.Vector3()},uRipples:{value:Array.from({length:6},()=>new T.Vector4(0,0,-100,0))}};
  const caustic=`float caustic(vec2 p,float t){p+=vec2(sin(p.y*1.3+t),cos(p.x*1.2-t))*.26;float a=sin(p.x*3.5+t*.7)+sin(p.y*3.2-t*.8)+cos(p.x*2.8-p.y*2.1+t*.3);return pow(max(0.,1.-abs(a)*.43),9.);}`;
  const vertex=`uniform mat4 uStageInverse;varying vec3 vP;varying vec3 vN;void main(){vec4 local=vec4(position,1.);vec3 localNormal=normal;
   #ifdef USE_INSTANCING
   local=instanceMatrix*local;localNormal=mat3(instanceMatrix)*localNormal;
   #endif
   vec4 w=modelMatrix*local;vP=(uStageInverse*w).xyz;vN=normalize(mat3(uStageInverse*modelMatrix)*localNormal);gl_Position=projectionMatrix*viewMatrix*w;}`;
  const tile=ownM(new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`varying vec3 vP;varying vec3 vN;uniform float uTime,uEnergy,uWater;${caustic}
   void main(){vec3 n=abs(vN);vec2 q=n.y>.5?vP.xz:n.x>.5?vP.zy:vP.xy;vec2 f=fract(q*3.3);vec2 d=min(f,1.-f);float seam=1.-smoothstep(.016,.032,min(d.x,d.y));float wet=1.-smoothstep(uWater-.02,uWater+.05,vP.y);
    float lamp=.42+.32*max(0.,dot(normalize(vN),normalize(vec3(-.3,1.,.3))));float age=.94+.06*sin(floor(q.x*3.3)*31.+floor(q.y*3.3)*13.);
    float lampDistance=(mod(-vP.z,6.)-3.)*.65;float band=exp(-lampDistance*lampDistance);float wallLight=band*exp(-abs(vP.y-2.35)*.75);
    vec3 c=mix(vec3(.13,.22,.23),vec3(.023,.12,.12),wet)*lamp*age;c=mix(c,c*.62,seam);
    c+=vec3(.04,.18,.13)*caustic(q,uTime*.55)*wet*(.45+uEnergy*.3);
    c+=vec3(.075,.055,.028)*wallLight;
    c=mix(c,vec3(.018,.046,.052),smoothstep(5.,27.,-vP.z)*.40);
    gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));
  const dark=ownM(new T.MeshStandardMaterial({color:0x183b40,roughness:.35,metalness:.3}));
  const metal=ownM(new T.MeshStandardMaterial({color:0x7b9692,roughness:.22,metalness:.85}));
  const glow=ownM(new T.MeshBasicMaterial({color:0xc0ffe5})),warm=ownM(new T.MeshBasicMaterial({color:0xf5d29b}));
  const batches=new Map();let boxCount=0;
  function box(m,x,y,z,w,h,d){const a=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion(),new T.Vector3(w,h,d));if(!batches.has(m))batches.set(m,[]);batches.get(m).push(a);boxCount++;return a;}
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
  for(const x of[-4,0,4])for(const z of[-3,-9,-15,-21])box(warm,x,5.14,z,1.4,.03,.20);
  for(const z of[-.5,-6.5,-12.5,-18.5])box(dark,0,4.9,z,13,.3,.15);
  const torus=ownG(new T.TorusGeometry(2.15,.024,8,80)),orbit=new T.Mesh(torus,glow);orbit.position.set(0,2.4,-21.9);group.add(orbit);
  function label(text,x,y,z,w,h){const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#133237';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#b2fbe2';ctx.textAlign='center';ctx.font='600 55px system-ui';ctx.fillText(text,512,100);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const m=ownM(new T.MeshBasicMaterial({map:t})),g=ownG(new T.PlaneGeometry(w,h)),a=new T.Mesh(g,m);a.position.set(x,y,z);group.add(a);}
  label('UNDERTOW / 132',0,4.65,-22.07,5.6,.86);
  const water=ownM(new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:`uniform float uTime,uMotion;uniform mat4 uStageInverse;varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vec3 local=(uStageInverse*w).xyz;w.y+=uMotion*(sin(local.x*2.+uTime*.8)*.012+cos(local.z*2.3-uTime*.6)*.014);vP=local;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`varying vec3 vP;uniform float uTime,uMotion,uEnergy;uniform vec3 uEye;uniform vec4 uRipples[6];${caustic}
    void main(){float t=uTime;vec2 slope=vec2(cos(vP.x*2.+t*.8)*.065,sin(vP.z*2.3-t*.6)*.055)*uMotion;vec3 rings=vec3(0.);
     for(int i=0;i<6;i++){vec4 r=uRipples[i];float age=t-r.z;if(age>0.&&age<1.6){vec2 d=vP.xz-r.xy;float l=length(d),wave=exp(-abs(l-age*2.2)*12.)*(1.-age/1.6);slope+=d/max(.01,l)*wave*.12*uMotion;rings+=mix(vec3(.09,.44,.30),vec3(.48,.10,.18),r.w)*wave;}}
     vec3 n=normalize(vec3(slope.x,1.,slope.y)),eye=normalize(uEye-vP);float fres=.04+.82*pow(1.-clamp(abs(dot(n,eye)),0.,1.),4.);
     vec3 ray=refract(-eye,n,.752);float travel=clamp((-1.02-vP.y)/min(-.08,ray.y),0.,16.);vec2 q=vP.xz+ray.xz*travel+slope*.16;
     vec2 f=fract(q*3.3);float seam=1.-smoothstep(.016,.032,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
     vec3 floor=mix(vec3(.024,.17,.15),vec3(.014,.08,.078),seam);floor+=vec3(.065,.23,.15)*caustic(q,t*.55)*.6;floor=mix(floor,vec3(.015,.075,.082),1.-exp(-travel*.22));
     vec3 rr=reflect(-eye,n);vec2 ceiling=vP.xz+rr.xz*(5.2-vP.y)/max(.12,rr.y);float nearX=min(abs(ceiling.x),min(abs(ceiling.x-4.),abs(ceiling.x+4.)));float nearZ=abs(mod(-ceiling.y,6.)-3.);float roof=(1.-smoothstep(.60,.9,nearX))*(1.-smoothstep(.08,.22,nearZ));
     vec3 reflected=vec3(.025,.066,.074)+vec3(.62,.50,.32)*roof;vec3 c=mix(floor,reflected,fres)+rings*.26;c+=vec3(.16,.28,.23)*pow(max(0.,dot(reflect(-normalize(vec3(-.2,1.,.1)),n),eye)),90.);
     gl_FragColor=vec4(c,.94);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}));
  const waterGeo=ownG(new T.PlaneGeometry(4.75,23.8,12,40));waterGeo.rotateX(-Math.PI/2);
  for(const side of[-1,1]){const m=new T.Mesh(waterGeo,water);m.position.set(side*3.67,-.08,-10);m.renderOrder=1;group.add(m);}
  for(const [m,matrices]of batches){const mesh=new T.InstancedMesh(boxGeo,m,matrices.length);for(let i=0;i<matrices.length;i++)mesh.setMatrixAt(i,matrices[i]);mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);instances.push(mesh);}
  const status={active:false,ar:false,waterVisible:false,hitsObserved:0,renderTargets:0,boxBatches:batches.size,boxCount,disposed:false};let was=false,clock=0,next=0,lastState=null,lastHit=-10;
  art.update=function(s,time,dt,menu){
   baseUpdate.call(art,s,time,dt,menu);if(status.disposed)return;
   const g=scene.components?.['prism-game'],selected=(s?.song.id||g?.track)==='undertow',ar=scene.is('ar-mode');
   const visible=selected&&!ar&&!s?.song.lesson;group.visible=visible;status.active=selected;status.ar=ar;status.waterVisible=visible;
   if(visible)art.studio.visible=false;else if(was)art.studio.visible=!ar;was=visible;
   group.position.copy(art.group.position);group.quaternion.copy(art.group.quaternion);group.updateMatrixWorld(true);uniforms.uStageInverse.value.copy(group.matrixWorld).invert();
   if(s!==lastState){for(const r of uniforms.uRipples.value)r.z=-100;status.hitsObserved=0;lastState=s;}
   const quiet=art.fx.state.reduced||art.fx.state.intensity===0;
   if(!quiet&&(menu||s?.state==='playing'))clock+=Math.min(.06,Math.max(0,dt||0));
   uniforms.uTime.value=quiet?0:clock;uniforms.uMotion.value=quiet?0:1;
   uniforms.uEnergy.value=quiet?.35:(s?.song.sections?.find(p=>time>=p.start&&time<p.end)?.id==='surge'?.9:.5);
   const camera=scene.renderer?.xr?.isPresenting?scene.renderer.xr.getCamera():scene.camera;
   if(camera)camera.getWorldPosition(uniforms.uEye.value).applyMatrix4(uniforms.uStageInverse.value);
  };
  art.burst=function(n,p){baseBurst.call(art,n,p);if(status.waterVisible&&!art.fx.state.reduced&&art.fx.state.intensity>0&&document.getElementById('spectral-reactive')?.checked!==false&&clock-lastHit>.06){uniforms.uRipples.value[next].set(n.hand?2.4:-2.4,p[2],clock,n.hand);next=(next+1)%6;lastHit=clock;status.hitsObserved++;}};
  function dispose(){if(status.disposed)return;status.disposed=true;group.removeFromParent();for(const m of instances)m.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}
  art.dispose=function(){dispose();baseDispose.call(art);};return {status,group,uniforms,dispose};
 }
 root.PrismPoolStage=Object.freeze({install});
})(globalThis);
