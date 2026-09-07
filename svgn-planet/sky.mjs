import * as T from './vendor/three.module.js';
// A lightweight procedural daylight sky: no downloaded backdrop or screen image.
export function createSky(scene, radius) {
 const uniforms={up:{value:new T.Vector3(0,1,0)}};
 const material=new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,depthTest:false,
  vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`precision mediump float;varying vec3 direction;uniform vec3 up;
  float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.3,.7));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  void main(){vec3 d=normalize(direction);float h=dot(d,up);vec3 blue=mix(vec3(.10,.34,.58),vec3(.012,.18,.55),smoothstep(-.5,.45,h));vec3 p=d*6.+vec3(7,2,11);float n=noise(p)*.6+noise(p*2.03)*.28+noise(p*4.1)*.12;float c=smoothstep(.48,.68,n)*smoothstep(-.25,.08,h);vec3 cloud=mix(vec3(.7,.8,.8),vec3(.98,.95,.84),smoothstep(.52,.75,n));gl_FragColor=vec4(mix(blue,cloud,c),1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
 const mesh=new T.Mesh(new T.SphereGeometry(radius,20,12),material);mesh.frustumCulled=false;mesh.renderOrder=-1000;scene.add(mesh);
 return {update(camera,normal,visible){mesh.visible=visible;mesh.position.copy(camera.position);uniforms.up.value.copy(normal);}};
}
