/* Visual-only integration with the existing nine-road world. All positions for
 * pickups come from WORLD; no added quest, rewards or changes to collisions. */
import * as T from './vendor/three.module.js';
import {WORLD,point,street,tangent,add,mul,distance} from './world.mjs';
import {createMaterialLibrary,gemGeometry,bevelGeometry,resolveLook,LOOK_KEY} from './jewel-materials.mjs';
import {createGlow,createSparks,makeWater} from './jewel-effects.mjs';
import {faceSurface} from './neighborhood.mjs';
const UP=new T.Vector3(0,1,0),phase=new T.Quaternion();
export function readLook(storage,touch=false){try{const s=JSON.parse(storage.getItem(LOOK_KEY)||'{}');return {preset:resolveLook(s.preset,touch),quiet:s.quiet===true};}catch{return {preset:resolveLook(null,touch),quiet:false};}}
export function createJewelScene({renderer,scene,root,sea,sun,courier,traffic,stamps,boxes,network,touch=false}){
 const pref=readLook({getItem:key=>globalThis.localStorage.getItem(key)},touch),library=createMaterialLibrary(renderer,scene),glow=createGlow(renderer),sparks=createSparks(root),bevel=bevelGeometry(),diamond=gemGeometry(.42),water=makeWater(),windows=[],landmarks=[];
 let look=(new URLSearchParams(location.search).get('quality')==='low'? 'light':pref.preset),quiet=pref.quiet,rebuilds=0,seen=new Set(),initial=true,draws=0,glowEnabled=false;sea.material=water;
 const tag=m=>{m.userData.keepOptics=true;return m;};[library.glass,library.chrome,library.gold,...library.gems].forEach(tag);
 // Upgrade only surfaces that should shine; skin, clothing, tires and paper do not.
 function cyclePolish(group){group.traverse(o=>{if(!o.isMesh||!o.material.color)return;const c=o.material.color.getHexString();if(['b0c5c5','b8d0cb','495d63','b8d7d6'].includes(c))o.material=library.chrome;else if(['365b6a','d3824f'].includes(c)){o.material=library.paint('#087a91');if(o.geometry.type==='BoxGeometry')o.geometry=bevel;}});}
 cyclePolish(courier.unicycle);cyclePolish(courier.bicycle);
 for(const side of [-1,1]){const rim=new T.Mesh(new T.TorusGeometry(.29,.024,6,32),library.chrome);rim.position.set(side*.115,.37,0);rim.rotation.y=Math.PI/2;courier.unicycle.add(rim);const hub=new T.Mesh(new T.CircleGeometry(.18,32),library.gold);hub.position.set(side*.12,.37,0);hub.rotation.y=side*Math.PI/2;courier.unicycle.add(hub);}
 // Faceted badge and a glass-fronted battery casing, not a rescaled character.
 const badge=new T.Mesh(gemGeometry(.11),library.gems[0]);badge.position.set(0,1.34,.49);courier.body.add(badge);
 traffic.forEach(({g})=>{g.traverse(o=>{if(!o.isMesh||!o.material.color)return;const c=o.material.color.getHexString();if(['7aa3af','405e69'].includes(c)){o.material=library.glass;windows.push(o);}else if(c==='c7c9b6')o.material=library.chrome;else if(!['283940','f4e6ae'].includes(c)){o.material=library.paint(o.material.color);if(o.geometry.type==='BoxGeometry')o.geometry=bevel;}});});
 for(const {g,flag} of boxes){g.traverse(o=>{if(!o.isMesh||o===flag)return;const c=o.material.color?.getHexString();if(c==='e8c389')o.material=library.gold;else if(c==='8f7658')o.material=library.chrome;});}
 stamps.forEach(({m},i)=>{m.geometry=diamond;m.material=library.gems[i%3];m.position.y=.1;m.castShadow=false;m.name='Faceted postmark / '+i;});
 // Glass transit shelters occupy existing verges. Their open sides never cover
 // a delivery target. They are static art, not new collision/mission content.
 const nearPos=[[3,5.8],[30,-25.7],[54,25.7],[77,42]];
 for(const [i,[t,x]] of nearPos.entries()){
  const n=street(t,x),g=new T.Group();faceSurface(g,n,tangent(add(street(t+1,x),mul(n,-1)),n));root.add(g);g.name='Glass-and-gold verge shelter';landmarks.push({g,n});
  const block=(geo,mat,p,scale)=>{const m=new T.Mesh(geo,mat);m.position.set(...p);if(scale)m.scale.set(...scale);g.add(m);m.castShadow=false;m.receiveShadow=true;return m;};
  block(bevel,library.ink,[0,.13,0],[1.65,.26,2.3]);
  for(const z of [-1,1])for(const s of [-.64,.64])block(bevel,library.gold,[s,1.37,z],[.065,2.6,.065]);
  block(bevel,library.glass,[0,2.68,0],[1.7,.13,2.45]);block(bevel,library.glass,[.67,1.5,0],[.055,2.3,2.12]);
  block(bevel,library.chrome,[0,.76,.6],[.8,.06,.6]);block(bevel,library.ink,[0,.43,.6],[.09,.66,.3]);
  const exhibit=block(gemGeometry(.48),library.gems[i%3],[0,1.7,0]);landmarks.at(-1).exhibit=exhibit;
  const text=document.createElement('canvas');text.width=256;text.height=64;const c=text.getContext('2d');c.fillStyle='#132e3c';c.fillRect(0,0,256,64);c.fillStyle='#e4d6aa';c.font='600 25px system-ui';c.textAlign='center';c.fillText(i?'SVGN / CITY LINK':'SVGN / PRISM LINE',128,42);const tex=new T.CanvasTexture(text);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(1.55,.39),new T.MeshBasicMaterial({map:tex}));sign.position.set(0,2.5,-1.06);sign.rotation.y=Math.PI;g.add(sign);
 }
 // A translucent rim shader on the collectible itself is cheaper and more
 // selective than blurring the entire scene on phone hardware.
 const haloMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{clock:{value:0},amount:{value:1}},vertexShader:'varying vec3 N,V;void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 N,V;uniform float clock,amount;void main(){float f=pow(1.-abs(dot(normalize(N),normalize(V))),3.);vec3 c=.55+.45*cos(vec3(0.,2.,4.)+clock*.5);gl_FragColor=vec4(c,f*.23*amount);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 stamps.forEach(({g})=>{const h=new T.Mesh(diamond,haloMat);h.scale.setScalar(1.07);h.position.y=.1;g.add(h);});
 function savePref(){try{localStorage.setItem(LOOK_KEY,JSON.stringify({preset:look,quiet}));}catch{}}
 function setLook(value,persist=true){look=resolveLook(value,touch);library.setLook(look);glowEnabled=look==='cinematic'&&!quiet;haloMat.uniforms.amount.value=look==='light'?.5:1;renderer.transmissionResolutionScale=.5;if(persist)savePref();}
 function setQuiet(value){quiet=!!value;glowEnabled=look==='cinematic'&&!quiet;savePref();}
 function assetMaterials(libraryRoot){libraryRoot.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;if(o.material.name==='MI_Glass'){o.material=library.glass;windows.push(o);}});}
 function update(dt,s,camera,overview){
  phase.setFromUnitVectors(UP,new T.Vector3(...s.n));scene.environmentRotation.setFromQuaternion(phase);library.orient(phase);water.uniforms.clock.value=quiet?0:s.time;water.uniforms.eye.value.copy(camera.position);haloMat.uniforms.clock.value=quiet?0:s.time;
  for(const l of landmarks){l.g.visible=overview||distance(l.n,s.n)<65;if(!quiet)l.exhibit.rotation.y=s.time*.45;}
  const current=new Set([...s.stamps,...s.delivered,...s.bonusDelivered,...s.stunts]);if(!initial)for(const key of current)if(!seen.has(key))sparks.burst(point(s.n,1.15),s.n);seen=current;initial=false;sparks.update(dt,quiet);
  // No state changes: controls, boost speed and collection volumes stay in model.
 }
 function render(camera){renderer.info.reset();glow.draw(scene,camera,glowEnabled&&!renderer.xr.isPresenting,1);draws++;}
 function restored(){library.rebuild();rebuilds++;setLook('light',false);}
 setLook(look,false);
 return {library,assetMaterials,update,render,setLook,setQuiet,restored,get preset(){return look;},get quiet(){return quiet;},inspect:()=>({...library.inspect(),quiet,bloom:glowEnabled,glow:glow.inspect(),sparks:sparks.inspect(),glassMeshes:windows.length+nearPos.length*2,crystalPostmarks:stamps.length,glassShelters:landmarks.length,frames:draws,rebuilds}),dispose(){library.dispose();glow.dispose();sparks.dispose();water.dispose();haloMat.dispose();bevel.dispose();diamond.dispose();}};
}
