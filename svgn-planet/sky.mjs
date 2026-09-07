import * as T from './vendor/three.module.js';
// Screen-space background, actual 3D foreground. Directions are reconstructed
// from the same camera so clouds never turn into a miniature floating globe.
export function createSky(scene,groundRadius=110) {
 const uniforms={dip:{value:0},up:{value:new T.Vector3(0,1,0)},rays:{value:new T.Matrix4()},eye:{value:new T.Vector3()},
  zenith:{value:new T.Color('#238ddb')},horizon:{value:new T.Color('#c5e7ea')},
  white:{value:new T.Color('#fff6dc')},shade:{value:new T.Color('#a8cddb')}};
 const material=new T.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,toneMapped:false,
 vertexShader:`varying vec2 screen;void main(){screen=position.xy;gl_Position=vec4(position.xy,1.,1.);}`,
 fragmentShader:`precision highp float;varying vec2 screen;uniform mat4 rays;uniform float dip;uniform vec3 eye,up,zenith,horizon,white,shade;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.3,.7));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){vec4 world=rays*vec4(screen,1.,1.);vec3 d=normalize(world.xyz/world.w-eye);float h=dot(d,up)+dip;
 vec3 blue=mix(horizon,zenith,smoothstep(-.05,.46,h));
 vec3 p=d*(5.5/(max(.24,h+.4)))+vec3(13,2,7);
 float n=noise(p)*.59+noise(p*2.03)*.28+noise(p*4.1)*.13;
 float cover=smoothstep(.51,.64,n)*smoothstep(-.08,.14,h);
 vec3 cloud=mix(shade,white,smoothstep(.49,.68,n));
 gl_FragColor=vec4(mix(blue,cloud,cover),1.);
 #include <colorspace_fragment>
 }`});
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const mesh=new T.Mesh(geometry,material);mesh.name='Procedural daylight sky';mesh.frustumCulled=false;mesh.renderOrder=-10000;scene.add(mesh);let rendered=0;
 mesh.onAfterRender=()=>rendered++;
 return {update(camera,normal,visible){mesh.visible=visible;uniforms.dip.value=Math.acos(Math.min(1,groundRadius/Math.max(groundRadius,camera.position.length())));uniforms.up.value.copy(normal);uniforms.eye.value.copy(camera.position);uniforms.rays.value.multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);},
  inspect:()=>({rendered,visible:mesh.visible,style:'daylight-cumulus'}),mesh};
}
