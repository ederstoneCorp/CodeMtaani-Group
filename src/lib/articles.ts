import { query } from "./db";

export type Article = {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; category: string; tags: string[];
  status: string; cover_image: string | null;
  author_name: string | null; author_id: string | null;
  published_at: string | null; created_at: string; updated_at: string;
};

export async function getPublishedArticles(category?: string, limit = 50) {
  const base = "SELECT * FROM articles WHERE status = 'published'";
  if (category) {
    const r = await query<Article>(base + " AND category = $1 ORDER BY published_at DESC LIMIT $2", [category, limit]);
    return r.rows;
  }
  const r = await query<Article>(base + " ORDER BY published_at DESC LIMIT $1", [limit]);
  return r.rows;
}

export async function getArticleBySlug(slug: string) {
  const r = await query<Article>("SELECT * FROM articles WHERE slug = $1 LIMIT 1", [slug]);
  return r.rows[0] || null;
}

export async function getAllArticles() {
  const r = await query<Article>("SELECT * FROM articles ORDER BY created_at DESC");
  return r.rows;
}

export async function createArticle(data: Omit<Article, "id" | "created_at" | "updated_at">) {
  const r = await query<Article>(
    `INSERT INTO articles (title, slug, excerpt, content, category, tags, status, cover_image, author_name, author_id, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [data.title, data.slug, data.excerpt, data.content, data.category, data.tags, data.status, data.cover_image, data.author_name, data.author_id, data.published_at]
  );
  return r.rows[0];
}

export async function updateArticle(id: string, data: Partial<Omit<Article, "id" | "created_at">>) {
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
  const r = await query<Article>(`UPDATE articles SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return r.rows[0] || null;
}

export async function deleteArticle(id: string) {
  const r = await query("DELETE FROM articles WHERE id = $1 RETURNING id", [id]);
  return r.rowCount ? true : false;
}
