import { query } from "./db";

export type DashboardStats = {
  totalSubmissions: number;
  newSubmissions: number;
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  publishedProjects: number;
  draftProjects: number;
  publishedArticles: number;
  draftArticles: number;
  upcomingEvents: number;
  teamMembers: number;
  staffAccounts: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [submissions, members, projects, articles, events, team, staff] = await Promise.all([
    query<{ total: number; new_count: number }>(
      "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'new')::int AS new_count FROM submissions"
    ),
    query<{ total: number; active: number; pending: number }>(
      "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM members"
    ),
    query<{ published: number; draft: number }>(
      "SELECT COUNT(*) FILTER (WHERE status NOT IN ('archived','concept'))::int AS published, COUNT(*) FILTER (WHERE status = 'concept')::int AS draft FROM projects"
    ),
    query<{ published: number; draft: number }>(
      "SELECT COUNT(*) FILTER (WHERE status = 'published')::int AS published, COUNT(*) FILTER (WHERE status IN ('draft','review'))::int AS draft FROM articles"
    ),
    query<{ upcoming: number }>(
      "SELECT COUNT(*) FILTER (WHERE status IN ('upcoming','ongoing'))::int AS upcoming FROM events"
    ),
    query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM team_members WHERE is_active = TRUE"
    ),
    query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM admin_users WHERE active = TRUE"
    ),
  ]);

  return {
    totalSubmissions: submissions.rows[0]?.total || 0,
    newSubmissions: submissions.rows[0]?.new_count || 0,
    totalMembers: members.rows[0]?.total || 0,
    activeMembers: members.rows[0]?.active || 0,
    pendingMembers: members.rows[0]?.pending || 0,
    publishedProjects: projects.rows[0]?.published || 0,
    draftProjects: projects.rows[0]?.draft || 0,
    publishedArticles: articles.rows[0]?.published || 0,
    draftArticles: articles.rows[0]?.draft || 0,
    upcomingEvents: events.rows[0]?.upcoming || 0,
    teamMembers: team.rows[0]?.count || 0,
    staffAccounts: staff.rows[0]?.count || 0,
  };
}
