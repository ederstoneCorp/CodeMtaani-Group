"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Edit3, ExternalLink } from "lucide-react";
import type { PublicSubmission } from "@/lib/public-submissions";

type StaffOption = { id: string; full_name: string; staff_number: string | null };

const STATUS_OPTIONS = [
  ["all", "All Statuses"],
  ["submitted", "Submitted"],
  ["under_review", "Under Review"],
  ["info_required", "Information Required"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["in_development", "In Development"],
  ["completed", "Completed"],
];

const TYPE_OPTIONS = [
  ["all", "All Categories"],
  ["idea", "Innovative Idea"],
  ["proposal", "Project Proposal"],
  ["partnership", "Partnership"],
  ["community", "Community Initiative"],
  ["suggestion", "Technology Suggestion"],
];

export function AdminPortalSubmissionsView() {
  const [submissions, setSubmissions] = useState<PublicSubmission[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [activeSub, setActiveSub] = useState<PublicSubmission | null>(null);
  const [revStatus, setRevStatus] = useState<PublicSubmission["status"]>("submitted");
  const [revFeedback, setRevFeedback] = useState("");
  const [revNotes, setRevNotes] = useState("");
  const [revAssignee, setRevAssignee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSubmissions = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (statusFilter !== "all") p.set("status", statusFilter);
      if (typeFilter !== "all") p.set("type", typeFilter);
      if (search.trim()) p.set("search", search.trim());

      const res = await fetch(`/api/admin/submissions/portal?${p.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setSubmissions(d.submissions || []);
      }
    } catch {}
  }, [statusFilter, typeFilter, search]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const d = await res.json();
        setStaff(d.users || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSubmissions(), loadStaff()]).finally(() => setLoading(false));
  }, [loadSubmissions, loadStaff]);

  function openReview(sub: PublicSubmission) {
    setActiveSub(sub);
    setRevStatus(sub.status);
    setRevFeedback(sub.applicant_feedback || "");
    setRevNotes(sub.internal_notes || "");
    setRevAssignee(sub.assigned_to || "");
    setError("");
  }

  async function handleSaveReview(e: FormEvent) {
    e.preventDefault();
    if (!activeSub) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/submissions/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSub.id,
          status: revStatus,
          applicant_feedback: revFeedback || null,
          internal_notes: revNotes || null,
          assigned_to: revAssignee || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Update failed.");
      }
      setActiveSub(null);
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review.");
    } finally {
      setSaving(false);
    }
  }

  function getStatusColor(st: string) {
    switch (st) {
      case "approved":
      case "completed":
        return "#45c8d8";
      case "in_development":
      case "under_review":
        return "#63d8e5";
      case "info_required":
        return "#ffaa00";
      case "rejected":
        return "#ff7777";
      default:
        return "#8fa5a9";
    }
  }

  return (
    <div>
      {/* FILTERS & SEARCH */}
      <div className="admin-filters" style={{ gridTemplateColumns: "1.5fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <input
          placeholder="Search by reference code, title, submitter or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadSubmissions()}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {TYPE_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* REVIEW & EVALUATION MODAL */}
      {activeSub && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3,15,18,0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#0a1417",
              border: "1px solid #45c8d8",
              borderRadius: "12px",
              padding: "26px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "rgba(69,200,216,0.15)",
                    color: "#45c8d8",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(69,200,216,0.3)",
                  }}
                >
                  {activeSub.reference_number}
                </span>
                <h3 style={{ fontSize: "20px", margin: "6px 0 2px", color: "#f1fbfc" }}>{activeSub.title}</h3>
                <small style={{ color: "#799da3" }}>
                  Submitted by {activeSub.submitter_name} ({activeSub.submitter_email}) · {activeSub.organisation || "Individual"}
                </small>
              </div>
              <button
                type="button"
                onClick={() => setActiveSub(null)}
                style={{ background: "transparent", border: "none", color: "#8fa5a9", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#061316", border: "1px solid #1a2c30", borderRadius: "8px", padding: "14px", marginBottom: "18px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#63d8e5" }}>
                Problem &amp; Proposal Description
              </span>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#d2e3e6", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                {activeSub.description}
              </p>
              {activeSub.attachment_url && (
                <div style={{ marginTop: "10px" }}>
                  <a
                    href={activeSub.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#45c8d8", fontSize: "12px", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    View Supporting Document / Prototype Link <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveReview}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  Workflow Status
                  <select value={revStatus} onChange={(e) => setRevStatus(e.target.value as PublicSubmission["status"])}>
                    {STATUS_OPTIONS.filter((s) => s[0] !== "all").map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Assign to Technical Reviewer
                  <select value={revAssignee} onChange={(e) => setRevAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.staff_number || "CMG"})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Public Applicant Feedback (Visible to applicant on /track)
                <textarea
                  rows={3}
                  value={revFeedback}
                  onChange={(e) => setRevFeedback(e.target.value)}
                  placeholder="Official communication regarding evaluation status, requests for clarification, or approval notes..."
                />
              </label>

              <label>
                Internal Governance Notes (Confidential · Never revealed to applicant)
                <textarea
                  rows={2}
                  value={revNotes}
                  onChange={(e) => setRevNotes(e.target.value)}
                  placeholder="Private internal evaluation notes, technical viability remarks, or resource estimates..."
                />
              </label>

              {error && <div className="admin-error" style={{ marginBottom: "12px" }}>{error}</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button className="admin-button" disabled={saving} type="submit">
                  {saving ? "Saving Review…" : "Save Evaluation"}
                </button>
                <button className="admin-button secondary" type="button" onClick={() => setActiveSub(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS LIST */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#8fa5a9" }}>Loading submissions…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: "#081518",
                border: "1px solid #1a2c30",
                borderRadius: "8px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "rgba(69,200,216,0.12)",
                      color: "#45c8d8",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid rgba(69,200,216,0.25)",
                    }}
                  >
                    {sub.reference_number}
                  </span>
                  <strong style={{ fontSize: "14px", color: "#f1fbfc" }}>{sub.title}</strong>
                  <span style={{ fontSize: "11px", color: "#63d8e5", textTransform: "capitalize" }}>
                    • {sub.submission_type}
                  </span>
                </div>

                <small style={{ color: "#799da3" }}>
                  By {sub.submitter_name} ({sub.submitter_email}) · {new Date(sub.created_at).toLocaleDateString()}
                  {sub.assigned_name && (
                    <span style={{ color: "#d2e3e6", marginLeft: "8px" }}>
                      · Assigned: {sub.assigned_name} ({sub.assigned_staff_number || "CMG"})
                    </span>
                  )}
                </small>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.06)",
                    color: getStatusColor(sub.status),
                    border: "1px solid currentColor",
                  }}
                >
                  {sub.status.replaceAll("_", " ")}
                </span>

                <button
                  type="button"
                  className="admin-button"
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                  onClick={() => openReview(sub)}
                >
                  <Edit3 size={12} style={{ marginRight: 4 }} /> Review
                </button>
              </div>
            </div>
          ))}

          {submissions.length === 0 && (
            <p className="admin-empty">No innovation submissions match the specified criteria.</p>
          )}
        </div>
      )}
    </div>
  );
}
