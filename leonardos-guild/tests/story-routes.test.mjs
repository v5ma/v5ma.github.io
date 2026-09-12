/* Route-marker fixtures: use real declared stairs, not invented teleport nodes. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWorld,newState} from '../model.mjs';
import {doorTarget} from '../doors-core.mjs';
const w=makeWorld(),h=w.doorHomes.find(h=>h.id==='workshop');
function fixture(level,route){const s=newState();s.mode='foot';s.x=h.x;s.z=h.z;s.doors.level=level;s.doors.room='workshop';s.doors.tracked={kind:'story',id:'lamplighter'};Object.assign(s.doors.stories.cases.lamplighter,{stage:2,route});return s;}
const point=p=>({x:p.x,z:p.z});
test('A roof evidence objective guides upward from upper rooms and attics, not back downstairs',()=>{for(const level of[1,2])assert.deepEqual(point(doorTarget(fixture(level,'roof'),w)),h.upperStair);assert.deepEqual(point(doorTarget(fixture(-1,'roof'),w)),h.stairs);});
test('An undercity evidence objective points to the cellar hatch once downstairs',()=>{for(const level of[1,2])assert.deepEqual(point(doorTarget(fixture(level,'cellar'),w)),h.stairs);assert.deepEqual(point(doorTarget(fixture(-1,'cellar'),w)),h.hatch);});
test('A same-house upper destination uses the actual cellar exit before any upper staircase',()=>{const s=fixture(-1,'roof');s.doors.tracked={kind:'home',id:'workshop'};s.doors.homes.workshop=1;assert.deepEqual(point(doorTarget(s,w)),h.stairs);});
