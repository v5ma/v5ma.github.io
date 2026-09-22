// Original fiction and ordered rules. No molecular-design instructions or old-save migration.
export const LIVING_BUILD='living-reserve-20260922.1';
export const LIVING_KEY='dino-atlas.living-reserve.v1';
export const LIVING_TITLE='The Living Reserve';
export const ORIGIN=[
 ['THE SINGULARITY','After the AI Singularity, an intelligence learned to design creatures by recombining DNA. Atlas used it to grow animals that look and act like dinosaurs. They are engineered living beings, not clones recovered from ancient blood.'],
 ['THE ATLAS CLAIM','ATLAS FOSSIL-FIT: above the 99th percentile. The reserve reports that its designs match known dinosaur fossil data above that benchmark. This is a claim within our fictional world, not a real scientific measurement or a percentage of recovered dinosaur DNA.'],
 ['THE LIVING QUESTION','The AI reconstructed bodies against the fossil record and synthesized behavior. But an anatomy benchmark is not a map of what a living animal needs today. Your field atlas records the animals, routes and people in front of you.']
];
export const CHAPTER_STEPS=[
 {id:'mara',name:'Meet your senior ranger',target:{x:5,y:0,z:44},label:'Talk to Mara',detail:'Meet Mara beside the visitor-center ranger bay. Park, step out, and use the interaction shown on HERE.'},
 {id:'watch',name:'A living animal, not a score',target:{x:-12,y:0,z:13},label:'Record a quiet field observation',detail:'Follow the road through the main gate to the valley overlook. Stop on foot, leave the herd space, and interact when an animal is visible. No weapon is needed.'},
 {id:'ivo',name:'The road that disappeared',target:{x:24,y:0,z:17},label:'Ask Ivo about the corridor',detail:'Take the east fork north of the practice ramp to Ivo at the service stop. Learn why a route on the atlas is no longer usable.'},
 {id:'log',name:'Read what the map missed',target:{x:31,y:0,z:-23},label:'Inspect the relay service record',detail:'Continue north along the east service road. Park south of the amber relay and inspect its maintenance record on foot.'},
 {id:'relay',name:'Make a way through',target:{x:31,y:0,z:-23},label:'Restore the corridor relay',detail:'Use the relay again to restore the research corridor. The gate beyond it opens a real route; restoring it does not move you there.'},
 {id:'recorder',name:'The missing survey team',target:{x:47,y:0,z:-51},label:'Recover the survey recording',detail:'Go through the research gate and follow the east-side road to the recorder. Watch the resident predator, keep your return route clear, then stop and interact on foot.'},
 {id:'leena',name:'Bring the field truth home',target:{x:-4,y:0,z:44},label:'Give Leena the corrected atlas',detail:'Return through the open corridor to Dr. Leena Rao at the visitor center. The recorder explains where the survey team went.'}
];
export const SCENES={
 prologue:[
  ['ATLAS / FIRST LIGHT',ORIGIN[0][1]],
  ['YOUR FIRST SHIFT','You are Ranger 07. Your job is to bring people home and learn how this reserve really works. A survey team is late. Mara wants you to check a familiar route before the incoming storm.'],
  ['ONE THING AT A TIME','Follow the gold goal and read HERE. Stop and step out to speak to people or work on equipment. The live floor map and What to do / controls remain available in XR. Conversations stay on this panel until you continue; brief radio messages still fade after 2 seconds.']
 ],
 mara:[
  ['MARA / SENIOR RANGER','Welcome to Atlas, Ranger 07. The Singularity gave us the ability to make creatures from DNA. That giant beyond the gate is alive because someone asked an AI to turn the fossil record into a living design.'],
  ['MARA','Headquarters says our dinosaur designs match known fossil data above the 99th percentile. Impressive. But a number will not tell you when to stop a jeep or leave a herd room to turn.'],
  ['MARA','Start at the valley overlook. Stop, watch a plant-eater, and record what you actually see. Then ask Ivo why the north corridor went dark. I will check the survey team toward Tidegate.']
 ],
 watch:[
  ['FIELD OBSERVATION','{animal} is visible from the valley road. You record its actual location and current reserve behavior: {mood}. The observation belongs to this living animal, not to an imagined prehistoric memory.'],
  ['MARA / RADIO','Good. Keep that distinction in your atlas: fossil evidence, what the AI designed, and what you observed. Those are not the same thing. Ivo is waiting at the east service stop.']
 ],
 ivo:[
  ['IVO / FIELD ENGINEER','The north corridor is marked open on the office map. The relay disagrees. The survey team used that route before they went quiet.'],
  ['IVO','Follow the east service road to the amber relay. Read the work record before you touch the switch. We are trying to restore a route, not chase an animal out of its own space.']
 ],
 log:[
  ['RELAY / SERVICE RECORD','Expansion order: sector water routing revised. Wildlife corridor marked redundant. Field objections deferred. The official atlas still lists the old route as available.'],
  ['DR. LEENA RAO / RADIO','I approved the earlier habitat model. I did not approve this closure. A fossil-fit score cannot justify ignoring what the field team reported. Restore the corridor controller. We need their recorder.']
 ],
 relay:[
  ['IVO / RADIO','Controller synchronized. The research gate is open. You made a route we can actually use. Keep the jeep on the road; there is room to turn south of the gate.'],
  ['MARA / RADIO','I have a broken signal from the survey team near Tidegate. Recover their last recording and bring it to Leena. I am going ahead. Do not follow a straight gold bearing through a fence.']
 ],
 recorder:[
  ['SURVEY TEAM / RECOVERED RECORDING','The atlas says the corridor is dry. It is not. The water-control change has flooded our planned exit. We are taking the service route toward Tidegate. We are leaving this recording at the northern station.'],
  ['RANGER 07 / FIELD ATLAS','You have evidence of a route change, not proof of a failed creature design. Return through the gate you restored. Leena can compare this recording with the service order.']
 ],
 leena:[
  ['DR. LEENA RAO','The DNA work succeeded. These are real living animals, designed to match the fossils. The failure is pretending that the world stopped changing when the benchmark passed.'],
  ['DR. LEENA RAO','Your observation, the relay record and the survey recording agree: the expansion altered the routes and the water. Someone dismissed the field warnings. We will send a corrected atlas, not another reassuring number.'],
  ['MARA / INTERRUPTED RADIO','Base, this is Mara. I found the team at Tidegate. The main approach is closing. Use the service... [transmission lost]'],
  ['FIRST LIGHT / CHAPTER COMPLETE','The north corridor stays open and your first field atlas is saved. The missing-team mystery continues beyond this opening chapter. Explore the full reserve, visit Tidegate, or play the existing Storm Response operation from the story journal. Your other missions and rewards are unchanged.']
 ]
};
export function emptyLiving(){return {version:1,active:false,stage:0,observation:null};}
export function sanitizeLiving(v){
 const s=emptyLiving();if(!v||v.version!==1)return s;
 s.stage=Number.isInteger(v.stage)?Math.min(CHAPTER_STEPS.length,Math.max(0,v.stage)):0;
 s.active=v.active===true&&s.stage<CHAPTER_STEPS.length;
 const o=v.observation;if(o&&typeof o.species==='string'&&typeof o.uid==='string'&&[o.x,o.z].every(Number.isFinite))s.observation={species:o.species.slice(0,64),uid:o.uid.slice(0,96),mood:String(o.mood||'observed').slice(0,64),x:o.x,z:o.z};
 return s;
}
export function readLiving(storage){try{return sanitizeLiving(JSON.parse(storage?.getItem(LIVING_KEY)));}catch{return emptyLiving();}}
export function futureLiving(storage){try{const v=JSON.parse(storage?.getItem(LIVING_KEY));return !!v&&v.version!==1;}catch{return false;}}
export function saveLiving(storage,state){try{if(!storage||futureLiving(storage))return false;storage.setItem(LIVING_KEY,JSON.stringify(sanitizeLiving(state)));return true;}catch{return false;}}
export const corridorRestored=s=>s.stage>=5;
export const chapterComplete=s=>s.stage>=CHAPTER_STEPS.length;
export function livingEligibility(s,{position,mode,speed,visible=true,animal=null}={}){
 const step=CHAPTER_STEPS[s.stage];if(!s.active||!step)return 'No active chapter.';
 if(!position||![position.x,position.y,position.z,speed].every(Number.isFinite))return 'Stop beside the marked place.';
 const range=step.id==='watch'?12:4.4;
 if(Math.hypot(position.x-step.target.x,position.z-step.target.z)>range||Math.abs(position.y-step.target.y)>3)return 'Follow the road to the gold goal.';
 if(mode!=='foot')return 'Park and step out to do this work.';
 if(Math.abs(speed)>.6)return 'Stop before interacting.';
 if(!visible)return 'Move around the obstruction to reach the marked place.';
 if(step.id==='watch'&&!animal)return 'Move along the overlook until a plant-eater is in clear view.';
 return '';
}
export function advanceLiving(s,id,context){
 if(CHAPTER_STEPS[s.stage]?.id!==id||livingEligibility(s,context))return false;
 if(id==='watch')s.observation={species:context.animal.species,uid:context.animal.uid,mood:context.animal.mood||'observed',x:context.animal.x,z:context.animal.z};
 s.stage++;if(chapterComplete(s))s.active=false;return true;
}
