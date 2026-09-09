'use strict';
importScripts('./core.js','./music.js');
onmessage=e=>{try{const r=PrismMusic.render(PrismCore.chart(e.data.id));postMessage(r,[r.left.buffer,r.right.buffer]);}catch(error){postMessage({error:String(error.message||error)});}};
