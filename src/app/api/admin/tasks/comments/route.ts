import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { addTaskComment, getTaskComments } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams;
    const taskId = q.get("taskId");
    if (!taskId || !/^[0-9a-f-]{36}$/i.test(taskId)) {
      return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
    }

    const comments = await getTaskComments(taskId);
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Task comments GET failed:", error);
    return NextResponse.json({ error: "Unable to load comments." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const body = await request.json();
    const taskId = String(body.taskId || "");
    const comment = String(body.comment || "").trim();

    if (!taskId || !/^[0-9a-f-]{36}$/i.test(taskId) || !comment) {
      return NextResponse.json({ error: "Task ID and comment are required." }, { status: 400 });
    }

    const created = await addTaskComment(taskId, session.id, comment);
    return NextResponse.json({ comment: created }, { status: 201 });
  } catch (error) {
    console.error("Task comment POST failed:", error);
    return NextResponse.json({ error: "Unable to post comment." }, { status: 500 });
  }
}
