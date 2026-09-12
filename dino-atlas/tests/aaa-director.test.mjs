import test from 'node:test';
import assert from 'node:assert/strict';
import {AAA_BUILD,sanitizeDirector,readDirector,saveDirector} from '../aaa-director.js';

test('AAA director build identifier is explicit',()=>{
 assert.equal(AAA_BUILD,'aaa-vslice-storm-20260911.1');
});

test('corrupt or future mission state becomes a safe bounded save',()=>{
 const v=sanitizeDirector({version:1,active:'storm-response',stage:999,checkpoint:-5,completed:['storm-response','bad','storm-response'],storm:'yes',finishedAt:Infinity});
 assert.equal(v.active,'storm-response');
 assert.equal(v.stage,7);
 assert.equal(v.checkpoint,0);
 assert.deepEqual(v.completed,['storm-response']);
 assert.equal(v.storm,true);
 assert.equal(v.finishedAt,0);
 assert.deepEqual(sanitizeDirector(null),{version:1,active:null,stage:0,completed:[],checkpoint:0,storm:false,finishedAt:0});
});

test('AAA mission save never overwrites journal, ranger, frontier, ranch or economy keys',()=>{
 const data=new Map([
  ['dino-atlas.progress.v1','journal'],
  ['dino-atlas.ranger.v1','campaign'],
  ['dino-atlas.frontier.v2','frontier'],
  ['dino-atlas.ranch.v1','ranch'],
  ['dino-atlas.economy.v1','economy']
 ]);
 const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const s={version:1,active:'storm-response',stage:4,checkpoint:4,completed:[],storm:true,finishedAt:0};
 assert.equal(saveDirector(storage,s),true);
 assert.equal(readDirector(storage).stage,4);
 assert.equal(data.get('dino-atlas.progress.v1'),'journal');
 assert.equal(data.get('dino-atlas.ranger.v1'),'campaign');
 assert.equal(data.get('dino-atlas.frontier.v2'),'frontier');
 assert.equal(data.get('dino-atlas.ranch.v1'),'ranch');
 assert.equal(data.get('dino-atlas.economy.v1'),'economy');
 assert.equal(saveDirector(null,s),false);
});

test('unknown missions cannot be activated from persisted data',()=>{
 const v=sanitizeDirector({version:1,active:'future-mission',stage:5,checkpoint:5,completed:['future-mission'],storm:true,finishedAt:22});
 assert.equal(v.active,null);
 assert.deepEqual(v.completed,[]);
 assert.equal(v.stage,5);
});
