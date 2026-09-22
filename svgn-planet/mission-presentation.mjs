/* Presentation derived from the existing mission state. Previews run on a copy;
 * they never accept a mission, advance a stage or credit the real player. */
import {highlineKit} from './lantern/highline-layout.mjs';
import {missionOptions,navigation} from './lantern/navigation.mjs';
import {trackStory,storyTarget,missionGoal} from './lantern/city.mjs';
import {watchRuntime,watchState} from './lantern/watch.mjs';
import {campaignRuntime,campaignState} from './lantern/campaign.mjs';
export function missionCards(state){
 const snapshot=JSON.parse(JSON.stringify(state));
 return missionOptions(snapshot).map(option=>{
  if(option.disabled)return {...option,detail:option.detail,next:null};
  const preview=JSON.parse(JSON.stringify(snapshot));trackStory(preview,option.id);
  const target=storyTarget(preview);
  return {...option,next:target?{label:target.label,x:target.x,y:target.y,z:target.z}:null,
   detail:target?'Next: '+target.label:option.detail};
 });
}
export function wardFieldStatus(state,yaw=0){
 const nav=navigation(state,yaw),watch=watchState(state),campaign=campaignState(state),runtime=watchRuntime(state);
 // core.action dispatches the unlocked campaign tool handler before Watch.
 const campaignKit=highlineKit(state)||watch.stage===4||campaign.completed.length>0;
 const tool=campaignKit?campaignRuntime(state).selected:watch.stage>=1?runtime.tool:'no field kit';
 const status=watch.tracking&&runtime.knockedOut?missionGoal(state):nav.target?nav.label:missionGoal(state);
 return {goal:status,detail:nav.target?Math.ceil(nav.distance)+' m / '+nav.level+' / '+(nav.guide?.hint||''):'Choose an available resident story',
  equipment:state.ride+' / '+tool,health:watch.tracking?runtime.health:null};
}
