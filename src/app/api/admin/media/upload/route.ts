import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canEdit, audit } from "@/lib/admin-roles";
import { saveMediaAsset, validateMediaUpload } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canEdit(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const validationError = validateMediaUpload(file.type, file.size);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const altText = formData.get("alt_text");
    const asset = await saveMediaAsset(
      file.name,
      file.type,
      buffer,
      session.id,
      typeof altText === "string" ? altText : undefined
    );

    await audit(session, "media_uploaded", "media_asset", asset.id, {
      filename: asset.filename,
      mime_type: asset.mime_type,
      size_bytes: asset.size_bytes,
    });

    return NextResponse.json(
      {
        id: asset.id,
        url: `/api/media/${asset.id}`,
        filename: asset.filename,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Media upload failed:", error);
    return NextResponse.json({ error: "Unable to upload file." }, { status: 500 });
  }
}
