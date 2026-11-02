"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, RefreshCw, TrendingUp } from "lucide-react";
import type { AnalyticsData } from "@/lib/dashboard-analytics";

type InsightsData = {
  executiveSummary: string;
  weeklySummary: string;
  monthlyTrend: string;
  overdueItems: { id: string; title: string; project: string; deadline: string; assignee: string }[];
  activityAnomalies: { metric: string; status: "normal" | "warning" | "alert"; observation: string; severity: "low" | "medium" | "high" }[];
  actionableRecommendations: string[];
  metrics: {
    staffCount: number;
    activeProjects: number;
    weeklySubmissions: number;
    weeklyDeltaPercent: number;
    overdueTaskCount: number;
    securityAlerts: number;
  };
  generatedAt: string;
  provider: string;
};

export function AdminAnalyticsView() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAi, setRefreshingAi] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [resA, resI] = await Promise.all([
        fetch("/api/admin/dashboard/analytics"),
        fetch("/api/admin/ai/insights"),
      ]);
      if (resA.ok) {
        const dA = await resA.json();
        setAnalytics(dA.analytics);
      }
      if (resI.ok) {
        const dI = await resI.json();
        setInsights(dI.insights);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function refreshInsights() {
    setRefreshingAi(true);
    try {
      const res = await fetch("/api/admin/ai/insights");
      if (res.ok) {
        const d = await res.json();
        setInsights(d.insights);
      }
    } catch {}
    setRefreshingAi(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#8fa5a9", fontSize: "13px" }}>
        Loading real-time organisation analytics and intelligence…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* AI-POWERED ORGANISATIONAL INSIGHTS CARD */}
      <div
        style={{
          background: "linear-gradient(145deg, #072127 0%, #051417 100%)",
          border: "1px solid #45c8d8",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(69,200,216,0.15)",
                display: "grid",
                placeItems: "center",
                color: "#45c8d8",
              }}
            >
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", margin: 0, color: "#f1fbfc", display: "flex", alignItems: "center", gap: "8px" }}>
                AI Operational Intelligence &amp; Synthesis
                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(69,200,216,0.18)", color: "#63d8e5" }}>
                  Live System Analysis
                </span>
              </h2>
              <small style={{ color: "#799da3" }}>
                Autonomous monitoring across staff, deliverables, inbound enquiries and security posture.
              </small>
            </div>
          </div>

          <button
            type="button"
            className="admin-button secondary"
            onClick={refreshInsights}
            disabled={refreshingAi}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}
          >
            <RefreshCw size={12} className={refreshingAi ? "animate-spin" : ""} />
            {refreshingAi ? "Analyzing…" : "Refresh Insights"}
          </button>
        </div>

        {insights && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.8", color: "#d2e3e6" }}>
              {insights.executiveSummary}
            </p>

            {/* OVERDUE ALERTS (IF ANY) */}
            {insights.overdueItems.length > 0 && (
              <div
                style={{
                  background: "rgba(255,100,100,0.08)",
                  border: "1px solid rgba(255,100,100,0.25)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ff8888", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                  <AlertTriangle size={14} /> Attention Required: {insights.overdueItems.length} Overdue Deliverable(s)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {insights.overdueItems.map((item) => (
                    <div key={item.id} style={{ fontSize: "12px", color: "#e7f1f2", display: "flex", justifyContent: "space-between" }}>
                      <span>
                        • <strong>{item.title}</strong> ({item.project})
                      </span>
                      <span style={{ color: "#ff8888" }}>
                        Assignee: {item.assignee} · Due {new Date(item.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANOMALIES & SURGES */}
            {insights.activityAnomalies.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
                {insights.activityAnomalies.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#09171b",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                    }}
                  >
                    <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: a.severity === "high" ? "#ff7777" : "#45c8d8" }}>
                      {a.metric}
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#c2d8dc" }}>
                      {a.observation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* RECOMMENDATIONS */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#63d8e5" }}>
                Strategic Next Actions
              </span>
              <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px", color: "#cadbe0", lineHeight: "1.7" }}>
                {insights.actionableRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE DATA VISUALISATIONS */}
      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          {/* STAFF GROWTH BAR CHART */}
          <div
            style={{
              background: "#081518",
              border: "1px solid #1f3034",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "14px", margin: "0 0 4px", color: "#f1fbfc", display: "flex", alignItems: "center", gap: "6px" }}>
              <TrendingUp size={15} color="#45c8d8" /> Staff Growth Trajectory
            </h3>
            <p style={{ fontSize: "11px", color: "#799da3", margin: "0 0 20px" }}>
              Monthly team onboardings from the PostgreSQL database.
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "130px", paddingTop: "20px" }}>
              {analytics.staffGrowth.length === 0 ? (
                <div style={{ color: "#799da3", fontSize: "12px" }}>No historical data yet.</div>
              ) : (
                analytics.staffGrowth.map((item, idx) => {
                  const maxCount = Math.max(...analytics.staffGrowth.map((s) => s.count), 1);
                  const heightPct = Math.max((item.count / maxCount) * 100, 15);
                  return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#45c8d8", marginBottom: "4px" }}>
                        {item.count}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          height: `${heightPct}%`,
                          background: "linear-gradient(180deg, #45c8d8 0%, #0b5965 100%)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.4s ease",
                        }}
                      />
                      <span style={{ fontSize: "9px", color: "#799da3", marginTop: "8px", whiteSpace: "nowrap" }}>
                        {item.month}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PROJECT STATUS DISTRIBUTION */}
          <div
            style={{
              background: "#081518",
              border: "1px solid #1f3034",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "14px", margin: "0 0 4px", color: "#f1fbfc", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} color="#45c8d8" /> Project Delivery Pipeline
            </h3>
            <p style={{ fontSize: "11px", color: "#799da3", margin: "0 0 20px" }}>
              Breakdown of ongoing, beta and released software initiatives.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analytics.projectStats.length === 0 ? (
                <div style={{ color: "#799da3", fontSize: "12px" }}>No projects tracked yet.</div>
              ) : (
                analytics.projectStats.map((item) => {
                  const total = analytics.projectStats.reduce((acc, x) => acc + x.count, 0) || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.status}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ textTransform: "capitalize", color: "#c8d8dc" }}>
                          {item.status.replaceAll("_", " ")}
                        </span>
                        <strong style={{ color: "#45c8d8" }}>
                          {item.count} ({pct}%)
                        </strong>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#45c8d8" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TASK WORKSPACE DISTRIBUTION */}
          <div
            style={{
              background: "#081518",
              border: "1px solid #1f3034",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "14px", margin: "0 0 4px", color: "#f1fbfc" }}>
              Kanban Task Progress Across Teams
            </h3>
            <p style={{ fontSize: "11px", color: "#799da3", margin: "0 0 16px" }}>
              Active tasks categorized by delivery stage.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
              {["backlog", "todo", "in_progress", "review", "completed"].map((st) => {
                const found = analytics.taskProgress.find((t) => t.stage === st);
                const count = found ? found.count : 0;
                return (
                  <div
                    key={st}
                    style={{
                      background: "#0a1c20",
                      border: "1px solid rgba(72,198,212,0.18)",
                      borderRadius: "6px",
                      padding: "12px 8px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#45c8d8", display: "block" }}>
                      {count}
                    </span>
                    <span style={{ fontSize: "10px", color: "#8aa2a6", textTransform: "capitalize", marginTop: "4px", display: "block" }}>
                      {st.replaceAll("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EVENT REGISTRATION VS CAPACITY */}
          <div
            style={{
              background: "#081518",
              border: "1px solid #1f3034",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "14px", margin: "0 0 4px", color: "#f1fbfc" }}>
              Upcoming Community Event Demand
            </h3>
            <p style={{ fontSize: "11px", color: "#799da3", margin: "0 0 16px" }}>
              Attendance registrations compared against capacity limits.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analytics.eventAttendance.length === 0 ? (
                <div style={{ color: "#799da3", fontSize: "12px" }}>No upcoming events scheduled.</div>
              ) : (
                analytics.eventAttendance.map((ev, i) => {
                  const pct = Math.min(Math.round((ev.registered / ev.capacity) * 100), 100);
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ color: "#d2e3e6", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "240px" }}>
                          {ev.event_title}
                        </span>
                        <strong style={{ color: pct >= 90 ? "#ff8888" : "#45c8d8" }}>
                          {ev.registered} / {ev.capacity} ({pct}%)
                        </strong>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 90 ? "#e00000" : "#45c8d8" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
