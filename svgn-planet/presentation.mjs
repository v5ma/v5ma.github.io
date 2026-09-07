export const PRESENTATION_VERSION = '0.2.0';
// The default is a character-scale chase camera, never the globe overview.
export const CAMERA_PRESETS = Object.freeze({
  street: {distance: 7.5, height: 2.5, targetHeight: 1.0, fov: 62},
  adventure: {distance: 13, height: 7, targetHeight: .8, fov: 52},
  overview: {distance: 68, height: 62, targetHeight: 0, fov: 45}
});
export function chooseGraphics({touch=false, width=1280, height=720, dpr=1, requested='auto'}={}) {
  const low=requested==='low'||(requested==='auto'&&touch);
  const pixelBudget=low?480000:1200000;
  return {low, shadows:!low, shadowSize:1024, fps:low?30:60,
    pixelRatio:Math.max(.1,Math.min(dpr,low?1:1.5,Math.sqrt(pixelBudget/Math.max(1,width*height))))};
}
