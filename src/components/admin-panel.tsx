"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  FolderGit2,
  Inbox,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { ImageUploader } from "./image-uploader";
import { AdminNotificationsDropdown } from "./admin-notifications-dropdown";
import { AdminAnalyticsView } from "./admin-analytics-view";
import { AdminKanbanView } from "./admin-kanban-view";
import { AdminCommunicationView } from "./admin-communication-view";
import { AdminPortalSubmissionsView } from "./admin-portal-submissions-view";

type Submission = {
  id: string;
  type: string;
  name: string;
  email: string;
  organisation: string | null;
  category: string | null;
  subject: string | null;
  area: string | null;
  link: string | null;
  message: string;
  status: string;
  internal_notes: string;
  created_at: string;
};

type Counts = { type: string; status: string; count: number };

type Stats = {
  totalSubmissions: number;
  newSubmissions: number;
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  publishedProjects: number;
  draftProjects: number;
  publishedArticles: number;
  upcomingEvents: number;
  teamMembers: number;
  staffAccounts: number;
};

type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  status: string;
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
  created_at: string;
};

type MemberItem = {
  id: string;
  full_name: string;
  email: string;
  category: string;
  institution_or_org: string | null;
  skills: string[];
  status: string;
  registered_at: string;
};

type ArticleItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  cover_image: string | null;
  author_name: string | null;
  published_at: string | null;
};

type EventItem = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  start_time: string;
  location: string | null;
  is_virtual: boolean;
  status: string;
};

type TeamItem = {
  id: string;
  full_name: string;
  role_title: string;
  department: string | null;
  is_active: boolean;
};

export function AdminPanel() {
  const [tab, setTab] = useState<"overview" | "submissions" | "members" | "projects" | "articles" | "events" | "team" | "communication">("overview");
  const [projSubTab, setProjSubTab] = useState<"kanban" | "list">("kanban");
  const [subsSubTab, setSubsSubTab] = useState<"portal" | "enquiries">("portal");

  // User and Auth State
  const [role, setRole] = useState("super_admin");
  const [userEmail, setUserEmail] = useState("");
  const [permissions, setPermissions] = useState({
    edit: true,
    manageStaff: false,
    export: true,
    manageProjects: true,
    manageTasks: true,
    manageAnnouncements: true,
    manageContent: true,
    manageMembers: true,
    reviewSubmissions: true,
    deleteArticle: false,
    viewAudit: false,
  });

  // Global KPIs from Database
  const [stats, setStats] = useState<Stats | null>(null);

  // Submissions State
  const [items, setItems] = useState<Submission[]>([]);
  const [counts, setCounts] = useState<Counts[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [subType, setSubType] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [subNotes, setSubNotes] = useState("");
  const [subNextStatus, setSubNextStatus] = useState("new");

  // Module Data States
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [team, setTeam] = useState<TeamItem[]>([]);

  // Modals & Creation States
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);

  // Form inputs
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjCategory, setNewProjCategory] = useState("digital_solutions");
  const [newProjTech, setNewProjTech] = useState("");
  const [newProjGithub, setNewProjGithub] = useState("");
  const [newProjImage, setNewProjImage] = useState<string | null>(null);

  const [newArtTitle, setNewArtTitle] = useState("");
  const [newArtExcerpt, setNewArtExcerpt] = useState("");
  const [newArtContent, setNewArtContent] = useState("");
  const [newArtCategory, setNewArtCategory] = useState("article");
  const [newArtCover, setNewArtCover] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [newEvTitle, setNewEvTitle] = useState("");
  const [newEvDesc, setNewEvDesc] = useState("");
  const [newEvType, setNewEvType] = useState("workshop");
  const [newEvTime, setNewEvTime] = useState("");
  const [newEvVirtual, setNewEvVirtual] = useState(true);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamRole, setNewTeamRole] = useState("");
  const [newTeamDept, setNewTeamDept] = useState("Engineering");
  const [newTeamAvatar, setNewTeamAvatar] = useState<string | null>(null);

  // UI status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Initialize and verify authentication
  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const d = await r.json();
        setPermissions(d.permissions || {});
        setRole(d.user?.role || "super_admin");
        setUserEmail(d.user?.email || "");
      })
      .catch(() => setError("Unable to verify account permissions."));
  }, []);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Load Submissions
  const loadSubmissions = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const p = new URLSearchParams();
        if (subType) p.set("type", subType);
        if (subStatus) p.set("status", subStatus);
        if (subSearch) p.set("q", subSearch);
        const r = await fetch("/api/admin/submissions?" + p, { signal, cache: "no-store" });
        if (r.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Unable to load submissions.");
        setItems(d.submissions || []);
        setCounts(d.counts || []);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [subType, subStatus, subSearch]
  );

  // Load Projects
  const loadProjects = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/projects");
      if (r.ok) {
        const d = await r.json();
        setProjects(d.projects || []);
      }
    } catch {}
  }, []);

  // Load Members
  const loadMembers = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/members");
      if (r.ok) {
        const d = await r.json();
        setMembers(d.members || []);
      }
    } catch {}
  }, []);

  // Load Articles
  const loadArticles = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/articles");
      if (r.ok) {
        const d = await r.json();
        setArticles(d.articles || []);
      }
    } catch {}
  }, []);

  // Load Events
  const loadEvents = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/events");
      if (r.ok) {
        const d = await r.json();
        setEvents(d.events || []);
      }
    } catch {}
  }, []);

  // Load Team
  const loadTeam = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/team");
      if (r.ok) {
        const d = await r.json();
        setTeam(d.members || []);
      }
    } catch {}
  }, []);

  // Trigger loads based on active tab
  useEffect(() => {
    loadStats();
    if (tab === "overview" || tab === "submissions") {
      const controller = new AbortController();
      loadSubmissions(controller.signal);
      return () => controller.abort();
    } else if (tab === "projects") {
      loadProjects();
    } else if (tab === "members") {
      loadMembers();
    } else if (tab === "articles") {
      loadArticles();
    } else if (tab === "events") {
      loadEvents();
    } else if (tab === "team") {
      loadTeam();
    }
  }, [tab, loadStats, loadSubmissions, loadProjects, loadMembers, loadArticles, loadEvents, loadTeam]);

  // Submission actions
  function chooseSub(item: Submission) {
    setSelectedSub(item);
    setSubNotes(item.internal_notes || "");
    setSubNextStatus(item.status);
  }

  async function saveSubStatus() {
    if (!selectedSub) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/submissions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSub.id, status: subNextStatus, internal_notes: subNotes }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Update failed.");
      await loadSubmissions();
      setSelectedSub({ ...selectedSub, status: subNextStatus, internal_notes: subNotes });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  // Create Project
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProjTitle,
          slug: newProjTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: newProjDesc,
          category: newProjCategory,
          technologies: newProjTech.split(",").map((s) => s.trim()).filter(Boolean),
          github_url: newProjGithub || null,
          image_url: newProjImage || null,
          status: "in_development",
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed to create project");
      }
      setShowNewProject(false);
      setNewProjTitle("");
      setNewProjDesc("");
      setNewProjTech("");
      setNewProjGithub("");
      setNewProjImage(null);
      await loadProjects();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  // Create Article
  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newArtTitle,
          slug: newArtTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          excerpt: newArtExcerpt,
          content: newArtContent,
          category: newArtCategory,
          cover_image: newArtCover,
          status: "published",
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed to create article");
      }
      setShowNewArticle(false);
      setNewArtTitle("");
      setNewArtExcerpt("");
      setNewArtContent("");
      setNewArtCover(null);
      await loadArticles();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create article");
    } finally {
      setBusy(false);
    }
  }

  // Delete Article
  async function handleDeleteArticle(id: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/articles?id=${id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed to delete article");
      }
      setDeleteConfirmId(null);
      await loadArticles();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete article");
    } finally {
      setBusy(false);
    }
  }

  // Create Event
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvTitle,
          slug: newEvTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: newEvDesc,
          event_type: newEvType,
          start_time: newEvTime,
          is_virtual: newEvVirtual,
          status: "upcoming",
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed to create event");
      }
      setShowNewEvent(false);
      setNewEvTitle("");
      setNewEvDesc("");
      setNewEvTime("");
      await loadEvents();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setBusy(false);
    }
  }

  // Create Team Member
  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newTeamName,
          role_title: newTeamRole,
          department: newTeamDept,
          avatar_url: newTeamAvatar || null,
          is_active: true,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed to create team member");
      }
      setShowNewTeam(false);
      setNewTeamName("");
      setNewTeamRole("");
      setNewTeamAvatar(null);
      await loadTeam();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team member");
    } finally {
      setBusy(false);
    }
  }

  // Member status toggle
  async function toggleMemberStatus(id: string, current: string) {
    const next = current === "active" ? "suspended" : "active";
    try {
      await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      await loadMembers();
      await loadStats();
    } catch {}
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const totalSubmissions = useMemo(() => counts.reduce((n, c) => n + c.count, 0), [counts]);

  return (
    <main className="admin-page" style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: "250px",
          background: "#080e10",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#63d8e5", letterSpacing: "0.05em" }}>
            CODEMTAANI
          </span>
          <span style={{ display: "block", fontSize: "10px", color: "#8fa5a9", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: "2px" }}>
            Workspace Admin
          </span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
          <button
            onClick={() => setTab("overview")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "overview" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "overview" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <BarChart3 size={17} /> Overview
          </button>

          <button
            onClick={() => setTab("submissions")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "submissions" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "submissions" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Inbox size={17} /> Submissions ({stats?.newSubmissions || 0})
          </button>

          <button
            onClick={() => setTab("members")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "members" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "members" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Users size={17} /> Members ({stats?.totalMembers || 0})
          </button>

          <button
            onClick={() => setTab("projects")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "projects" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "projects" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <FolderGit2 size={17} /> Projects &amp; Tasks ({stats?.publishedProjects || 0})
          </button>

          <button
            onClick={() => setTab("communication")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "communication" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "communication" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <MessageSquare size={17} /> Internal Comms &amp; Bulletin
          </button>

          <button
            onClick={() => setTab("articles")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "articles" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "articles" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <BookOpen size={17} /> Content CMS ({stats?.publishedArticles || 0})
          </button>

          <button
            onClick={() => setTab("events")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "events" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "events" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Calendar size={17} /> Events ({stats?.upcomingEvents || 0})
          </button>

          <button
            onClick={() => setTab("team")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: tab === "team" ? "rgba(69,200,216,0.15)" : "transparent",
              color: tab === "team" ? "#45c8d8" : "#8fa5a9",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <UserCheck size={17} /> Team ({stats?.teamMembers || 0})
          </button>
        </nav>

        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {permissions.manageStaff && (
            <>
              <a
                href="/admin/staff"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  color: "#8fa5a9",
                  fontSize: "12px",
                  borderRadius: "4px",
                }}
              >
                <Shield size={15} /> Staff Access
              </a>
              <a
                href="/admin/audit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  color: "#8fa5a9",
                  fontSize: "12px",
                  borderRadius: "4px",
                }}
              >
                <ShieldCheck size={15} /> Security Audit
              </a>
            </>
          )}

          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              color: "#ffaaaa",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "12px",
              textAlign: "left",
              marginTop: "8px",
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <section style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxWidth: "1200px" }}>
        {/* Top Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.12em", color: "#62d4e2" }}>
              CodeMtaani Group Platform
            </span>
            <h1 style={{ fontSize: "2rem", margin: "4px 0 0", color: "#f1fbfc" }}>
              {tab === "overview" && "Executive Overview"}
              {tab === "submissions" && "Submission & Enquiry Desk"}
              {tab === "members" && "Membership Directory"}
              {tab === "projects" && "Project & Task Management"}
              {tab === "communication" && "Internal Communication & Bulletin"}
              {tab === "articles" && "Content & Blog CMS"}
              {tab === "events" && "Events & Workshops"}
              {tab === "team" && "Team Profiles"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AdminNotificationsDropdown />
            <span
              style={{
                fontSize: "11px",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "rgba(69,200,216,0.12)",
                border: "1px solid rgba(69,200,216,0.3)",
                color: "#63d8e5",
                textTransform: "capitalize",
              }}
            >
              {role.replaceAll("_", " ")}
            </span>
            <small style={{ color: "#8fa5a9", fontSize: "12px" }}>{userEmail}</small>
          </div>
        </header>

        {error && (
          <div className="admin-error" role="alert" style={{ marginBottom: "20px" }}>
            <strong>Notice:</strong> {error}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
              <article>
                <span>Total Submissions</span>
                <strong>{stats?.totalSubmissions ?? totalSubmissions}</strong>
              </article>
              <article>
                <span>New / Unhandled</span>
                <strong style={{ color: "#63d8e5" }}>{stats?.newSubmissions ?? 0}</strong>
              </article>
              <article>
                <span>Community Members</span>
                <strong>{stats?.totalMembers ?? 0}</strong>
              </article>
              <article>
                <span>Published Projects</span>
                <strong>{stats?.publishedProjects ?? 0}</strong>
              </article>
            </div>

            <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: "12px" }}>
              <article>
                <span>Published Articles</span>
                <strong>{stats?.publishedArticles ?? 0}</strong>
              </article>
              <article>
                <span>Upcoming Events</span>
                <strong>{stats?.upcomingEvents ?? 0}</strong>
              </article>
              <article>
                <span>Active Team Members</span>
                <strong>{stats?.teamMembers ?? 0}</strong>
              </article>
              <article>
                <span>Staff Accounts</span>
                <strong>{stats?.staffAccounts ?? 0}</strong>
              </article>
            </div>

            <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
              <div style={{ padding: "24px", background: "#101719", border: "1px solid #263438", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "16px", color: "#e7f1f2" }}>Quick Operations</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button className="admin-button" onClick={() => setTab("submissions")}>
                    <Inbox size={14} style={{ marginRight: 6 }} /> Review Submissions
                  </button>
                  <button className="admin-button secondary" onClick={() => setTab("projects")}>
                    <Plus size={14} style={{ marginRight: 6 }} /> Manage Projects
                  </button>
                  <button className="admin-button secondary" onClick={() => setTab("articles")}>
                    <Plus size={14} style={{ marginRight: 6 }} /> New Article
                  </button>
                  <button className="admin-button secondary" onClick={() => setTab("members")}>
                    <Users size={14} style={{ marginRight: 6 }} /> Review Members
                  </button>
                </div>
              </div>

              <div style={{ padding: "24px", background: "#101719", border: "1px solid #263438", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#e7f1f2" }}>Platform Governance</h3>
                <p style={{ fontSize: "12px", lineHeight: "1.7", color: "#8fa5a9", margin: 0 }}>
                  All dashboard metrics reflect real-time PostgreSQL database state. No dummy statistics or fabricated data are used.
                  Access is governed by server-validated role-based permissions.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "28px" }}>
              <AdminAnalyticsView />
            </div>
          </div>
        )}

        {/* SUBMISSIONS TAB */}
        {tab === "submissions" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", borderBottom: "1px solid #1a2c30", paddingBottom: "10px" }}>
              <button
                type="button"
                className={`admin-button ${subsSubTab === "portal" ? "" : "secondary"}`}
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => setSubsSubTab("portal")}
              >
                Innovation &amp; Community Submissions
              </button>
              <button
                type="button"
                className={`admin-button ${subsSubTab === "enquiries" ? "" : "secondary"}`}
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => setSubsSubTab("enquiries")}
              >
                Website Contact Enquiries ({stats?.newSubmissions || 0})
              </button>
            </div>

            {subsSubTab === "portal" ? (
              <AdminPortalSubmissionsView />
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div className="admin-actions">
                    {permissions.export && (
                      <button
                        className="admin-button secondary"
                        onClick={() => {
                          const p = new URLSearchParams();
                          if (subType) p.set("type", subType);
                          if (subStatus) p.set("status", subStatus);
                          if (subSearch) p.set("q", subSearch);
                          window.location.href = "/api/admin/export?" + p.toString();
                        }}
                      >
                        <FileSpreadsheet size={14} style={{ marginRight: 6 }} /> Export CSV
                      </button>
                    )}
                    <button className="admin-button secondary" onClick={() => loadSubmissions()}>
                      <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
                    </button>
                  </div>
                </div>

                <section className="admin-workspace">
                  <div className="admin-list">
                    <div className="admin-filters">
                      <input placeholder="Search submissions" value={subSearch} onChange={(e) => setSubSearch(e.target.value)} />
                      <select value={subType} onChange={(e) => setSubType(e.target.value)}>
                        <option value="">All types</option>
                        <option value="enquiry">Enquiries</option>
                        <option value="career">Careers</option>
                        <option value="partnership">Partnerships</option>
                      </select>
                      <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)}>
                        <option value="">All statuses</option>
                        {["new", "reviewing", "responded", "closed", "rejected"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {loading && <p className="admin-empty">Loading submissions…</p>}
                    {!loading &&
                      items.map((item) => (
                        <button
                          className={"admin-submission " + (selectedSub?.id === item.id ? "active" : "")}
                          key={item.id}
                          onClick={() => chooseSub(item)}
                        >
                          <span className="admin-submission-top">
                            <b>{item.name}</b>
                            <small>{item.type}</small>
                          </span>
                          <span>{item.subject || item.area || item.organisation || "Submission"}</span>
                          <small>
                            {new Date(item.created_at).toLocaleString()} · {item.status}
                          </small>
                        </button>
                      ))}
                    {!loading && !items.length && !error && <p className="admin-empty">No submissions match these filters.</p>}
                  </div>

                  <aside className="admin-detail">
                    {selectedSub ? (
                      <>
                        <p className="eyebrow">Submission details</p>
                        <h2>{selectedSub.name}</h2>
                        <p>
                          <a href={"mailto:" + selectedSub.email}>{selectedSub.email}</a>
                        </p>
                        {selectedSub.organisation && <p>Org: {selectedSub.organisation}</p>}
                        {selectedSub.category && <p>Category: {selectedSub.category}</p>}
                        {selectedSub.area && <p>Area: {selectedSub.area}</p>}
                        {selectedSub.link && (
                          <p>
                            <a href={selectedSub.link} target="_blank" rel="noreferrer">
                              Open link ↗
                            </a>
                          </p>
                        )}
                        <div className="admin-message">{selectedSub.message}</div>
                        {permissions.edit && (
                          <>
                            <label>
                              Status
                              <select value={subNextStatus} onChange={(e) => setSubNextStatus(e.target.value)}>
                                {["new", "reviewing", "responded", "closed", "rejected"].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Internal notes
                              <textarea
                                rows={4}
                                value={subNotes}
                                onChange={(e) => setSubNotes(e.target.value)}
                                placeholder="Administrative notes visible only to staff"
                              />
                            </label>
                            <button className="admin-button" disabled={busy} onClick={saveSubStatus}>
                              {busy ? "Saving…" : "Save changes"}
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="admin-empty">Select a submission to view details.</p>
                    )}
                  </aside>
                </section>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#8fa5a9", margin: 0 }}>
                Review registered student and developer community members.
              </p>
              <button className="admin-button secondary" onClick={() => loadMembers()}>
                <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
              </button>
            </div>

            <div style={{ background: "#101719", border: "1px solid #263438", borderRadius: "8px", overflow: "hidden" }}>
              {members.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #263438", color: "#8fa5a9", background: "rgba(0,0,0,0.2)" }}>
                        <th style={{ padding: "12px 16px" }}>Full Name</th>
                        <th style={{ padding: "12px 16px" }}>Email</th>
                        <th style={{ padding: "12px 16px" }}>Category</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Registered</th>
                        <th style={{ padding: "12px 16px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "12px 16px", color: "#f1fbfc", fontWeight: 600 }}>{m.full_name}</td>
                          <td style={{ padding: "12px 16px", color: "#c2d8dc" }}>{m.email}</td>
                          <td style={{ padding: "12px 16px", textTransform: "capitalize", color: "#63d8e5" }}>{m.category}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: m.status === "active" ? "rgba(69,200,216,0.15)" : "rgba(255,255,255,0.08)",
                                color: m.status === "active" ? "#45c8d8" : "#8fa5a9",
                                fontSize: "11px",
                                textTransform: "capitalize",
                              }}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#8fa5a9" }}>
                            {new Date(m.registered_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {permissions.edit && (
                              <button
                                className="admin-button secondary"
                                style={{ padding: "4px 10px", fontSize: "11px" }}
                                onClick={() => toggleMemberStatus(m.id, m.status)}
                              >
                                {m.status === "active" ? "Suspend" : "Approve"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-empty">No community members registered in database yet.</p>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {tab === "projects" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", borderBottom: "1px solid #1a2c30", paddingBottom: "10px" }}>
              <button
                type="button"
                className={`admin-button ${projSubTab === "kanban" ? "" : "secondary"}`}
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => setProjSubTab("kanban")}
              >
                Kanban Task Workspace
              </button>
              <button
                type="button"
                className={`admin-button ${projSubTab === "list" ? "" : "secondary"}`}
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => setProjSubTab("list")}
              >
                Projects Directory ({projects.length})
              </button>
            </div>

            {projSubTab === "kanban" ? (
              <AdminKanbanView projects={projects} />
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <p style={{ fontSize: "13px", color: "#8fa5a9", margin: 0 }}>Manage published and in-development software projects.</p>
                  {permissions.manageProjects && (
                    <button className="admin-button" onClick={() => setShowNewProject(!showNewProject)}>
                      <Plus size={14} style={{ marginRight: 6 }} /> Add Project
                    </button>
                  )}
                </div>

                {showNewProject && (
                  <form
                    onSubmit={handleCreateProject}
                    style={{
                      background: "#101719",
                      padding: "20px",
                      border: "1px solid #45c8d8",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>New Project Entry</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <label>
                        Project Title
                        <input required value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)} placeholder="Title" />
                      </label>
                      <label>
                        Category
                        <select value={newProjCategory} onChange={(e) => setNewProjCategory(e.target.value)}>
                          <option value="digital_solutions">Digital Solutions</option>
                          <option value="ai_data">AI &amp; Data</option>
                          <option value="fintech">FinTech</option>
                          <option value="social_tech">Social Tech</option>
                          <option value="cloud_infra">Cloud &amp; Infrastructure</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea
                        required
                        rows={3}
                        value={newProjDesc}
                        onChange={(e) => setNewProjDesc(e.target.value)}
                        placeholder="Short description of the project"
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <label>
                        Technologies (comma separated)
                        <input value={newProjTech} onChange={(e) => setNewProjTech(e.target.value)} placeholder="Next.js, Python, PostgreSQL" />
                      </label>
                      <label>
                        GitHub URL (optional)
                        <input type="url" value={newProjGithub} onChange={(e) => setNewProjGithub(e.target.value)} placeholder="https://github.com/..." />
                      </label>
                    </div>
                    <ImageUploader value={newProjImage} onChange={setNewProjImage} label="Project Screenshot / Banner" />
                    <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                      <button className="admin-button" disabled={busy} type="submit">
                        {busy ? "Saving…" : "Create Project"}
                      </button>
                      <button className="admin-button secondary" type="button" onClick={() => setShowNewProject(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ background: "#101719", border: "1px solid #263438", borderRadius: "8px", padding: "16px" }}>
                  {projects.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {projects.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: "14px",
                            background: "#0a1113",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "14px", color: "#f1fbfc" }}>{p.title}</strong>
                            <span style={{ fontSize: "11px", color: "#63d8e5", marginLeft: "10px", textTransform: "capitalize" }}>
                              {p.category}
                            </span>
                            <small style={{ display: "block", color: "#8fa5a9", marginTop: "4px" }}>
                              Status: {p.status} · Slug: /{p.slug}
                            </small>
                          </div>
                          {p.github_url && (
                            <a href={p.github_url} target="_blank" rel="noreferrer" className="text-link" style={{ fontSize: "11px" }}>
                              Repo ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-empty">No projects created yet. Click &quot;Add Project&quot; above to create one.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMMUNICATION TAB */}
        {tab === "communication" && (
          <div>
            <AdminCommunicationView canAnnounce={permissions.manageAnnouncements || permissions.manageStaff} />
          </div>
        )}

        {/* ARTICLES TAB */}
        {tab === "articles" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#8fa5a9", margin: 0 }}>Publish articles, tutorials, and field notes.</p>
              {permissions.manageContent && (
                <button className="admin-button" onClick={() => setShowNewArticle(!showNewArticle)}>
                  <Plus size={14} style={{ marginRight: 6 }} /> New Article
                </button>
              )}
            </div>

            {showNewArticle && (
              <form
                onSubmit={handleCreateArticle}
                style={{
                  background: "#101719",
                  padding: "20px",
                  border: "1px solid #45c8d8",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>New Article</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
                  <label>
                    Article Title
                    <input required value={newArtTitle} onChange={(e) => setNewArtTitle(e.target.value)} placeholder="Title" />
                  </label>
                  <label>
                    Category
                    <select value={newArtCategory} onChange={(e) => setNewArtCategory(e.target.value)}>
                      <option value="article">Article</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="research_publication">Research Publication</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </label>
                </div>
                <label>
                  Excerpt
                  <input value={newArtExcerpt} onChange={(e) => setNewArtExcerpt(e.target.value)} placeholder="Short summary" />
                </label>
                <label>
                  Content
                  <textarea
                    required
                    rows={6}
                    value={newArtContent}
                    onChange={(e) => setNewArtContent(e.target.value)}
                    placeholder="Article body content..."
                  />
                </label>
                <ImageUploader value={newArtCover} onChange={setNewArtCover} label="Cover Image" />
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button className="admin-button" disabled={busy} type="submit">
                    {busy ? "Publishing…" : "Publish Article"}
                  </button>
                  <button className="admin-button secondary" type="button" onClick={() => setShowNewArticle(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ background: "#101719", border: "1px solid #263438", borderRadius: "8px", padding: "16px" }}>
              {articles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {articles.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: "14px",
                        background: "#0a1113",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        {a.cover_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.cover_image}
                            alt=""
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "4px",
                              objectFit: "cover",
                              flexShrink: 0,
                              border: "1px solid rgba(72,198,212,0.2)",
                            }}
                          />
                        )}
                        <div>
                          <strong style={{ fontSize: "14px", color: "#f1fbfc", display: "block" }}>{a.title}</strong>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                            <span style={{ fontSize: "11px", color: "#63d8e5", textTransform: "capitalize" }}>
                              {a.category}
                            </span>
                            <span style={{ color: "#3a5054" }}>·</span>
                            <small style={{ color: "#8fa5a9" }}>
                              By {a.author_name}
                            </small>
                            <span style={{ color: "#3a5054" }}>·</span>
                            <span
                              style={{
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: a.status === "published" ? "rgba(69,200,216,0.12)" : "rgba(255,255,255,0.06)",
                                color: a.status === "published" ? "#45c8d8" : "#8fa5a9",
                                textTransform: "uppercase",
                              }}
                            >
                              {a.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {permissions.deleteArticle && (
                        <div style={{ flexShrink: 0 }}>
                          {deleteConfirmId === a.id ? (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(255,80,80,0.1)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,80,80,0.3)" }}>
                              <span style={{ fontSize: "11px", color: "#ff8888", fontWeight: 600 }}>Delete?</span>
                              <button
                                type="button"
                                className="admin-button"
                                style={{ background: "#d32f2f", borderColor: "#d32f2f", padding: "4px 8px", fontSize: "11px", color: "#fff" }}
                                onClick={() => handleDeleteArticle(a.id)}
                                disabled={busy}
                              >
                                {busy ? "…" : "Confirm"}
                              </button>
                              <button
                                type="button"
                                className="admin-button secondary"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={busy}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="admin-button secondary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                fontSize: "11px",
                                color: "#ff7777",
                                borderColor: "rgba(255,119,119,0.25)",
                              }}
                              onClick={() => setDeleteConfirmId(a.id)}
                              title="Delete this article permanently (Super Admin)"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty">No articles published yet.</p>
              )}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {tab === "events" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#8fa5a9", margin: 0 }}>Schedule and manage upcoming workshops and hackathons.</p>
              {permissions.edit && (
                <button className="admin-button" onClick={() => setShowNewEvent(!showNewEvent)}>
                  <Plus size={14} style={{ marginRight: 6 }} /> New Event
                </button>
              )}
            </div>

            {showNewEvent && (
              <form
                onSubmit={handleCreateEvent}
                style={{
                  background: "#101719",
                  padding: "20px",
                  border: "1px solid #45c8d8",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>New Event Schedule</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
                  <label>
                    Event Title
                    <input required value={newEvTitle} onChange={(e) => setNewEvTitle(e.target.value)} placeholder="Title" />
                  </label>
                  <label>
                    Type
                    <select value={newEvType} onChange={(e) => setNewEvType(e.target.value)}>
                      <option value="workshop">Workshop</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="training">Training</option>
                      <option value="meetup">Meetup</option>
                    </select>
                  </label>
                </div>
                <label>
                  Start Time
                  <input
                    required
                    type="datetime-local"
                    value={newEvTime}
                    onChange={(e) => setNewEvTime(e.target.value)}
                  />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                  <input
                    type="checkbox"
                    checked={newEvVirtual}
                    onChange={(e) => setNewEvVirtual(e.target.checked)}
                    style={{ width: "auto" }}
                  />
                  Virtual Event (Online)
                </label>
                <label>
                  Description
                  <textarea
                    required
                    rows={3}
                    value={newEvDesc}
                    onChange={(e) => setNewEvDesc(e.target.value)}
                    placeholder="Event overview, agenda and prerequisites..."
                  />
                </label>
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button className="admin-button" disabled={busy} type="submit">
                    {busy ? "Saving…" : "Save Event"}
                  </button>
                  <button className="admin-button secondary" type="button" onClick={() => setShowNewEvent(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ background: "#101719", border: "1px solid #263438", borderRadius: "8px", padding: "16px" }}>
              {events.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "14px",
                        background: "#0a1113",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "14px", color: "#f1fbfc" }}>{ev.title}</strong>
                        <span style={{ fontSize: "11px", color: "#63d8e5", marginLeft: "10px", textTransform: "capitalize" }}>
                          {ev.event_type}
                        </span>
                        <small style={{ display: "block", color: "#8fa5a9", marginTop: "4px" }}>
                          Starts: {new Date(ev.start_time).toLocaleString()} · Status: {ev.status}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty">No events scheduled yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {tab === "team" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#8fa5a9", margin: 0 }}>Add and manage public team profiles.</p>
              {permissions.manageStaff && (
                <button className="admin-button" onClick={() => setShowNewTeam(!showNewTeam)}>
                  <Plus size={14} style={{ marginRight: 6 }} /> Add Team Member
                </button>
              )}
            </div>

            {showNewTeam && (
              <form
                onSubmit={handleCreateTeam}
                style={{
                  background: "#101719",
                  padding: "20px",
                  border: "1px solid #45c8d8",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>New Team Profile</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Full Name
                    <input required value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Full name" />
                  </label>
                  <label>
                    Role Title
                    <input required value={newTeamRole} onChange={(e) => setNewTeamRole(e.target.value)} placeholder="e.g. Lead Engineer" />
                  </label>
                </div>
                <label>
                  Department
                  <input value={newTeamDept} onChange={(e) => setNewTeamDept(e.target.value)} placeholder="Engineering / AI / Product" />
                </label>
                <ImageUploader value={newTeamAvatar} onChange={setNewTeamAvatar} label="Profile Photo / Avatar" />
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <button className="admin-button" disabled={busy} type="submit">
                    {busy ? "Saving…" : "Add Member"}
                  </button>
                  <button className="admin-button secondary" type="button" onClick={() => setShowNewTeam(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ background: "#101719", border: "1px solid #263438", borderRadius: "8px", padding: "16px" }}>
              {team.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {team.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "14px",
                        background: "#0a1113",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "14px", color: "#f1fbfc" }}>{t.full_name}</strong>
                        <span style={{ fontSize: "12px", color: "#63d8e5", marginLeft: "10px" }}>{t.role_title}</span>
                        {t.department && (
                          <small style={{ display: "block", color: "#8fa5a9", marginTop: "4px" }}>
                            Department: {t.department}
                          </small>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: t.is_active ? "#45c8d8" : "#8fa5a9" }}>
                        {t.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty">No team profiles added yet.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
