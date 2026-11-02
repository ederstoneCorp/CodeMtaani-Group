import { query } from "./db";

export type SubmissionInput = {
  type: "enquiry" | "career" | "partnership";
  name: string;
  email: string;
  organisation?: string;
  category?: string;
  subject?: string;
  area?: string;
  link?: string;
  message: string;
};

export async function saveSubmission(input: SubmissionInput) {
  const result = await query<{ id: string; created_at: Date }>(
    `INSERT INTO submissions
      (type, name, email, organisation, category, subject, area, link, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, created_at`,
    [input.type, input.name, input.email, input.organisation ?? null, input.category ?? null, input.subject ?? null, input.area ?? null, input.link ?? null, input.message],
  );
  return result.rows[0];
}
