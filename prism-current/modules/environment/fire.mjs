// Reuses the caller's existing THREE. No renderer/asset dependency is imported.
import './fire.js';
const api=globalThis.SVGNFire;
export const {VERSION,QUALITY,Pool,noiseData,flowData,create}=api;
export default api;
