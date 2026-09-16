/* One bounded change to the existing Freight Hall, not a new level.
 * Data is shared by collision, sight, pathfinding, save state and graybox art. */
export const FIREBREAK_TASK='ward-freight-firebreak';
export const FIREBREAK_REVISION='freight-firebreak-1';
export const FIREBREAK_SCREEN=Object.freeze({id:'freight-firebreak-screen',x:20.5,z:-21.2,w:4,d:.45,h:2.55,bottom:0,kind:'metal',closeOnTask:FIREBREAK_TASK,disabled:true});
export const FIREBREAK_DOOR=Object.freeze({id:'freight-yard-door',x:28,z:-15,w:.8,d:3,h:3.3,bottom:0,kind:'metal',openOnTask:FIREBREAK_TASK,disabled:false});
export const FIREBREAK_LEVER=Object.freeze({id:FIREBREAK_TASK,x:26.1,z:-10.3,title:'Release the freight firebreak / noisy',description:'The linked counterweight lowers the centre partition and opens the east yard door. It breaks the long firing lane but leaves paths around both ends. The mechanism makes noise: plan your next corner before pulling. Save at a shelter to retain the change.',kind:'repair',required:false,customArt:true,reward:{},noiseRadius:18,completeMessage:'Partition down. East yard open. The mechanism carried: turn a corner, do not wait at the lever.'});
export const FIREBREAK_ROUTES=Object.freeze({
 direct:{purpose:'Fast access to supplies and lever; exposed to the Freight lookout along the central aisle.',points:[[21,-5],[21,-10],[26.1,-10.3]]},
 north:{purpose:'West terrace descent to the longer north approach from clinic observation to the spindle behind the central firing lane; the quay is still dangerous.',points:[[-22,-10],[-25,-10],[-30,-10],[-30,-14],[-30,-20],[-30,-23],[-27,-24],[-18,-26],[-18,-42],[12,-46],[21,-32],[21,-26.7],[22.3,-26.7]]},
 yard:{purpose:'A changed-world recovery loop, not safety: leave the lowered partition behind, exit east and use a wall corner before returning through the north loading door.',requires:FIREBREAK_TASK,points:[[26.1,-10.3],[30.2,-15],[31,-21],[31,-32],[21,-32],[21,-26.7]]}
});
export function applyFreightFirebreak(level){
 if(level.id!=='district')return level;
 // Preserve the stable east-wall ID for its north segment; a new gap is real.
 level.obstacles=level.obstacles.map(o=>o.id==='depot-east'?{...o,z:-23.25,d:13.5}:o).concat([
  {id:'depot-east-south',x:28,z:-10.75,w:1,d:5.5,h:5.5,bottom:0,kind:'brick'},
  {id:'depot-yard-lintel',x:28,z:-15,w:1,d:3,h:2.2,bottom:3.3,kind:'brick'},
  {...FIREBREAK_SCREEN},{...FIREBREAK_DOOR}
 ]);
 level.tasks=[...level.tasks,{...FIREBREAK_LEVER}];level.firebreakRevision=FIREBREAK_REVISION;return level;
}
export function firebreakState(state){const active=state?.level==='district';return {active,deployed:active&&!!state.completedTasks?.includes(FIREBREAK_TASK)};}
