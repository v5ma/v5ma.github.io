/* Isolated model/presentation fixtures, not physical-device acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,saveState,step,interact,nearby} from '../model.mjs';
import {TASKS} from '../expedition-world.mjs';
import {BELL_ROUTES} from '../bellwether-layout.mjs';
import {BELL_TASK,bellGoal,bellGalleryGoal} from '../bellwether-world.mjs';
import {focusedTask,goalDirection,usePromptLabel,stripUsePrefix,objectiveReminder} from '../objective-focus.mjs';
import {goalGuide} from '../goal-guide.mjs';
import {fieldGuidance} from '../field-guide-core.mjs';
import {storyAssignment} from '../story-core.mjs';
import {readFileSync} from 'node:fs';

test('Fresh and deliberately chosen unfinished assignments retain their original focus',()=>{
 const s=createState();assert.equal(focusedTask(s).id,'dispatch');
 for(const t of TASKS){s.expedition.tracked=t.id;assert.equal(focusedTask(s).id,t.id);assert.equal(goalGuide(s).taskId,t.id);}
});
test('A saved completed Bellwether desk no longer traps the next-destination marker',()=>{
 const s=createState({version:1,bellwether:{stage:6},expedition:{tracked:BELL_TASK.id,flags:[BELL_TASK.flag]}}),before=saveState(s);
 const t=focusedTask(s),g=goalGuide(s);assert.notEqual(t.id,BELL_TASK.id);assert.equal(g.taskId,t.id);assert.notEqual(g.id,'bell-dispatch');
 assert.equal(s.expedition.tracked,BELL_TASK.id);assert.equal(saveState(s),before);
 assert(!fieldGuidance(s,null).step.includes('Bellwether restored'));assert(storyAssignment(s).text.includes(t.name));
});
test('Every completed tracked task resolves to an unfinished suggestion, never an already-paid task',()=>{
 for(const task of TASKS){const s=createState();s.expedition.tracked=task.id;s.expedition.flags.push(task.flag);const g=goalGuide(s);assert(g);assert.notEqual(g.taskId,task.id);assert(!s.expedition.flags.includes(focusedTask(s).flag));}
});
test('All completed adventures remove the stale goal without claiming the relay story is over',()=>{
 const s=createState();s.expedition.flags=TASKS.map(t=>t.flag);const before=saveState(s);assert.equal(focusedTask(s),null);assert.equal(goalGuide(s),null);assert.match(fieldGuidance(s,null).step,/Silent Network/);assert.match(objectiveReminder(null),/Explore freely/);assert.equal(saveState(s),before);
});
test('Reminder and focus repeatedly read state without rewards, event emission or save mutation',()=>{
 const s=createState(),before=saveState(s),raw=JSON.stringify(s);for(let i=0;i<250;i++){objectiveReminder(goalGuide(s));fieldGuidance(s,nearby(s),'E');storyAssignment(s);}assert.equal(JSON.stringify(s),raw);assert.equal(saveState(s),before);
});
test('Actual noticeboard action immediately changes quick reminder from pickup to delivery',()=>{
 const s=createState();Object.assign(s.p,{x:5,y:.02,z:0});assert.equal(goalGuide(s).id,'dispatch-board');assert(interact(s));const g=goalGuide(s);assert.equal(g.id,'market-board');const text=objectiveReminder(g);assert(text.includes(g.name)&&text.includes(g.direction)&&text.includes(g.distance+' m'));assert.match(text,/Bearing only/);assert(!text.includes('route projected'));
});
for(const [x,z,expected]of [[0,-10,'Ahead'],[10,-10,'Ahead right'],[10,0,'To your right'],[10,10,'Behind right'],[0,10,'Behind you'],[-10,10,'Behind left'],[-10,0,'To your left'],[-10,-10,'Ahead left']])test('Destination bearing: '+expected,()=>{
 for(const yaw of[0,Math.PI/3,-Math.PI/2,Math.PI*8]){const c=Math.cos(yaw),n=Math.sin(yaw);assert.equal(goalDirection({x:2,y:7,z:3,yaw},{x:2+x*c-z*n,y:7,z:3+x*n+z*c}),expected);}
});
test('A vertical target does not send the player in an arbitrary horizontal direction',()=>{
 const p={x:0,y:7,z:0,yaw:1};assert.equal(goalDirection(p,{x:.1,y:27.5,z:.1}),'Directly above');assert.equal(goalDirection(p,{x:0,y:0,z:0}),'Directly below');assert.equal(goalDirection(p,{x:0,y:7,z:0}),'Here');
});
test('Keyboard, connected-but-unused pad, custom pad and both XR input paths get honest use labels',()=>{
 assert.equal(usePromptLabel(),'E');assert.equal(usePromptLabel({connected:true}),'E');assert.equal(usePromptLabel({connected:true,controllerUsed:true}),'X');assert.equal(usePromptLabel({connected:true,controllerUsed:true,binding:'B'}),'B');assert.equal(usePromptLabel({xr:true}),'Right grip');assert.equal(usePromptLabel({xr:true,standard:true,binding:'Y'}),'Y');assert.equal(usePromptLabel({controllerUsed:true,connected:false}),'E');
});
test('Remapped mechanism prompts strip old mixed key prefixes without stripping ordinary names',()=>{
 for(const text of ['E · Turn supply dial','X / E - Turn supply dial','E: Turn supply dial','E / Turn supply dial'])assert.equal(stripUsePrefix(text),'Turn supply dial');
 for(const text of ['East gallery','Elevator landing','Receiver synchronized'])assert.equal(stripUsePrefix(text),text);
 const s=createState();assert.equal(fieldGuidance(s,{label:'X / E - Turn supply dial',id:'bell-dial-0'},'B').interaction,'B / Turn supply dial');
});
test('Gallery waypoints are taken from the existing authored geometry and never point back to the street ladder',()=>{
 const points=BELL_ROUTES.find(r=>r.id==='upper').points;
 for(const [x,y,z]of points.filter(p=>p[1]>=12&&p[1]<26)){
  const s=createState();Object.assign(s.p,{x,y,z});s.bellwether.stage=3;const g=bellGoal(s);assert(g.id.startsWith('bell-gallery-'));assert(points.some(p=>p[0]===g.x&&p[1]===g.y&&p[2]===g.z));assert(g.y>=y);s.bellwether.stage=4;assert.equal(bellGoal(s).id,g.id);
 }
});
test('The supported south ladder and receiver target remain available outside the gallery route',()=>{
 const s=createState();s.bellwether.stage=3;Object.assign(s.p,{x:-107,y:7,z:.1});assert.equal(bellGoal(s).id,'roof-bell-ladder');s.p.y=27.5;assert.equal(bellGoal(s).id,'bell-signal');assert.equal(bellGalleryGoal({x:150,y:17,z:100}),null);
});
test('Real movement up the existing gallery keeps goal selection read-only and on the upper route',()=>{
 const s=createState(),points=BELL_ROUTES.find(r=>r.id==='upper').points;s.drones=[];s.bellwether.stage=3;s.expedition.tracked=BELL_TASK.id;
 Object.assign(s.p,{x:points[0][0],y:points[0][1],z:points[0][2],grounded:true});
 for(const [x,y,z]of points.slice(1)){
  let reached=false;
  for(let n=0;n<4000;n++){
   const dx=x-s.p.x,dz=z-s.p.z;if(Math.hypot(dx,dz)<.18&&Math.abs(y-s.p.y)<.7){reached=true;break;}
   s.p.yaw=Math.atan2(dx,-dz);step(s,{moveZ:Math.min(1,Math.hypot(dx,dz)),explorer:true},1/120);
   const before=JSON.stringify(s),g=goalGuide(s);assert.equal(JSON.stringify(s),before);if(s.p.y>=12&&s.p.y<26)assert.notEqual(g.id,'roof-bell-ladder');
  }
  assert(reached,'Failed ordinary movement to '+[x,y,z]);
 }
 assert.equal(s.stats.rescues,0);assert.equal(s.bellwether.stage,3);
});
test('Controller and reminder adapters consume the shared helpers rather than hardcoding Quest or relay help',()=>{
 const controls=readFileSync(new URL('../controllers.mjs',import.meta.url),'utf8'),ui=readFileSync(new URL('../skirmish-ui.mjs',import.meta.url),'utf8');assert(controls.includes('usePromptLabel({xr:xr.active'));assert(controls.includes('stripUsePrefix(prompt.textContent)'));assert(ui.includes('objectiveReminder(goalGuide(s))'));assert(!ui.includes('Objective route projected'));assert(!ui.includes('View / Atlas shows the next relay'));
});
