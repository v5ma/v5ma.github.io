/* Pure exploration rules. No DOM, storage, game input, or progression writes. */
export const BUILD = 'sky-cycle-route-compass-2026.09.12';
export const STORE = 'svgn.skycycle.exploration.v1';
export const PREFS = 'svgn.skycycle.compass.v1';
const finite = Number.isFinite;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const safeID = v => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(v);
const stampID = v => typeof v === 'string' && /^(district:[0-9]{1,2}|rail:[a-zA-Z0-9_-]{1,80})$/.test(v);
export function sanitize(raw) {
  const result = Object.create(null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [id,r] of Object.entries(raw).slice(0,128)) {
    if (!safeID(id) || !r || typeof r !== 'object') continue;
    result[id] = {stamps:[...new Set((Array.isArray(r.stamps)?r.stamps:[]).filter(stampID))].slice(0,128),finishes:Number.isSafeInteger(r.finishes)?clamp(r.finishes,0,1000000):0};
  }
  return result;
}
export function profile(data, info) {
  if (!safeID(info?.id) || data?.kind !== 'ground' || !Array.isArray(data.gp?.sections) || !finite(data.width) || data.width < 8 || data.width > 4096) return null;
  const finish = finite(data.goal?.x) ? clamp(data.goal.x,4,data.width)*36 : (data.width-5)*36;
  const sections = data.gp.sections.slice(0,32).filter(s=>finite(s.x)&&s.x>=0&&s.x*36<finish&&typeof s.name==='string').map((s,i)=>({id:'district:'+i,x:s.x*36,name:s.name.slice(0,100),scene:s.scene})).sort((a,b)=>a.x-b.x);
  if (!sections.length) return null;
  const rails = (Array.isArray(data.ct)?data.ct:[]).slice(0,128).filter(p=>Array.isArray(p)&&p.sky?.optional&&stampID('rail:'+p.sky.id)).map(p=>({id:'rail:'+p.sky.id,name:String(p.sky.label||'Upper route').slice(0,100),x:Math.min(...p.filter(v=>Array.isArray(v)&&finite(v[0])).map(v=>v[0]))})).filter(r=>finite(r.x)&&r.x>=0&&r.x<finish);
  const checkpoints=[];
  if (data.cells && Number.isInteger(data.width) && data.cells.length<=4096*512) for(let i=0;i<data.cells.length;i++) if(data.cells[i]===13) checkpoints.push((i%data.width)*36);
  return {id:info.id,name:String(info.name||info.id).slice(0,100),finish,sections,rails,checkpoints:[...new Set(checkpoints)].sort((a,b)=>a-b)};
}
export function districtAt(p,x) {
  if(!p||!finite(x)) return null;
  return [...p.sections].reverse().find(s=>s.x<=x)||p.sections[0];
}
export function newRun(p) { return p?{profile:p,seen:new Set(),finished:false,steps:0}:null; }
export function observe(run,x,railID=null) {
  if(!run||run.finished||!finite(x)||x<0||x>run.profile.finish+144) return false;
  const old=run.seen.size, district=districtAt(run.profile,x);
  if(district)run.seen.add(district.id);
  if(railID&&run.profile.rails.some(r=>r.id==='rail:'+railID))run.seen.add('rail:'+railID);
  run.steps++;
  return run.seen.size!==old;
}
export function settle(records,run,accepted) {
  const ledger=sanitize(records);
  if(!accepted||!run||run.finished||run.steps<1) return {records:ledger,fresh:[],banked:false};
  const old=ledger[run.profile.id]||{stamps:[],finishes:0},allowed=new Set([...run.profile.sections,...run.profile.rails].map(s=>s.id));
  const seen=[...run.seen].filter(id=>allowed.has(id)),fresh=seen.filter(id=>!old.stamps.includes(id));
  ledger[run.profile.id]={stamps:[...new Set([...old.stamps,...seen])].slice(0,128),finishes:Math.min(1000000,old.finishes+1)};
  run.finished=true;
  return {records:ledger,fresh,banked:true};
}
export function guidance(p,x) {
  if(!p||!finite(x))return null;
  const district=districtAt(p,x),next=p.sections.find(s=>s.x>x),checkpoint=p.checkpoints.find(cx=>cx>x+18),rail=p.rails.filter(r=>r.x>=x-72&&r.x<=x+540).sort((a,b)=>a.x-b.x)[0];
  const tips={village:'Find your rhythm on the road. Try a gold ramp when you are ready.',market:'Look ahead for low blocks and patrol bots. The lower road remains your main route.',park:'The park loop is optional. Build speed before trying its gold entry.',garden:'Look for upper rails and peg routes. You can always choose the lower road.',canal:'Explore the balconies or stay on the promenade.',festival:'Follow the road toward the striped finish. Deliveries and high routes are optional.'};
  return {district,next,checkpoint,rail,percent:Math.round(clamp((x-108)/Math.max(1,p.finish-108),0,1)*100),tip:tips[district.scene]||'Follow the road to the finish. Upper routes and deliveries are optional.'};
}
