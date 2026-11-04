import { query } from "./db";

export type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
  sender_staff_number?: string | null;
};

export type ConversationContact = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  staff_number: string | null;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
};

export type ChatGroup = {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  is_department_only: boolean;
  created_by: string | null;
  created_at: string;
  member_count?: number;
};

export type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
  sender_name: string;
  sender_staff_number: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  target_department: string | null;
  target_role?: string | null;
  attachment_url: string | null;
  image_url?: string | null;
  created_by: string | null;
  published_at: string;
  created_at: string;
  author_name?: string;
  author_staff_number?: string | null;
  is_read?: boolean;
};

// -------------------------------------------------------------
// Direct Messaging
// -------------------------------------------------------------
export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  content: string,
  attachmentUrl?: string | null
): Promise<DirectMessage> {
  const r = await query<DirectMessage>(
    `INSERT INTO direct_messages (sender_id, recipient_id, content, attachment_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [senderId, recipientId, content.trim(), attachmentUrl || null]
  );
  return r.rows[0];
}

export async function getDirectMessages(
  userId1: string,
  userId2: string,
  limit = 50
): Promise<DirectMessage[]> {
  const r = await query<DirectMessage>(
    `SELECT dm.*, u.full_name AS sender_name, u.staff_number AS sender_staff_number
     FROM direct_messages dm
     JOIN admin_users u ON u.id = dm.sender_id
     WHERE (dm.sender_id = $1 AND dm.recipient_id = $2)
        OR (dm.sender_id = $2 AND dm.recipient_id = $1)
     ORDER BY dm.created_at ASC
     LIMIT $3`,
    [userId1, userId2, limit]
  );

  // Mark messages from other user as read
  await query(
    `UPDATE direct_messages
     SET is_read = TRUE, read_at = NOW()
     WHERE sender_id = $1 AND recipient_id = $2 AND is_read = FALSE`,
    [userId2, userId1]
  ).catch(() => {});

  return r.rows;
}

export async function getConversationContacts(userId: string): Promise<ConversationContact[]> {
  const r = await query<ConversationContact>(
    `SELECT u.id, u.full_name, u.email, u.role, u.department, u.staff_number,
            COUNT(dm.id) FILTER (WHERE dm.recipient_id = $1 AND dm.is_read = FALSE)::int AS unread_count,
            (SELECT content FROM direct_messages
             WHERE (sender_id = u.id AND recipient_id = $1) OR (sender_id = $1 AND recipient_id = u.id)
             ORDER BY created_at DESC LIMIT 1) AS last_message,
            (SELECT created_at FROM direct_messages
             WHERE (sender_id = u.id AND recipient_id = $1) OR (sender_id = $1 AND recipient_id = u.id)
             ORDER BY created_at DESC LIMIT 1) AS last_message_at
     FROM admin_users u
     LEFT JOIN direct_messages dm ON (dm.sender_id = u.id AND dm.recipient_id = $1)
     WHERE u.id != $1 AND u.active = TRUE
     GROUP BY u.id, u.full_name, u.email, u.role, u.department, u.staff_number
     ORDER BY last_message_at DESC NULLS LAST, u.full_name ASC`,
    [userId]
  );
  return r.rows;
}

// -------------------------------------------------------------
// Group Conversations
// -------------------------------------------------------------
export async function createChatGroup(
  name: string,
  description: string | null,
  department: string | null,
  isDeptOnly: boolean,
  creatorId: string
): Promise<ChatGroup> {
  const r = await query<ChatGroup>(
    `INSERT INTO chat_groups (name, description, department, is_department_only, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, department, isDeptOnly, creatorId]
  );
  const group = r.rows[0];

  // Add creator as member
  await query(
    "INSERT INTO chat_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [group.id, creatorId]
  ).catch(() => {});

  return group;
}

export async function getUserChatGroups(userId: string, department?: string | null): Promise<ChatGroup[]> {
  const r = await query<ChatGroup>(
    `SELECT g.*, COUNT(m.user_id)::int AS member_count
     FROM chat_groups g
     LEFT JOIN chat_group_members m ON m.group_id = g.id
     WHERE g.is_department_only = FALSE
        OR g.department = $2
        OR EXISTS (SELECT 1 FROM chat_group_members cgm WHERE cgm.group_id = g.id AND cgm.user_id = $1)
     GROUP BY g.id
     ORDER BY g.updated_at DESC`,
    [userId, department || ""]
  );
  return r.rows;
}

export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  content: string,
  attachmentUrl?: string | null
): Promise<GroupMessage> {
  const r = await query<GroupMessage>(
    `INSERT INTO group_messages (group_id, sender_id, content, attachment_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [groupId, senderId, content.trim(), attachmentUrl || null]
  );
  await query("UPDATE chat_groups SET updated_at = NOW() WHERE id = $1", [groupId]).catch(() => {});
  return r.rows[0];
}

export async function getGroupMessages(groupId: string, limit = 50): Promise<GroupMessage[]> {
  const r = await query<GroupMessage>(
    `SELECT gm.*, u.full_name AS sender_name, u.staff_number AS sender_staff_number
     FROM group_messages gm
     JOIN admin_users u ON u.id = gm.sender_id
     WHERE gm.group_id = $1
     ORDER BY gm.created_at ASC
     LIMIT $2`,
    [groupId, limit]
  );
  return r.rows;
}

// -------------------------------------------------------------
// Internal Announcements
// -------------------------------------------------------------
export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority?: Announcement["priority"];
  target_department?: string | null;
  target_role?: string | null;
  attachment_url?: string | null;
  image_url?: string | null;
  created_by?: string | null;
}): Promise<Announcement> {
  const r = await query<Announcement>(
    `INSERT INTO internal_announcements (title, content, priority, target_department, target_role, attachment_url, image_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.title,
      data.content,
      data.priority || "normal",
      data.target_department || null,
      data.target_role || null,
      data.attachment_url || null,
      data.image_url || null,
      data.created_by || null,
    ]
  );
  return r.rows[0];
}

export async function getAnnouncements(userId: string | null, department?: string | null, role?: string | null): Promise<Announcement[]> {
  const r = await query<Announcement>(
    `SELECT a.*, u.full_name AS author_name, u.staff_number AS author_staff_number,
            EXISTS (SELECT 1 FROM announcement_reads r WHERE r.announcement_id = a.id AND $1::uuid IS NOT NULL AND r.user_id = $1::uuid) AS is_read
     FROM internal_announcements a
     LEFT JOIN admin_users u ON u.id = a.created_by
     WHERE (a.target_department IS NULL OR a.target_department = '' OR a.target_department = $2)
       AND (a.target_role IS NULL OR a.target_role = '' OR a.target_role = $3)
     ORDER BY a.published_at DESC
     LIMIT 50`,
    [userId, department || "", role || ""]
  );
  return r.rows;
}

export async function markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean> {
  const r = await query(
    `INSERT INTO announcement_reads (announcement_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (announcement_id, user_id) DO NOTHING`,
    [announcementId, userId]
  );
  return (r.rowCount ?? 0) > 0;
}
