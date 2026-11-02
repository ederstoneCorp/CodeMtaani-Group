"use client";

import { FormEvent, useState } from "react";

const categories = [
  { id: "student", label: "Student Member", desc: "College/university student building technical skills" },
  { id: "developer", label: "Developer Member", desc: "Software engineer, web developer, backend/frontend builder" },
  { id: "creative", label: "Creative & Designer", desc: "UI/UX, visual designer, technical writer, media" },
  { id: "researcher", label: "Researcher & Innovator", desc: "Applied AI, data science, academic research, emerging tech" },
  { id: "community", label: "Community Member", desc: "Tech enthusiast, event participant, supporter" },
  { id: "collaborator", label: "External Collaborator", desc: "Industry professional, mentor, guest contributor" },
];

export function MembershipForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your application.");
      }

      setStatus("success");
      setMessage("Your membership application has been received! Our community operations team will review your submission and contact you via email.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Full Name
          <input name="full_name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Full name" />
        </label>
        <label>
          Email Address
          <input name="email" type="email" required maxLength={180} autoComplete="email" placeholder="you@example.com" />
        </label>
      </div>

      <div className="form-row">
        <label>
          Membership Category
          <select name="category" defaultValue="developer" required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Institution or Organisation <span>(optional)</span>
          <input name="institution_or_org" maxLength={160} placeholder="University, company or project" />
        </label>
      </div>

      <div className="form-row">
        <label>
          Skills <span>(comma-separated)</span>
          <input name="skills" maxLength={250} placeholder="e.g. Next.js, Python, UI/UX, Docker, PostgreSQL" />
        </label>
        <label>
          Interests &amp; Areas of Focus
          <input name="interests" maxLength={250} placeholder="e.g. AI systems, FinTech, Open Source, Cloud" />
        </label>
      </div>

      <div className="form-row">
        <label>
          GitHub Username <span>(optional)</span>
          <input name="github_handle" maxLength={80} placeholder="username" />
        </label>
        <label>
          LinkedIn or Portfolio URL <span>(optional)</span>
          <input name="linkedin_url" type="url" maxLength={300} placeholder="https://" />
        </label>
      </div>

      <label>
        Brief Bio &amp; What You Hope to Contribute
        <textarea
          name="bio"
          rows={4}
          maxLength={1000}
          placeholder="Share a short background about yourself and how you would like to participate in CodeMtaani."
        />
      </label>

      {/* Honeypot field for spam prevention */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot" />

      <button className="button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting application…" : "Apply for membership ↗"}
      </button>

      {message && (
        <p role="status" className={status === "error" ? "form-status error" : "form-status"}>
          {message}
        </p>
      )}

      <p className="form-privacy">
        Membership does not imply employment, governance control, or financial remuneration. Personal data is managed in compliance with the Kenya Data Protection Act, 2019.
      </p>
    </form>
  );
}
