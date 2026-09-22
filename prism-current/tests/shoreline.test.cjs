/* Pure shared-bed and scenery wiring checks, not a rendered-device test. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const Art=require('../river/art'),C=require('../river/core'),layout=require('../river/bank-trees');
test('Authored riverbed is finite, symmetric, bounded and outside the action corridor',()=>{for(let z=-44;z<=0;z+=.17)for(let x=0;x<=8.4;x+=.1){const y=Art.bankHeight(x,z);A.ok(Number.isFinite(y)&&y>=-2.780001&&y<=.960001);A.equal(y,Art.bankHeight(-x,z));if(x<=3.5)A.equal(y,-2.78);}});
test('Shore slopes rise continuously toward dry ground rather than vertical block walls',()=>{for(let z=-42;z<0;z+=.5){let previous=-2.78;for(let x=4;x<=5.7;x+=.01){const y=Art.bankHeight(x,z);A.ok(y>=previous-1e-8);A.ok(y-previous<.09);previous=y;}A.ok(Math.abs(previous-.96)<1e-8);}});
test('Actual high tide stays below the outer bank and every tree root is grounded',()=>{for(let t=0;t<90;t+=.2)for(let z=-42;z<=0;z+=.5)A.ok(Art.bankHeight(5.25,z)>C.water('duck-armada',t));for(const d of layout.TREES)A.ok(Math.abs(d.position[1]-Art.bankHeight(d.position[0],d.position[2]))<1e-8,d.id);});
test('Visible ground and water optics use the same authored bed callback',()=>{const s=fs.readFileSync(__dirname+'/../river/art.js','utf8');A.match(s,/bedHeight:bankHeight/);A.match(s,/y=bankHeight\(x,z\)/);A.match(s,/bankUniforms.bankLevel.value=waterLevel/);});
test('Coherent sky and banks borrow the water texture without a second texture owner',()=>{const s=fs.readFileSync(__dirname+'/../river/art.js','utf8');A.match(s,/bankNoise:\{value:waterSystem.uniforms.waterNoise.value\}/);A.match(s,/waterNoise:\{value:waterSystem.uniforms.waterNoise.value\}/);A.doesNotMatch(s,/new T.WebGLRenderer|new T.WebGLRenderTarget/);});
test('Malformed ground queries do not silently upload a valid-looking height',()=>{A.ok(Number.isNaN(Art.bankHeight(NaN,0)));A.ok(Number.isNaN(Art.bankHeight(0,Infinity)));});
