import Experience from '@/components/experience';
import {catalog} from '@/lib/server';
import {seedCourses} from '@/lib/courses';
import {notFound} from 'next/navigation';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const cs=await catalog().catch(()=>seedCourses),c=cs.find(c=>c.id===slug);return {title:c?.name||'Course not found',description:c?.description,alternates:{canonical:`/courses/${slug}`}};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const cs=await catalog().catch(()=>seedCourses);if(!cs.some(c=>c.id===slug))notFound();return <Experience section="course" courseId={slug}/>}
