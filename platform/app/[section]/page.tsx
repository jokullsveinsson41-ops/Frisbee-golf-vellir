import Experience from '@/components/experience';
import {notFound} from 'next/navigation';
const sections=['atlas','trip-planner','learn','events','saved','scorecard','clubs','coverage','admin'];
export async function generateMetadata({params}:{params:Promise<{section:string}>}){const {section}=await params;return {title:section.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ')};}
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.includes(section))notFound();return <Experience section={section}/>}
