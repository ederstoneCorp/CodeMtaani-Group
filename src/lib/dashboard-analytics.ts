import { query } from "./db";

export type AnalyticsData = {
  staffGrowth: { month: string; count: number }[];
  projectStats: { status: string; count: number }[];
  submissionsByType: { type: string; count: number }[];
  eventAttendance: { event_title: string; capacity: number; registered: number }[];
  monthlyActivity: { month: string; count: number }[];
  taskProgress: { stage: string; count: number }[];
  securityEvents: { date: string; failed_attempts: number }[];
};

export async function getOrganisationalAnalytics(): Promise<AnalyticsData> {
  const [
    staffGrowthQ,
    projectStatsQ,
    submissionsByTypeQ,
    eventsQ,
    activityQ,
    tasksQ,
    securityQ,
  ] = await Promise.all([
    // Staff growth by month (past 6 months)
    query<{ month: string; count: number }>(
      `SELECT TO_CHAR(created_at, 'Mon YYYY') AS month,
              DATE_TRUNC('month', created_at) AS sort_month,
              COUNT(*)::int AS count
       FROM admin_users
       GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
       ORDER BY sort_month ASC
       LIMIT 6`
    ).catch(() => ({ rows: [] })),

    // Project breakdown by status
    query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int AS count
       FROM projects
       GROUP BY status
       ORDER BY count DESC`
    ).catch(() => ({ rows: [] })),

    // Submissions breakdown by type
    query<{ type: string; count: number }>(
      `SELECT type, COUNT(*)::int AS count
       FROM submissions
       GROUP BY type
       ORDER BY count DESC`
    ).catch(() => ({ rows: [] })),

    // Event registrations vs capacity
    query<{ event_title: string; capacity: number; registered: number }>(
      `SELECT e.title AS event_title,
              COALESCE(e.capacity, 100)::int AS capacity,
              COUNT(r.id)::int AS registered
       FROM events e
       LEFT JOIN event_registrations r ON r.event_id = e.id
       GROUP BY e.id, e.title, e.capacity
       ORDER BY e.start_time DESC
       LIMIT 5`
    ).catch(() => ({ rows: [] })),

    // Audit activity monthly trends
    query<{ month: string; count: number }>(
      `SELECT TO_CHAR(created_at, 'Mon YYYY') AS month,
              DATE_TRUNC('month', created_at) AS sort_month,
              COUNT(*)::int AS count
       FROM admin_audit_log
       GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
       ORDER BY sort_month DESC
       LIMIT 6`
    ).catch(() => ({ rows: [] })),

    // Task progress breakdown
    query<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*)::int AS count
       FROM project_tasks
       GROUP BY stage
       ORDER BY count DESC`
    ).catch(() => ({ rows: [] })),

    // Security failed login attempts in last 7 days
    query<{ date: string; failed_attempts: number }>(
      `SELECT TO_CHAR(attempted_at, 'Dy, Mon DD') AS date,
              DATE_TRUNC('day', attempted_at) AS sort_day,
              COUNT(*)::int AS failed_attempts
       FROM admin_login_attempts
       WHERE succeeded = FALSE AND attempted_at > NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(attempted_at, 'Dy, Mon DD'), DATE_TRUNC('day', attempted_at)
       ORDER BY sort_day ASC`
    ).catch(() => ({ rows: [] })),
  ]);

  return {
    staffGrowth: staffGrowthQ.rows.map((r) => ({ month: r.month, count: r.count })),
    projectStats: projectStatsQ.rows,
    submissionsByType: submissionsByTypeQ.rows,
    eventAttendance: eventsQ.rows,
    monthlyActivity: activityQ.rows.reverse(),
    taskProgress: tasksQ.rows,
    securityEvents: securityQ.rows.map((r) => ({ date: r.date, failed_attempts: r.failed_attempts })),
  };
}
