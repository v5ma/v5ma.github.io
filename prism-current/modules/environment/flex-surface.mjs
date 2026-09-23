// Caller supplies THREE; same source for classic-script and ES-module hosts.
import './flex-surface.js';
const api=globalThis.SVGNFlexSurface;
export const {VERSION,MAX_BEND,options,shape,evaluate,create}=api;
export default api;
