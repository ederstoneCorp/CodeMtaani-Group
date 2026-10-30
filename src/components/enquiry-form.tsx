"use client";
import { FormEvent, useState } from "react";

export function EnquiryForm() {
 const [status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");
 const [message,setMessage]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setStatus("sending");setMessage("");
  const form=new FormData(event.currentTarget);
  const payload=Object.fromEntries(form.entries());
  try{
   const response=await fetch("/api/enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json();
   if(!response.ok) throw new Error(data.error||"Unable to submit your enquiry.");
   setStatus("sent");setMessage("Your enquiry has been received. Our team will follow up using the contact details provided.");event.currentTarget.reset();
  }catch(error){setStatus("error");setMessage(error instanceof Error?error.message:"Something went wrong. Please try again.");}
 }
 return <form className="enquiry-form" onSubmit={submit}>
  <div className="form-row"><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name"/></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={180} placeholder="you@example.com"/></label></div>
  <div className="form-row"><label>Organisation <span>(optional)</span><input name="organisation" maxLength={140} placeholder="Company or institution"/></label><label>Enquiry type<select name="category" defaultValue="Project enquiry"><option>Project enquiry</option><option>Partnership</option><option>Careers</option><option>General enquiry</option></select></label></div>
  <label>Subject<input name="subject" required minLength={4} maxLength={160} placeholder="What would you like to discuss?"/></label>
  <label>How can we help?<textarea name="message" required minLength={20} maxLength={5000} rows={6} placeholder="Give us a little context about your project, idea or request."/></label>
  <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot"/>
  <button className="button-primary" type="submit" disabled={status==="sending"}>{status==="sending"?"Sending enquiry…":"Submit enquiry ↗"}</button>
  {message&&<p role="status" className={status==="error"?"form-status error":"form-status"}>{message}</p>}
  <p className="form-privacy">Please do not include passwords, financial account details or other sensitive personal information.</p>
 </form>;
}
