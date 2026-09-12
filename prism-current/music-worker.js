'use strict';
importScripts('./tidal-bloom.js?v=0.4.0','./core.js?v=0.4.0','./music.js?v=0.4.0');
onmessage=e=>{try{const r=PrismMusic.render(PrismCore.chart(e.data.id));postMessage(r,[r.left.buffer,r.right.buffer]);}catch(error){postMessage({error:String(error.message||error)});}};
