"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Calendar, MessageSquare, Plus, Trash2, User } from "lucide-react";
import type { ProjectTask, TaskComment } from "@/lib/tasks";

type StaffOption = { id: string; full_name: string; staff_number: string | null; department: string | null };
type ProjectOption = { id: string; title: string };

const STAGES = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Under Review" },
  { key: "completed", label: "Completed" },
] as const;

export function AdminKanbanView({ projects }: { projects: ProjectOption[] }) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // New task modal
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskProjId, setTaskProjId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskStage, setTaskStage] = useState<ProjectTask["stage"]>("todo");

  // Task details / comments modal
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [busy, setBusy] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const url = selectedProject === "all" ? "/api/admin/tasks" : `/api/admin/tasks?projectId=${selectedProject}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setTasks(d.tasks || []);
      }
    } catch {}
  }, [selectedProject]);

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
    Promise.all([loadTasks(), loadStaff()]).finally(() => setLoading(false));
  }, [loadTasks, loadStaff]);

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: taskProjId || (projects[0]?.id || ""),
          title: taskTitle,
          description: taskDesc,
          assignee_id: taskAssignee || null,
          priority: taskPriority,
          deadline: taskDeadline || null,
          stage: taskStage,
        }),
      });
      if (res.ok) {
        setShowNewTask(false);
        setTaskTitle("");
        setTaskDesc("");
        setTaskDeadline("");
        await loadTasks();
      }
    } catch {}
    setBusy(false);
  }

  async function moveStage(task: ProjectTask, newStage: ProjectTask["stage"]) {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, stage: newStage } : t))
      );
      await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, stage: newStage }),
      });
      await loadTasks();
    } catch {}
  }

  async function openTaskDetails(task: ProjectTask) {
    setActiveTask(task);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/admin/tasks/comments?taskId=${task.id}`);
      if (res.ok) {
        const d = await res.json();
        setComments(d.comments || []);
      }
    } catch {}
    setLoadingComments(false);
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!activeTask || !newComment.trim()) return;
    try {
      const res = await fetch("/api/admin/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: activeTask.id, comment: newComment }),
      });
      if (res.ok) {
        const d = await res.json();
        setComments((prev) => [...prev, d.comment]);
        setNewComment("");
      }
    } catch {}
  }

  async function handleDeleteTask(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetch(`/api/admin/tasks?id=${id}`, { method: "DELETE" });
      setActiveTask(null);
      await loadTasks();
    } catch {}
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "critical":
        return "#e00000";
      case "high":
        return "#ff8800";
      case "medium":
        return "#45c8d8";
      default:
        return "#8aa2a6";
    }
  }

  return (
    <div>
      {/* TOOLBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ width: "240px" }}
          >
            <option value="all">All Projects ({tasks.length} tasks)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <button className="admin-button" onClick={() => setShowNewTask(true)}>
          <Plus size={14} style={{ marginRight: 6 }} /> Create Task
        </button>
      </div>

      {/* CREATE TASK MODAL */}
      {showNewTask && (
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
          }}
        >
          <div
            style={{
              background: "#0a1417",
              border: "1px solid #45c8d8",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "540px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", margin: 0, color: "#f1fbfc" }}>Create Project Task</h3>
              <button
                type="button"
                onClick={() => setShowNewTask(false)}
                style={{ background: "transparent", border: "none", color: "#8fa5a9", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <label>
                Project
                <select value={taskProjId} onChange={(e) => setTaskProjId(e.target.value)} required>
                  <option value="" disabled>Select target project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </label>

              <label>
                Task Title
                <input required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Implement Webhook verification" />
              </label>

              <label>
                Description &amp; Acceptance Criteria
                <textarea rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Task details..." />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  Assignee
                  <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.staff_number || "CMG"})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high" | "critical")}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  Initial Stage
                  <select value={taskStage} onChange={(e) => setTaskStage(e.target.value as ProjectTask["stage"])}>
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Deadline
                  <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                <button className="admin-button" disabled={busy} type="submit">
                  {busy ? "Saving…" : "Add Task"}
                </button>
                <button className="admin-button secondary" type="button" onClick={() => setShowNewTask(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS / COMMENTS MODAL */}
      {activeTask && (
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
          }}
        >
          <div
            style={{
              background: "#0a1417",
              border: "1px solid #45c8d8",
              borderRadius: "12px",
              padding: "26px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#63d8e5", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {activeTask.project_title}
                </span>
                <h3 style={{ fontSize: "18px", margin: "4px 0", color: "#f1fbfc" }}>{activeTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                style={{ background: "transparent", border: "none", color: "#8fa5a9", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", color: getPriorityColor(activeTask.priority), border: "1px solid currentColor" }}>
                {activeTask.priority}
              </span>
              <span style={{ fontSize: "11px", color: "#8fa5a9" }}>
                Assignee: <strong style={{ color: "#f1fbfc" }}>{activeTask.assignee_name || "Unassigned"}</strong> {activeTask.assignee_staff_number && `(${activeTask.assignee_staff_number})`}
              </span>
              {activeTask.deadline && (
                <span style={{ fontSize: "11px", color: "#8fa5a9" }}>
                  Due: {new Date(activeTask.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            {activeTask.description && (
              <p style={{ fontSize: "13px", color: "#c2d8dc", lineHeight: "1.7", margin: "0 0 20px" }}>
                {activeTask.description}
              </p>
            )}

            {/* STAGE SELECTOR */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "#8fa5a9" }}>Move Stage:</span>
              <select
                value={activeTask.stage}
                onChange={(e) => {
                  const newSt = e.target.value as ProjectTask["stage"];
                  moveStage(activeTask, newSt);
                  setActiveTask({ ...activeTask, stage: newSt });
                }}
                style={{ width: "160px", padding: "6px 12px" }}
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="admin-button secondary"
                onClick={() => handleDeleteTask(activeTask.id)}
                style={{ marginLeft: "auto", color: "#ff7777", borderColor: "#552020", padding: "6px 12px", fontSize: "11px" }}
              >
                <Trash2 size={13} style={{ marginRight: 4 }} /> Delete
              </button>
            </div>

            {/* COMMENTS SECTION */}
            <div style={{ borderTop: "1px solid #1c2b2f", paddingTop: "14px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: "13px", color: "#f1fbfc", margin: "0 0 10px" }}>
                Discussion &amp; Updates ({comments.length})
              </h4>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                {loadingComments ? (
                  <span style={{ fontSize: "12px", color: "#779095" }}>Loading comments…</span>
                ) : comments.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#779095" }}>No comments yet.</span>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{ background: "#061316", padding: "10px 12px", borderRadius: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                        <strong style={{ color: "#45c8d8" }}>
                          {c.user_name} {c.user_staff_number && `(${c.user_staff_number})`}
                        </strong>
                        <small style={{ color: "#5d787d" }}>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#d2e3e6" }}>{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px" }}>
                <input
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post progress update or blocker..."
                  style={{ flex: 1 }}
                />
                <button className="admin-button" type="submit" style={{ padding: "8px 14px" }}>
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* KANBAN BOARD */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#8fa5a9" }}>Loading board…</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(220px, 1fr))",
            gap: "14px",
            alignItems: "start",
            overflowX: "auto",
            paddingBottom: "16px",
          }}
        >
          {STAGES.map((col) => {
            const colTasks = tasks.filter((t) => t.stage === col.key);
            return (
              <div
                key={col.key}
                style={{
                  background: "#081518",
                  border: "1px solid #1a2c30",
                  borderRadius: "10px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "480px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #17262a" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1fbfc" }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      background: "rgba(69,200,216,0.15)",
                      color: "#45c8d8",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "999px",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {colTasks.map((t) => {
                    const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.stage !== "completed";
                    return (
                      <div
                        key={t.id}
                        onClick={() => openTaskDetails(t)}
                        style={{
                          background: "#0c1f24",
                          border: `1px solid ${isOverdue ? "rgba(255,100,100,0.3)" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: "8px",
                          padding: "12px",
                          cursor: "pointer",
                          transition: "border-color 0.15s ease, transform 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "10px", color: "#63d8e5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {t.project_title}
                          </span>
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 5px",
                              borderRadius: "4px",
                              background: "rgba(0,0,0,0.3)",
                              color: getPriorityColor(t.priority),
                            }}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <strong style={{ fontSize: "13px", color: "#f1fbfc", display: "block", marginBottom: "6px" }}>
                          {t.title}
                        </strong>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "11px", color: "#8fa5a9" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <User size={12} /> {t.assignee_name || "Unassigned"}
                          </span>
                          {t.comment_count ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <MessageSquare size={11} /> {t.comment_count}
                            </span>
                          ) : null}
                        </div>

                        {t.deadline && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", fontSize: "10px", color: isOverdue ? "#ff8888" : "#718e93" }}>
                            <Calendar size={11} /> {new Date(t.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#50696e", fontSize: "11px" }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
