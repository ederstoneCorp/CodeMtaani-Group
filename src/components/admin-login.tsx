"use client";
import { FormEvent, useState } from "react";
export function AdminLogin() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})}); const data=await response.json(); if(!response.ok) throw new Error(data.error||"Sign in failed."); window.location.href="/admin"; }
    catch(e){setError(e instanceof Error?e.message:"Sign in failed.");} finally{setBusy(false);}
  }
  return <main className="admin-page"><section className="admin-auth-card"><p className="eyebrow">CodeMtaani Group / Secure access</p><h1>Administrator sign in</h1><p>Access is restricted to authorised administrators.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="admin-error">{error}</p>}<button className="admin-button" disabled={busy}>{busy?"Signing in…":"Sign in securely"}</button></form></section></main>;
}
