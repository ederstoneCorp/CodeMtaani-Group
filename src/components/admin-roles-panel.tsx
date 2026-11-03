"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { safeFetchJson } from "@/lib/safe-fetch";

type RoleItem = {
  key: string;
  level: number;
  levelName: string;
  title: string;
  description: string;
  defaultScope: string;
  canManageAllProjects: boolean;
  canManageAllStaff: boolean;
  canManageSystem: boolean;
  userCount: number;
  activeUserCount: number;
};

export function AdminRolesPanel() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    const res = await safeFetchJson<{ roles: RoleItem[] }>("/api/admin/roles");
    if (!res.ok || !res.data) {
      setError(res.error || "Failed to load roles from database.");
    } else {
      setRoles(res.data.roles || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const filteredRoles = roles.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.key.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q);
    const matchesLevel = levelFilter === "all" || String(r.level) === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return { bg: "rgba(234, 179, 8, 0.15)", border: "#eab308", text: "#facc15", badge: "Supreme Authority" };
      case 2:
        return { bg: "rgba(69, 200, 216, 0.15)", border: "#45c8d8", text: "#65d5e1", badge: "Administrator" };
      case 3:
        return { bg: "rgba(168, 85, 247, 0.15)", border: "#a855f7", text: "#c084fc", badge: "Department Head" };
      case 4:
        return { bg: "rgba(59, 130, 246, 0.15)", border: "#3b82f6", text: "#60a5fa", badge: "Project Manager" };
      default:
        return { bg: "rgba(16, 185, 129, 0.12)", border: "#10b981", text: "#34d399", badge: "Staff Member" };
    }
  };

  return (
    <div style={{ color: "#e8f4f6" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", margin: "0 0 4px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={22} style={{ color: "#45c8d8" }} />
            Organisational Authority &amp; Role Hierarchy
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#a8c7cd" }}>
            Formal five-level governance hierarchy governing permissions, staff visibility, project desks, and communications.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRoles}
          className="admin-button secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Roles
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="admin-filters" style={{ marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 2 }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#8fa3a6" }} />
          <input
            aria-label="Search roles"
            placeholder="Search role title, scope or permissions description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>
        <select
          aria-label="Filter by level"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">All 5 Authority Levels</option>
          <option value="1">Level 1: Super Admin (Supreme)</option>
          <option value="2">Level 2: Administrator</option>
          <option value="3">Level 3: Department Head</option>
          <option value="4">Level 4: Project Manager</option>
          <option value="5">Level 5: Staff Member</option>
        </select>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 24px", backgroundColor: "rgba(4,35,41,0.4)", borderRadius: "8px" }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: "#45c8d8", margin: "0 auto 12px" }} />
          <p style={{ margin: 0, fontSize: "14px", color: "#c2d8dc" }}>Loading authoritative role hierarchy…</p>
        </div>
      )}

      {/* ROLES GRID */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {filteredRoles.map((role) => {
            const levelStyle = getLevelColor(role.level);
            const isSuper = role.key === "super_admin";

            return (
              <article
                key={role.key}
                style={{
                  backgroundColor: "#072329",
                  border: `1px solid ${levelStyle.border}40`,
                  borderRadius: "10px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
              >
                {/* Level Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 800,
                      backgroundColor: levelStyle.bg,
                      color: levelStyle.text,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      border: `1px solid ${levelStyle.border}60`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {isSuper ? <Crown size={12} /> : <Shield size={12} />}
                    {role.levelName}
                  </span>

                  <span
                    style={{
                      fontSize: "11px",
                      color: role.activeUserCount > 0 ? "#34d399" : "#8fa3a6",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Users size={12} />
                    <strong>{role.activeUserCount}</strong> active ({role.userCount} total)
                  </span>
                </div>

                <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "#fff" }}>{role.title}</h3>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#63d8e5", marginBottom: "12px" }}>
                  role: &quot;{role.key}&quot;
                </div>

                <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#c2d8dc", margin: "0 0 16px", flexGrow: 1 }}>
                  {role.description}
                </p>

                {/* Capability Matrix */}
                <div
                  style={{
                    backgroundColor: "rgba(3, 21, 24, 0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "#a8c7cd",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                  }}
                >
                  <div>
                    Organisation Governance:{" "}
                    <strong style={{ color: role.canManageSystem ? "#34d399" : "#8fa3a6" }}>
                      {role.canManageSystem ? "Supreme (All)" : "Restricted"}
                    </strong>
                  </div>
                  <div>
                    Staff Management:{" "}
                    <strong style={{ color: role.canManageAllStaff ? "#34d399" : "#8fa3a6" }}>
                      {role.canManageAllStaff ? "Full Access" : "Department/None"}
                    </strong>
                  </div>
                  <div>
                    Project Authority:{" "}
                    <strong style={{ color: role.canManageAllProjects ? "#34d399" : "#60a5fa" }}>
                      {role.canManageAllProjects ? "All Projects" : "Assigned Projects"}
                    </strong>
                  </div>
                  <div>
                    Scope Filter: <strong style={{ color: "#fff" }}>{role.defaultScope}</strong>
                  </div>
                </div>

                {isSuper && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(234, 179, 8, 0.1)",
                      border: "1px solid rgba(234, 179, 8, 0.25)",
                      fontSize: "11px",
                      color: "#fde047",
                    }}
                  >
                    Protected supreme authority: cannot be deleted, overridden, or demoted.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
