const VERSION='discover-gacha-pwa-v2-halloween-all';
const CACHE=VERSION+'-'+self.registration.scope;
const FILES=['./','index.html','offline.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','videos/A.mp4','videos/B.mp4','videos/C.mp4','videos/D.mp4','videos/E.mp4'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(FILES.map(f=>new Request(new URL(f,self.registration.scope),{cache:'reload'})));await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
async function ranged(response,range){
 const data=await response.arrayBuffer(),size=data.byteLength;
 const m=/^bytes=(\d*)-(\d*)$/.exec(range);
 if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
 let end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;
 if(start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 return new Response(data.slice(start,end+1),{status:206,headers:{'Content-Type':response.headers.get('Content-Type')||'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1)}});
}
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{const c=await caches.open(CACHE);let hit=await c.match(event.request.url);if(!hit&&event.request.mode==='navigate')hit=await c.match(new URL('index.html',self.registration.scope));if(hit){const range=event.request.headers.get('Range');return range?await ranged(hit,range):hit}return fetch(event.request)})());
});
self.addEventListener('message',event=>{if(event.data?.type==='CHECK_OFFLINE')event.waitUntil((async()=>{const c=await caches.open(CACHE);const results=await Promise.all(FILES.map(f=>c.match(new URL(f,self.registration.scope))));event.ports[0]?.postMessage({ready:results.every(Boolean),version:VERSION})})())});
