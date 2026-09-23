import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { answer, validateMessages } from './assistant.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};

export async function createApp({apiKey=process.env.OPENAI_API_KEY, model=process.env.OPENAI_MODEL || 'gpt-6-astra', webSearch=process.env.FRISBI_WEB_SEARCH==='true', siteOrigin=process.env.SITE_ORIGIN || '', answerImpl=answer, perMinute=8, dailyLimit=200}={}) {
  // Serve an explicit root-file allowlist, never the server, tests, .env or repository metadata.
  const publicFiles=new Set((await readdir(root,{withFileTypes:true})).filter(f=>f.isFile() && mime[extname(f.name)] && !f.name.startsWith('.')).map(f=>f.name));
  const buckets=new Map(); let day='', dailyCount=0, active=0;
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
    let url; try {url=new URL(req.url,'http://localhost');} catch {return send(400,{error:'invalid_request'});}
    if (url.pathname==='/api/frisbi-ai/health' && req.method==='GET') return send(200,{ready:!!apiKey,webSearch:!!apiKey && webSearch});
    if (url.pathname==='/api/frisbi-ai') {
      if (req.method!=='POST') {res.setHeader('Allow','POST');return send(405,{error:'method_not_allowed'});}
      // Require same-origin JSON requests. Configure the public HTTPS origin at deployment.
      const allowedOrigin=siteOrigin || `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin!==allowedOrigin) return send(403,{error:'origin_not_allowed'});
      if (!(req.headers['content-type'] || '').startsWith('application/json')) return send(415,{error:'json_required'});
      if (!apiKey) return send(503,{error:'not_configured'});
      const now=Date.now(), today=new Date(now).toISOString().slice(0,10);
      if(day!==today){day=today;dailyCount=0;}
      for(const [key,b] of buckets) if(now>b.reset) buckets.delete(key);
      // Do not trust a user-supplied X-Forwarded-For header.
      const key=req.socket.remoteAddress || 'unknown';
      const bucket=buckets.get(key) || {count:0,reset:now+60000};
      if(bucket.count>=perMinute || dailyCount>=dailyLimit || active>=4){res.setHeader('Retry-After','60');return send(429,{error:'rate_limited'});}
      const chunks=[]; let bytes=0;
      try {
        for await(const chunk of req){bytes+=chunk.length;if(bytes>40000){send(413,{error:'too_large'});return;}chunks.push(chunk);}
        const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8')); validateMessages(parsed.messages);
        const current=buckets.get(key) || bucket;
        if(current.count>=perMinute || dailyCount>=dailyLimit || active>=4){res.setHeader('Retry-After','60');return send(429,{error:'rate_limited'});}
        current.count++; buckets.set(key,current);dailyCount++;active++;
        const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);
        const onClose=()=>{if(!res.writableEnded)controller.abort();};res.on('close',onClose);
        try {
          const result=await answerImpl(parsed.messages,{apiKey,model,webSearch,signal:controller.signal});
          if(!res.destroyed)send(200,result);
        } catch(error) {
          if(!res.destroyed)send(error.message==='upstream_rate_limit'?429:502,{error:controller.signal.aborted?'timeout':'assistant_unavailable'});
        } finally {clearTimeout(timer);res.off('close',onClose);active--;}
      }catch {if(!res.headersSent)send(400,{error:'invalid_messages'});}
      return;
    }
    if (!['GET','HEAD'].includes(req.method)) return send(405,{error:'method_not_allowed'});
    const filename=url.pathname==='/'?'index.html':url.pathname.slice(1);
    if(!publicFiles.has(filename)) return send(404,{error:'not_found'});
    try {const contents=await readFile(resolve(root,filename));res.writeHead(200,{'Content-Type':mime[extname(filename)],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:contents);}
    catch {send(404,{error:'not_found'});}
  });
  server.requestTimeout=15000;
  server.headersTimeout=10000;
  return server;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=await createApp();
  server.listen(Number(process.env.PORT || 8080),'0.0.0.0',()=>console.log('Frisbí website server started.'));
}
