import { query } from "./db";

export type Member = {
  id: string; email: string; full_name: string; category: string;
  institution_or_org: string | null; skills: string[]; interests: string[];
  bio: string | null; github_handle: string | null; linkedin_url: string | null;
  status: string; registered_at: string; updated_at: string;
};

export async function getActiveMembers() {
  const r = await query<Member>("SELECT * FROM members WHERE status = 'active' ORDER BY registered_at DESC");
  return r.rows;
}

export async function getAllMembers(status?: string) {
  if (status) {
    const r = await query<Member>("SELECT * FROM members WHERE status = $1 ORDER BY registered_at DESC", [status]);
    return r.rows;
  }
  const r = await query<Member>("SELECT * FROM members ORDER BY registered_at DESC");
  return r.rows;
}

export async function registerMember(data: Omit<Member, "id" | "registered_at" | "updated_at" | "status">) {
  const r = await query<Member>(
    `INSERT INTO members (email, full_name, category, institution_or_org, skills, interests, bio, github_handle, linkedin_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.email, data.full_name, data.category, data.institution_or_org, data.skills, data.interests, data.bio, data.github_handle, data.linkedin_url]
  );
  return r.rows[0];
}

export async function updateMemberStatus(id: string, status: string) {
  const r = await query<Member>("UPDATE members SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *", [id, status]);
  return r.rows[0] || null;
}

export async function getMemberCounts() {
  const r = await query<{ status: string; count: number }>("SELECT status, COUNT(*)::int AS count FROM members GROUP BY status");
  return r.rows;
}
