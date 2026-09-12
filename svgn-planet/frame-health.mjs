/* Local-only measurements. Frame interval and CPU submission time are not GPU
 * timer queries, certification, or a claim about the user's hardware. */
const percentile=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:0;
export function summarizeFrames(samples){
 const valid=samples.filter(s=>Number.isFinite(s.interval)&&s.interval>0&&s.interval<10000),sorted=valid.map(s=>s.interval).sort((a,b)=>a-b),cpu=valid.map(s=>s.work).filter(Number.isFinite).sort((a,b)=>a-b);
 const wall=valid.reduce((a,s)=>a+s.interval,0),simulation=valid.reduce((a,s)=>a+s.simulation,0);
 return {samples:valid.length,windowSeconds:wall/1000,meanFPS:wall?1000*valid.length/wall:0,p95ms:percentile(sorted,.95),p99ms:percentile(sorted,.99),cpuP95ms:percentile(cpu,.95),over50ms:sorted.filter(n=>n>50).length,simulationRatio:wall?simulation/wall:0};
}
export function createFrameHealth(capacity=600){
 capacity=Math.max(10,Math.min(3600,Math.floor(capacity)||600));const ring=new Array(capacity);let cursor=0,size=0,previousTime=null,previousSim=0,cached=null,lastSummary=0;
 return {frame(now,sim,work){if(!Number.isFinite(now)||!Number.isFinite(sim))return;if(previousTime!==null&&now>previousTime){ring[cursor]={interval:now-previousTime,simulation:Math.max(0,(sim-previousSim)*1000),work:Math.max(0,work||0)};cursor=(cursor+1)%capacity;size=Math.min(capacity,size+1);}previousTime=now;previousSim=sim;},gap(){previousTime=null;},reset(){cursor=size=0;previousTime=null;cached=null;},inspect(now=performance.now()){if(!cached||now-lastSummary>500){cached=summarizeFrames(ring.slice(0,size));lastSummary=now;}return {...cached,capacity,scope:'Local rendered-frame window; pauses excluded; CPU submission, not GPU time',target:'Desktop target 60 fps; real hardware sign-off not yet recorded'};}};
}
export function speedPresentation(speed,reducedMotion=false){const amount=reducedMotion?0:Math.max(0,Math.min(1,(speed-7.5)/22.5));return {fov:amount*10,chase:amount*.9,streaks:!reducedMotion&&speed>16};}
