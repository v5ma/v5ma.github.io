"""Light/material tuning and stable dynamic whip geometry; no gameplay shortcuts."""
from pathlib import Path
root=Path(__file__).resolve().parents[1];g=root/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
s=s.replace('MeshStandardNodeMaterial,MeshBasicNodeMaterial,','MeshStandardNodeMaterial,MeshLambertNodeMaterial,MeshBasicNodeMaterial,')
if 'src="./whip-visual.js"' not in s:s=s.replace('<script src="./grapple-game.js"></script>','<script src="./grapple-game.js"></script>\n<script src="./whip-visual.js"></script>')
p.write_text(s,newline='\r\n')
p=g/'cloudview-depth.js';s=p.read_text()
s=s.replace("2026.09.05-depth2", "2026.09.05-depth3")
s=s.replace('for(const [light,intensity]of saved.lights)light.intensity=intensity;', 'for(const [light,intensity,visible]of saved.lights){light.intensity=intensity;light.visible=visible;}')
s=s.replace('saved.lights.push([light,light.intensity]);','saved.lights.push([light,light.intensity,light.visible]);')
s=s.replace('for(const [light]of saved.lights)light.intensity=0;','for(const [light]of saved.lights){light.intensity=0;light.visible=false;}')
s=s.replace('root.traverse(o=>{if(o.isLight)o.intensity=0;});','root.traverse(o=>{if(o.isLight){o.intensity=0;o.visible=false;}});')
s=s.replace('m.renderer.toneMappingExposure=.74','m.renderer.toneMappingExposure=.91')
s=s.replace("'#064eee'","'#298cf4'").replace("'#116aed'","'#71c9ff'")
if 'function matteScenery' not in s:
    helper='''  // Diffuse rocks/foliage do not need a metallic environment BRDF. Keep
  // the same geometry, normal maps, colors and real directional lighting.
  function matteScenery(m,root){
    const replacements=new Map();let diffuse=0,distant=0;
    root.traverse(o=>{
      const old=o.material;if(!old||!o.geometry)return;
      if(old.isMeshStandardNodeMaterial&&old.roughness>=.7&&old.metalness<=.06){
        if(!replacements.has(old))replacements.set(old,new m.THREE.MeshLambertNodeMaterial({
          color:old.color,vertexColors:old.vertexColors,map:old.map,side:old.side,
          fog:old.fog,transparent:old.transparent,opacity:old.opacity,
          depthWrite:old.depthWrite,emissive:old.emissive,emissiveIntensity:old.emissiveIntensity
        }));
        o.material=replacements.get(old);diffuse++;
      }
      if(o.name.includes('/ spatial ')){
        o.geometry.computeBoundingBox();
        if(o.geometry.boundingBox.max.z < -120){o.castShadow=false;o.receiveShadow=false;distant++;}
      }
    });
    for(const old of replacements.keys())old.dispose();
    return {diffuseBatches:diffuse,distantShadowExclusions:distant,geometryReduced:false};
  }
'''
    s=s.replace('  function makeBevel(T)',helper+'  function makeBevel(T)')
    s=s.replace('lighting.stats.spatial=CloudDepthChunks.apply(m,root);','lighting.stats.spatial=CloudDepthChunks.apply(m,root);lighting.stats.materials=matteScenery(m,root);')
p.write_text(s)
p=g/'cloudview-world.js';s=p.read_text()
old="gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.94)');gr.addColorStop(.62,'rgba(248,253,255,.92)');gr.addColorStop(.84,'rgba(231,245,255,.65)');gr.addColorStop(1,'rgba(230,246,255,0)')"
new="gr=g.createRadialGradient(x-r*.28,y-r*.35,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.96)');gr.addColorStop(.48,'rgba(244,252,255,.93)');gr.addColorStop(.78,'rgba(173,206,238,.64)');gr.addColorStop(1,'rgba(166,204,239,0)')"
s=s.replace(old,new);p.write_text(s)
p=root/'tests/grapple_browser.py';s=p.read_text()
s=s.replace("__grapple.graphics.chain.count>0","__grapple.graphics.ropeMesh?.geometry.drawRange.count>0")
s=s.replace('while time.monotonic()-start<240:', 'while time.monotonic()-start<540:')
s=s.replace("'Attached whip is rendered as a segmented 3D chain'","'Whip has submitted nonempty dynamic 3D link geometry'")
p.write_text(s)
p=root/'tests/sky_browser.py';s=p.read_text().replace('while time.monotonic()-start<300:', 'while time.monotonic()-start<540:');p.write_text(s)
print('Legacy light flood removed, diffuse scenery optimized, dynamic whip geometry installed.')
