'use client';
import {Select,SelectTrigger,SelectContent,SelectItem,SelectValue} from '@/components/ui/select';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Info,ArrowUpRight} from 'lucide-react';
import type {ReactNode} from 'react';
export function Choice({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string;disabled?:boolean}[]}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="choice"><SelectValue placeholder={label}/></SelectTrigger><SelectContent>{options.map(o=><SelectItem value={o.value} key={o.value} disabled={o.disabled}>{o.label}</SelectItem>)}</SelectContent></Select>}
export function Modal({open,onClose,title,description,children,wide=false}:{open:boolean;onClose:()=>void;title:string;description?:string;children:ReactNode;wide?:boolean}){return <Dialog open={open} onOpenChange={v=>!v&&onClose()}><DialogContent className={wide?'dgi-dialog dgi-wide':'dgi-dialog'}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description||'Disc Golf Iceland'}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>}
export function Notice({children}:{children:ReactNode}){return <div className="notice"><Info size={18}/><div>{children}</div></div>}
export function External({href,children}:{href:string;children:ReactNode}){return <a href={href} target="_blank" rel="noopener noreferrer" className="text-link">{children}<ArrowUpRight size={15}/></a>}
export async function api(path:string,data?:unknown){const r=await fetch(path,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:undefined);const body:any=await r.json();if(!r.ok)throw new Error(body.error||'This service is currently unavailable. Please try again.');return body;}
export async function shareUrl(url:string){try{await navigator.clipboard.writeText(url);return true;}catch{if(navigator.share){await navigator.share({url});return true;}return false;}}
