import {test} from 'node:test';import assert from 'node:assert/strict';
import {menuControlVisible} from '../menu-visibility.mjs';
// Deliberately nonempty layout rectangles for hidden disclosure descendants.
class Element {
 constructor(tag,parent=null){this.tagName=tag;this.parentElement=parent;this.children=[];parent?.children.push(this);this.open=false;this.hidden=false;this.rectangles=1;}
 contains(e){for(let p=e;p;p=p.parentElement)if(p===this)return true;return false;}
 closest(){for(let p=this;p;p=p.parentElement)if(p.hidden)return p;return null;}
 getClientRects(){return Array.from({length:this.rectangles},()=>({}));}
}
test('Closed disclosures retain their summary but exclude every hidden control even with nonempty layout boxes',()=>{
 const root=new Element('DIV'),details=new Element('DETAILS',root),summary=new Element('SUMMARY',details),input=new Element('INPUT',details);
 assert.ok(menuControlVisible(summary));assert.equal(menuControlVisible(input),false);details.open=true;assert.ok(menuControlVisible(input));details.open=false;assert.equal(menuControlVisible(input),false);
});
test('Nested disclosures cannot make a closed ancestor control reachable',()=>{
 const root=new Element('DETAILS'),top=new Element('SUMMARY',root),inner=new Element('DETAILS',root),summary=new Element('SUMMARY',inner),input=new Element('SELECT',inner);inner.open=true;
 assert.ok(menuControlVisible(top));assert.equal(menuControlVisible(summary),false);assert.equal(menuControlVisible(input),false);root.open=true;assert.ok(menuControlVisible(input));
});
test('Only the first summary of a closed disclosure remains exposed',()=>{
 const root=new Element('DETAILS'),first=new Element('SUMMARY',root),label=new Element('SPAN',first),second=new Element('SUMMARY',root);
 assert.ok(menuControlVisible(label));assert.equal(menuControlVisible(second),false);
});
test('Visibility checks respect browser content visibility but do not reject transparent XR DOM mirrors',()=>{
 const e=new Element('BUTTON');e.checkVisibility=options=>{assert.equal(options.visibilityProperty,true);assert.equal(options.opacityProperty,undefined);return true;};assert.ok(menuControlVisible(e));e.checkVisibility=()=>false;assert.equal(menuControlVisible(e),false);delete e.checkVisibility;e.hidden=true;assert.equal(menuControlVisible(e),false);e.hidden=false;e.rectangles=0;assert.equal(menuControlVisible(e),false);
});
