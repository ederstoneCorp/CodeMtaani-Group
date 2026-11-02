"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export type Staff = {
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
  must_change_password: boolean;
  password_changed_at: string | null;
  provisioning_status: "active" | "pending_password_change" | "inactive" | "provisioning_failed" | string | null;
};

const roleOptions = [
  ["super_admin", "Super Administrator", "all"],
  ["executive_administrator", "Executive Administrator", "all"],
  ["technical_administrator", "Technical Administrator", "all"],
  ["department_head", "Department Head", "all"],
  ["project_manager", "Project Manager", "all"],
  ["staff_member", "Staff Member", "all"],
  ["developer", "Software Developer", "all"],
  ["business_development", "Business Development", "enquiry"],
  ["marketing_and_communications", "Marketing & Communications", "all"],
  ["research_and_innovation", "Research & Innovation", "all"],
  ["content_manager", "Content Manager", "all"],
  ["operations", "Operations", "all"],
  ["careers", "Careers", "career"],
  ["partnerships", "Partnerships", "partnership"],
  ["viewer", "Read-only Viewer", "all"],
];

function generateSecureTempPassword(): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*-_";
  let pwd = "";
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += lowers[Math.floor(Math.random() * lowers.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];
  const all = uppers + lowers + digits + symbols;
  for (let i = 4; i < 16; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => 0.5 - Math.random()).join("");
}

export function AdminStaffPanel() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Onboarding Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("developer");
  const [scope, setScope] = useState("all");
  const [department, setDepartment] = useState("Engineering");
  const [position, setPosition] = useState("Software Engineer");
  const [phone, setPhone] = useState("");

  // Edit Staff Modal State
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

  // Credential Reset Modal State
  const [resettingStaff, setResettingStaff] = useState<Staff | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [reissuedPassword, setReissuedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Notification & Feedback States
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [duplicateStaff, setDuplicateStaff] = useState<{
    id: string;
    email: string;
    full_name: string;
    staff_number: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // Load staff accounts with complete error handling
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/staff", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to load staff directory from database.");
      }
      setUsers(data.users || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Database connection failed.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function changeRole(value: string) {
    setRole(value);
    const found = roleOptions.find((x) => x[0] === value);
    if (found) setScope(found[2]);
  }

  function handleAutoGeneratePassword() {
    const pwd = generateSecureTempPassword();
    setPassword(pwd);
    setShowPassword(true);
  }

  function handleAutoGenerateResetPassword() {
    const pwd = generateSecureTempPassword();
    setTempPasswordInput(pwd);
    setShowResetPassword(true);
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

  function openResetModal(user: Staff) {
    setResettingStaff(user);
    const autoPwd = generateSecureTempPassword();
    setTempPasswordInput(autoPwd);
    setReissuedPassword(null);
    setCopied(false);
    setError("");
  }

  function closeResetModal() {
    setResettingStaff(null);
    setReissuedPassword(null);
    setTempPasswordInput("");
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingStaff) return;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/admin/staff", {
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update staff member.");
      setNotice(`Updated staff profile for ${data.user.full_name} (${data.user.staff_number || "CMG-STAFF"}).`);
      setEditingStaff(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update staff profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReissueCredentials(e: FormEvent) {
    e.preventDefault();
    if (!resettingStaff) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resettingStaff.id,
          temporary_password: tempPasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reissue temporary credentials.");

      setReissuedPassword(data.temporary_password);
      setNotice(`Temporary credentials reissued for ${resettingStaff.full_name}. Password change flag activated.`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to reissue credentials.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOnboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setDuplicateStaff(null);

    try {
      const res = await fetch("/api/admin/staff", {
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

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "ACCOUNT_EXISTS" && data.existing_staff) {
          setDuplicateStaff(data.existing_staff);
        }
        throw new Error(data.error || "Unable to onboard staff member.");
      }

      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setNotice(
        `Staff member onboarded successfully! Unique Staff Number: ${data.user.staff_number}. Mandatory password change requirement is active.`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create staff account.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: Staff) {
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to change account status.");
      setNotice(`Account for ${user.full_name} is now ${user.active ? "disabled" : "activated"}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update account status.");
    }
  }

  const handleCopyPassword = () => {
    if (reissuedPassword) {
      navigator.clipboard.writeText(reissuedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

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

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      let matchStatus = true;
      if (statusFilter === "active") {
        matchStatus = u.active && !u.must_change_password;
      } else if (statusFilter === "pending_password_change") {
        matchStatus = Boolean(u.must_change_password);
      } else if (statusFilter === "inactive") {
        matchStatus = !u.active;
      }

      return matchSearch && matchDept && matchRole && matchStatus;
    });
  }, [users, search, deptFilter, roleFilter, statusFilter]);

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
        {/* HEADER */}
        <header className="admin-heading">
          <div>
            <p className="eyebrow">CodeMtaani Group / Governance</p>
            <h1>Staff &amp; Role Management</h1>
            <p>
              Super Admin directory with automated unique staff numbers, mandatory initial password change, and role governance.
            </p>
          </div>
          <div className="admin-actions" style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => load()}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Syncing…" : "Refresh Directory"}
            </button>
            <a className="admin-button secondary" href="/admin">
              Back to Dashboard
            </a>
          </div>
        </header>

        {/* FEEDBACK NOTICES */}
        {notice && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10b981",
              color: "#34d399",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <AlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong>Notice:</strong> {error}
                </div>
              </div>
              {duplicateStaff && (
                <button
                  type="button"
                  className="admin-button"
                  style={{ padding: "4px 10px", fontSize: "11px", whiteSpace: "nowrap" }}
                  onClick={() => {
                    setSearch(duplicateStaff.email);
                    setError("");
                  }}
                >
                  View Existing Profile ↗
                </button>
              )}
            </div>
          </div>
        )}

        {/* REISSUE CREDENTIALS MODAL */}
        {resettingStaff && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={closeResetModal}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#072329",
                border: "1px solid rgba(69, 200, 216, 0.4)",
                borderRadius: "12px",
                padding: "28px",
                maxWidth: "480px",
                width: "100%",
                boxShadow: "0 24px 50px rgba(0,0,0,0.7)",
                color: "#e8f4f6",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={closeResetModal}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "transparent",
                  border: "none",
                  color: "#8fa3a6",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <KeyRound size={20} style={{ color: "#45c8d8" }} />
                <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Reissue Temporary Credentials</h3>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(3, 21, 24, 0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  marginBottom: "16px",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: 700, color: "#fff" }}>{resettingStaff.full_name}</div>
                <div style={{ color: "#8fa3a6" }}>
                  {resettingStaff.email} · {resettingStaff.staff_number || "CMG-STAFF"}
                </div>
              </div>

              {reissuedPassword ? (
                <div>
                  <div
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px dashed #10b981",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      New Temporary Password
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#fff",
                        margin: "8px 0",
                        wordBreak: "break-all",
                      }}
                    >
                      {reissuedPassword}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="button-primary"
                      style={{
                        padding: "6px 14px",
                        fontSize: "11px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied to clipboard" : "Copy Temporary Password"}
                    </button>
                  </div>
                  <p style={{ fontSize: "12px", color: "#f59e0b", lineHeight: "1.5", margin: "0 0 16px" }}>
                    <strong>Security Notice:</strong> This password will <em>never</em> be displayed again. Deliver it securely to the staff member. They will be required to change it at their next login before accessing the workspace.
                  </p>
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="admin-button"
                    style={{ width: "100%", padding: "10px", fontSize: "12px" }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReissueCredentials}>
                  <p style={{ fontSize: "12px", color: "#a8c7cd", lineHeight: "1.5", margin: "0 0 16px" }}>
                    Reissuing credentials will invalidate previous credentials and activate the mandatory first-login password change policy.
                  </p>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", color: "#c2d8dc" }}>Temporary Password *</label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateResetPassword}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#45c8d8",
                          fontSize: "11px",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Auto-generate strong password
                      </button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showResetPassword ? "text" : "password"}
                        required
                        value={tempPasswordInput}
                        onChange={(e) => setTempPasswordInput(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 42px 10px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(4, 25, 30, 0.8)",
                          color: "#fff",
                          fontSize: "13px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#8fa3a6",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        aria-label="Toggle password visibility"
                      >
                        {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="admin-button secondary"
                      style={{ padding: "8px 14px", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy || !tempPasswordInput}
                      className="admin-button"
                      style={{ padding: "8px 18px", fontSize: "12px" }}
                    >
                      {busy ? "Reissuing…" : "Confirm & Set Temporary Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* EDIT PROFILE MODAL */}
        {editingStaff && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={closeEdit}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#072329",
                border: "1px solid rgba(69, 200, 216, 0.4)",
                borderRadius: "12px",
                padding: "28px",
                maxWidth: "600px",
                width: "100%",
                boxShadow: "0 24px 50px rgba(0,0,0,0.7)",
                color: "#e8f4f6",
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <button
                type="button"
                onClick={closeEdit}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "transparent",
                  border: "none",
                  color: "#8fa3a6",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Edit3 size={20} style={{ color: "#45c8d8" }} />
                <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Edit Staff Profile</h3>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(3, 21, 24, 0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span style={{ color: "#8fa3a6" }}>Unique Staff ID: </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#45c8d8" }}>
                    {editingStaff.staff_number || "CMG-STAFF"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#8fa3a6" }}>Joined: </span>
                  <span>{new Date(editingStaff.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Full Name *
                    <input
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                    />
                  </label>
                  <label>
                    Email Address *
                    <input
                      required
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. jane@codemtaani.com"
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
                      placeholder="e.g. Senior Software Architect"
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
                      <option value="active">Active (Access Allowed)</option>
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

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="admin-button secondary"
                    style={{ padding: "8px 16px", fontSize: "12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="admin-button"
                    style={{ padding: "8px 20px", fontSize: "12px" }}
                  >
                    {busy ? "Saving…" : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MAIN TWO-COLUMN WORKSPACE */}
        <section className="admin-grid">
          {/* LEFT: ONBOARDING DESK */}
          <div className="admin-form-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <UserPlus size={18} style={{ color: "#45c8d8" }} />
              <h2 style={{ margin: 0, fontSize: "18px" }}>Onboard Staff Member</h2>
            </div>
            <p style={{ color: "#a8c7cd", fontSize: "13px", lineHeight: "1.5", marginBottom: "16px" }}>
              Creates an authentication identity, auto-generates a unique staff number (<code style={{ color: "#45c8d8" }}>CMG-STAFF-XXXX</code>), and requires a mandatory password change on first login.
            </p>

            <form onSubmit={handleOnboard}>
              <label>
                Full Name *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Kamau"
                />
              </label>

              <label>
                Email Address *
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.kamau@codemtaani.com"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  Department
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                  />
                </label>
                <label>
                  Position
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                  />
                </label>
              </div>

              <label>
                Phone (Optional)
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                />
              </label>

              <label>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Temporary Password *</span>
                  <button
                    type="button"
                    onClick={handleAutoGeneratePassword}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#45c8d8",
                      fontSize: "11px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Auto-generate strong password
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={12}
                    maxLength={200}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 12 chars (upper, lower, number, symbol)"
                    style={{ paddingRight: "38px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#8fa3a6",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    disabled={role !== "viewer" && role !== "business_development"}
                  >
                    <option value="all">All departments</option>
                    <option value="enquiry">Enquiries</option>
                    <option value="career">Careers</option>
                    <option value="partnership">Partnerships</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#8fa3a6",
                  marginBottom: "16px",
                  lineHeight: "1.4",
                  backgroundColor: "rgba(4, 25, 30, 0.5)",
                  padding: "8px 10px",
                  borderRadius: "6px",
                }}
              >
                🔒 The new staff member will be required to change this temporary password immediately after their first successful login.
              </div>

              <button className="admin-button" disabled={busy} type="submit" style={{ width: "100%" }}>
                {busy ? "Onboarding Staff Member…" : "Onboard Staff Member ↗"}
              </button>
            </form>
          </div>

          {/* RIGHT: STAFF DIRECTORY */}
          <div className="admin-list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={20} style={{ color: "#45c8d8" }} />
                Staff Directory ({loading ? "…" : filteredUsers.length})
              </h2>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="admin-filters" style={{ marginBottom: "16px" }}>
              <div style={{ position: "relative", flex: 2 }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#8fa3a6" }} />
                <input
                  aria-label="Search staff"
                  placeholder="Search by name, email, staff number or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: "32px", width: "100%" }}
                />
              </div>

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
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {roleOptions.map((r) => (
                  <option key={r[0]} value={r[0]}>{r[1]}</option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="pending_password_change">Pending Password Change</option>
                <option value="inactive">Disabled Only</option>
              </select>
            </div>

            {/* LOADING STATE */}
            {loading && (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  backgroundColor: "rgba(4, 35, 41, 0.4)",
                  borderRadius: "8px",
                  border: "1px dashed rgba(255,255,255,0.15)",
                }}
              >
                <RefreshCw size={28} className="animate-spin" style={{ color: "#45c8d8", margin: "0 auto 12px" }} />
                <p style={{ margin: 0, fontSize: "14px", color: "#c2d8dc" }}>
                  Connecting to PostgreSQL staff directory…
                </p>
              </div>
            )}

            {/* ERROR STATE WITH RETRY BUTTON */}
            {!loading && loadError && (
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                }}
              >
                <ShieldAlert size={36} style={{ color: "#f87171", margin: "0 auto 12px" }} />
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#fff" }}>Unable to load staff directory</h3>
                <p style={{ margin: "0 auto 16px", fontSize: "13px", color: "#fca5a5", maxWidth: "480px", lineHeight: "1.5" }}>
                  {loadError}
                </p>
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => load()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={14} /> Retry Database Connection
                </button>
              </div>
            )}

            {/* DIRECTORY CARDS */}
            {!loading && !loadError && (
              <>
                {filteredUsers.map((user) => {
                  const isPendingChange = Boolean(user.must_change_password);
                  const isDeactivated = !user.active;

                  return (
                    <article className="admin-submission" key={user.id} style={{ marginBottom: "12px", padding: "16px" }}>
                      <span className="admin-submission-top">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <b style={{ fontSize: "15px", color: "#fff" }}>{user.full_name}</b>

                          {user.staff_number && (
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#45c8d8",
                                backgroundColor: "rgba(69,200,216,0.15)",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                border: "1px solid rgba(69,200,216,0.3)",
                              }}
                            >
                              {user.staff_number}
                            </span>
                          )}

                          {/* STATUS BADGE */}
                          {isDeactivated ? (
                            <span
                              style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                fontWeight: 700,
                                color: "#f87171",
                                backgroundColor: "rgba(239,68,68,0.15)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid rgba(239,68,68,0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <X size={11} /> Disabled
                            </span>
                          ) : isPendingChange ? (
                            <span
                              style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                fontWeight: 700,
                                color: "#fbbf24",
                                backgroundColor: "rgba(245,158,11,0.15)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid rgba(245,158,11,0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Clock size={11} /> Pending Password Change
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                fontWeight: 700,
                                color: "#34d399",
                                backgroundColor: "rgba(16,185,129,0.15)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid rgba(16,185,129,0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Check size={11} /> Active
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: "12px", color: "#8fa3a6" }}>
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </span>

                      <div style={{ marginTop: "6px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", fontSize: "13px" }}>
                        <span style={{ color: "#c2d8dc" }}>{user.email}</span>
                        {user.phone && <span style={{ color: "#8fa3a6", fontSize: "11px" }}>· {user.phone}</span>}
                        {user.position && <span style={{ color: "#63d8e5", fontSize: "11px" }}>· {user.position}</span>}
                        {user.department && <span style={{ color: "#8fa3a6", fontSize: "11px" }}>({user.department})</span>}
                      </div>

                      <small style={{ display: "block", color: "#8fa3a6", marginTop: "4px" }}>
                        Role: <span style={{ color: "#fff", textTransform: "capitalize" }}>{user.role.replaceAll("_", " ")}</span> · Scope: {user.scope} · Last login:{" "}
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never (Awaiting first login)"}
                      </small>

                      {user.notes && (
                        <div style={{ marginTop: "8px", fontSize: "11px", color: "#a8c7cd", backgroundColor: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: "4px" }}>
                          📝 {user.notes}
                        </div>
                      )}

                      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="admin-button"
                          style={{ padding: "4px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                          onClick={() => openEdit(user)}
                        >
                          <Edit3 size={12} /> Edit Profile
                        </button>
                        <button
                          type="button"
                          className="admin-button secondary"
                          style={{ padding: "4px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                          onClick={() => openResetModal(user)}
                        >
                          <KeyRound size={12} /> Reset Credentials
                        </button>
                        <button
                          type="button"
                          className="admin-button secondary"
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            color: user.active ? "#fca5a5" : "#6ee7b7",
                          }}
                          onClick={() => toggleActive(user)}
                        >
                          {user.active ? "Disable access" : "Restore access"}
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* EMPTY STATES */}
                {filteredUsers.length === 0 && (
                  <div
                    style={{
                      padding: "48px 24px",
                      textAlign: "center",
                      backgroundColor: "rgba(4, 35, 41, 0.4)",
                      borderRadius: "8px",
                      border: "1px dashed rgba(255,255,255,0.15)",
                    }}
                  >
                    <UserCheck size={32} style={{ color: "#45c8d8", margin: "0 auto 12px" }} />
                    <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#fff" }}>
                      {users.length === 0 ? "No Staff Accounts Found" : "No Matching Staff Members"}
                    </h3>
                    <p style={{ margin: "0 auto", fontSize: "13px", color: "#a8c7cd", maxWidth: "440px" }}>
                      {users.length === 0
                        ? "No database staff accounts provisioned yet. Use the onboarding desk on the left to create your first staff member."
                        : "No staff members match the active search and filter options. Try clearing your filters."}
                    </p>
                    {users.length > 0 && (
                      <button
                        type="button"
                        className="admin-button secondary"
                        style={{ marginTop: "14px", padding: "6px 14px", fontSize: "11px" }}
                        onClick={() => {
                          setSearch("");
                          setDeptFilter("all");
                          setRoleFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
