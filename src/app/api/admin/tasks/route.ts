import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageTasks, audit } from "@/lib/admin-roles";
import { createTask, deleteTask, getProjectTasks, updateTask } from "@/lib/tasks";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams;
    const projectId = q.get("projectId") || undefined;
    const tasks = await getProjectTasks(projectId);

    return NextResponse.json({ tasks }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Tasks GET failed:", error);
    return NextResponse.json({ error: "Unable to load tasks." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageTasks(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const projectId = String(body.project_id || "");
    const title = String(body.title || "").trim();

    if (!projectId || !/^[0-9a-f-]{36}$/i.test(projectId) || !title) {
      return NextResponse.json({ error: "Valid project ID and title are required." }, { status: 400 });
    }

    const task = await createTask({
      project_id: projectId,
      title,
      description: body.description || null,
      assignee_id: body.assignee_id || null,
      stage: body.stage || "todo",
      priority: body.priority || "medium",
      deadline: body.deadline || null,
      attachment_url: body.attachment_url || null,
      created_by: session.id,
    });

    await audit(session, "task_created", "project_task", task.id, { title: task.title, project_id: projectId });

    // Notify assignee if assigned
    if (task.assignee_id && task.assignee_id !== session.id) {
      await createNotification({
        recipientId: task.assignee_id,
        title: `Task Assigned: ${task.title}`,
        message: `${session.fullName} assigned a new task to you with priority "${task.priority}".`,
        category: "task",
        link: `/admin?tab=projects&taskId=${task.id}`,
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Task create failed:", error);
    return NextResponse.json({ error: "Unable to create task." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageTasks(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
    }

    const updated = await updateTask(id, body);
    if (!updated) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    await audit(session, "task_updated", "project_task", id, { stage: updated.stage, priority: updated.priority });

    // If completed, notify project creator/managers
    if (body.stage === "completed") {
      await createNotification({
        title: `Task Completed: ${updated.title}`,
        message: `${session.fullName} completed task "${updated.title}".`,
        category: "task",
        link: `/admin?tab=projects&projectId=${updated.project_id}`,
      });
    }

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Task update failed:", error);
    return NextResponse.json({ error: "Unable to update task." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageTasks(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const id = q.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
    }

    const success = await deleteTask(id);
    if (!success) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    await audit(session, "task_deleted", "project_task", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Task delete failed:", error);
    return NextResponse.json({ error: "Unable to delete task." }, { status: 500 });
  }
}
