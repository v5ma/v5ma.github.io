/* Input hysteresis is independent of renderer and device emulation. */
export function pinchPressed(distance,wasPressed=false){return Number.isFinite(distance)&&distance<(wasPressed?.038:.024);}
export function xrAxes(pad){const a=pad?.axes||[],offset=a.length>=4?2:0;const dead=v=>Number.isFinite(v)&&Math.abs(v)>.18?Math.sign(v)*Math.min(1,(Math.abs(v)-.18)/.82):0;return {x:dead(a[offset]),y:-dead(a[offset+1])};}
export function buttonPressed(pad,i){return !!pad?.buttons?.[i]?.pressed||(pad?.buttons?.[i]?.value||0)>.55;}
export const xrInput={x:0,y:0,lookX:0,lookY:0,boost:false,brake:false};
export function clearXRInput(){for(const key of Object.keys(xrInput))xrInput[key]=typeof xrInput[key]==='boolean'?false:0;}
