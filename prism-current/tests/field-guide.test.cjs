/* Rules and visibility only. Actual WebGL/XR is tested separately. */
'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const D=require('../river/difficulty'),Guide=require('../river/field-guide');
test('Guide reflects each actual difficulty rather than inventing a scoring rule',()=>{
 for(const key of D.ORDER){const p=D.get(key),cards=Guide.cards(p);a.equal(cards.length,3);a.ok(cards[2].detail.includes(String(p.heal)));a.equal(cards[0].note,p.directionRequired?'Follow the fruit arrows':'Any cut direction');a.match(cards[1].verb,/CUT.*SHOOT.*SHIELD/);a.match(cards[2].note,/100/);}
});
test('Guide never appears in combat, loading, non-AR or a hidden menu',()=>{
 for(const phase of ['playing','loading','failed','complete'])a.equal(Guide.shouldShow({ar:true,open:true,page:'help',phase}),false);
 a.equal(Guide.shouldShow({ar:false,open:true,page:'help',phase:'paused'}),false);
 a.equal(Guide.shouldShow({ar:true,open:false,page:'play',phase:'menu'}),false);
 a.equal(Guide.shouldShow({ar:true,open:true,busy:true,page:'help',phase:'paused'}),false);
});
test('Guide introduces objects before AR play and remains available on paused Controls',()=>{
 a.equal(Guide.shouldShow({ar:true,open:true,page:'play',phase:'menu'}),true);
 a.equal(Guide.shouldShow({ar:true,open:true,page:'help',phase:'paused'}),true);
 for(const page of ['play','layout','sound','difficulty'])a.equal(Guide.shouldShow({ar:true,open:true,page,phase:'paused'}),false);
});
test('Field guide loads the existing flexible surface before its adapter and game initialization',()=>{
 const html=fs.readFileSync(__dirname+'/../index.html','utf8');
 const x=html.indexOf('modules/environment/flex-surface.js'),y=html.indexOf('river/field-guide.js'),z=html.indexOf('river/app.js');a.ok(x>0&&x<y&&y<z);
});
test('Field guide has no input capture, game-state mutation, storage or render loop',()=>{
 const text=fs.readFileSync(__dirname+'/../river/field-guide.js','utf8');
 a.doesNotMatch(text,/addEventListener|localStorage|requestAnimationFrame|new T\.WebGLRenderer|g\.state\s*=|g\.cancel\(|g\.start\(|g\.resume\(|RiverCore\.(shoot|slice|advance)/);
});
