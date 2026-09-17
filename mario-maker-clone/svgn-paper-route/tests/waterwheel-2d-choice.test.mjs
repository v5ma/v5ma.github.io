/* Isolated Canvas2D drawing fixture, not a native camera or human-readability test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {draw2D} from '../waterwheel-preview-art.mjs';
for(const v of [{name:'desktop',x:2516,y:1794,w:800,h:455},{name:'portrait',x:2676,y:1705,w:354,h:608}]){
 test(`The ${v.name} fallback fixture contains the fixed world placard and its three lines`,()=>{
  const previous=globalThis.window,boxes=[],lines=[];
  const data={preview:true,groundOnly:true,landmark:{x:7930,y:1880,radius:190}};
  globalThis.window={__ground:{meta:{waterwheel:data}}};
  const g={save(){},restore(){},fillRect(x,y,w,h){if((w===230||w===190)&&h===102)boxes.push({x,y,w,h});},fillText(s,x,y){lines.push({s,x,y});}};
  try{
   draw2D(g,v.x,v.y,v.w,v.h);assert.equal(boxes.length,1);const b=boxes[0];
   assert(b.x>=v.x&&b.x+b.w<=v.x+v.w&&b.y>=v.y&&b.y+b.h<=v.y+v.h,'whole board inside viewport');
   for(const text of ['CHOOSE YOUR LINE','SPEED: HIGH GALLERY','BRAKE, RELEASE: CANAL MAIL']){
    const p=lines.find(p=>p.s===text);assert(p);assert(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h);
   }
   assert.equal(data.preview,true);assert.equal(data.groundOnly,true);
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
 });
}
