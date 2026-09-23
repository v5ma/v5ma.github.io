// Same original mesh-cloud implementation; caller supplies the existing THREE.
import './cloudlets.js';
const api=globalThis.SVGNCloudlets;
export const {VERSION,MAX_CLOUDS,LOBES,LEVELS,seedFor,descriptors,shape,extent,level,offset,create}=api;
export default api;
