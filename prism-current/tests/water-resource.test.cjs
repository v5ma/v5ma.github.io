const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
test('Reflection camera copying cannot clone its torch subtree each frame',()=>{const s=fs.readFileSync(__dirname+'/../water-mission/scene.js','utf8');A.match(s,/mirror\.copy\(camera,false\)/);A.equal((s.match(/new T.WebGLRenderTarget/g)||[]).length,1);});
test('Unfocused controller input is ignored and re-seeded before any edge action',()=>{const s=fs.readFileSync(__dirname+'/../water-mission/app.js','utf8');A.match(s,/document.hidden\|\|!document.hasFocus/);A.match(s,/if\(padSeed\)/);});
