"use client";

import { FormEvent, useEffect, useState } from "react";

type Staff = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  scope: string;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
};

const roleOptions = [
  ["super_admin", "Super Administrator", "all"],
  ["executive_administrator", "Executive Administrator", "all"],
  ["technical_administrator", "Technical Administrator", "all"],
  ["developer", "Developer", "all"],
  ["business_development", "Business Development", "enquiry"],
  ["marketing_and_communications", "Marketing & Communications", "all"],
  ["research_and_innovation", "Research & Innovation", "all"],
  ["content_manager", "Content Manager", "all"],
  ["operations", "Operations", "all"],
  ["careers", "Careers", "career"],
  ["partnerships", "Partnerships", "partnership"],
  ["viewer", "Read-only Viewer", "all"],
];

export function AdminStaffPanel() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("developer");
  const [scope, setScope] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/staff");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Unable to load staff.");
    setUsers(d.users || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function changeRole(value: string) {
    setRole(value);
    const found = roleOptions.find((x) => x[0] === value);
    if (found) setScope(found[2]);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, password, role, scope }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to create account.");
      setName("");
      setEmail("");
      setPassword("");
      setNotice("Staff account created successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(user: Staff) {
    setError("");
    try {
      const r = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to update account.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update account.");
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-wrap">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">CodeMtaani Group / Governance</p>
            <h1>Staff &amp; Role Management</h1>
            <p>Create and manage authorised team accounts with role-based access control.</p>
          </div>
          <div className="admin-actions">
            <a className="admin-button secondary" href="/admin">
              Back to Dashboard
            </a>
          </div>
        </header>

        <section className="admin-workspace">
          <div className="admin-detail">
            <h2>Provision Staff Account</h2>
            <form onSubmit={create}>
              <label>
                Full Name
                <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </label>
              <label>
                Work Email
                <input required type="email" maxLength={180} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@codemtaani.com" />
              </label>
              <label>
                Password (min 12 characters)
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={200}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Strong password"
                />
              </label>
              <label>
                Assigned Role
                <select value={role} onChange={(e) => changeRole(e.target.value)}>
                  {roleOptions.map((x) => (
                    <option key={x[0]} value={x[0]}>
                      {x[1]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Department Scope
                <select value={scope} onChange={(e) => setScope(e.target.value)} disabled={role !== "viewer" && role !== "business_development"}>
                  <option value="all">All departments</option>
                  <option value="enquiry">Enquiries</option>
                  <option value="career">Careers</option>
                  <option value="partnership">Partnerships</option>
                </select>
              </label>
              <button className="admin-button" disabled={busy}>
                {busy ? "Creating…" : "Create Account"}
              </button>
            </form>
            {notice && <p style={{ color: "#45c8d8", fontSize: "12px", marginTop: "12px" }}>{notice}</p>}
            {error && <p className="admin-error">{error}</p>}
          </div>

          <div className="admin-list">
            <h2>Active Staff Accounts</h2>
            {users.map((user) => (
              <article className="admin-submission" key={user.id}>
                <span className="admin-submission-top">
                  <b>{user.full_name}</b>
                  <small style={{ color: user.active ? "#45c8d8" : "#ff7777" }}>{user.active ? "Active" : "Disabled"}</small>
                </span>
                <span>{user.email}</span>
                <small>
                  Role: {user.role.replaceAll("_", " ")} · Scope: {user.scope} · Last login:{" "}
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                </small>
                <div style={{ marginTop: "10px" }}>
                  <button className="admin-button secondary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => toggle(user)}>
                    {user.active ? "Disable access" : "Restore access"}
                  </button>
                </div>
              </article>
            ))}
            {!users.length && <p className="admin-empty">No database staff accounts provisioned yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
