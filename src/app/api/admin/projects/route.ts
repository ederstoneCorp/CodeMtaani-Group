import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canManageProjects, audit } from "@/lib/admin-roles";
import { getAllProjects, createProject, updateProject, deleteProject } from "@/lib/projects";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const projects = await getAllProjects();
    return NextResponse.json({ projects }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin projects GET failed:", error);
    return NextResponse.json({ error: "Unable to load projects." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageProjects(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const description = String(body.description || "").trim();

    if (!title || !slug || !description) {
      return NextResponse.json({ error: "Title, slug and description are required." }, { status: 400 });
    }

    const project = await createProject({
      title,
      slug,
      description,
      problem_statement: body.problem_statement || null,
      solution_overview: body.solution_overview || null,
      category: body.category || "digital_solutions",
      technologies: Array.isArray(body.technologies) ? body.technologies : [],
      status: body.status || "in_development",
      github_url: body.github_url || null,
      demo_url: body.demo_url || null,
      image_url: body.image_url || null,
      featured: Boolean(body.featured),
      contributors: Array.isArray(body.contributors) ? body.contributors : [],
      published_at: body.published_at || new Date().toISOString(),
    });

    await audit(session, "project_created", "project", project.id, { title: project.title });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Admin project create failed:", error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageProjects(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
    }

    const updated = await updateProject(id, body);
    if (!updated) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    await audit(session, "project_updated", "project", id);
    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Admin project update failed:", error);
    return NextResponse.json({ error: "Unable to update project." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageProjects(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const id = q.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
    }

    const success = await deleteProject(id);
    if (!success) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    await audit(session, "project_deleted", "project", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin project delete failed:", error);
    return NextResponse.json({ error: "Unable to delete project." }, { status: 500 });
  }
}
