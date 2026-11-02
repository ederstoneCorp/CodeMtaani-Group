import { query } from "./db";

export type Project = {
  id: string; title: string; slug: string; description: string;
  problem_statement: string | null; solution_overview: string | null;
  category: string | null; technologies: string[]; status: string;
  github_url: string | null; demo_url: string | null; image_url: string | null;
  featured: boolean; contributors: string[];
  published_at: string | null; created_at: string; updated_at: string;
};

export async function getPublishedProjects(category?: string) {
  const base = "SELECT * FROM projects WHERE status != 'archived'";
  if (category) {
    const r = await query<Project>(base + " AND category = $1 ORDER BY featured DESC, created_at DESC", [category]);
    return r.rows;
  }
  const r = await query<Project>(base + " ORDER BY featured DESC, created_at DESC");
  return r.rows;
}

export async function getProjectBySlug(slug: string) {
  const r = await query<Project>("SELECT * FROM projects WHERE slug = $1 LIMIT 1", [slug]);
  return r.rows[0] || null;
}

export async function getAllProjects() {
  const r = await query<Project>("SELECT * FROM projects ORDER BY created_at DESC");
  return r.rows;
}

export async function createProject(data: Omit<Project, "id" | "created_at" | "updated_at">) {
  const r = await query<Project>(
    `INSERT INTO projects (title, slug, description, problem_statement, solution_overview, category, technologies, status, github_url, demo_url, image_url, featured, contributors, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [data.title, data.slug, data.description, data.problem_statement, data.solution_overview, data.category, data.technologies, data.status, data.github_url, data.demo_url, data.image_url, data.featured, data.contributors, data.published_at]
  );
  return r.rows[0];
}

export async function updateProject(id: string, data: Partial<Omit<Project, "id" | "created_at">>) {
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
  const r = await query<Project>(`UPDATE projects SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return r.rows[0] || null;
}

export async function deleteProject(id: string) {
  const r = await query("DELETE FROM projects WHERE id = $1 RETURNING id", [id]);
  return r.rowCount ? true : false;
}
