import { NextRequest, NextResponse } from "next/server";
import { saveSubmission } from "@/lib/database";

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const runtime = "nodejs";

export async function POST(request:NextRequest){
 try{
  const body=await request.json();
  if(typeof body.website==="string"&&body.website.trim()) return NextResponse.json({ok:true});
  const name=String(body.name||"").trim(),email=String(body.email||"").trim(),organisation=String(body.organisation||"").trim(),category=String(body.category||"General enquiry").trim(),subject=String(body.subject||"").trim(),message=String(body.message||"").trim();
  if(name.length<2||name.length>100||!emailPattern.test(email)||email.length>180||organisation.length>160||category.length>120||subject.length<4||subject.length>160||message.length<20||message.length>5000) return NextResponse.json({error:"Check the required fields and try again."},{status:400});
  const saved=await saveSubmission({type:"enquiry",name,email,organisation,category,subject,message});
  const key=process.env.RESEND_API_KEY;
  if(key){
   const textBody=[`Submission ID: ${saved.id}`,`Name: ${name}`,`Email: ${email}`,`Organisation: ${organisation||"Not provided"}`,`Category: ${category}`,`Subject: ${subject}`,"",message].join("\n");
   try{await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.ENQUIRY_FROM_EMAIL||"CodeMtaani Website <onboarding@resend.dev>",to:process.env.ENQUIRY_TO_EMAIL||"hello@codemtaani.com",reply_to:email,subject:`Website enquiry: ${subject}`,text:textBody})});}catch(error){console.error("Enquiry notification failed:",error);}
  }
  return NextResponse.json({ok:true,id:saved.id},{status:201});
 }catch(error){
  console.error("Enquiry submission failed:",error);
  return NextResponse.json({error:"We could not save your enquiry. Please try again later."},{status:503});
 }
}
