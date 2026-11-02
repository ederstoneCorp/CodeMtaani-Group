import { query } from "./db";

export type ResearchInitiative = {
  id: string; title: string; slug: string; area: string | null;
  stage: string; objective: string; findings_summary: string | null;
  publication_url: string | null; status: string;
  created_at: string; updated_at: string;
};

export async function getPublishedResearch() {
  const r = await query<ResearchInitiative>("SELECT * FROM research_initiatives WHERE status = 'published' ORDER BY created_at DESC");
  return r.rows;
}

export async function getAllResearch() {
  const r = await query<ResearchInitiative>("SELECT * FROM research_initiatives ORDER BY created_at DESC");
  return r.rows;
}

export async function getResearchBySlug(slug: string) {
  const r = await query<ResearchInitiative>("SELECT * FROM research_initiatives WHERE slug = $1 LIMIT 1", [slug]);
  return r.rows[0] || null;
}

export async function createResearch(data: Omit<ResearchInitiative, "id" | "created_at" | "updated_at">) {
  const r = await query<ResearchInitiative>(
    `INSERT INTO research_initiatives (title, slug, area, stage, objective, findings_summary, publication_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.title, data.slug, data.area, data.stage, data.objective, data.findings_summary, data.publication_url, data.status]
  );
  return r.rows[0];
}

export async function updateResearch(id: string, data: Partial<Omit<ResearchInitiative, "id" | "created_at">>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || key === "created_at") continue;
    fields.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);
  const r = await query<ResearchInitiative>(`UPDATE research_initiatives SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return r.rows[0] || null;
}
