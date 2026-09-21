import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fieldStatus,floorStatusPlacement,statusLines} from '../field-status.mjs';
const width={measureText:text=>({width:String(text).length*10})};
test('Riding HUD shows the vehicle, speed and letters instead of a misleading equipped staff',()=>{
 const v=fieldStatus({mode:'bike',speed:5,papers:12,health:90,resonance:{tool:'staff'}},{title:'Deliver plans'});
 assert.equal(v.header,'BICYCLE');assert.match(v.resources,/18 km\/h.*Letters 12.*Health 90/);assert.match(v.primary,/steer.*brake.*boost/);assert.match(v.secondary,/bicycle hop/);assert.equal(v.title,'Deliver plans');
});
test('Carriage controls do not advertise an unsupported jump',()=>{
 const v=fieldStatus({mode:'car',speed:-2,resonance:{tool:'sling',aim:true}});
 assert.equal(v.header,'PEDAL CARRIAGE');assert.match(v.secondary,/stays grounded/);assert.equal(v.reload,false);assert.doesNotMatch(v.secondary,/reload|hop|jump/);
});
test('Aimed sling uses the actual right-B reload and held-interaction behavior',()=>{
 const s={mode:'foot',health:73,resonance:{tool:'sling',aim:true,ready:2,reserve:31}},before=JSON.stringify(s),v=fieldStatus(s);
 assert.match(v.resources,/Health 73.*Sling 2 \+ 31/);assert.match(v.primary,/LT: aim.*RT: sling pellet/);assert.match(v.secondary,/reload; hold B to interact/);assert.equal(v.reload,true);assert.equal(JSON.stringify(s),before);
});
test('Staff, letter and earned-lantern hints follow their actual tool roles',()=>{
 for(const [tool,expected]of [['staff',/brace.*staff/],['letters',/throw selected letter/],['lantern',/earned lantern power/]]){const v=fieldStatus({mode:'foot',resonance:{tool,aim:true}});assert.match(v.primary,expected);assert.equal(v.reload,false);assert.match(v.secondary,/interact \/ nearby/);}
});
test('Missing state values stay finite and do not invent resources',()=>{
 const v=fieldStatus({mode:'foot',health:NaN,resonance:{ready:Infinity,reserve:-4}});assert.match(v.resources,/Health 0.*Sling 0 \+ 0/);assert.equal(v.profile,'tracked-xr');assert.doesNotMatch(JSON.stringify(v),/NaN|Infinity/);
});
test('Floor status is tied to a valid stationary anchor, never the current gaze',()=>{
 assert.equal(floorStatusPlacement(null),null);assert.equal(floorStatusPlacement({floor:0,yaw:NaN,foot:{x:0,z:0}}),null);
 const anchor={floor:0,yaw:Math.PI/2,foot:{x:2,z:4}},before=JSON.stringify(anchor),p=floorStatusPlacement(anchor);
 assert.ok(Math.abs(p.x-1.4)<1e-12);assert.equal(p.y,.25);assert.equal(p.z,4);assert.equal(JSON.stringify(anchor),before);
});
test('Long objectives wrap into readable lines and advertise overflow',()=>{
 assert.deepEqual(statusLines(width,'Take the plans',150,2),['Take the plans']);
 const lines=statusLines(width,'Take the restored delivery passage to the dye workshop',180,2);
 assert.equal(lines.length,2);assert.match(lines[1],/\.\.\.$/);assert.ok(lines.every(line=>width.measureText(line).width<=180));
});
test('An unbroken label cannot overlap the minimap',()=>{
 const lines=statusLines(width,'x'.repeat(100),90,2);assert.ok(lines.length<=2);assert.ok(lines.every(line=>width.measureText(line).width<=90));assert.match(lines[0],/\.\.\.$/);assert.deepEqual(statusLines(width,'',90,2),[]);
});
