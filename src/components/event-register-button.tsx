"use client";

import { useState } from "react";
import { CheckCircle2, Ticket, X } from "lucide-react";

interface EventRegisterButtonProps {
  eventId: string;
  eventTitle: string;
  isVirtual?: boolean;
}

export function EventRegisterButton({ eventId, eventTitle, isVirtual }: EventRegisterButtonProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ referenceCode: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          full_name: fullName,
          email,
          phone: phone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete registration.");
      }

      setSuccess({
        referenceCode: data.reference_code,
        message: data.message,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setFullName("");
    setEmail("");
    setPhone("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="button-primary"
        style={{
          width: "100%",
          padding: "10px 16px",
          fontSize: "12px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          marginTop: "16px",
          cursor: "pointer",
        }}
      >
        <Ticket size={14} />
        Register to Attend ↗
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#072329",
              border: "1px solid rgba(72, 198, 212, 0.35)",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              color: "#e8f4f6",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#8fa3a6",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            {success ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <CheckCircle2 size={48} style={{ color: "#48c6d4", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "20px", marginBottom: "8px", color: "#fff" }}>Registration Confirmed!</h3>
                <p style={{ color: "#c2d8dc", fontSize: "13px", lineHeight: "1.6", marginBottom: "20px" }}>
                  {success.message}
                </p>
                <div
                  style={{
                    backgroundColor: "rgba(72,198,212,0.1)",
                    border: "1px dashed #48c6d4",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#65d5e1" }}>
                    Your Event Pass Code
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", fontFamily: "monospace", color: "#fff", marginTop: "4px" }}>
                    {success.referenceCode}
                  </div>
                </div>
                <p style={{ fontSize: "11px", color: "#8fa3a6", marginBottom: "24px" }}>
                  {isVirtual ? "Virtual joining details will be shared prior to the event." : "Keep this code handy for on-site check-in."}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="button-primary"
                  style={{ width: "100%", padding: "10px", fontSize: "13px", cursor: "pointer" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#48c6d4", marginBottom: "4px" }}>
                  Event Registration
                </div>
                <h3 style={{ fontSize: "20px", lineHeight: "1.3", marginBottom: "16px", color: "#fff" }}>
                  {eventTitle}
                </h3>

                {error && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#fca5a5",
                      fontSize: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#c2d8dc", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backgroundColor: "rgba(4, 25, 30, 0.7)",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#c2d8dc", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backgroundColor: "rgba(4, 25, 30, 0.7)",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#c2d8dc", marginBottom: "6px" }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backgroundColor: "rgba(4, 25, 30, 0.7)",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "transparent",
                      color: "#c2d8dc",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button-primary"
                    style={{
                      padding: "10px 18px",
                      fontSize: "12px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Registering..." : "Confirm Free Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
