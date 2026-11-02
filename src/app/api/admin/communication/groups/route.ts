import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createChatGroup, getGroupMessages, getUserChatGroups, sendGroupMessage } from "@/lib/communication";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams;
    const groupId = q.get("groupId");

    if (groupId) {
      if (!/^[0-9a-f-]{36}$/i.test(groupId)) {
        return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });
      }
      const messages = await getGroupMessages(groupId);
      return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store, private" } });
    }

    const groups = await getUserChatGroups(session.id, session.department);
    return NextResponse.json({ groups }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Groups GET failed:", error);
    return NextResponse.json({ error: "Unable to load channels." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const body = await request.json();

    // If message is being sent to a group
    if (body.groupId) {
      const groupId = String(body.groupId);
      const content = String(body.content || "").trim();
      if (!/^[0-9a-f-]{36}$/i.test(groupId) || !content) {
        return NextResponse.json({ error: "Group ID and content required." }, { status: 400 });
      }
      const message = await sendGroupMessage(groupId, session.id, content, body.attachmentUrl || null);
      return NextResponse.json({ message }, { status: 201 });
    }

    // Creating a new group
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Channel name is required." }, { status: 400 });
    }

    const group = await createChatGroup(
      name,
      body.description || null,
      body.department || null,
      Boolean(body.isDepartmentOnly),
      session.id
    );

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Group operation failed:", error);
    return NextResponse.json({ error: "Unable to complete request." }, { status: 500 });
  }
}
