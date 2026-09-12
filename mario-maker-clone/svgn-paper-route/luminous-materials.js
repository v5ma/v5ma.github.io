/* Three r177 TSL shaders for the existing Prismatic layer. No extra renderer,
 * screen postprocess, external textures, geometry displacement or game hooks. */
import {preferences,strength,waterPatches,skyBounds,LIMITS} from './luminous-core.mjs';
export function installLuminous(T,owner,clock,raw,course,makeMesh) {
  const prefs=preferences(raw),amount=strength(prefs);
  const stats={finish:prefs.finish,waterCount:0,skyCount:0,extraDraws:0,draws:0,waterDraws:0,skyDraws:0,railMaterials:0,budget:LIMITS.extraDraws};
  if(!amount)return {stats,update(){}};
  const {sin,cos,uv,color,mix,vec3,normalMap,positionWorld,normalView,positionViewDirection,smoothstep}=T.TSL;
  // Slow spatial thin-film variation. Gold edge geometry is deliberately untouched.
  const phase=sin(positionWorld.x.mul(.005).add(positionWorld.y.mul(.003)).add(clock.mul(.16))).mul(.5).add(.5);
  const fresnel=normalView.dot(positionViewDirection).abs().oneMinus().pow(2);
  for(const [mat,factor] of [[owner.roadMaterial,1],[owner.actorMaterial,.38]]) {
    if(!mat)continue;
    mat.iridescenceNode=phase.mul(.36*amount*factor).add(.16).add(fresnel.mul(.2*amount*factor)).clamp(0,.8);
    mat.iridescenceThicknessNode=phase.mul(170).add(180);
    mat.roughnessNode=phase.mul(.06*amount).add(.23);
    mat.needsUpdate=true;stats.railMaterials++;
  }
  const scenery=[];
  function add(geometry,material,name) {
    owner.geometries.add(geometry);owner.materials.add(material);
    const o=makeMesh(geometry,material,owner.group,name);o.userData.luminousDecoration=true;
    o.onAfterRender=()=>{stats.draws++;if(name.includes("canal"))stats.waterDraws++;else stats.skyDraws++;};scenery.push(o);stats.extraDraws++;return o;
  }
  if(prefs.water) {
    const patches=waterPatches(course);
    if(patches.length) {
      const mat=new T.MeshPhysicalNodeMaterial({name:'Luminous / ripple-lit canal',roughness:.22,metalness:.2,clearcoat:.8,clearcoatRoughness:.14,envMap:owner.env,envMapIntensity:.9,side:T.DoubleSide});
      const x=positionWorld.x.mul(.018).add(clock.mul(.45)),z=positionWorld.z.mul(.035).sub(clock.mul(.33));
      const a=sin(x.add(sin(z))),b=sin(z.add(sin(x.mul(.73))));
      const filigree=a.add(b.mul(.65)).abs().oneMinus().clamp(0,1).pow(9);
      mat.colorNode=mix(color('#235c70'),color('#67bfb5'),a.mul(.17).add(.38)).add(color('#d8ffe9').mul(filigree.mul(.22*amount)));
      mat.normalNode=normalMap(vec3(sin(x).mul(.08*amount).add(.5),cos(z).mul(.08*amount).add(.5),1));
      mat.roughnessNode=a.mul(.04).add(.24);
      // Emissive filigree is a stylized caustic pattern, not ray-traced caustics.
      mat.emissiveNode=color('#9aeadb').mul(filigree.mul(.09*amount));
      const geo=new T.PlaneGeometry(1,1);
      for(const p of patches){const o=add(geo,mat,'Luminous canal surface');o.position.set(p.x,p.y,p.z);o.rotation.x=-Math.PI/2;o.scale.set(p.width,p.depth,1);o.userData.extent=p.width/2;stats.waterCount++;}
    }
  }
  if(prefs.sky) {
    const mat=new T.MeshBasicNodeMaterial({name:'Luminous / sky silk',transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,fog:false});
    const u=uv(),t=clock.mul(.025);
    const bend=sin(u.x.mul(14).add(t)).mul(.10).add(sin(u.x.mul(29).sub(t.mul(.6))).mul(.022)).add(.57);
    const band=smoothstep(.008,.135,u.y.sub(bend).abs()).oneMinus();
    const ribs=sin(u.x.mul(115).add(sin(u.y.mul(7))).add(t)).mul(.14).add(.86);
    const ends=smoothstep(0,.08,u.x).mul(smoothstep(.92,1,u.x).oneMinus());
    mat.colorNode=mix(color('#aff6da'),color('#c1b1f1'),sin(u.x.mul(17).sub(t)).mul(.5).add(.5));
    mat.opacityNode=band.pow(1.6).mul(ribs).mul(ends).mul(.11+.17*amount);
    const p=skyBounds(course),o=add(new T.PlaneGeometry(p.width,p.height),mat,'Luminous sky silk');o.position.set(p.x,p.y,p.z);o.renderOrder=-80;stats.skyCount=1;
  }
  return {stats,update(x,y,active) {
    for(const o of scenery)if(o.userData.extent)o.visible=!active||Math.abs(o.position.x-x)<1450+o.userData.extent&&Math.abs(o.position.y+y)<1500;
  }};
}
