import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageContent, canDeleteArticle, audit } from "@/lib/admin-roles";
import { getAllArticles, createArticle, updateArticle, deleteArticle, getArticleById } from "@/lib/articles";
import { deleteMediaAsset } from "@/lib/media";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const articles = await getAllArticles();
    return NextResponse.json({ articles }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin articles GET failed:", error);
    return NextResponse.json({ error: "Unable to load articles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageContent(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const content = String(body.content || "").trim();

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Title, slug and content are required." }, { status: 400 });
    }

    const article = await createArticle({
      title,
      slug,
      excerpt: body.excerpt || null,
      content,
      category: body.category || "article",
      tags: Array.isArray(body.tags) ? body.tags : [],
      status: body.status || "draft",
      cover_image: body.cover_image || null,
      author_name: session.fullName || "CodeMtaani",
      author_id: session.id || null,
      published_at: body.status === "published" ? new Date().toISOString() : null,
    });

    await audit(session, "article_created", "article", article.id, { title: article.title });
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Admin article create failed:", error);
    return NextResponse.json({ error: "Unable to create article." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageContent(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
    }

    const updated = await updateArticle(id, body);
    if (!updated) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    await audit(session, "article_updated", "article", id);
    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Admin article update failed:", error);
    return NextResponse.json({ error: "Unable to update article." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canDeleteArticle(session)) return NextResponse.json({ error: "Only Super Admin or Executive Administrator can delete articles." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const id = q.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
    }

    // Retrieve article to check for cover image before deletion
    const article = await getArticleById(id);
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    // Delete cover image from media_assets if it references our media route
    if (article.cover_image) {
      const mediaMatch = article.cover_image.match(/\/api\/media\/([0-9a-f-]{36})/i);
      if (mediaMatch) {
        await deleteMediaAsset(mediaMatch[1]).catch(() => {/* ignore if already gone */});
      }
    }

    const success = await deleteArticle(id);
    if (!success) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    await audit(session, "article_deleted", "article", id, { title: article.title });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin article delete failed:", error);
    return NextResponse.json({ error: "Unable to delete article." }, { status: 500 });
  }
}
