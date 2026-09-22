import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { seedCourses, type Course } from '@/lib/courses';
export const config=()=>env as Cloudflare.Env & {OPENAI_API_KEY?:string;OPENAI_MODEL?:string;ORS_API_KEY?:string;ADMIN_USER_IDS?:string;OPEN_METEO_API_KEY?:string};
export function db(){const d=config().DB;if(!d)throw new Error('Storage is temporarily unavailable. Please try again.');return d;}
let seeded:Promise<unknown>|null=null;
export async function catalog():Promise<Course[]>{
 const d=db(); if(!seeded)seeded=d.batch(seedCourses.map(c=>d.prepare('INSERT OR IGNORE INTO courses (id,data,updated) VALUES (?,?,?)').bind(c.id,JSON.stringify(c),c.checked))).catch(e=>{seeded=null;throw e;});await seeded;
 const r=await d.prepare('SELECT data FROM courses ORDER BY id').all<{data:string}>();return r.results.map(x=>JSON.parse(x.data));
}
export async function viewer(){return getChatGPTUser();}
export async function requireUser(){const u=await viewer();if(!u)throw new ApiError('Please sign in to save your courses, trips, and rounds.',401);return u;}
export async function requireAdmin(){const u=await requireUser();if(!(config().ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).includes(u.userId))throw new ApiError('Administrator access is required. An owner must configure the administrator allowlist.',403);return u;}
export class ApiError extends Error{constructor(message:string,public status=400){super(message);}}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function error(e:unknown){if(e instanceof ApiError)return json({error:e.message},e.status);if(e instanceof Error&&e.name==='ZodError')return json({error:'Please check the required fields and values.'},400);console.error(e);return json({error:'This service is temporarily unavailable. Your input has been kept; please try again.'},503);}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new ApiError('This request must come from this website.',403);}
export async function readLimited(req:Request,max:number){
 if(Number(req.headers.get('content-length')||0)>max)throw new ApiError('This submission is too large.',413);
 const reader=req.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new ApiError('This submission is too large.',413);}chunks.push(value);}
 const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
export async function body(req:Request){const data=await readLimited(req,100000);try{return JSON.parse(new TextDecoder().decode(data));}catch{throw new ApiError('Invalid request.',400);}}
export async function limit(key:string,max=20){const d=db(),now=Date.now(),window=Math.floor(now/3600000),k=`${key}:${window}`;const row=await d.prepare('INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(k,now+3600000).first<{count:number}>();if(row&&row.count>max)throw new ApiError('You have reached the hourly limit. Please try again later.',429);await d.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(now).run();}
export function validSource(url:string){try{const u=new URL(url);return u.protocol==='https:'&&!['localhost','127.0.0.1'].includes(u.hostname);}catch{return false;}}
