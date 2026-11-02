import { NextRequest, NextResponse } from "next/server";
import { getMediaAsset } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid media ID." }, { status: 400 });
  }

  try {
    const asset = await getMediaAsset(id);
    if (!asset) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    const buf = Buffer.isBuffer(asset.data) ? asset.data : Buffer.from(asset.data);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": asset.mime_type,
        "Content-Length": String(asset.size_bytes),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${encodeURIComponent(asset.filename)}"`,
      },
    });
  } catch (error) {
    console.error("Media fetch failed:", error);
    return NextResponse.json({ error: "Unable to retrieve media." }, { status: 500 });
  }
}
