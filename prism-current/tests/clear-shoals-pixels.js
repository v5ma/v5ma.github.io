/* Native optical fixture only. Never loaded by the game.
 * A per-surface alpha cap composes as 1-product(1-alpha) at projected overlaps.
 * Compare the moving surface to the SAME triangles shaded at the cap, then
 * independently test that cap in an overhead nonoverlapping projection.
 */
window.measureShoalOpacity=()=>{
 const f=fixture,measure=data=>{let max=0,over=0,at=0;for(let i=3;i<data.length;i+=4){if(data[i]>205)over++;if(data[i]>max){max=data[i];at=i;}}return {max,over,at:[((at-3)/4)%960,Math.floor((at-3)/4/960)]};};
 const m=f.w.material,fragment=m.fragmentShader,pos=f.cam.position.clone(),q=f.cam.quaternion.clone();
 const result={base:measure(f.base),optical:measure(f.upgraded),uniform:f.w.uniforms.opacity.value,clearAlpha:f.r.getClearAlpha(),boundViolations:0,addedOverlapPixels:0};
 const anchor='gl_FragColor=vec4(color,alpha*nearRoom);';
 if(fragment.split(anchor).length!==2)throw Error('Unknown optical output for alpha-reference fixture');
 try{
  m.fragmentShader=fragment.replace(anchor,'gl_FragColor=vec4(vec3(0.),opacity);');m.needsUpdate=true;f.r.render(f.s,f.cam);
  const upper=f.pixels();result.geometryBound=measure(upper);
  for(let i=3;i<upper.length;i+=4){if(f.upgraded[i]>upper[i]+1)result.boundViolations++;if(f.upgraded[i]>205&&f.base[i]<=205)result.addedOverlapPixels++;}
  m.fragmentShader=fragment;m.needsUpdate=true;f.cam.position.set(0,12,-7);f.cam.lookAt(0,0,-7);f.r.render(f.s,f.cam);result.overhead=measure(f.pixels());
 }finally{
  m.fragmentShader=fragment;m.needsUpdate=true;f.cam.position.copy(pos);f.cam.quaternion.copy(q);f.cam.updateMatrixWorld(true);f.r.render(f.s,f.cam);
 }
 return result;
};
