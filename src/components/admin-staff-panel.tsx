"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Staff = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  scope: string;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
  staff_number: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  notes: string | null;
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
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // New staff form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("developer");
  const [scope, setScope] = useState("all");
  const [department, setDepartment] = useState("Engineering");
  const [position, setPosition] = useState("Software Engineer");
  const [phone, setPhone] = useState("");

  // Edit staff modal / panel state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editScope, setEditScope] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editPos, setEditPos] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editActive, setEditActive] = useState(true);

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

  function openEdit(user: Staff) {
    setEditingStaff(user);
    setEditName(user.full_name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditScope(user.scope);
    setEditDept(user.department || "");
    setEditPos(user.position || "");
    setEditPhone(user.phone || "");
    setEditNotes(user.notes || "");
    setEditActive(user.active);
    setError("");
    setNotice("");
  }

  function closeEdit() {
    setEditingStaff(null);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingStaff) return;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const r = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStaff.id,
          full_name: editName,
          email: editEmail,
          role: editRole,
          scope: editScope,
          department: editDept,
          position: editPos,
          phone: editPhone,
          notes: editNotes,
          active: editActive,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update staff member.");
      setNotice(`Updated staff profile for ${d.user.full_name} (${d.user.staff_number || "CMG"}).`);
      setEditingStaff(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update staff member.");
    } finally {
      setBusy(false);
    }
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
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          role,
          scope,
          department,
          position,
          phone,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to create account.");
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setNotice(`Staff account created. Unique ID assigned: ${d.user.staff_number || "CMG-STAFF"}`);
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

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.staff_number && u.staff_number.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q));

      const matchDept =
        deptFilter === "all" ||
        (u.department && u.department.toLowerCase() === deptFilter.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.active) ||
        (statusFilter === "inactive" && !u.active);

      return matchSearch && matchDept && matchStatus;
    });
  }, [users, search, deptFilter, statusFilter]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  return (
    <main className="admin-page">
      <div className="admin-wrap">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">CodeMtaani Group / Governance</p>
            <h1>Staff &amp; Role Management</h1>
            <p>Super Admin directory with automated staff numbers, profile auditing and role governance.</p>
          </div>
          <div className="admin-actions">
            <a className="admin-button secondary" href="/admin">
              Back to Dashboard
            </a>
          </div>
        </header>

        {notice && (
          <div style={{ background: "rgba(69,200,216,0.12)", border: "1px solid #45c8d8", color: "#63d8e5", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>
            {notice}
          </div>
        )}
        {error && (
          <div className="admin-error" role="alert" style={{ marginBottom: "20px" }}>
            <strong>Notice:</strong> {error}
          </div>
        )}

        {/* PROFILE EDIT MODAL */}
        {editingStaff && (
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
                padding: "28px",
                maxWidth: "600px",
                width: "100%",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: "13px",
                      background: "rgba(69,200,216,0.15)",
                      color: "#45c8d8",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      border: "1px solid rgba(69,200,216,0.3)",
                      marginBottom: "6px",
                    }}
                  >
                    {editingStaff.staff_number || "CMG-STAFF"}
                  </span>
                  <h2 style={{ fontSize: "20px", margin: 0, color: "#f1fbfc" }}>Edit Staff Profile</h2>
                  <small style={{ color: "#8fa5a9" }}>
                    Account created {new Date(editingStaff.created_at).toLocaleDateString()} · Last login:{" "}
                    {editingStaff.last_login_at ? new Date(editingStaff.last_login_at).toLocaleString() : "Never"}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#8fa5a9",
                    fontSize: "22px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Full Name
                    <input
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Work Email
                    <input
                      required
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      maxLength={180}
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Role
                    <select
                      value={editRole}
                      onChange={(e) => {
                        setEditRole(e.target.value);
                        const found = roleOptions.find((x) => x[0] === e.target.value);
                        if (found) setEditScope(found[2]);
                      }}
                    >
                      {roleOptions.map((x) => (
                        <option key={x[0]} value={x[0]}>
                          {x[1]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Department Scope
                    <select
                      value={editScope}
                      onChange={(e) => setEditScope(e.target.value)}
                      disabled={editRole !== "viewer" && editRole !== "business_development"}
                    >
                      <option value="all">All departments</option>
                      <option value="enquiry">Enquiries</option>
                      <option value="career">Careers</option>
                      <option value="partnership">Partnerships</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Department
                    <input
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      placeholder="e.g. Engineering, Operations"
                    />
                  </label>
                  <label>
                    Position / Title
                    <input
                      value={editPos}
                      onChange={(e) => setEditPos(e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer"
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Phone / Contact
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+254 700 000 000"
                    />
                  </label>
                  <label>
                    Account Status
                    <select
                      value={editActive ? "active" : "inactive"}
                      onChange={(e) => setEditActive(e.target.value === "active")}
                    >
                      <option value="active">Active (Access Granted)</option>
                      <option value="inactive">Disabled (Access Blocked)</option>
                    </select>
                  </label>
                </div>

                <label>
                  Administrative Notes
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Internal governance notes regarding this account..."
                  />
                </label>

                <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                  <button className="admin-button" disabled={busy} type="submit">
                    {busy ? "Saving…" : "Save Changes"}
                  </button>
                  <button className="admin-button secondary" type="button" onClick={closeEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="admin-workspace">
          {/* PROVISION NEW STAFF */}
          <div className="admin-detail">
            <h2>Onboard New Staff</h2>
            <p style={{ fontSize: "12px", color: "#8fa5a9", marginBottom: "16px" }}>
              Staff members are automatically assigned a unique sequential staff number (e.g. CMG-STAFF-0001) upon onboarding.
            </p>
            <form onSubmit={create}>
              <label>
                Full Name
                <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </label>
              <label>
                Work Email
                <input required type="email" maxLength={180} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@codemtaani.com" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  Department
                  <input maxLength={80} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" />
                </label>
                <label>
                  Position
                  <input maxLength={100} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Software Engineer" />
                </label>
              </div>
              <label>
                Phone / Contact (optional)
                <input maxLength={50} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7..." />
              </label>
              <label>
                Initial Password (min 12 characters)
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
                {busy ? "Onboarding…" : "Onboard Staff Member"}
              </button>
            </form>
          </div>

          {/* STAFF DIRECTORY */}
          <div className="admin-list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0 }}>Staff Directory ({filteredUsers.length})</h2>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="admin-filters" style={{ marginBottom: "16px" }}>
              <input
                aria-label="Search staff"
                placeholder="Search by name, email, staff number or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label="Filter by department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Disabled Only</option>
              </select>
            </div>

            {filteredUsers.map((user) => (
              <article className="admin-submission" key={user.id} style={{ marginBottom: "10px" }}>
                <span className="admin-submission-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <b>{user.full_name}</b>
                    {user.staff_number && (
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
                        {user.staff_number}
                      </span>
                    )}
                  </div>
                  <small style={{ color: user.active ? "#45c8d8" : "#ff7777" }}>
                    {user.active ? "Active" : "Disabled"}
                  </small>
                </span>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "4px 0", flexWrap: "wrap" }}>
                  <span style={{ color: "#d2e3e6", fontSize: "12px" }}>{user.email}</span>
                  {user.phone && (
                    <span style={{ color: "#8fa5a9", fontSize: "11px" }}>· {user.phone}</span>
                  )}
                  {user.position && (
                    <span style={{ color: "#63d8e5", fontSize: "11px" }}>· {user.position}</span>
                  )}
                  {user.department && (
                    <span style={{ color: "#8fa5a9", fontSize: "11px" }}>({user.department})</span>
                  )}
                </div>

                <small style={{ display: "block", color: "#8fa5a9" }}>
                  Role: {user.role.replaceAll("_", " ")} · Scope: {user.scope} · Joined:{" "}
                  {new Date(user.created_at).toLocaleDateString()} · Last login:{" "}
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                </small>

                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="admin-button"
                    style={{ padding: "4px 12px", fontSize: "11px" }}
                    onClick={() => openEdit(user)}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="admin-button secondary"
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                    onClick={() => toggle(user)}
                  >
                    {user.active ? "Disable access" : "Restore access"}
                  </button>
                </div>
              </article>
            ))}

            {!filteredUsers.length && (
              <p className="admin-empty">
                {users.length === 0
                  ? "No database staff accounts provisioned yet."
                  : "No staff members match the specified filters."}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
