import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PIECES,createGame,playMove,buyPromotionLicense} from '../warledger-engine.mjs';
import {ART_TYPES,ART_INDEX,ATLAS,faceUV} from '../warledger-art.mjs';
import {SAVE_KEY,loadSession,saveSession,validState} from '../warledger-session.mjs';
import {nextPinch,gridStep,gamepadEdges} from '../warledger-input.mjs';

function memoryStorage(){const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};}
test('Every engine piece has distinct icon and rendered-portrait UVs on all six faces',()=>{
  assert.equal(Object.keys(PIECES).length,10);assert.equal(ART_TYPES.length,11);assert.equal(PIECES.D.name,'Chancellor');
  for(const type of Object.keys(PIECES)){
    assert.ok(Object.hasOwn(ART_INDEX,type));
    const front=faceUV(type,4),side=faceUV(type,0);assert.notDeepEqual(front,side);
    assert.deepEqual(side,faceUV(type,1));assert.deepEqual(front,faceUV(type,5));
    for(let face=0;face<6;face++){const r=faceUV(type,face);assert.ok(r.u0>=0&&r.u1<=1&&r.v0>=0&&r.v1<=1);assert.ok(r.u0<r.u1&&r.v0<r.v1);}
  }
  assert.notEqual(ART_INDEX.D,ART_INDEX.DRAGON);assert.throws(()=>faceUV('unknown',0));assert.throws(()=>faceUV('K',6));
});
test('The generated texture payload is a real WebP, not a placeholder or external link',()=>{
  const b=fs.readFileSync(new URL('../assets/piece-faces.webp',import.meta.url));
  assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');assert.ok(b.length>10000);
  assert.equal(ATLAS.width,256);assert.equal(ATLAS.height,512);
});
test('Shared save retains moves, licenses, economy, repetitions, and undo between 2D and AR',()=>{
  const storage=memoryStorage(),before=createGame(),after=playMove(before,{from:'e2',to:'e4'}).state;
  assert.ok(validState(after));assert.ok(saveSession(after,[before],storage));
  const loaded=loadSession(storage);assert.deepEqual(loaded.state,after);assert.deepEqual(loaded.undoStack,[before]);
  let lab=createGame('promotionLab');lab=buyPromotionLicense(lab,'white','D').state;
  const promoted=playMove(lab,{from:'e7',to:'e8',promotionType:'D'}).state;
  saveSession(promoted,[lab],storage);assert.equal(loadSession(storage).state.board[0][4].type,'D');assert.equal(loadSession(storage).state.bank.white,0);
});
test('Invalid or unavailable browser storage does not stop play',()=>{
  const storage=memoryStorage();storage.setItem(SAVE_KEY,'{broken');
  const loaded=loadSession(storage);assert.equal(loaded.state.board[6][4].type,'P');assert.ok(loaded.warning);assert.equal(storage.getItem(`${SAVE_KEY}.recovery`),'{broken');
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
  assert.ok(validState(loadSession(blocked).state));assert.equal(saveSession(createGame(),[],blocked),false);
  const invalid=createGame();invalid.board[0][0].type='DRAGON';assert.equal(validState(invalid),false);
});
test('Pinch has hysteresis and gamepad inputs activate only on edges',()=>{
  assert.deepEqual(nextPinch(false,.015),{latched:true,pressed:true});assert.deepEqual(nextPinch(true,.022),{latched:true,pressed:false});
  assert.deepEqual(nextPinch(true,.04),{latched:false,pressed:false});assert.deepEqual(nextPinch(false,NaN),{latched:false,pressed:false});
  const e=gamepadEdges([{pressed:true},{pressed:false}]);assert.deepEqual(e.pressed,[true,false]);assert.deepEqual(gamepadEdges([{pressed:true},{pressed:false}],e.current).pressed,[false,false]);
  assert.equal(gridStep('e2',0,-1),'e3');assert.equal(gridStep('a1',-1,1),'a1');assert.equal(gridStep('h8',1,-1),'h8');
});
