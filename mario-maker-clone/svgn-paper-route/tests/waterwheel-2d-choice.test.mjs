/* Isolated Canvas2D drawing fixtures, not native camera or physical-device approval.
 * Includes the exact camera interval exposed by 594496's portrait capture. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {draw2D} from '../waterwheel-preview-art.mjs';
function observe(v){
 const previous=globalThis.window,boxes=[],lines=[];
 const data={preview:true,groundOnly:true,landmark:{x:7930,y:1880,radius:190}};
 globalThis.window={__ground:{meta:{waterwheel:data}}};
 const g={save(){},restore(){},fillRect(x,y,w,h){if((w===230||w===190)&&h===102)boxes.push({x,y,w,h});},fillText(s,x,y){lines.push({s,x,y});}};
 try{draw2D(g,v.x,v.y,v.w,v.h);return {boxes,lines,data};}
 finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
}
const views=[
 {name:'desktop',x:2516,y:1794,w:800,h:455},
 ...[2660,2676,2740,2775.8523,2800].map(x=>({name:'portrait camera '+x,x,y:1705.2445,w:354.5454,h:608.1818}))
];
for(const v of views)test(`The ${v.name} contains the entire approach board with a safety margin`,()=>{
 const {boxes,lines,data}=observe(v);assert.equal(boxes.length,1);const b=boxes[0];
 assert(b.x>=v.x+2&&b.x+b.w<=v.x+v.w-2&&b.y>=v.y+2&&b.y+b.h<=v.y+v.h-2,'whole board inside the reading interval');
 for(const text of ['CHOOSE YOUR LINE','SPEED: HIGH GALLERY','BRAKE, RELEASE: CANAL MAIL']){
  const p=lines.find(p=>p.s===text);assert(p);assert(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h);
 }
 assert.equal(data.preview,true);assert.equal(data.groundOnly,true);
});
test('The portrait placard stays in the same world position as the camera moves',()=>{
 const poses=views.filter(v=>v.w<500).map(v=>observe(v).boxes[0]);
 for(const box of poses)assert.deepEqual(box,poses[0]);
 assert.deepEqual(poses[0],{x:2815,y:1879,w:190,h:102});
});
test('Passing the placard lets it leave the view rather than following the player',()=>{
 const {boxes}=observe({x:3200,y:1705,w:354,h:608});assert.equal(boxes.length,0);
});
