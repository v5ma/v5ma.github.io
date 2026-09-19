/* Pure XR menu contracts, not physical headset acceptance. */
const {test}=require('node:test'),A=require('node:assert/strict'),X=require('../river/xr');
class InputSources {
 constructor(items){this.items=items;items.forEach((s,i)=>Object.defineProperty(this,i,{get:()=>this.items[i]}));}
 get length(){return this.items.length;}
 *[Symbol.iterator](){yield* this.items;}
}
const source=(hand,extra={})=>({handedness:hand,gripSpace:{},...extra});
test('Native-shaped XRInputSourceArray is not a JavaScript array; Start still counts controllers',()=>{const input=new InputSources([source('left'),source('right')]);A.equal(input.filter,undefined);A.equal(Array.isArray(input),false);A.throws(()=>input.filter(Boolean),TypeError);A.equal(X.controllerHands(input).size,2);});
test('Two copies of one hand, tracked hands and missing grips cannot unlock two-controller combat',()=>{for(const input of[[source('left'),source('left')],[source('left',{hand:{}}),source('right')],[source('left',{gripSpace:null}),source('right')],[source('none'),source('right')]])A.ok(X.controllerHands(new InputSources(input)).size<2);A.equal(X.controllerHands(null).size,0);});
for(let i=0;i<8;i++)test('Every painted area and corner of XR button '+i+' is selectable',()=>{const r=X.RECTS[i];for(const dx of[.1,r.w/2,r.w-.1])for(const dy of[.1,r.h/2,r.h-.1])A.equal(X.actionAtUV((r.x+dx)/1200,1-(r.y+dy)/814),i);});
test('The heading, gaps, outside panel and invalid coordinates do not activate a button',()=>{for(const [x,y]of[[600,350],[300,280],[300,410],[-5,350],[1210,350],[300,795],[NaN,350]])A.equal(X.actionAtUV(x/1200,1-y/814),-1);});
test('Button painting and ray picking share one immutable layout',()=>{A.ok(Object.isFrozen(X.RECTS));A.ok(X.RECTS.every(Object.isFrozen));A.equal(X.RECTS.length,8);});
test('Thumbstick traverses the two-column menu without requiring a ray',()=>{A.equal(X.navigate(0,1,0),1);A.equal(X.navigate(1,0,1),3);A.equal(X.navigate(3,-1,0),2);A.equal(X.navigate(0,0,-1),6);A.equal(X.navigate(7,0,1),1);A.equal(X.navigate(0,-1,0),0);A.equal(X.navigate(1,1,0),1);});
test('XR-standard thumbstick reads indices 2 and 3, not empty touchpad slots',()=>{A.deepEqual(X.stick({axes:Object.freeze([0,0,.9,0])}),[1,0]);A.deepEqual(X.stick({axes:[1,1,0,-.9]}),[0,-1]);A.deepEqual(X.stick({axes:[0,0,.1,-.1]}),[0,0]);A.deepEqual(X.stick({axes:[0,.9]}),[0,1]);A.deepEqual(X.stick(null),[0,0]);});
