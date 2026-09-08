/* Hide unused lights rather than leaving zero-intensity lights in the renderer. */
export function updateLightPool(lights,candidates,budget,night){
  let active=0;
  for(let i=0;i<lights.length;i++){
    const light=lights[i],p=candidates[i];
    light.intensity=i<budget&&p&&p.d<16?(p.inside?10:12*night):0;
    light.visible=light.intensity>0;light.castShadow=false;
    if(light.visible){light.position.copy(p.pos);active++;}
  }
  return active;
}
