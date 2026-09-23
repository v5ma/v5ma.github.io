// ES-module entry. Uses the caller's Three.js; does not import a second renderer.
import './water.js';
const api = globalThis.SVGNWater;
export const { VERSION, QUALITY, PRESETS, WAVES, options, evaluate, Disturbances, noiseData, create } = api;
export default api;
