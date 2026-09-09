/* Simulation uses bounded 60 Hz steps, independently of rendering. Previously
 * every rendered frame advanced at most .05s, causing slow motion under load. */
export function createFrameClock({step=1/60,maxElapsed=.25,maxSteps=15}={}){
 if(!(step>0&&maxElapsed>0&&Number.isInteger(maxSteps)&&maxSteps>0))throw Error('Invalid clock budget');
 let remainder=0,dropped=0;
 return {reset(){remainder=0;},advance(elapsed,run){
  if(!Number.isFinite(elapsed)||elapsed<=0)return 0;
  const accepted=Math.min(elapsed,maxElapsed);dropped+=Math.max(0,elapsed-accepted);remainder+=accepted;
  let n=0;while(remainder+1e-10>=step&&n<maxSteps){remainder=Math.max(0,remainder-step);n++;if(run(step)===false){remainder=0;break;}}
  if(remainder>=step){dropped+=remainder;remainder=0;}return n;
 },stats:()=>({remainder,dropped,step,maxElapsed,maxSteps})};
}
