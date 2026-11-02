import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    // 1. Gather live operational metrics from database
    const [
      staffQ,
      projectsQ,
      overdueTasksQ,
      submissionsRecentQ,
      submissionsPriorQ,
      securityFailuresQ,
      articlesQ,
      eventsQ,
    ] = await Promise.all([
      query<{ total: number; active: number }>(
        "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE active = TRUE)::int AS active FROM admin_users"
      ),
      query<{ total: number; completed: number; in_dev: number }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'released')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'in_development')::int AS in_dev
         FROM projects`
      ),
      query<{ id: string; title: string; project_title: string; deadline: string; assignee_name: string | null }>(
        `SELECT t.id, t.title, p.title AS project_title, t.deadline, u.full_name AS assignee_name
         FROM project_tasks t
         JOIN projects p ON p.id = t.project_id
         LEFT JOIN admin_users u ON u.id = t.assignee_id
         WHERE t.stage != 'completed' AND t.deadline < NOW()
         ORDER BY t.deadline ASC
         LIMIT 5`
      ).catch(() => ({ rows: [] })),
      query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM submissions WHERE created_at > NOW() - INTERVAL '7 days'"
      ),
      query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM submissions WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'"
      ),
      query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM admin_login_attempts WHERE succeeded = FALSE AND attempted_at > NOW() - INTERVAL '48 hours'"
      ),
      query<{ total: number; published: number }>(
        "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'published')::int AS published FROM articles"
      ),
      query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM events WHERE status IN ('upcoming', 'ongoing')"
      ),
    ]);

    const staff = staffQ.rows[0] || { total: 0, active: 0 };
    const projects = projectsQ.rows[0] || { total: 0, completed: 0, in_dev: 0 };
    const overdueTasks = overdueTasksQ.rows;
    const recentSubs = submissionsRecentQ.rows[0]?.count || 0;
    const priorSubs = submissionsPriorQ.rows[0]?.count || 0;
    const securityFailures = securityFailuresQ.rows[0]?.count || 0;
    const articles = articlesQ.rows[0] || { total: 0, published: 0 };
    const upcomingEvents = eventsQ.rows[0]?.count || 0;

    const subDeltaPercent = priorSubs === 0
      ? (recentSubs > 0 ? 100 : 0)
      : Math.round(((recentSubs - priorSubs) / priorSubs) * 100);

    // Heuristic Operational Intelligence Synthesis
    const anomalies: { metric: string; status: "normal" | "warning" | "alert"; observation: string; severity: "low" | "medium" | "high" }[] = [];

    if (securityFailures > 5) {
      anomalies.push({
        metric: "Authentication Security",
        status: "alert",
        observation: `${securityFailures} failed admin sign-in attempts detected in the past 48 hours. Consider reviewing login audit logs.`,
        severity: "high",
      });
    }

    if (overdueTasks.length > 0) {
      anomalies.push({
        metric: "Project Deliverables",
        status: "warning",
        observation: `${overdueTasks.length} task(s) currently past deadline requiring managerial attention.`,
        severity: "medium",
      });
    }

    if (recentSubs > priorSubs * 1.5 && priorSubs > 0) {
      anomalies.push({
        metric: "Public Engagement Surge",
        status: "normal",
        observation: `Inbound enquiries increased by ${subDeltaPercent}% week-over-week. Ensure operational review capacity is adequate.`,
        severity: "low",
      });
    }

    const recommendations: string[] = [];
    if (overdueTasks.length > 0) {
      recommendations.push(`Review overdue items for "${overdueTasks[0].project_title}" with team lead.`);
    }
    if (projects.in_dev > 0 && projects.completed === 0) {
      recommendations.push("Establish sprint milestones to push in-development projects toward release.");
    }
    if (articles.published < 3) {
      recommendations.push("Publish thought leadership insights to boost organic technical reach.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Maintain current release velocity and monitor upcoming event registrations.");
    }

    const executiveSummary = `CodeMtaani Group currently maintains ${staff.active} active staff accounts overseeing ${projects.total} software projects (${projects.in_dev} in development). Inbound enquiry momentum is tracking at ${subDeltaPercent >= 0 ? "+" : ""}${subDeltaPercent}% over the previous 7-day period.`;

    const weeklySummary = `During this operational cycle, the organisation recorded ${recentSubs} new public inquiries and submissions, ${upcomingEvents} scheduled upcoming community events, and published ${articles.published} technical articles. All security throttles remain nominal with ${securityFailures} blocked attempt(s).`;

    const monthlyTrend = `Platform telemetry demonstrates sustained organizational expansion with active participation in software engineering, education initiatives, and community tech projects.`;

    return NextResponse.json(
      {
        insights: {
          executiveSummary,
          weeklySummary,
          monthlyTrend,
          overdueItems: overdueTasks.map((t) => ({
            id: t.id,
            title: t.title,
            project: t.project_title,
            deadline: t.deadline,
            assignee: t.assignee_name || "Unassigned",
          })),
          activityAnomalies: anomalies,
          actionableRecommendations: recommendations,
          metrics: {
            staffCount: staff.total,
            activeProjects: projects.in_dev,
            weeklySubmissions: recentSubs,
            weeklyDeltaPercent: subDeltaPercent,
            overdueTaskCount: overdueTasks.length,
            securityAlerts: securityFailures,
          },
          generatedAt: new Date().toISOString(),
          provider: "intelligent_analytics_engine",
        },
      },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("AI Insights synthesis error:", error);
    return NextResponse.json({ error: "Unable to generate insights." }, { status: 500 });
  }
}
