import test from 'node:test';
import assert from 'node:assert/strict';
import {MODAL_MODES,actionAllowed,safeViewport,selectedDescription,PIECE_GUIDES} from '../warledger-presentation.mjs';
import {createGame,getLegalMoves,PIECES} from '../warledger-engine.mjs';

test('Every legal piece has a readable guide without inventing Dragon rules',()=>{
  assert.deepEqual(Object.keys(PIECE_GUIDES).sort(),Object.keys(PIECES).sort());
  assert.match(PIECE_GUIDES.D,/Chancellor/);assert.equal(PIECE_GUIDES.DRAGON,undefined);
  const state=createGame();const text=selectedDescription(state,'e2',getLegalMoves(state),PIECES);
  assert.match(text,/Pawn on e2 \| 2 legal moves/);assert.equal(selectedDescription(state,'e4',[],PIECES),'');
});
test('Exclusive panels cannot click through to board, new game, or hidden gallery',()=>{
  for(const mode of MODAL_MODES){
    assert.equal(actionAllowed(mode,'square:e4'),false);assert.equal(actionAllowed(mode,'cancel'),true);
  }
  for(const mode of ['confirm','promotion','market','help'])assert.equal(actionAllowed(mode,'gallery'),false);
  assert.equal(actionAllowed('confirm','new'),false);assert.equal(actionAllowed('confirm','market'),false);
  assert.equal(actionAllowed('promotion','promote:D'),true);assert.equal(actionAllowed('promotion','buy:D'),true);
  assert.equal(actionAllowed('options','gallery'),true);assert.equal(actionAllowed('play','square:e4'),true);
});
test('Safe viewport excludes readable header and help on portrait and landscape screens',()=>{
  for(const [w,h,top,bottom] of [[390,844,180,70],[844,390,90,45],[1440,1000,95,42],[320,568,190,72]]){
    const a=safeViewport(w,h,top,bottom);
    assert.ok(a.halfWidth>0&&a.halfHeight>0);
    assert.ok(a.centerY-a.halfHeight>=a.top);assert.ok(a.centerY+a.halfHeight<=h-a.bottom);
    assert.equal(h/2-a.offsetY,a.centerY);
  }
});
