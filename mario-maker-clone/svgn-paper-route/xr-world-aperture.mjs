/* Fixed exhibit-space fragment mask. No view-space ClippingGroup cache, invisible
 * occluder meshes, camera-following cap planes, or changes to collision geometry.
 * Materials retain their own alpha, lighting, textures and previous masks.
 */
export function apertureBounds(config={}) {
  const finite=(v,f)=>Number.isFinite(Number(v))?Number(v):f;
  const s=finite(config.scale,1),h=finite(config.height,0),d=finite(config.distance,2.4);
  return {min:[-1.5*s,h-.95*s,-d-.8*s],max:[1.5*s,h+.95*s,-d+.5*s]};
}
export function insideAperture(point,bounds) {
  return point.every((v,i)=>v>=bounds.min[i]&&v<=bounds.max[i]);
}
export function createWorldAperture(T) {
  const {uniform,positionWorld,vec4}=T.TSL;
  const inverse=uniform(new T.Matrix4()),minimum=uniform(new T.Vector3()),maximum=uniform(new T.Vector3());
  const enabled=uniform(0);
  const local=inverse.mul(vec4(positionWorld,1)).xyz;
  const inside=local.greaterThanEqual(minimum).all().and(local.lessThanEqual(maximum).all());
  const mask=enabled.equal(0).or(inside),originals=new Map();
  let bounds=apertureBounds(),active=false;
  return {
    update(matrix,config,on){
      active=!!on;enabled.value=active?1:0;bounds=apertureBounds(config);
      inverse.value.copy(matrix).invert();minimum.value.fromArray(bounds.min);maximum.value.fromArray(bounds.max);
    },
    sync(scene){
      if(!active)return;
      scene?.traverse(o=>{
        for(const m of Array.isArray(o.material)?o.material:[o.material]){
          if(!m?.isMaterial||originals.has(m))continue;
          // r177 NodeLibrary copies enumerable fields from classic materials too.
          const prior=m.maskNode,combined=prior?mask.and(prior):mask;
          originals.set(m,{prior,combined,owned:Object.hasOwn(m,'maskNode')});m.maskNode=combined;m.needsUpdate=true;
        }
      });
    },
    dispose(){
      enabled.value=0;
      for(const [m,{prior,combined,owned}]of originals)if(m.maskNode===combined){if(owned)m.maskNode=prior;else delete m.maskNode;m.needsUpdate=true;}
      originals.clear();active=false;
    },
    get diagnostics(){return {active,space:'exhibit-world',materials:originals.size,min:bounds.min.slice(),max:bounds.max.slice(),inverse:inverse.value.elements.slice()};}
  };
}
