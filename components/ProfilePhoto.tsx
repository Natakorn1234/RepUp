import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

export function Avatar({src}:{src?:string}) {
 const [failed,setFailed]=useState<string>();
 return src&&failed!==src?<img className="avatar-image" src={src} alt="Your profile" onError={()=>setFailed(src)}/>:<>YOU</>;
}

export default function ProfilePhoto({src,onChange,toast}:{src?:string;onChange:(src:string|undefined)=>void;toast:(message:string)=>void}) {
 const input=useRef<HTMLInputElement>(null);
 const [busy,setBusy]=useState(false);
 const change=useRef(onChange);change.current=onChange;
 async function upload(file:File) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('Choose a JPG, PNG, or WebP image.');return;}
  if(file.size>8*1024*1024){toast('Choose an image smaller than 8 MB.');return;}
  setBusy(true);
  let bitmap:ImageBitmap|undefined;
  try {
   bitmap=await createImageBitmap(file);
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error();
   ctx.fillStyle='#20241f';ctx.fillRect(0,0,256,256);
   const side=Math.min(bitmap.width,bitmap.height);
   ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);
   const photo=canvas.toDataURL('image/jpeg',0.85);
   if(photo.length>150000)throw Error();
   change.current(photo);toast('Profile photo updated');
  } catch {toast('Could not read this image. Try a different JPG, PNG, or WebP.');}
  finally {bitmap?.close();setBusy(false);}
 }
 return <section className="panel"><h2>Profile photo</h2><div className="profile-photo-row"><button className="avatar profile-photo-preview" aria-label="Choose profile photo" disabled={busy} onClick={()=>input.current?.click()}><Avatar src={src}/></button><div><button className="secondary" disabled={busy} onClick={()=>input.current?.click()}><Camera size={17}/>{busy?'Preparing…':src?'Change photo':'Upload photo'}</button><p className="fine">JPG, PNG or WebP · up to 8 MB<br/>Cropped to a square and saved only on this device.</p>{src&&<button className="text-btn danger" disabled={busy} onClick={()=>{if(confirm('Remove your profile photo?')){change.current(undefined);toast('Profile photo removed');}}}>Remove photo</button>}</div></div><input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" aria-label="Upload profile photo" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file);}}/></section>;
}
