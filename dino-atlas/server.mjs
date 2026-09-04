// Local development only. Static hosting needs no server-side runtime.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('.',import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
createServer(async (req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const requested = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let path = resolve(root,'.'+requested);
    if (path !== root.slice(0,-1) && !path.startsWith(root.endsWith(sep)?root:root+sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path,'index.html');
    const body = await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port,'127.0.0.1',()=>console.log(`Dino Atlas: http://127.0.0.1:${port}`));
