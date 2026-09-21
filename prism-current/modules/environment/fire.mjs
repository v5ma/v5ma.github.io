// Reuses the caller's existing THREE. No renderer/asset dependency is imported.
import './fire.js';
const api=globalThis.SVGNFire;
export const {VERSION,QUALITY,Pool,noiseData,create}=api;
export default api;
