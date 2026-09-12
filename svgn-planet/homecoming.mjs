/* Authored story progression. The existing contract/save systems stay intact.
 * Progress is derived from validated contract IDs, not a second reward ledger. */
import {street,distance} from './world.mjs';
import {startJob,currentJob} from './activities.mjs';
export const HOMECOMING_VERSION='0.8.0';
export const HOST=Object.freeze({name:'Maya',n:street(-8,4.8),title:'Your neighborhood, together'});
export const CHAPTER=Object.freeze([
 {id:'welcome',job:'local-courier',name:'A warm welcome',speaker:'Maya',line:'The cafe has breakfast ready, but some of our neighbors cannot get out this morning. Take a basket around. A neighborhood begins when somebody shows up.',payoff:'Breakfast reached the neighbors. The cafe is open for the day.'},
 {id:'care',job:'local-cleanup',name:'Make room for everyone',speaker:'Luis',line:'This corner used to be somewhere people stopped, not somewhere they passed through. Help me clear the litter. We can make a place worth coming back to.',payoff:'The plaza is clean. The folding tables and flower beds are ready.'},
 {id:'signals',job:'local-repair',name:'Keep the neighborhood moving',speaker:'Ari',line:'Three signal cabinets are out. Brake at each one and lock a steady pulse. When the street works for everyone, it feels like a place you belong.',payoff:'The cabinets are restored. The plaza lights are back on.'},
 {id:'postcards',job:'local-photo',name:'See what we made',speaker:'Nia',line:'People remember a place through its small details. Bring the bike to a stop at each viewpoint and make a few postcards. This time, there is something to show.',payoff:'Your postcards are on the community board.'},
 {id:'ride',job:'local-sprint',name:'The homecoming ride',speaker:'Maya',line:'One last loop together. Follow the rings through the neighborhood. There is a personal-best time to chase, but this is not a deadline. The plaza will be here when you get back.',payoff:'The homecoming ride is complete. Come back to the plaza to celebrate.'}
]);
export const PROJECTS=Object.freeze({garden:{name:'Community garden',line:'We will fill the plaza with planters, flowers and a shared table.'},workshop:{name:'Cycle workshop',line:'We will set up a repair stand and a gathering place for neighborhood riders.'}});
export function readHomecoming(raw){const r=raw&&typeof raw==='object'?raw:{};return {accepted:r.accepted===true,project:r.project==='workshop'?'workshop':'garden',claimed:r.claimed===true};}
export function storyStatus(s){
 const h=readHomecoming(s.homecoming),done=CHAPTER.filter(c=>s.jobs.completed.includes(c.job));
 const next=CHAPTER.find(c=>!s.jobs.completed.includes(c.job))||null;
 return {...h,total:CHAPTER.length,finished:done.length,next,ready:h.accepted&&!next&&!h.claimed,complete:h.accepted&&!next&&h.claimed,active:!!next&&s.jobs.active?.id===next.job,done:done.map(c=>c.id)};
}
export const nearHost=s=>distance(s.n,HOST.n)<4;
function notice(s,type,text){s.toast=text;s.toastT=6;s.events.push({type,step:s.steps});if(s.events.length>180)s.events.shift();}
export function chooseProject(s,project){if(!Object.hasOwn(PROJECTS,project)||s.homecoming.claimed)return false;s.homecoming.project=project;return true;}
export function followChapter(s,{replace=false}={}){
 const status=storyStatus(s);if(status.complete||status.ready)return {kind:status.complete?'complete':'return'};
 if(currentJob(s)&&s.jobs.active.id!==status.next?.job&&!replace)return {kind:'conflict'};
 s.homecoming.accepted=true;
 if(status.next&&s.jobs.active?.id!==status.next.job)startJob(s,status.next.job);
 return {kind:'started',stage:status.next?.id};
}
export function claimHomecoming(s){
 const status=storyStatus(s);if(!status.ready||!nearHost(s))return false;
 s.homecoming.claimed=true;s.jobs.wallet+=500;s.jobs.earned+=500;
 if(!s.jobs.owned.includes('mint'))s.jobs.owned.push('mint');
 notice(s,'chapter-complete','HOMECOMING | The plaza is yours to share. +500 credits and Sea-glass mint unlocked.');return true;
}
export function storyTarget(s){const h=storyStatus(s);return h.ready?{id:'homecoming-return',name:'Return to Maya at the plaza',mail:HOST.n,n:HOST.n}:null;}
