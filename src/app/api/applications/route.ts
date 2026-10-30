import { NextRequest, NextResponse } from "next/server";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(request:NextRequest){
 try{
  const body=await request.json();
  if(typeof body.website==="string"&&body.website.trim())return NextResponse.json({ok:true});
  const kind=body.kind==="career"?"career":body.kind==="partnership"?"partnership":null;
  const name=String(body.name||"").trim(),email=String(body.email||"").trim(),area=String(body.area||"").trim(),organisation=String(body.organisation||"").trim(),link=String(body.link||"").trim(),message=String(body.message||"").trim();
  if(!kind||name.length<2||name.length>100||!emailPattern.test(email)||email.length>180||area.length<2||area.length>120||organisation.length>160||link.length>500||message.length<30||message.length>4000)return NextResponse.json({error:"Check the required fields and try again."},{status:400});
  if(link&&!/^https:\/\//i.test(link))return NextResponse.json({error:"Please provide a valid HTTPS link."},{status:400});
  const key=process.env.RESEND_API_KEY;
  if(!key)return NextResponse.json({error:"Application delivery is not configured yet. Please use the relevant contact email."},{status:503});
  const to=kind==="career"?(process.env.CAREERS_TO_EMAIL||process.env.ENQUIRY_TO_EMAIL||"hello@codemtaani.com"):(process.env.PARTNERSHIPS_TO_EMAIL||process.env.ENQUIRY_TO_EMAIL||"hello@codemtaani.com");
  const from=process.env.ENQUIRY_FROM_EMAIL||"CodeMtaani Website <onboarding@resend.dev>";
  const title=kind==="career"?"Talent profile":"Partnership proposal";
  const bodyText=[`Name: ${name}`,`Email: ${email}`,`Area: ${area}`,`Organisation/location: ${organisation||"Not provided"}`,`Link: ${link||"Not provided"}`,"",message].join("\n");
  const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to,reply_to:email,subject:`Website ${title.toLowerCase()}: ${name}`,text:bodyText})});
  if(!result.ok)return NextResponse.json({error:"We could not deliver your submission. Please use the contact page."},{status:502});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Invalid request. Please review the form and try again."},{status:400});}
}
