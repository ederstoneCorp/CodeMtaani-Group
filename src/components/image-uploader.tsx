"use client";

import { useCallback, useRef, useState } from "react";

type ImageUploaderProps = {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUploader({ value, onChange, label = "Cover Image" }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError("");

    if (!ALLOWED.includes(file.type)) {
      setError("Unsupported format. Use JPEG, PNG, WebP, GIF or SVG.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 5 MB.`);
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      URL.revokeObjectURL(localUrl);
      setPreview(data.url);
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setPreview(value || null);
    } finally {
      setUploading(false);
    }
  }, [value, onChange]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  function removeImage() {
    setPreview(null);
    onChange(null);
    setError("");
  }

  const dropZoneStyle: React.CSSProperties = {
    border: `2px dashed ${dragOver ? "#45c8d8" : "#29383c"}`,
    borderRadius: "8px",
    padding: preview ? "8px" : "28px 16px",
    textAlign: "center",
    cursor: "pointer",
    background: dragOver ? "rgba(69,200,216,0.06)" : "#0a1113",
    transition: "border-color 0.2s, background 0.2s",
    position: "relative",
  };

  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", color: "#8fa5a9", fontSize: "12px", marginBottom: "8px", fontWeight: 600 }}>
        {label}
      </label>

      <div
        style={dropZoneStyle}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {preview ? (
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "6px",
                objectFit: "cover",
                opacity: uploading ? 0.5 : 1,
              }}
            />
            {uploading && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(0,0,0,0.4)",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#45c8d8",
                fontWeight: 700,
              }}>
                Uploading…
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "24px", color: "#45c8d8", marginBottom: "8px" }}>⬆</div>
            <p style={{ margin: 0, color: "#8fa5a9", fontSize: "13px" }}>
              Drag &amp; drop an image or <span style={{ color: "#45c8d8", textDecoration: "underline" }}>browse</span>
            </p>
            <p style={{ margin: "6px 0 0", color: "#5a7a80", fontSize: "11px" }}>
              JPEG, PNG, WebP, GIF, SVG · Max 5 MB
            </p>
          </div>
        )}
      </div>

      {(preview || error) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
          {preview && !uploading && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  background: "#121b1e",
                  border: "1px solid #29383c",
                  borderRadius: "5px",
                  color: "#c8d7d9",
                  cursor: "pointer",
                }}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  background: "#121b1e",
                  border: "1px solid #3c2020",
                  borderRadius: "5px",
                  color: "#ff7777",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </>
          )}
          {error && (
            <span style={{ color: "#ff7777", fontSize: "11px" }}>{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
