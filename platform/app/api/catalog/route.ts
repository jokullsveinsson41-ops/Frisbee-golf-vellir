import {catalog,viewer,config,json} from '@/lib/server';
import {seedCourses} from '@/lib/courses';
export async function GET(){const u=await viewer();let courses=seedCourses;let storage=true;try{courses=await catalog();}catch{storage=false;}return json({courses,storage,user:u?{name:u.fullName||'Player',id:u.userId,isAdmin:(config().ADMIN_USER_IDS||'').split(',').includes(u.userId)}:null,aiAvailable:!!config().OPENAI_API_KEY,routingAvailable:!!config().ORS_API_KEY});}
