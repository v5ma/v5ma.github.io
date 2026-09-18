# Temporary source transport; removed before merge. No gameplay acceptance criteria change.
from pathlib import Path
import hashlib,json
EXPECTED={'graphics/pool-stage.js': ('429c01cbc235e705291da2f0eeb609ec3bf683d598ee0cb36b9a3738873aa617', '0309c31a51c3aefc84b8718688559ddadd8d6ff7764fca180f1ec2b92491ffb1'), 'tests/undertow-browser.py': ('a15576b04505a9c27549e3f44f652084a4a1dad5ce3a1e47ad7b3f4bf6756a44', 'd18396cd625da598786732f40a57c0271621231486d9d68bf6a3bc14d814ff31')}
for n,h in EXPECTED.items():assert hashlib.sha256((Path('prism-current')/n).read_bytes()).hexdigest()==h[0],n
p=Path('prism-current/graphics/pool-stage.js')
s=p.read_text()
s=s.replace(" function install(art,scene){",''' // Join only fixed opaque hilt parts with identical material objects. Blade GLSL,
 // live ribbon geometry, grip origins and all collision endpoints remain untouched.
 function mergeFixedParts(T,parent){
  const byMaterial=new Map(),joined=[],hidden=[];let before=0,after=0,triangles=0,maxError=0;
  for(const m of parent.children){
   if(!m.isMesh||!m.visible||Array.isArray(m.material)||m.material.isShaderMaterial||m.material.transparent)continue;
   if(!m.geometry.attributes.position||!m.geometry.attributes.normal)continue;
   if(!byMaterial.has(m.material))byMaterial.set(m.material,[]);byMaterial.get(m.material).push(m);
  }
  for(const [material,meshes] of byMaterial){
   if(meshes.length<2)continue;
   const positions=[],normals=[],uvs=[],sourceBox=new T.Box3();
   for(const m of meshes){
    m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);g.computeBoundingBox();sourceBox.union(g.boundingBox);
    const a=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;
    for(let i=0;i<a.count;i++){positions.push(a.getX(i),a.getY(i),a.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(u?u.getX(i):0,u?u.getY(i):0);}
    g.dispose();hidden.push({mesh:m,visible:m.visible});m.visible=false;
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeBoundingBox();g.computeBoundingSphere();
   maxError=Math.max(maxError,g.boundingBox.min.distanceTo(sourceBox.min),g.boundingBox.max.distanceTo(sourceBox.max));
   const m=new T.Mesh(g,material);m.name='Merged static hilt / unchanged triangles';parent.add(m);joined.push(m);before+=meshes.length;after++;triangles+=positions.length/9;
  }
  let disposed=false;
  return {stats:{before,after,triangles,maxError},dispose(){if(disposed)return;disposed=true;for(const m of joined){m.removeFromParent();m.geometry.dispose();}for(const h of hidden)h.mesh.visible=h.visible;}};
 }
 function install(art,scene){''')
s=s.replace("const geometries=[],materials=[],textures=[],instances=[];", "const geometries=[],materials=[],textures=[],instances=[];\n  const hiltBatches=art.hands.map(h=>mergeFixedParts(T,h.g));")
s=s.replace("boxCount,disposed:false", "boxCount,hiltBatches:hiltBatches.map(b=>b.stats),disposed:false")
s=s.replace("status.disposed=true;group.removeFromParent();", "status.disposed=true;for(const b of hiltBatches)b.dispose();group.removeFromParent();")
s=s.replace("Object.freeze({install})", "Object.freeze({install,mergeFixedParts})")
p.write_text(s)
p=Path('prism-current/tests/undertow-browser.py');s=p.read_text()
s=s.replace("check(p.locator('#tracks button').count()==5", "check(p.evaluate('Prism.component.art.poolStage.status.hiltBatches.every(b=>b.after<b.before&&b.triangles>0&&b.maxError<1e-6)'), 'Hilt batching preserves transformed geometry bounds and reduces fixed-part draws')\n  check(p.locator('#tracks button').count()==5")
p.write_text(s)
for n,h in EXPECTED.items():assert hashlib.sha256((Path('prism-current')/n).read_bytes()).hexdigest()==h[1],n
f=Path('/tmp/prism-undertow-paths.json');f.write_text(json.dumps(json.loads(f.read_text())+['prism-current/'+n for n in EXPECTED]))
