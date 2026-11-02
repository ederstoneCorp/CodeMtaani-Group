import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getPublishedArticles } from "@/lib/articles";
import { ArrowUpRight, BookOpen, Calendar, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Insights",
  description: "Technology updates, engineering insights, tutorials, and research publications from CodeMtaani Group.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  try {
    articles = await getPublishedArticles();
  } catch (error) {
    console.error("Failed to load articles:", error);
  }

  return (
    <PageShell
      eyebrow="Knowledge &amp; Publishing / Blog &amp; Insights"
      title="Technology thinking and engineering notes."
      intro="Technical tutorials, product discoveries, applied intelligence research, and stories of grassroots technological transformation from the CodeMtaani engineering collective."
    >
      <section className="content-section">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Publications</p>
              <h2 className="section-title">
                Field notes, research &amp; <span>technical insights.</span>
              </h2>
            </div>
            <div className="heading-aside">
              <p>
                We publish genuine technical progress, engineering evaluations and open-source releases. We do not generate filler or AI-fabricated articles.
              </p>
            </div>
          </div>

          {articles.length > 0 ? (
            <div className="card-grid" style={{ marginTop: "40px" }}>
              {articles.map((article) => (
                <article className="info-card" key={article.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#65d5e1", fontSize: "11px" }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{article.category}</span>
                    {article.published_at && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={13} />
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 style={{ marginTop: "20px", fontSize: "22px", lineHeight: "1.3" }}>{article.title}</h3>
                  {article.excerpt && (
                    <p style={{ marginTop: "12px", color: "#c2d8dc", fontSize: "13px", lineHeight: "1.75" }}>
                      {article.excerpt}
                    </p>
                  )}
                  {article.tags && article.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "16px" }}>
                      {article.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.08)",
                            color: "#a8c7cd",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Tag size={10} /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: "auto", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <small style={{ color: "#a8c7cd", fontSize: "11px" }}>By {article.author_name || "CodeMtaani"}</small>
                    <span style={{ color: "#48c6d4", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                      Read <ArrowUpRight size={15} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: "40px",
                padding: "48px 32px",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                background: "rgba(4,35,41,0.5)",
                textAlign: "center",
              }}
            >
              <BookOpen size={36} style={{ color: "#48c6d4", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Editorial desk is preparing upcoming publications</h3>
              <p className="body-copy" style={{ margin: "0 auto", maxWidth: "620px" }}>
                Our engineering and research contributors are currently preparing case studies on our digital solutions, FinTech architectures, and AI workflow experiments.
                New articles and announcements will appear here once reviewed and published by our editorial team.
              </p>
              <div style={{ marginTop: "28px" }}>
                <Link href="/contact" className="button-primary">
                  Suggest a topic or collaborate ↗
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
