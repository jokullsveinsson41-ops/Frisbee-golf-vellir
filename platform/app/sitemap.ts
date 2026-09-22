import {catalog} from '@/lib/server';
import {seedCourses} from '@/lib/courses';
export default async function sitemap(){const base='https://disc-golf-iceland.jokullsveinsson41.chatgpt.site';const cs=await catalog().catch(()=>seedCourses);return ['', '/atlas','/trip-planner','/learn','/events','/coverage','/clubs',...cs.map(c=>`/courses/${c.id}`)].map(path=>({url:base+path,lastModified:'2026-09-22'}));}
