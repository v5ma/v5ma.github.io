/* Self-host the pinned A-Frame version; fail visibly without contacting a CDN. */
(async()=>{'use strict';
 const status=document.getElementById('loading-status');
 function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Could not load '+src));};document.head.append(s);});}
 try{await script('./vendor/aframe-1.8.0.min.js');await import('./game.mjs');}
 catch(e){status.textContent='The game could not load. Check the connection and reload. '+e.message;document.getElementById('loading').classList.add('failed');}
})();
