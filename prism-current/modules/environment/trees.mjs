// Reuse the caller's Three.js; this entry imports no renderer or engine.
import './trees.js';
const api=globalThis.SVGNTrees;
export const {VERSION,SCHEMA,MAX_TREES,PRESETS,DETAIL,descriptor,skeleton,geometryData,wind,level,create}=api;
export default api;
