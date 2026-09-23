export function nextPinch(latched, distance) {
  if (!Number.isFinite(distance)) return {latched:false,pressed:false};
  if (latched) return {latched:distance<.03,pressed:false};
  return {latched:distance<.018,pressed:distance<.018};
}
export function gridStep(square,dx,dy) {
  const file=Math.max(0,Math.min(7,square.charCodeAt(0)-97+dx));
  const rank=Math.max(1,Math.min(8,Number(square[1])-dy));
  return `${String.fromCharCode(97+file)}${rank}`;
}
export function gamepadEdges(buttons,previous=[]) {
  const current=Array.from(buttons,b=>!!b?.pressed);
  return {current,pressed:current.map((value,i)=>value&&!previous[i])};
}
