"use client";
import { FormEvent, useState } from "react";
type Props={kind:"career"|"partnership"; options:string[]};
export function ApplicationForm({kind,options}:Props){
 const [status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");const [feedback,setFeedback]=useState("");
 const isCareer=kind==="career";
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setStatus("sending");setFeedback("");const form=event.currentTarget;const payload=Object.fromEntries(new FormData(form).entries());payload.kind=kind;
 try{const response=await fetch("/api/applications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to submit.");setStatus("sent");setFeedback("Your submission has been received. The team will review it and contact you if there is a suitable next step.");form.reset();}catch(error){setStatus("error");setFeedback(error instanceof Error?error.message:"Something went wrong. Please try again.");}}
 return <form className="enquiry-form" onSubmit={submit}>
 <div className="form-row"><label>{isCareer?"Full name":"Your name"}<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Full name"/></label><label>Email address<input name="email" type="email" required maxLength={180} autoComplete="email" placeholder="you@example.com"/></label></div>
 <div className="form-row"><label>{isCareer?"Area of interest":"Partnership type"}<select name="area" required defaultValue=""><option value="" disabled>Select an area</option>{options.map(x=><option key={x}>{x}</option>)}</select></label><label>{isCareer?"Current location":"Organisation"}<input name="organisation" maxLength={160} placeholder={isCareer?"City / country":"Organisation name"}/></label></div>
 <label>{isCareer?"Portfolio, CV or LinkedIn URL":"Website or relevant link"}<input name="link" type="url" maxLength={500} placeholder="https://"/></label>
 <label>{isCareer?"Tell us about your skills and interests":"Describe the proposed collaboration"}<textarea name="message" required minLength={30} maxLength={4000} rows={6} placeholder={isCareer?"Summarise your experience, skills and what you hope to contribute.":"Explain the opportunity, intended outcomes and possible contributions."}/></label>
 <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot"/>
 <button className="button-primary" type="submit" disabled={status==="sending"}>{status==="sending"?"Submitting…":isCareer?"Send talent profile ↗":"Submit partnership proposal ↗"}</button>
 {feedback&&<p role="status" className={status==="error"?"form-status error":"form-status"}>{feedback}</p>}
 <p className="form-privacy">Do not submit confidential, sensitive or unnecessary personal information. Submissions are sent to the group team by email.</p>
 </form>;
}
