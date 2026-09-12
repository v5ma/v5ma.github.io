const {test}=require('node:test'),A=require('node:assert/strict'),S=require('../graphics/spectral');
test('Ripple Gaussians avoid undefined GLSL powers of negative distances',()=>{A.doesNotMatch(S.shaders.ground,/pow\(\(r-/);A.match(S.shaders.ground,/exp\(-d\*d\)/);A.match(S.shaders.coreFragment,/nv=clamp/);});
