import { NextRequest, NextResponse } from "next/server";

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(request:NextRequest){
 try{
  const body=await request.json();
  if(typeof body.website==="string"&&body.website.trim()) return NextResponse.json({ok:true});
  const name=String(body.name||"").trim(),email=String(body.email||"").trim(),organisation=String(body.organisation||"").trim(),category=String(body.category||"General enquiry").trim(),subject=String(body.subject||"").trim(),message=String(body.message||"").trim();
  if(name.length<2||name.length>100||!emailPattern.test(email)||email.length>180||subject.length<4||subject.length>160||message.length<20||message.length>5000) return NextResponse.json({error:"Check the required fields and try again."},{status:400});
  const key=process.env.RESEND_API_KEY;
  if(!key) return NextResponse.json({error:"Enquiry delivery is not configured yet. Please email hello@codemtaani.com directly."},{status:503});
  const to=process.env.ENQUIRY_TO_EMAIL||"hello@codemtaani.com";
  const from=process.env.ENQUIRY_FROM_EMAIL||"CodeMtaani Website <onboarding@resend.dev>";
  const textBody=[`Name: ${name}`,`Email: ${email}`,`Organisation: ${organisation||"Not provided"}`,`Category: ${category}`,`Subject: ${subject}`,"",message].join("\n");
  const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to,reply_to:email,subject:`Website enquiry: ${subject}`,text:textBody})});
  if(!result.ok) return NextResponse.json({error:"We could not deliver your enquiry right now. Please email hello@codemtaani.com."},{status:502});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Invalid request. Please review the form and try again."},{status:400});}
}
