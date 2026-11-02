"use client";

import { FormEvent, useState } from "react";
import { PageShell } from "@/components/page-shell";

type TrackingData = {
  reference_number: string;
  submission_type: string;
  title: string;
  submitter_name: string;
  status: "submitted" | "under_review" | "info_required" | "approved" | "rejected" | "in_development" | "completed";
  applicant_feedback: string | null;
  created_at: string;
  updated_at: string;
};

const STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "info_required", label: "Information Required" },
  { key: "approved", label: "Approved" },
  { key: "in_development", label: "In Development" },
  { key: "completed", label: "Completed" },
];

function getStageIndex(status: string): number {
  if (status === "rejected") return 3;
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TrackPage() {
  const [ref, setRef] = useState("");
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`/api/submissions/track?ref=${encodeURIComponent(ref.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to find submission.");
      }
      setData(json.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  const currentStage = data ? getStageIndex(data.status) : 0;

  return (
    <PageShell
      eyebrow="Portal / Submission Tracking"
      title="Track your initiative."
      intro="Enter your unique reference number to check real-time progress on your idea, project proposal, or collaboration request."
    >
      <section className="content-section">
        <div className="container" style={{ maxWidth: 860 }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: "12px",
              background: "#063b45",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(72,198,212,0.3)",
            }}
          >
            <input
              type="text"
              required
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. CMG-SUB-2026-0001"
              style={{
                flex: 1,
                background: "#04242b",
                border: "1px solid rgba(72,198,212,0.35)",
                color: "#f4fbfc",
                padding: "14px 18px",
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="button-primary"
              disabled={loading}
              style={{ padding: "14px 28px", cursor: "pointer" }}
            >
              {loading ? "Searching…" : "Track ↗"}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px 20px",
                background: "rgba(224,0,0,0.12)",
                border: "1px solid #e00000",
                borderRadius: "8px",
                color: "#ff9999",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {data && (
            <div
              style={{
                marginTop: "36px",
                background: "#063b45",
                border: "1px solid rgba(72,198,212,0.3)",
                borderRadius: "16px",
                padding: "36px 30px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: "13px",
                      background: "rgba(72,198,212,0.15)",
                      color: "#48c6d4",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      border: "1px solid rgba(72,198,212,0.3)",
                      display: "inline-block",
                      marginBottom: "8px",
                    }}
                  >
                    {data.reference_number}
                  </span>
                  <h2 style={{ fontSize: "24px", margin: "4px 0", color: "#f4fbfc" }}>{data.title}</h2>
                  <p style={{ margin: "4px 0 0", color: "#c2d8dc", fontSize: "13px" }}>
                    Category: <strong style={{ textTransform: "capitalize", color: "#65d5e1" }}>{data.submission_type}</strong> · Submitted on {new Date(data.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: data.status === "rejected" ? "#4a1212" : data.status === "completed" ? "#0a4220" : "rgba(72,198,212,0.2)",
                      color: data.status === "rejected" ? "#ff7777" : data.status === "completed" ? "#55ff99" : "#48c6d4",
                      border: "1px solid currentColor",
                    }}
                  >
                    {data.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              {/* STAGES PROGRESS TIMELINE */}
              <div style={{ margin: "40px 0 30px" }}>
                <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#65d5e1", marginBottom: "16px" }}>
                  Workflow Progression
                </p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: "8px" }}>
                  {STAGES.map((s, idx) => {
                    const isDone = idx <= currentStage && data.status !== "rejected";
                    const isCurrent = idx === currentStage;
                    return (
                      <div key={s.key} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            height: "6px",
                            borderRadius: "3px",
                            background: isDone ? "#48c6d4" : "rgba(255,255,255,0.15)",
                            marginBottom: "8px",
                            transition: "background 0.3s ease",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: isCurrent ? 800 : 500,
                            color: isCurrent ? "#48c6d4" : isDone ? "#f4fbfc" : "#8aa2a6",
                            display: "block",
                            lineHeight: "1.2",
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* APPLICANT FEEDBACK SECTION */}
              <div
                style={{
                  background: "#04242b",
                  border: "1px solid rgba(72,198,212,0.2)",
                  borderRadius: "10px",
                  padding: "20px",
                  marginTop: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: "14px", color: "#65d5e1" }}>Communication from CodeMtaani Review Board</h3>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.8", color: "#d2e3e6" }}>
                  {data.applicant_feedback || "Your submission is currently queued for evaluation by our technical committee. Further updates will appear here."}
                </p>
                <small style={{ display: "block", marginTop: "12px", color: "#789498", fontSize: "11px" }}>
                  Last reviewed: {new Date(data.updated_at).toLocaleString()}
                </small>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
