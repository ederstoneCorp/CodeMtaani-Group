import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { getConversationContacts, getDirectMessages, sendDirectMessage } from "@/lib/communication";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams;
    const peerId = q.get("peerId");

    if (peerId) {
      if (!/^[0-9a-f-]{36}$/i.test(peerId)) {
        return NextResponse.json({ error: "Invalid peer ID." }, { status: 400 });
      }
      const messages = await getDirectMessages(session.id, peerId);
      return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store, private" } });
    }

    const contacts = await getConversationContacts(session.id);
    return NextResponse.json({ contacts }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Direct messages GET failed:", error);
    return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const body = await request.json();
    const recipientId = String(body.recipientId || "");
    const content = String(body.content || "").trim();
    const attachmentUrl = body.attachmentUrl ? String(body.attachmentUrl) : null;

    if (!recipientId || !/^[0-9a-f-]{36}$/i.test(recipientId) || !content) {
      return NextResponse.json({ error: "Recipient and message content are required." }, { status: 400 });
    }
    if (recipientId === session.id) {
      return NextResponse.json({ error: "You cannot send a direct message to your own account." }, { status: 400 });
    }
    if (content.length > 10000) {
      return NextResponse.json({ error: "Message is too long. Maximum length is 10,000 characters." }, { status: 400 });
    }

    const recipient = await query<{ id: string }>(
      "SELECT id FROM admin_users WHERE id = $1 AND active = TRUE LIMIT 1",
      [recipientId]
    );
    if (!recipient.rows.length) {
      return NextResponse.json({ error: "This staff account is unavailable or inactive." }, { status: 404 });
    }

    const message = await sendDirectMessage(session.id, recipientId, content, attachmentUrl);

    // Notify recipient
    await createNotification({
      recipientId,
      title: `New message from ${session.fullName}`,
      message: content.length > 80 ? content.slice(0, 77) + "…" : content,
      category: "system",
      link: `/admin?tab=communication&peerId=${session.id}`,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Direct message send failed:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
