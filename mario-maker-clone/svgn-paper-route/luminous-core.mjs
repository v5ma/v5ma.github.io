/* Pure visual options and scenery placement. No gameplay or storage access. */
export const BUILD = 'sky-cycle-luminous-2026.09.12';
export const KEY = 'svgn.skycycle.luminous.v1';
export const LIMITS = Object.freeze({water:6, sky:1, extraDraws:7});
export function preferences(raw) {
  const v = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {finish:['off','subtle','vivid'].includes(v.finish)?v.finish:'subtle',water:v.water!==false,sky:v.sky!==false};
}
export function strength(raw) {return {off:0,subtle:.42,vivid:1}[preferences(raw).finish];}
export function waterPatches(course) {
  if (course?.kind !== 'ground' || !Number.isFinite(course.ground) || !Number.isInteger(course.width) || course.width<8 || course.width>4096) return [];
  const sections=(Array.isArray(course.gp?.sections)?course.gp.sections:[]).filter(s=>Number.isFinite(s?.x)&&s.x>=0&&s.x<course.width).slice(0,32).sort((a,b)=>a.x-b.x);
  const patches=[];
  for(let i=0;i<sections.length && patches.length<LIMITS.water;i++) {
    if(sections[i].scene!=='canal')continue;
    const start=sections[i].x*36,end=Math.min(course.width*36,(sections[i+1]?.x??course.width)*36);
    for(let x=start;x<end&&patches.length<LIMITS.water;x+=900) {
      const width=Math.min(900,end-x);if(width<40)continue;
      patches.push({x:x+width/2,y:-course.ground*36+3,z:-330,width,depth:220});
    }
  }
  return patches;
}
export function skyBounds(course) {
  const width=Number.isFinite(course?.width)?Math.max(8,Math.min(4096,course.width)):224;
  return {x:width*18,y:-1950,z:-1800,width:Math.max(16000,width*36+4500),height:1500};
}
export function normalizedSnapshot(stats) {
  return {finish:preferences(stats).finish,water:Number.isInteger(stats?.waterCount)?Math.max(0,Math.min(LIMITS.water,stats.waterCount)):0,sky:stats?.skyCount===1?1:0};
}
