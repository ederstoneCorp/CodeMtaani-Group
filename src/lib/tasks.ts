import { query } from "./db";

export type ProjectTask = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  stage: "backlog" | "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  deadline: string | null;
  attachment_url: string | null;
  completion_percentage: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string | null;
  assignee_staff_number?: string | null;
  project_title?: string;
  comment_count?: number;
};

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name: string;
  user_staff_number: string | null;
};

export async function recalculateProjectProgress(projectId: string): Promise<number> {
  const r = await query<{ total: number; completed: number }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE stage = 'completed')::int AS completed
     FROM project_tasks
     WHERE project_id = $1`,
    [projectId]
  );
  const total = r.rows[0]?.total || 0;
  const completed = r.rows[0]?.completed || 0;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  await query(
    `UPDATE projects
     SET completion_percentage = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [projectId, pct]
  );

  return pct;
}

export async function getProjectTasks(projectId?: string): Promise<ProjectTask[]> {
  const sql = `
    SELECT t.*,
           u.full_name AS assignee_name,
           u.staff_number AS assignee_staff_number,
           p.title AS project_title,
           COUNT(c.id)::int AS comment_count
    FROM project_tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN admin_users u ON u.id = t.assignee_id
    LEFT JOIN task_comments c ON c.task_id = t.id
    ${projectId ? "WHERE t.project_id = $1" : ""}
    GROUP BY t.id, u.full_name, u.staff_number, p.title
    ORDER BY t.created_at DESC
  `;
  const params = projectId ? [projectId] : [];
  const r = await query<ProjectTask>(sql, params);
  return r.rows;
}

export async function createTask(data: {
  project_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  stage?: ProjectTask["stage"];
  priority?: ProjectTask["priority"];
  deadline?: string | null;
  attachment_url?: string | null;
  created_by?: string | null;
}): Promise<ProjectTask> {
  const r = await query<ProjectTask>(
    `INSERT INTO project_tasks (project_id, title, description, assignee_id, stage, priority, deadline, attachment_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.project_id,
      data.title.trim(),
      data.description || null,
      data.assignee_id || null,
      data.stage || "todo",
      data.priority || "medium",
      data.deadline || null,
      data.attachment_url || null,
      data.created_by || null,
    ]
  );
  const task = r.rows[0];
  await recalculateProjectProgress(data.project_id);
  return task;
}

export async function updateTask(id: string, updates: Partial<ProjectTask>): Promise<ProjectTask | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(updates)) {
    if (["id", "project_id", "created_at"].includes(key)) continue;
    setClauses.push(`${key} = $${idx}`);
    values.push(val);
    idx++;
  }

  if (updates.stage === "completed" && !updates.completed_at) {
    setClauses.push(`completed_at = NOW()`);
  } else if (updates.stage && updates.stage !== "completed") {
    setClauses.push(`completed_at = NULL`);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const r = await query<ProjectTask>(
    `UPDATE project_tasks SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );

  const task = r.rows[0] || null;
  if (task) {
    await recalculateProjectProgress(task.project_id);
  }
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  // Find project id first
  const existing = await query<{ project_id: string }>("SELECT project_id FROM project_tasks WHERE id = $1", [id]);
  const projectId = existing.rows[0]?.project_id;

  const r = await query("DELETE FROM project_tasks WHERE id = $1 RETURNING id", [id]);
  const deleted = (r.rowCount ?? 0) > 0;

  if (deleted && projectId) {
    await recalculateProjectProgress(projectId);
  }
  return deleted;
}

export async function addTaskComment(taskId: string, userId: string, comment: string): Promise<TaskComment> {
  const r = await query<TaskComment>(
    `INSERT INTO task_comments (task_id, user_id, comment)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [taskId, userId, comment.trim()]
  );
  return r.rows[0];
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const r = await query<TaskComment>(
    `SELECT c.*, u.full_name AS user_name, u.staff_number AS user_staff_number
     FROM task_comments c
     JOIN admin_users u ON u.id = c.user_id
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
    [taskId]
  );
  return r.rows;
}
