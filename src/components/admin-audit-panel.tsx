"use client";

import { useEffect, useMemo, useState } from "react";

type Event = {
  id: string;
  actor: string;
  staff_number: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  source: string;
};

const labels: Record<string, string> = {
  login: "Signed In",
  login_succeeded: "Successful Sign-In",
  login_failed: "Failed Sign-In Attempt",
  staff_created: "Staff Account Created",
  staff_updated: "Staff Profile Modified",
  staff_activated: "Staff Access Restored",
  staff_deactivated: "Staff Access Suspended",
  article_created: "Article Published",
  article_updated: "Article Modified",
  article_deleted: "Article Permanently Deleted",
  project_created: "Project Initialized",
  project_updated: "Project Modified",
  task_created: "Task Created & Assigned",
  task_updated: "Task Stage Progressed",
  task_deleted: "Task Removed",
  public_submission_reviewed: "Public Submission Evaluated",
  attendance_updated: "Event Attendance Checked",
  media_uploaded: "Media Asset Uploaded",
  submissions_exported: "Submissions Exported",
};

export function AdminAuditPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [securityAlert, setSecurityAlert] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const p = new URLSearchParams();
        if (search.trim()) p.set("q", search.trim());
        if (action) p.set("action", action);
        if (targetType) p.set("targetType", targetType);

        const r = await fetch("/api/admin/audit?" + p, { cache: "no-store", signal: controller.signal });
        const d = await r.json();
        if (r.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!r.ok) throw new Error(d.error || "Unable to load activity.");
        setEvents(d.events || []);
        setSecurityAlert(Boolean(d.intelligence?.securityAlertActive));
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    const timer = window.setTimeout(load, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, action, targetType]);

  const failures = useMemo(() => events.filter((e) => e.action === "login_failed").length, [events]);

  function exportCsv() {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (action) p.set("action", action);
    if (targetType) p.set("targetType", targetType);
    p.set("format", "csv");
    window.location.href = `/api/admin/audit?${p.toString()}`;
  }

  return (
    <main className="admin-page">
      <div className="admin-wrap">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">CodeMtaani Group / Governance</p>
            <h1>Advanced Audit Trail &amp; Security Intelligence</h1>
            <p>Immutable forensic record of all administrative operations, access events, and data changes.</p>
          </div>
          <div className="admin-actions">
            <button className="admin-button" onClick={exportCsv}>
              Export Audit Trail (CSV)
            </button>
            <a className="admin-button secondary" href="/admin">
              Dashboard
            </a>
            <a className="admin-button secondary" href="/admin/staff">
              Staff Directory
            </a>
          </div>
        </header>

        {securityAlert && (
          <div
            style={{
              background: "rgba(224,0,0,0.15)",
              border: "1px solid #e00000",
              color: "#ff8888",
              padding: "16px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong>Security Intelligence Alert:</strong> Multiple failed authentication attempts ({failures}) detected. Automatic IP rate limiting is engaged.
            </div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              High Priority
            </span>
          </div>
        )}

        {/* SECURITY & AUDIT KPI CARDS */}
        <section className="admin-stats">
          <article>
            <span>Events in Scope</span>
            <strong>{events.length}</strong>
          </article>
          <article>
            <span>Failed Sign-in Warnings</span>
            <strong style={{ color: failures > 0 ? "#ff7777" : "inherit" }}>{failures}</strong>
          </article>
          <article>
            <span>Governance Actions</span>
            <strong>{events.filter((e) => e.action.startsWith("staff_")).length}</strong>
          </article>
          <article>
            <span>Task &amp; Project Operations</span>
            <strong>{events.filter((e) => e.action.startsWith("task_") || e.action.startsWith("project_")).length}</strong>
          </article>
        </section>

        {/* AUDIT LOG LIST & FILTERS */}
        <section className="admin-list audit-list">
          <div className="admin-filters" style={{ gridTemplateColumns: "1.5fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <input
              aria-label="Search activity"
              placeholder="Search actor, staff number, action or metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select aria-label="Filter activity" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="login">Sign-in &amp; Auth</option>
              <option value="staff_">Staff Governance</option>
              <option value="article_">Article CMS</option>
              <option value="project_">Project Operations</option>
              <option value="task_">Task Management</option>
              <option value="submission">Submissions Review</option>
            </select>
            <select aria-label="Filter resource" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              <option value="">All Resource Types</option>
              <option value="admin_user">Staff Accounts</option>
              <option value="article">Articles</option>
              <option value="project">Projects</option>
              <option value="project_task">Tasks</option>
              <option value="public_submission">Submissions</option>
              <option value="authentication">Authentication Gateway</option>
            </select>
          </div>

          {loading && <p className="admin-empty">Loading immutable audit trail…</p>}
          {error && (
            <div className="admin-error">
              {error} <button className="admin-button secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
          {!loading && !error && !events.length && (
            <p className="admin-empty">No activity records match the current filter criteria.</p>
          )}

          {!loading &&
            events.map((event) => (
              <article className="audit-event" key={event.source + "-" + event.id}>
                <div className="audit-event-main">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong>{labels[event.action] || event.action.replaceAll("_", " ")}</strong>
                      {event.staff_number && (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "10px",
                            background: "rgba(69,200,216,0.12)",
                            color: "#45c8d8",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(69,200,216,0.25)",
                          }}
                        >
                          {event.staff_number}
                        </span>
                      )}
                    </div>
                    <span>{event.actor}</span>
                  </div>
                  <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time>
                </div>

                {(event.target_type || event.target_id) && (
                  <p style={{ margin: "6px 0", color: "#8fa5a9", fontSize: "11px" }}>
                    Resource: <strong style={{ color: "#d2e3e6" }}>{event.target_type || "Record"}</strong>
                    {event.target_id ? ` · ID: ${event.target_id}` : ""}
                  </p>
                )}

                {Object.keys(event.metadata || {}).length > 0 && (
                  <p className="audit-meta" style={{ margin: "4px 0 0", fontSize: "11px" }}>
                    {Object.entries(event.metadata)
                      .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`)
                      .join(" · ")}
                  </p>
                )}
              </article>
            ))}
        </section>

        <p className="admin-footnote" style={{ marginTop: "20px", color: "#6a888d", fontSize: "11px" }}>
          Protected by database-level immutability triggers. Audit logs are tamper-evident and cannot be altered or removed.
        </p>
      </div>
    </main>
  );
}
