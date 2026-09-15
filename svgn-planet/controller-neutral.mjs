/* Match the thresholds used by gameplay, not the browser's digital pressed
 * flag alone: an analog trigger can accelerate before it reports pressed. */
export function gameplayInputIsNeutral(pad) {
 if (!pad) return false;
 return Array.from(pad.axes || []).every(value => Number.isFinite(value) && Math.abs(value) <= .16)
  && Array.from(pad.buttons || []).every((button, index) => !button?.pressed
   && Number.isFinite(button?.value ?? 0)
   && (button?.value ?? 0) <= (index === 6 || index === 7 ? .2 : .55));
}
