import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { exportSubmissions } from "@/lib/admin-submissions";
export const runtime = "nodejs";
function csvCell(value: unknown) {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const q = request.nextUrl.searchParams;
    const rows = await exportSubmissions({ type: q.get("type") || "", status: q.get("status") || "", search: q.get("q") || "" });
    const columns = ["id","type","name","email","organisation","category","subject","area","link","message","status","internal_notes","created_at","updated_at"];
    const csv = [columns.join(","), ...rows.map(row => columns.map(key => csvCell(row[key])).join(","))].join("\r\n");
    return new NextResponse("\uFEFF" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="codemtaani-submissions.csv"', "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin export failed:", error);
    return NextResponse.json({ error: "Unable to export submissions." }, { status: 503 });
  }
}
