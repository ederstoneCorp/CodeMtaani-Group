import { query } from "./db";

export type AdminNotification = {
  id: string;
  recipient_id: string | null;
  title: string;
  message: string;
  category: "application" | "project" | "task" | "enquiry" | "announcement" | "deadline" | "security" | "system";
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export async function createNotification(input: {
  recipientId?: string | null;
  title: string;
  message: string;
  category?: AdminNotification["category"];
  link?: string;
}): Promise<AdminNotification | null> {
  try {
    const r = await query<AdminNotification>(
      `INSERT INTO admin_notifications (recipient_id, title, message, category, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.recipientId || null,
        input.title,
        input.message,
        input.category || "system",
        input.link || null,
      ]
    );
    return r.rows[0];
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function getNotifications(userId: string | null, limit = 25): Promise<AdminNotification[]> {
  try {
    const r = await query<AdminNotification>(
      `SELECT * FROM admin_notifications
       WHERE recipient_id = $1 OR recipient_id IS NULL
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return r.rows;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationRead(id: string, userId: string | null): Promise<boolean> {
  try {
    const r = await query(
      `UPDATE admin_notifications
       SET is_read = TRUE
       WHERE id = $1 AND (recipient_id = $2 OR recipient_id IS NULL)`,
      [id, userId]
    );
    return (r.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead(userId: string | null): Promise<boolean> {
  try {
    await query(
      `UPDATE admin_notifications
       SET is_read = TRUE
       WHERE (recipient_id = $1 OR recipient_id IS NULL) AND is_read = FALSE`,
      [userId]
    );
    return true;
  } catch {
    return false;
  }
}
