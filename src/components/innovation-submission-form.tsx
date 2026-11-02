"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function InnovationSubmissionForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [refNumber, setRefNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    setRefNumber(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed.");
      }
      setStatus("success");
      setRefNumber(data.reference_number);
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div
      style={{
        background: "#063b45",
        border: "1px solid rgba(72,198,212,0.3)",
        borderRadius: "16px",
        padding: "36px",
        marginTop: "30px",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <p className="eyebrow">Public Innovation Portal</p>
        <h3 style={{ fontSize: "24px", color: "#f4fbfc", margin: "6px 0" }}>
          Submit an Idea, Proposal or Community Initiative
        </h3>
        <p style={{ color: "#c2d8dc", fontSize: "14px", margin: 0 }}>
          Every submission receives a unique tracking reference code to monitor its progression through our 7-stage review process.
        </p>
      </div>

      {status === "success" && refNumber ? (
        <div
          style={{
            background: "rgba(69,200,216,0.12)",
            border: "1px solid #48c6d4",
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
          <h4 style={{ fontSize: "18px", color: "#f4fbfc", margin: "0 0 8px" }}>
            Submission Successfully Registered
          </h4>
          <p style={{ color: "#c2d8dc", fontSize: "13px", margin: "0 0 16px" }}>
            Keep your tracking reference number safe. You can check your review progress at any time.
          </p>
          <div
            style={{
              display: "inline-block",
              background: "#04242b",
              border: "1px dashed #48c6d4",
              borderRadius: "8px",
              padding: "10px 20px",
              fontFamily: "monospace",
              fontSize: "18px",
              fontWeight: 700,
              color: "#48c6d4",
              letterSpacing: "0.08em",
              marginBottom: "16px",
            }}
          >
            {refNumber}
          </div>
          <div>
            <Link
              href={`/track?ref=${encodeURIComponent(refNumber)}`}
              className="button-primary"
              style={{ display: "inline-flex", padding: "10px 20px", fontSize: "12px" }}
            >
              Track Submission Progress ↗
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="enquiry-form">
          <div className="form-row">
            <label>
              Your Full Name
              <input name="submitter_name" required maxLength={120} placeholder="e.g. Achieng Mwangi" />
            </label>
            <label>
              Email Address
              <input name="submitter_email" type="email" required maxLength={180} placeholder="you@domain.com" />
            </label>
          </div>

          <div className="form-row">
            <label>
              Submission Category
              <select name="submission_type" defaultValue="idea" required>
                <option value="idea">Innovative Idea / Concept</option>
                <option value="proposal">Project Proposal</option>
                <option value="partnership">Partnership Request</option>
                <option value="community">Community Initiative</option>
                <option value="suggestion">General Technology Suggestion</option>
              </select>
            </label>
            <label>
              Organisation / Institution <span>(optional)</span>
              <input name="organisation" maxLength={160} placeholder="University, startup or lab" />
            </label>
          </div>

          <label>
            Initiative Title
            <input name="title" required maxLength={200} placeholder="e.g. Decentralized Micro-Solar Monitoring System" />
          </label>

          <label>
            Problem Statement, Solution &amp; Scope
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={5000}
              rows={6}
              placeholder="Describe the challenge, your proposed solution, target audience and what support or collaboration you are seeking from CodeMtaani Group."
            />
          </label>

          <label>
            Supporting Document / Prototype Link <span>(optional)</span>
            <input name="attachment_url" type="url" maxLength={500} placeholder="https://github.com/... or Google Drive link" />
          </label>

          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot" />

          {errorMsg && (
            <div style={{ color: "#ff8888", fontSize: "13px", marginTop: "10px" }}>
              {errorMsg}
            </div>
          )}

          <div style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button className="button-primary" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Registering Submission…" : "Submit Initiative ↗"}
            </button>
            <Link href="/track" style={{ color: "#65d5e1", fontSize: "13px", textDecoration: "underline" }}>
              Already have a reference number? Track status here
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
