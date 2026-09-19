/* Acceptance-driver inputs only. Never imported by gameplay; never edits game state.
 * A slow software-rendered frame can move a full-strength stick past a small target.
 * Approach proportionally and use the ordinary brake before recording arrival. */
export function approachAxes(dx, dz) {
 if (![dx, dz].every(Number.isFinite)) throw new TypeError('Finite target delta required');
 const distance=Math.hypot(dx,dz), brake=distance<=.22;
 const strength=Math.min(.8,.2+distance*.3);
 return {axes:brake?[0,0,0,0]:[dx/distance*strength,dz/distance*strength,0,0],brake,distance};
}
