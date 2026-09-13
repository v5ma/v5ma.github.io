/* Original pool environment. Planar reflection + analytic refracted tile floor.
   Caustics are stylized, not physically traced. No remote assets or camera input. */
(function(root){'use strict';
 function build(T,renderer){
  const scene=new T.Scene();scene.background=new T.Color(0x172c32);scene.fog=new T.FogExp2(0x344e51,.029);
  const owned=[],geo=[],textures=[],waterMeshes=[],props={},uniforms={time:{value:0},level:{value:-.1},quiet:{value:0}};
  const own=m=>(owned.push(m),m),metal=own(new T.MeshStandardMaterial({color:0x73838a,metalness:.83,roughness:.24})),dark=own(new T.MeshStandardMaterial({color:0x192d32,roughness:.55,metalness:.35})),red=own(new T.MeshStandardMaterial({color:0xb34b35,roughness:.38,metalness:.55}));
  const glow=c=>own(new T.MeshBasicMaterial({color:c}));const cyan=glow(0x74ffdd),amber=glow(0xffd589);
  const caustic=`float caustic(vec2 p,float t){p+=vec2(sin(p.y*1.4+t),cos(p.x*1.3-t))*.28;float a=sin(p.x*3.4+t*.7)+sin(p.y*3.1-t*.8);float b=cos(p.x*2.8-p.y*2.4+t*.3);return pow(max(0.,1.-abs(a+b)*.42),9.);}`;
  function tile(c){const m=own(new T.MeshStandardMaterial({color:c,roughness:.4,metalness:.03}));m.onBeforeCompile=sh=>{
   sh.uniforms.uPoolTime=uniforms.time;sh.uniforms.uPoolLevel=uniforms.level;
   sh.vertexShader='varying vec3 vPoolPos;varying vec3 vPoolNormal;\n'+sh.vertexShader;
   sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPoolPos=(modelMatrix*vec4(transformed,1.)).xyz;vPoolNormal=normalize(mat3(modelMatrix)*normal);');
   sh.fragmentShader='varying vec3 vPoolPos;varying vec3 vPoolNormal;uniform float uPoolTime,uPoolLevel;\n'+caustic+'\n'+sh.fragmentShader;
   sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    vec3 n=abs(vPoolNormal);vec2 q=n.y>.5?vPoolPos.xz:(n.x>.5?vPoolPos.zy:vPoolPos.xy);
    vec2 f=fract(q*3.2);vec2 edge=min(f,1.-f);float seam=1.-smoothstep(.012,.032,min(edge.x,edge.y));
    float stain=.97+.03*sin(floor(q.x*3.2)*17.+floor(q.y*3.2)*37.);
    diffuseColor.rgb*=mix(vec3(stain),vec3(.28,.34,.33),seam);
    float wet=1.-smoothstep(uPoolLevel-.03,uPoolLevel+.07,vPoolPos.y);diffuseColor.rgb*=mix(vec3(1.),vec3(.50,.78,.76),wet);`);
   sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    float under=1.-smoothstep(uPoolLevel-.05,uPoolLevel+.04,vPoolPos.y);
    totalEmissiveRadiance+=vec3(.22,.62,.46)*caustic(vPoolPos.xz+vPoolPos.y*.6,uPoolTime*.7)*under*.38;`);
  };m.customProgramCacheKey=()=> 'floodgate-tiles-v1';return m;}
  const pale=tile(0xa6bab1),poolTile=tile(0x88b7b1),trim=tile(0x466e75);
  const boxGeo=new T.BoxGeometry(1,1,1);geo.push(boxGeo);
  function box(m,x,y,z,w,h,d){const b=new T.Mesh(boxGeo,m);b.position.set(x,y,z);b.scale.set(w,h,d);scene.add(b);return b;}
  function pipe(points,r=.045,m=metal){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(curve,Math.max(8,points.length*5),r,8,false);geo.push(g);const mesh=new T.Mesh(g,m);scene.add(mesh);return mesh;}
  function sign(text,x,y,z,w=3,h=.8,color='#c9dfd7',rot=0){const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#152e32';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#5f9291';ctx.lineWidth=6;ctx.strokeRect(4,4,760,152);ctx.fillStyle=color;ctx.textAlign='center';ctx.font='600 43px sans-serif';ctx.fillText(text,384,95);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const m=own(new T.MeshBasicMaterial({map:t})),g=new T.PlaneGeometry(w,h);geo.push(g);const b=new T.Mesh(g,m);b.position.set(x,y,z);b.rotation.y=rot;scene.add(b);return b;}
  box(pale,0,-.15,1.5,14,.3,9);box(poolTile,0,-1.64,-9,10.4,.28,12);
  box(pale,-6, -.16,-9,1.6,.32,12);box(pale,6,-.16,-9,1.6,.32,12);
  box(poolTile,5.25,-.8,-9,.1,1.6,12);box(poolTile,-5.25,-.8,-9,.1,1.6,12);
  box(poolTile,1.025,-.77,-3.02,8.35,1.55,.08);
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute([-5.15,0,-3,-3.15,0,-3,-3.15,-1.5,-7,-5.15,0,-3,-3.15,-1.5,-7,-5.15,-1.5,-7],3));rg.computeVertexNormals();geo.push(rg);scene.add(new T.Mesh(rg,pale));
  box(pale,-7,2,-5,.4,8,22);box(pale,7,2,-5,.4,8,22);box(pale,0,2,6,14,8,.35);
  box(pale,-4.35,2,-15.3,5.6,8,.4);box(pale,4.35,2,-15.3,5.6,8,.4);box(pale,0,3.65,-15.3,3.2,4.7,.4);
  box(poolTile,0,-1.64,-17,3.2,.28,4);box(trim,-1.85,1,-17,.4,5,4);box(trim,1.85,1,-17,.4,5,4);box(pale,0,3.5,-17,4,.25,4);
  props.gate=box(metal,0,-.2,-15.15,3.15,2.65,.13);
  for(let i=-6;i<=6;i+=3){box(trim,i,4.9,-6,.18,.3,23);box(pale,i,5.95,-6,2.7,.15,23);box(amber,i,5.82,-7,1.9,.05,6);}
  box(poolTile,0,-4.15,-25,12,.3,12);box(pale,-6.2,1,-25,.35,10,12);box(pale,6.2,1,-25,.35,10,12);
  box(pale,-4,1,-31,4.4,10,.4);box(pale,4,1,-31,4.4,10,.4);box(pale,0,2,-31,3.7,8,.45);
  box(poolTile,0,-4.15,-33.4,3.6,.3,5);box(trim,0,-1.75,-33.25,3.6,.5,4.5);box(poolTile,-2,-2.9,-33.25,.4,2.6,4.5);box(poolTile,2,-2.9,-33.25,.4,2.6,4.5);
  box(poolTile,0,-4.15,-37.6,8,.3,5);box(poolTile,-4.2,-1.6,-37.6,.4,5.2,5);box(poolTile,4.2,-1.6,-37.6,.4,5.2,5);box(poolTile,0,-1.6,-40.15,8,5.2,.3);box(trim,0,.9,-37.5,8,.3,5);
  for(const x of [-4.7,4.7]){box(trim,x,2,-25,.7,8,.7);box(pale,x,4.1,-25,1, .4,12);}
  box(dark,0,2.4,-25,12,.16,1.3);for(const z of [-24.3,-25.7]){pipe([[-6,3.45,z],[6,3.45,z]],.035);for(let x=-5.8;x<6;x+=1)box(metal,x,2.95,z,.035,1.1,.035);}
  for(const x of [4.35,4.95])pipe([[x,-1.3,-3.6],[x,.75,-3.6],[x,1,-3.35],[x,1,-2.9],[x,.15,-2.5]],.045);
  for(let y=-1.1;y<.6;y+=.32)pipe([[4.35,y,-3.62],[4.95,y,-3.62]],.035);
  for(const z of [-5,-11,-21,-28])for(const side of [-1,1]){const x=(z>-15?6.7:5.9)*side;box(dark,x,2.2,z,.15,.45,.6);box(amber,x-side*.09,2.2,z,.06,.28,.38);}
  for(let z=-20;z>-39;z-=2.4){box(cyan,-1.3,-3.75,z,.08,.06,.45);box(cyan,1.3,-3.75,z,.08,.06,.45);}
  function consoleAt(id,x,z,c){box(dark,x,.65,z,.8,1.3,.6);const screen=box(glow(c),x,1.15,z+.315,.58,.35,.025);props[id]=screen;}
  consoleAt('power',5.45,1.1,0xf3ad50);consoleAt('extract',2.5,3.8,0x387c69);
  const vg=new T.TorusGeometry(.30,.055,8,24);geo.push(vg);props.valve=new T.Mesh(vg,red);props.valve.position.set(-5.7,1.05,-2.4);scene.add(props.valve);for(let a=0;a<3;a++){const rod=box(red,-5.7,1.05,-2.4,.57,.045,.06);rod.rotation.z=a*Math.PI/3;}
  pipe([[-5.7,1.05,-2.5],[-5.7,.4,-2.5],[-5.7,.4,-7]],.12);
  const crystalGeo=new T.OctahedronGeometry(.36);geo.push(crystalGeo);props.core=new T.Mesh(crystalGeo,own(new T.MeshStandardMaterial({color:0x79ffe2,emissive:0x35c9a7,emissiveIntensity:.9,metalness:.3,roughness:.13})));props.core.position.set(0,-2.85,-37.6);scene.add(props.core);box(dark,0,-3.68,-37.6,1,.5,1);
  sign('PRISM CURRENT / NEXUS INTAKE',0,3.55,5.8,7,1.1,'#d5e2d3',Math.PI);sign('01 / INTAKE',0,2.85,-15.05,3,.72);sign('02 / DEEP RESERVOIR',0,4.05,-30.7,5,.85);sign('DIVE / SUBMERGED ACCESS',0,-1.55,-30.73,3.4,.48,'#81f4d3');sign('AUXILIARY POWER',5.4,1.85,1.06,2,.35);sign('RETURN / PRISM DOCK',2.5,2,3.8,2.4,.38);sign('PUMP / DRAIN',-5.65,1.75,-2.4,2,.35);
  const hemi=new T.HemisphereLight(0xbfe2db,0x18282e,1.65);scene.add(hemi);const sun=new T.DirectionalLight(0xffe0b8,2.4);sun.position.set(-3,10,2);scene.add(sun);
  for(const [x,y,z,c,p] of [[0,3,-7,0xb7e8df,30],[0,2,-23,0x73d6ce,28],[0,-2.3,-38,0x59ffe0,8],[5,1.5,2,0xffb563,7]]){const l=new T.PointLight(c,p,18,2);l.position.set(x,y,z);scene.add(l);}
  const camera=new T.PerspectiveCamera(70,1,.06,95);camera.rotation.order='YXZ';scene.add(camera);
  const torch=new T.SpotLight(0xdcfff0,26,22,.49,.55,1.4);camera.add(torch);torch.position.set(.18,-.12,0);torch.target.position.set(0,0,-7);camera.add(torch.target);
  const reflection=new T.WebGLRenderTarget(512,512,{depthBuffer:true});reflection.texture.colorSpace=T.LinearSRGBColorSpace;const mirror=new T.PerspectiveCamera();const textureMatrix=new T.Matrix4(),look=new T.Vector3(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),normal=new T.Vector3(0,1,0);
  const rippleUniform=Array.from({length:6},()=>new T.Vector4(0,0,-100,0));let rippleIndex=0,lastRipple=-1;
  const wu={uTime:uniforms.time,uLevel:uniforms.level,uReflect:{value:reflection.texture},uMatrix:{value:textureMatrix},uReflected:{value:0},uEye:{value:new T.Vector3()},uRipples:{value:rippleUniform},uMotion:{value:1}};
  const waterMat=own(new T.ShaderMaterial({transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide,uniforms:wu,vertexShader:`uniform float uTime,uMotion;uniform mat4 uMatrix;varying vec3 vWorld;varying vec4 vReflection;
   void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=uMotion*(sin(w.x*1.7+uTime*.9)*.018+cos(w.z*2.1-uTime*.7)*.013);vWorld=w.xyz;vReflection=uMatrix*w;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`uniform float uTime,uLevel,uReflected,uMotion;uniform sampler2D uReflect;uniform vec3 uEye;uniform vec4 uRipples[6];varying vec3 vWorld;varying vec4 vReflection;
   ${caustic}
   void main(){float t=uTime;vec2 slope=vec2(cos(vWorld.x*1.7+t*.9)*.055,sin(vWorld.z*2.1-t*.7)*.052)*uMotion;float rings=0.;
    for(int i=0;i<6;i++){float age=t-uRipples[i].z;if(age>0.&&age<2.4){vec2 d=vWorld.xz-uRipples[i].xy;float len=length(d);float w=exp(-abs(len-age*1.5)*8.)*(1.-age/2.4);slope+=d/max(.01,len)*sin(len*19.-age*13.)*w*.12*uMotion;rings+=w*.11;}}
    vec3 n=normalize(vec3(slope.x,1.,slope.y)),eye=normalize(uEye-vWorld);float fres=.035+.90*pow(1.-clamp(abs(dot(n,eye)),0.,1.),4.);
    float floorY=vWorld.z< -18.5?-4.:-1.5;vec3 ray=refract(-eye,n,.752);float lengthRay=clamp((floorY-vWorld.y)/min(-.08,ray.y),0.,18.);vec2 bottom=vWorld.xz+ray.xz*lengthRay+slope*.35;
    vec2 f=fract(bottom*3.2);float grid=1.-smoothstep(.012,.033,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
    vec3 tiles=mix(vec3(.30,.53,.49),vec3(.075,.16,.16),grid);tiles+=vec3(.22,.49,.36)*caustic(bottom,t*.7)*.42;
    vec3 transmission=mix(tiles,vec3(.018,.16,.16),1.-exp(-lengthRay*.28));
    vec2 uv=vReflection.xy/max(.001,vReflection.w)+slope*.015;
    vec3 reflected=texture2D(uReflect,clamp(uv,.002,.998)).rgb;
    reflected=mix(vec3(.20,.33,.34),reflected,uReflected);
    float shine=pow(max(0.,dot(reflect(-normalize(vec3(-.3,1.,.25)),n),eye)),150.);
    vec3 c=mix(transmission,reflected,fres)+vec3(1.,.92,.7)*shine*.85+vec3(.06,.20,.17)*rings;
    if(uEye.y<uLevel)c=mix(vec3(.018,.19,.19),c,.42);
    gl_FragColor=vec4(c,.91);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));
  for(const [x,z,w,d]of [[0,-9,10.4,12],[0,-17,3.2,4],[0,-25,12,12]]){const g=new T.PlaneGeometry(w,d,32,48);g.rotateX(-Math.PI/2);geo.push(g);const m=new T.Mesh(g,waterMat);m.position.set(x,-.1,z);m.renderOrder=3;scene.add(m);waterMeshes.push(m);}
  let frame=0,disposed=false,reflectionPasses=0;
  function update(s,time,quality,quiet){uniforms.time.value=quiet?0:time;uniforms.level.value=s.water;wu.uMotion.value=quiet?0:1;
   camera.position.set(s.player.x,s.player.y,s.player.z);camera.rotation.set(s.player.pitch,s.player.yaw,0,'YXZ');camera.updateMatrixWorld();wu.uEye.value.copy(camera.position);torch.visible=s.torch;
   const submerged=s.player.y<s.water-.08;scene.fog.color.set(submerged?0x155c58:0x344e51);scene.fog.density=submerged?.17:.025;scene.background.copy(scene.fog.color);
   props.gate.position.y=s.stage>=2?2.75:-.2;props.power.material.color.set(s.stage>=1?0x71ffb5:0xf3ad50);props.extract.material.color.set(s.stage>=3?0x84ffe0:0x387c69);props.core.visible=s.stage<3;props.core.rotation.y=time*.5;props.valve.rotation.z=s.stage>=2?-1.5:0;
   for(const m of waterMeshes)m.position.y=s.water;
   if(s.mode==='playing'&&!quiet&&s.player.y-1.3<s.water&&time-lastRipple>.4){const speed=Math.hypot(s.player.x-(update.px??s.player.x),s.player.z-(update.pz??s.player.z));if(speed>.009){rippleUniform[rippleIndex].set(s.player.x,s.player.z,time,1);rippleIndex=(rippleIndex+1)%6;lastRipple=time;}}
   update.px=s.player.x;update.pz=s.player.z;
   wu.uReflected.value=quality==='light'?0:1;
   if(quality!=='light'&&!submerged&&frame++%(quality==='cinematic'?3:5)===0){
    mirror.copy(camera);mirror.position.y=2*s.water-camera.position.y;camera.getWorldDirection(look);look.y=-look.y;mirror.up.set(0,-1,0);mirror.lookAt(mirror.position.clone().add(look));mirror.updateMatrixWorld();
    textureMatrix.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
    const target=renderer.getRenderTarget(),clips=renderer.clippingPlanes;for(const m of waterMeshes)m.visible=false;torch.visible=false;
    try{renderer.clippingPlanes=[new T.Plane(normal,-s.water+.01)];renderer.setRenderTarget(reflection);renderer.render(scene,mirror);reflectionPasses++;}finally{renderer.setRenderTarget(target);renderer.clippingPlanes=clips;for(const m of waterMeshes)m.visible=true;torch.visible=s.torch;}
   }
   renderer.render(scene,camera);
  }
  function dispose(){if(disposed)return;disposed=true;for(const g of geo)g.dispose();for(const m of owned)m.dispose();for(const t of textures)t.dispose();reflection.dispose();scene.clear();}
  return {scene,camera,update,dispose,get stats(){return {reflectionPasses,rippleSlots:6,waterSurfaces:waterMeshes.length,disposed};}};
 }
 root.PrismWaterScene={build};
})(globalThis);
