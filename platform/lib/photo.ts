// Remove metadata before any upload is stored or published. Pixel data is unchanged.
export function stripPhotoMetadata(bytes:Uint8Array):Uint8Array{
 const parts:Uint8Array[]=[];
 if(bytes[0]===255&&bytes[1]===216){parts.push(bytes.slice(0,2));let at=2;while(at<bytes.length){if(bytes[at]!==255)throw Error('Invalid JPEG');const marker=bytes[at+1];if(marker===218){parts.push(bytes.slice(at));break;}if(marker===217){parts.push(bytes.slice(at,at+2));break;}const length=(bytes[at+2]<<8)|bytes[at+3];if(length<2||at+2+length>bytes.length)throw Error('Invalid JPEG');if(!(marker>=224&&marker<=239)&&marker!==254)parts.push(bytes.slice(at,at+2+length));at+=2+length;}}
 else{parts.push(bytes.slice(0,8));let at=8;const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);while(at+12<=bytes.length){const length=view.getUint32(at),kind=String.fromCharCode(...bytes.slice(at+4,at+8));if(at+length+12>bytes.length)throw Error('Invalid PNG');if(['IHDR','PLTE','IDAT','IEND','tRNS'].includes(kind))parts.push(bytes.slice(at,at+length+12));at+=length+12;if(kind==='IEND')break;}}
 const output=new Uint8Array(parts.reduce((a,b)=>a+b.length,0));let at=0;for(const p of parts){output.set(p,at);at+=p.length;}return output;
}
