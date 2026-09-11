/* Network-first runtime; scoped cache cleanup never touches sibling apps. */
const CACHE='svgn-paper-route-sky-cycle-20260911';
const STATIC=['./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('svgn-paper-route-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const isStatic=url=>/\.(png|webmanifest|ico|svg)$/i.test(url.pathname);
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 if(isStatic(url)){e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));return;}
 e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>caches.match(req).then(async hit=>hit||(req.mode==='navigate'?await caches.match('./index.html'):null)||Response.error())));
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting();});
