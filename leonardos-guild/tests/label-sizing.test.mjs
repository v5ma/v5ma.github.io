import {test} from 'node:test';import assert from 'node:assert/strict';
import {readoutScale} from '../label-sizing.mjs';
test('Close nameplates stay within 64 by 260 screen pixels, while distant signs keep their original size',()=>{
 for(const viewportHeight of [480,700,800,844])for(const depth of [.05,.2,1,2,5,20])for(const [width,height]of [[1.7,.64],[2.6,.65],[4,1]])for(const parentScale of [.92,1,1.8]){
  const scale=readoutScale({depth,width,height,parentScale,viewportHeight});assert.ok(scale>0&&scale<=1);
  const pxPerWorld=viewportHeight/(2*depth*Math.tan(58*Math.PI/360));
  assert.ok(height*parentScale*scale*pxPerWorld<=64+1e-8);assert.ok(width*parentScale*scale*pxPerWorld<=260+1e-8);
 }
 assert.equal(readoutScale({depth:100,width:1,height:1,viewportHeight:800}),1);
 assert.equal(readoutScale({depth:NaN,width:1,height:1,viewportHeight:800}),1);
});
