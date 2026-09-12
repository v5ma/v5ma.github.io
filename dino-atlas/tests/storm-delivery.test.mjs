import test from 'node:test';
import assert from 'node:assert/strict';
import {STORM_ID,EAST_PIER,emptyDirector,startDirector,actionAt} from '../storm-mission.js';

test('East Pier delivery survives ordinary boat drift but still rejects a moving pass-by',()=>{
 const s=startDirector(emptyDirector());s.stage=7;
 const p={x:EAST_PIER.x+26,y:1,z:EAST_PIER.z+15};
 assert.equal(actionAt(s,p,'boat',0),'delivery');
 assert.equal(actionAt(s,p,'boat',5.5),'delivery');
 assert.equal(actionAt(s,p,'boat',6.5),null);
 assert.equal(actionAt(s,p,'jeep',0),null);
 assert.equal(actionAt({...s,active:null},p,'boat',0),null);
 assert.equal(s.active,STORM_ID);
});
