// Independent save model: observing living animals never clears the old journal.
export const STUDY_KEY='dino-atlas.living-herds.v1';
export const STUDY_REWARD=450;
export const STUDY_STEPS=[
 {title:'Read the grazer',detail:'Follow the marker to the valley Triceratops. Stop 7-20 m away for two seconds. Watch its head follow you; give its feet room.',uid:'legacy-2'},
 {title:'Guide with water',detail:'Guide the marked Triceratops with the pressure hose. LB + RT aims/fires from the jeep; right stick aims. RB changes tools. X reloads.',uid:'legacy-2'},
 {title:'Recognize a warning',detail:'Approach the marked Allosaurus carefully. Its raised head and amber warning ring announce a charge. Stop inside 18 m with a clear view.',uid:'wild-forest'},
 {title:'Interrupt the charge',detail:'Use the zapper on the marked Allosaurus while it warns or charges. RB selects the tool, LB + RT fires. Stay clear while it recovers.',uid:'wild-forest'},
 {title:'File the field report',detail:'Return to the visitor-center ranger bay. Stop and press A / E to file your report. First completion earns 450 credits.',target:{x:0,z:51}}
];
export function emptyStudy(){return {version:1,active:false,stage:0,complete:false,calm:0,cues:'balanced'};}
export function cleanStudy(v){const s=emptyStudy();if(!v||v.version!==1)return s;s.active=v.active===true;s.complete=v.complete===true;s.stage=Number.isInteger(v.stage)?Math.max(0,Math.min(4,v.stage)):0;s.calm=Number.isFinite(v.calm)?Math.max(0,Math.min(2,v.calm)):0;if(['balanced','quiet','off'].includes(v.cues))s.cues=v.cues;return s;}
export function readStudy(storage){try{return cleanStudy(JSON.parse(storage?.getItem(STUDY_KEY)));}catch{return emptyStudy();}}
export function saveStudy(storage,s){try{if(!storage)return false;storage.setItem(STUDY_KEY,JSON.stringify(cleanStudy(s)));return true;}catch{return false;}}
export function startStudy(s){s.active=true;if(s.complete){s.stage=0;s.calm=0;}return s;}
export function studyAdvance(s){if(!s.active)return false;if(s.stage<4){s.stage++;s.calm=0;return true;}s.active=false;s.complete=true;return true;}
