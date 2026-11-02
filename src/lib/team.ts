import { query } from "./db";

export type TeamMember = {
  id: string; full_name: string; role_title: string; department: string | null;
  bio: string | null; avatar_url: string | null; skills: string[];
  social_links: Record<string, string>; display_order: number;
  is_active: boolean; created_at: string; updated_at: string;
};

export async function getActiveTeamMembers() {
  const r = await query<TeamMember>("SELECT * FROM team_members WHERE is_active = TRUE ORDER BY display_order ASC, full_name ASC");
  return r.rows;
}

export async function getAllTeamMembers() {
  const r = await query<TeamMember>("SELECT * FROM team_members ORDER BY display_order ASC, created_at DESC");
  return r.rows;
}

export async function createTeamMember(data: Omit<TeamMember, "id" | "created_at" | "updated_at">) {
  const r = await query<TeamMember>(
    `INSERT INTO team_members (full_name, role_title, department, bio, avatar_url, skills, social_links, display_order, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.full_name, data.role_title, data.department, data.bio, data.avatar_url, data.skills, JSON.stringify(data.social_links), data.display_order, data.is_active]
  );
  return r.rows[0];
}

export async function updateTeamMember(id: string, data: Partial<Omit<TeamMember, "id" | "created_at">>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || key === "created_at") continue;
    fields.push(`${key} = $${i}`);
    values.push(key === "social_links" ? JSON.stringify(value) : value);
    i++;
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);
  const r = await query<TeamMember>(`UPDATE team_members SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return r.rows[0] || null;
}

export async function deleteTeamMember(id: string) {
  const r = await query("DELETE FROM team_members WHERE id = $1 RETURNING id", [id]);
  return r.rowCount ? true : false;
}
