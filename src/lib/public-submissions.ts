import { query } from "./db";

export type PublicSubmission = {
  id: string;
  reference_number: string;
  submission_type: "idea" | "proposal" | "partnership" | "community" | "suggestion";
  title: string;
  submitter_name: string;
  submitter_email: string;
  organisation: string | null;
  description: string;
  attachment_url: string | null;
  status: "submitted" | "under_review" | "info_required" | "approved" | "rejected" | "in_development" | "completed";
  applicant_feedback: string | null;
  internal_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  assigned_name?: string | null;
  assigned_staff_number?: string | null;
};

export type PublicTrackingResult = {
  reference_number: string;
  submission_type: string;
  title: string;
  submitter_name: string;
  status: PublicSubmission["status"];
  applicant_feedback: string | null;
  created_at: string;
  updated_at: string;
};

export async function createPublicSubmission(data: {
  submission_type: PublicSubmission["submission_type"];
  title: string;
  submitter_name: string;
  submitter_email: string;
  organisation?: string | null;
  description: string;
  attachment_url?: string | null;
}): Promise<PublicSubmission> {
  const r = await query<PublicSubmission>(
    `INSERT INTO public_submissions
      (submission_type, title, submitter_name, submitter_email, organisation, description, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.submission_type,
      data.title.trim(),
      data.submitter_name.trim(),
      data.submitter_email.trim().toLowerCase(),
      data.organisation || null,
      data.description.trim(),
      data.attachment_url || null,
    ]
  );
  return r.rows[0];
}

export async function getPublicSubmissionByRef(referenceNumber: string): Promise<PublicTrackingResult | null> {
  const r = await query<PublicTrackingResult>(
    `SELECT reference_number, submission_type, title, submitter_name, status, applicant_feedback, created_at, updated_at
     FROM public_submissions
     WHERE UPPER(TRIM(reference_number)) = UPPER(TRIM($1))
     LIMIT 1`,
    [referenceNumber]
  );
  return r.rows[0] || null;
}

export async function getAllPublicSubmissions(filters?: {
  status?: string;
  type?: string;
  search?: string;
}): Promise<PublicSubmission[]> {
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters?.status && filters.status !== "all") {
    whereClauses.push(`ps.status = $${idx}`);
    values.push(filters.status);
    idx++;
  }

  if (filters?.type && filters.type !== "all") {
    whereClauses.push(`ps.submission_type = $${idx}`);
    values.push(filters.type);
    idx++;
  }

  if (filters?.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`;
    whereClauses.push(`(ps.reference_number ILIKE $${idx} OR ps.title ILIKE $${idx} OR ps.submitter_name ILIKE $${idx} OR ps.submitter_email ILIKE $${idx})`);
    values.push(q);
    idx++;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const r = await query<PublicSubmission>(
    `SELECT ps.*, u.full_name AS assigned_name, u.staff_number AS assigned_staff_number
     FROM public_submissions ps
     LEFT JOIN admin_users u ON u.id = ps.assigned_to
     ${whereStr}
     ORDER BY ps.created_at DESC`,
    values
  );
  return r.rows;
}

export async function updatePublicSubmission(
  id: string,
  updates: {
    status?: PublicSubmission["status"];
    applicant_feedback?: string | null;
    internal_notes?: string | null;
    assigned_to?: string | null;
  }
): Promise<PublicSubmission | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.status !== undefined) {
    setClauses.push(`status = $${idx}`);
    values.push(updates.status);
    idx++;
  }

  if (updates.applicant_feedback !== undefined) {
    setClauses.push(`applicant_feedback = $${idx}`);
    values.push(updates.applicant_feedback);
    idx++;
  }

  if (updates.internal_notes !== undefined) {
    setClauses.push(`internal_notes = $${idx}`);
    values.push(updates.internal_notes);
    idx++;
  }

  if (updates.assigned_to !== undefined) {
    setClauses.push(`assigned_to = $${idx}`);
    values.push(updates.assigned_to);
    idx++;
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const r = await query<PublicSubmission>(
    `UPDATE public_submissions SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return r.rows[0] || null;
}
