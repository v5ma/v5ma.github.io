/* Extend original ShaderMaterials with Three's own world-volume clip uniforms.
 * No time, color, motion or material uniforms are replaced. Standard materials
 * already participate in renderer.clippingPlanes. */
export function enableDioramaClipping(scene){
 let count=0;const seen=new Set();
 scene.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material]){
  if(!material?.isShaderMaterial||seen.has(material))continue;seen.add(material);
  if(material.userData?.rainwardDioramaClip){count++;continue;}
  const vertex=material.vertexShader,fragment=material.fragmentShader,end=vertex.lastIndexOf('}');
  if(end<0||!fragment.match(/void\s+main\s*\(\s*\)\s*\{/))throw Error('Diorama clipping needs a reviewed ShaderMaterial main');
  // Preserve actual authored vertex deformation where it exists.
  const viewPosition=/vec4\s+world\s*=/.test(vertex)?'(viewMatrix*world).xyz':/vec4\s+mv\s*=/.test(vertex)?'mv.xyz':/vec3\s+p\s*=/.test(vertex)?'(modelViewMatrix*vec4(p,1.0)).xyz':'(modelViewMatrix*vec4(position,1.0)).xyz';
  const clip='\n#if NUM_CLIPPING_PLANES > 0\n vClipPosition=-'+viewPosition+';\n#endif\n';
  material.vertexShader='#include <clipping_planes_pars_vertex>\n'+vertex.slice(0,end)+clip+vertex.slice(end);
  material.fragmentShader='#include <clipping_planes_pars_fragment>\n'+fragment.replace(/void\s+main\s*\(\s*\)\s*\{/,'void main(){\n#include <clipping_planes_fragment>\n');
  material.clipping=true;material.userData.rainwardDioramaClip=true;material.needsUpdate=true;count++;
 }});return count;
}
