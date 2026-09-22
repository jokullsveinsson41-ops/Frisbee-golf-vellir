import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'Disc Golf Iceland — Find your next fairway',template:'%s | Disc Golf Iceland'},description:'Discover disc golf courses across Iceland. Explore a source-led atlas, plan a trip, and keep score. English and Icelandic.',metadataBase:new URL('https://disc-golf-iceland.jokullsveinsson41.chatgpt.site'),icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
