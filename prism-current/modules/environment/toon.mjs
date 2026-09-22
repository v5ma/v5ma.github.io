// Reuses the host's Three.js namespace; no second engine import.
import './toon.js';
const api=globalThis.SVGNToon;
export const {VERSION,DEFAULT_BANDS,MAX_MATERIALS,bands,ramp,create}=api;
export default api;
