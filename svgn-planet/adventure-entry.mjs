/* A read-only launch plan. Clicking it selects a case; it never grants progress,
 * moves the courier or rewrites the original city's save. */
import {CAMPAIGN_CASES} from './lantern/campaign.mjs';
export function adventureEntry(state,blocked=false){
 if(blocked)return {mission:null,title:'Open Lantern Ward / save recovery',detail:'Saved data needs recovery. The original data will not be replaced.'};
 const c=state?.campaign,done=c?.completed||[];
 const id=!done.includes('highline')?'highline':!done.includes('unsent')?'unsent':null;
 if(!id)return {mission:null,title:'Explore Highline / completed adventure',detail:'Both rooftop cases are complete. Explore or choose another mission; rewards remain recorded.'};
 const story=CAMPAIGN_CASES.find(s=>s.id===id),stage=c?.progress?.[id]||0,next=story.steps[stage];
 return {mission:'campaign:'+id,title:id==='highline'?(stage?'Continue Highline / rooftop adventure':'Play Highline / taller rooftop adventure'):(stage?'Continue Archive / The Unsent Call':'Play Archive / The Unsent Call'),detail:'Next: '+next.label+'. Your saved position and earlier missions are retained.'};
}
